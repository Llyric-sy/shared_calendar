import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const CALENDAR_ORIGIN = "https://llyric-sy.github.io";
const CALENDAR_URL = Deno.env.get("CALENDAR_URL") ?? "https://llyric-sy.github.io/shared_calendar/";
const SUPPORTED_NOTIFICATIONS = new Set([
  "invitation",
  "accepted",
  "declined",
  "changes_suggested",
  "confirmed"
]);

type NotificationType = "invitation" | "accepted" | "declined" | "changes_suggested" | "confirmed";

type CalendarItem = {
  id: string;
  item_type: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string;
  status: string;
  created_by: string;
  invited_user_id: string | null;
  last_action_by: string | null;
};

Deno.serve(async (request: Request) => {
  const headers = responseHeaders(request);

  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration is incomplete" }, 500, headers);
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401, headers);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const token = authorization.slice("Bearer ".length);
  const { data: { user }, error: userError } = await admin.auth.getUser(token);

  if (userError || !user) return json({ error: "Authentication required" }, 401, headers);

  // This is the global kill switch. It defaults to off, so deploying this
  // function without any email-provider secrets cannot send an email.
  if (Deno.env.get("EMAIL_NOTIFICATIONS_ENABLED") !== "true") {
    return json({ delivery: "disabled" }, 202, headers);
  }

  let body: { calendar_item_id?: string; notification_type?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400, headers);
  }

  const notificationType = body.notification_type as NotificationType;
  if (!body.calendar_item_id || !SUPPORTED_NOTIFICATIONS.has(notificationType)) {
    return json({ error: "Invalid notification request" }, 400, headers);
  }

  const { data: item, error: itemError } = await admin
    .from("calendar_items")
    .select("id, item_type, title, event_date, start_time, end_time, all_day, location, status, created_by, invited_user_id, last_action_by")
    .eq("id", body.calendar_item_id)
    .single<CalendarItem>();

  if (itemError || !item || item.item_type !== "plan") {
    return json({ error: "Plan not found" }, 404, headers);
  }

  const delivery = resolveDelivery(item, notificationType);
  if (!delivery || item.last_action_by !== user.id || delivery.actorId !== user.id) {
    return json({ error: "This notification cannot be sent by this account" }, 403, headers);
  }

  const { data: member } = await admin
    .from("profiles")
    .select("id, active")
    .eq("id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!member) return json({ error: "Calendar access required" }, 403, headers);

  const { data: preference } = await admin
    .from("notification_preferences")
    .select("email_enabled")
    .eq("profile_id", delivery.recipientId)
    .maybeSingle();

  if (!preference?.email_enabled) return json({ delivery: "recipient-disabled" }, 202, headers);

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL");
  if (!resendApiKey || !fromEmail) return json({ error: "Email provider is not configured" }, 503, headers);

  const [{ data: recipientData, error: recipientError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.auth.admin.getUserById(delivery.recipientId),
    admin.from("profiles").select("id, display_name").in("id", [delivery.actorId, delivery.recipientId])
  ]);

  const recipientEmail = recipientData.user?.email;
  if (recipientError || profilesError || !recipientEmail) {
    return json({ error: "Recipient email is unavailable" }, 503, headers);
  }

  const actorName = profiles?.find(profile => profile.id === delivery.actorId)?.display_name || "Your person";
  const recipientName = profiles?.find(profile => profile.id === delivery.recipientId)?.display_name || "there";
  const message = emailCopy(notificationType, actorName, recipientName, item);

  const providerResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipientEmail],
      subject: message.subject,
      text: message.text,
      html: message.html
    })
  });

  if (!providerResponse.ok) {
    console.error("Calendar email provider rejected a delivery", providerResponse.status);
    return json({ error: "Email delivery failed" }, 502, headers);
  }

  return json({ delivery: "sent" }, 200, headers);
});

function resolveDelivery(item: CalendarItem, type: NotificationType) {
  if (!item.invited_user_id) return null;

  if (type === "invitation" && item.status === "pending") {
    return { actorId: item.created_by, recipientId: item.invited_user_id };
  }
  if (["accepted", "declined", "changes_suggested"].includes(type) && item.status === type) {
    return { actorId: item.invited_user_id, recipientId: item.created_by };
  }
  if (type === "confirmed" && item.status === "confirmed") {
    return { actorId: item.created_by, recipientId: item.invited_user_id };
  }
  return null;
}

function emailCopy(type: NotificationType, actorName: string, recipientName: string, item: CalendarItem) {
  const action = {
    invitation: "invited you to a plan",
    accepted: "accepted your invitation",
    declined: "declined your invitation",
    changes_suggested: "suggested changes to your invitation",
    confirmed: "confirmed your plan"
  }[type];
  const safeRecipient = escapeHtml(recipientName);
  const safeActor = escapeHtml(actorName);
  const safeTitle = escapeHtml(item.title);
  const safeDate = escapeHtml(item.event_date);
  const safeTime = item.all_day
    ? "All day"
    : `${escapeHtml(item.start_time.slice(0, 5))}–${escapeHtml(item.end_time.slice(0, 5))}`;
  const safeLocation = item.location ? `<p><strong>Location:</strong> ${escapeHtml(item.location)}</p>` : "";
  const subject = `${actorName} ${action}: ${item.title}`;
  const textLocation = item.location ? `\nLocation: ${item.location}` : "";

  return {
    subject,
    text: `Hi ${recipientName},\n\n${actorName} ${action}: ${item.title}\nDate: ${item.event_date}\nTime: ${item.all_day ? "All day" : `${item.start_time.slice(0, 5)}–${item.end_time.slice(0, 5)}`}${textLocation}\n\nOpen the shared calendar: ${CALENDAR_URL}`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#312d3a;line-height:1.5"><p>Hi ${safeRecipient},</p><p><strong>${safeActor}</strong> ${escapeHtml(action)}:</p><h2>${safeTitle}</h2><p><strong>Date:</strong> ${safeDate}<br><strong>Time:</strong> ${safeTime}</p>${safeLocation}<p><a href="${escapeHtml(CALENDAR_URL)}">Open the shared calendar</a></p></body></html>`
  };
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character] as string);
}

function responseHeaders(request: Request) {
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigin = requestOrigin === CALENDAR_ORIGIN ? requestOrigin : CALENDAR_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
    "Vary": "Origin"
  };
}

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers });
}
