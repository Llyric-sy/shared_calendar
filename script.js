import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://uyofqzrgyubdsgheuhbl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TOj9Iqr3gRFktXxvzYA7kQ_g9-edYzp";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const templates = {
  "date-night": { title: "Date night", duration: 240 },
  "day-date": { title: "Day date", duration: 360 },
  monthsary: { title: "Monthsary", duration: 240 },
  anniversary: { title: "Anniversary", duration: 360 },
  "reading-night": { title: "Reading night", duration: 90 },
  "game-night": { title: "Game night", duration: 180 },
  "friends-game-night": { title: "Game night with friends", duration: 240 },
  "movie-night": { title: "Movie night", duration: 180 },
  "eat-out": { title: "Eat out", duration: 120 },
  karaoke: { title: "Karaoke", duration: 120 },
  "ice-skating": { title: "Ice skating", duration: 120 },
  bouldering: { title: "Bouldering", duration: 120 },
  bowling: { title: "Bowling", duration: 120 },
  shopping: { title: "Shopping", duration: 180 },
  arcade: { title: "Arcade", duration: 120 },
  "sports-activity": { title: "Sports / activity", duration: 120 },
  "try-something-new": { title: "Try something new", duration: 180 },
  custom: { title: "", duration: 60 }
};

const scheduleLabels = {
  work: "Work",
  uni: "University",
  appointment: "Appointment",
  busy: "Busy / unavailable",
  gym: "Gym",
  other: "Other"
};

const state = {
  currentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: null,
  editingId: null,
  detailId: null,
  filter: "all",
  draggedItemId: null,
  items: [],
  notifications: [],
  profiles: new Map(),
  user: null,
  profile: null,
  otherProfile: null,
  calendarChannel: null,
  notificationChannel: null,
  toastTimer: null,
  recoveryMode: false,
  authNotice: ""
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const elements = {
  authView: $("#authView"),
  appView: $("#appView"),
  loginHeading: $("#loginHeading"),
  authDescription: $("#authDescription"),
  loginForm: $("#loginForm"),
  loginEmail: $("#loginEmail"),
  loginPassword: $("#loginPassword"),
  loginButton: $("#loginButton"),
  loginMessage: $("#loginMessage"),
  forgotPasswordButton: $("#forgotPasswordButton"),
  recoveryRequestForm: $("#recoveryRequestForm"),
  recoveryEmail: $("#recoveryEmail"),
  recoveryRequestMessage: $("#recoveryRequestMessage"),
  sendRecoveryButton: $("#sendRecoveryButton"),
  backToLoginButton: $("#backToLoginButton"),
  passwordUpdateForm: $("#passwordUpdateForm"),
  newPassword: $("#newPassword"),
  confirmNewPassword: $("#confirmNewPassword"),
  passwordUpdateMessage: $("#passwordUpdateMessage"),
  saveNewPasswordButton: $("#saveNewPasswordButton"),
  logoutButton: $("#logoutButton"),
  currentUserName: $("#currentUserName"),
  currentUserRole: $("#currentUserRole"),
  avatar: $("#avatar"),
  syncStatus: $("#syncStatus"),
  notificationButton: $("#notificationButton"),
  notificationBadge: $("#notificationBadge"),
  notificationPanel: $("#notificationPanel"),
  notificationsList: $("#notificationsList"),
  markAllReadButton: $("#markAllReadButton"),
  updateScheduleButton: $("#updateScheduleButton"),
  invitePartnerButton: $("#invitePartnerButton"),
  monthLabel: $("#monthLabel"),
  monthJump: $("#monthJump"),
  previousMonth: $("#previousMonth"),
  nextMonth: $("#nextMonth"),
  todayButton: $("#todayButton"),
  calendarFilters: $("#calendarFilters"),
  calendarDays: $("#calendarDays"),
  calendarMessage: $("#calendarMessage"),
  copyTargets: $("#copyTargets"),
  dayModal: $("#dayModal"),
  dayTitle: $("#dayTitle"),
  dayScheduleButton: $("#dayScheduleButton"),
  dayInviteButton: $("#dayInviteButton"),
  closeDayModal: $("#closeDayModal"),
  allDayItems: $("#allDayItems"),
  timeline: $("#timeline"),
  eventModal: $("#eventModal"),
  eventForm: $("#eventForm"),
  editorLabel: $("#editorLabel"),
  editorHeading: $("#editorHeading"),
  editorMeta: $("#editorMeta"),
  closeEventModal: $("#closeEventModal"),
  cancelEditor: $("#cancelEditor"),
  itemType: $("#itemType"),
  scheduleFields: $("#scheduleFields"),
  planFields: $("#planFields"),
  scheduleType: $("#scheduleType"),
  scheduleTitleField: $("#scheduleTitleField"),
  scheduleTitle: $("#scheduleTitle"),
  inviteeName: $("#inviteeName"),
  templateSelect: $("#templateSelect"),
  customTitleField: $("#customTitleField"),
  customEventTitle: $("#customEventTitle"),
  eventDate: $("#eventDate"),
  eventAllDay: $("#eventAllDay"),
  timeFields: $("#timeFields"),
  startTime: $("#startTime"),
  endTime: $("#endTime"),
  eventLocation: $("#eventLocation"),
  repeatSection: $("#repeatSection"),
  repeatSchedule: $("#repeatSchedule"),
  repeatOptions: $("#repeatOptions"),
  repeatEndDate: $("#repeatEndDate"),
  eventNotes: $("#eventNotes"),
  formMessage: $("#formMessage"),
  deleteEvent: $("#deleteEvent"),
  saveEventButton: $("#saveEventButton"),
  detailModal: $("#detailModal"),
  closeDetailModal: $("#closeDetailModal"),
  detailLabel: $("#detailLabel"),
  detailTitle: $("#detailTitle"),
  detailStatus: $("#detailStatus"),
  detailCreator: $("#detailCreator"),
  detailDate: $("#detailDate"),
  detailTime: $("#detailTime"),
  detailLocationRow: $("#detailLocationRow"),
  detailLocation: $("#detailLocation"),
  detailNotesRow: $("#detailNotesRow"),
  detailNotes: $("#detailNotes"),
  suggestionSummary: $("#suggestionSummary"),
  suggestionWhen: $("#suggestionWhen"),
  suggestionLocation: $("#suggestionLocation"),
  suggestionNote: $("#suggestionNote"),
  suggestionForm: $("#suggestionForm"),
  suggestedDate: $("#suggestedDate"),
  suggestedStartTime: $("#suggestedStartTime"),
  suggestedEndTime: $("#suggestedEndTime"),
  suggestedLocationInput: $("#suggestedLocationInput"),
  responseNote: $("#responseNote"),
  cancelSuggestionButton: $("#cancelSuggestionButton"),
  detailMessage: $("#detailMessage"),
  detailActions: $("#detailActions"),
  toast: $("#toast")
};

boot();

async function boot() {
  buildTimeOptions();
  attachEventListeners();

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) {
      state.recoveryMode = true;
      setTimeout(() => showPasswordUpdate(session), 0);
      return;
    }
    if (event === "SIGNED_IN" && session && !state.recoveryMode && state.user?.id !== session.user.id) {
      setTimeout(() => loadAuthenticatedApp(session), 0);
    }
    if (event === "SIGNED_OUT") setTimeout(clearAuthenticatedApp, 0);
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (session && (state.recoveryMode || hasRecoveryParameters())) {
    state.recoveryMode = true;
    showPasswordUpdate(session);
  } else if (session) {
    await loadAuthenticatedApp(session);
  } else {
    showLogin();
  }
}

function attachEventListeners() {
  elements.loginForm.addEventListener("submit", login);
  elements.forgotPasswordButton.addEventListener("click", showRecoveryRequest);
  elements.recoveryRequestForm.addEventListener("submit", requestPasswordReset);
  elements.backToLoginButton.addEventListener("click", showLogin);
  elements.passwordUpdateForm.addEventListener("submit", updatePassword);
  elements.logoutButton.addEventListener("click", logout);
  elements.previousMonth.addEventListener("click", () => changeMonth(-1));
  elements.nextMonth.addEventListener("click", () => changeMonth(1));
  elements.todayButton.addEventListener("click", () => {
    const today = new Date();
    state.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar();
  });
  elements.monthJump.addEventListener("change", () => {
    if (!elements.monthJump.value) return;
    const [year, month] = elements.monthJump.value.split("-").map(Number);
    state.currentDate = new Date(year, month - 1, 1);
    renderCalendar();
  });

  elements.calendarFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    $$(".filter-button").forEach(item => item.classList.toggle("active", item === button));
    renderCalendar();
  });

  elements.updateScheduleButton.addEventListener("click", () => openEditor({ type: "schedule" }));
  elements.invitePartnerButton.addEventListener("click", () => openEditor({ type: "plan" }));
  elements.dayScheduleButton.addEventListener("click", () => openEditor({ type: "schedule", date: state.selectedDate }));
  elements.dayInviteButton.addEventListener("click", () => openEditor({ type: "plan", date: state.selectedDate }));

  elements.closeDayModal.addEventListener("click", closeDayView);
  elements.closeEventModal.addEventListener("click", closeEditor);
  elements.cancelEditor.addEventListener("click", closeEditor);
  elements.closeDetailModal.addEventListener("click", closeDetail);
  elements.eventForm.addEventListener("submit", saveItem);
  elements.deleteEvent.addEventListener("click", deleteCurrentItem);
  elements.scheduleType.addEventListener("change", updateScheduleTitleField);
  elements.templateSelect.addEventListener("change", () => {
    updateCustomTitleField();
    applyTemplateDuration();
  });
  elements.startTime.addEventListener("change", () => {
    if (elements.itemType.value === "plan") applyTemplateDuration();
  });
  elements.eventAllDay.addEventListener("change", syncAllDayFields);
  elements.repeatSchedule.addEventListener("change", () => {
    elements.repeatOptions.classList.toggle("hidden", !elements.repeatSchedule.checked);
    if (elements.repeatSchedule.checked) setDefaultRepeatDay();
  });

  elements.notificationButton.addEventListener("click", event => {
    event.stopPropagation();
    const opening = elements.notificationPanel.classList.contains("hidden");
    elements.notificationPanel.classList.toggle("hidden", !opening);
    elements.notificationButton.setAttribute("aria-expanded", String(opening));
  });
  elements.notificationPanel.addEventListener("click", event => event.stopPropagation());
  elements.markAllReadButton.addEventListener("click", markAllNotificationsRead);
  elements.suggestionForm.addEventListener("submit", submitSuggestion);
  elements.cancelSuggestionButton.addEventListener("click", () => {
    elements.suggestionForm.classList.add("hidden");
    renderDetailActions(getDetailItem());
  });

  $$("[data-copy-direction]").forEach(target => {
    target.addEventListener("dragover", event => {
      if (!state.draggedItemId) return;
      event.preventDefault();
      target.classList.add("drag-over");
    });
    target.addEventListener("dragleave", () => target.classList.remove("drag-over"));
    target.addEventListener("drop", event => {
      event.preventDefault();
      target.classList.remove("drag-over");
      copyItemToAdjacentMonth(target.dataset.copyDirection === "previous" ? -1 : 1);
    });
  });

  [elements.dayModal, elements.eventModal, elements.detailModal].forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target !== modal) return;
      if (modal === elements.dayModal) closeDayView();
      if (modal === elements.eventModal) closeEditor();
      if (modal === elements.detailModal) closeDetail();
    });
  });

  document.addEventListener("click", () => {
    elements.notificationPanel.classList.add("hidden");
    elements.notificationButton.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!elements.eventModal.classList.contains("hidden")) closeEditor();
    else if (!elements.detailModal.classList.contains("hidden")) closeDetail();
    else if (!elements.dayModal.classList.contains("hidden")) closeDayView();
  });
}

async function login(event) {
  event.preventDefault();
  elements.loginMessage.textContent = "";
  elements.loginMessage.classList.remove("success");
  elements.loginButton.disabled = true;
  elements.loginButton.textContent = "Signing in...";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: elements.loginEmail.value.trim(),
    password: elements.loginPassword.value
  });

  if (error) {
    elements.loginMessage.textContent = "Incorrect email or password.";
  } else {
    elements.loginPassword.value = "";
    await loadAuthenticatedApp(data.session);
  }

  elements.loginButton.disabled = false;
  elements.loginButton.textContent = "Sign in";
}

function showRecoveryRequest() {
  state.recoveryMode = false;
  elements.loginHeading.textContent = "reset password";
  elements.authDescription.textContent = "Enter the email used for your calendar login and we’ll send you a secure reset link.";
  elements.loginForm.classList.add("hidden");
  elements.passwordUpdateForm.classList.add("hidden");
  elements.recoveryRequestForm.classList.remove("hidden");
  elements.recoveryRequestMessage.textContent = "";
  elements.recoveryRequestMessage.classList.remove("success");
  elements.recoveryEmail.value = elements.loginEmail.value.trim();
  elements.recoveryEmail.focus();
}

async function requestPasswordReset(event) {
  event.preventDefault();
  elements.recoveryRequestMessage.textContent = "";
  elements.recoveryRequestMessage.classList.remove("success");
  elements.sendRecoveryButton.disabled = true;
  elements.sendRecoveryButton.textContent = "Sending...";

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.resetPasswordForEmail(elements.recoveryEmail.value.trim(), { redirectTo });

  if (error) {
    elements.recoveryRequestMessage.textContent = "The reset email could not be sent right now. Please wait a moment and try again.";
  } else {
    elements.recoveryRequestMessage.textContent = "If that email belongs to a calendar account, a reset link is on its way. Check your inbox and spam folder.";
    elements.recoveryRequestMessage.classList.add("success");
  }

  elements.sendRecoveryButton.disabled = false;
  elements.sendRecoveryButton.textContent = "Send reset email";
}

function showPasswordUpdate(session) {
  if (!session?.user) return showLogin();
  state.user = session.user;
  elements.authView.classList.remove("hidden");
  elements.appView.classList.add("hidden");
  elements.loginHeading.textContent = "choose a new password";
  elements.authDescription.textContent = "Create a new password for your private shared calendar.";
  elements.loginForm.classList.add("hidden");
  elements.recoveryRequestForm.classList.add("hidden");
  elements.passwordUpdateForm.classList.remove("hidden");
  elements.newPassword.value = "";
  elements.confirmNewPassword.value = "";
  elements.passwordUpdateMessage.textContent = "";
  elements.passwordUpdateMessage.classList.remove("success");
  elements.saveNewPasswordButton.disabled = false;
  elements.saveNewPasswordButton.textContent = "Save new password";
  elements.newPassword.focus();
}

async function updatePassword(event) {
  event.preventDefault();
  elements.passwordUpdateMessage.textContent = "";

  if (elements.newPassword.value.length < 8) {
    elements.passwordUpdateMessage.textContent = "Use at least 8 characters for the new password.";
    return;
  }
  if (elements.newPassword.value !== elements.confirmNewPassword.value) {
    elements.passwordUpdateMessage.textContent = "The two passwords do not match.";
    return;
  }

  elements.saveNewPasswordButton.disabled = true;
  elements.saveNewPasswordButton.textContent = "Saving...";
  const { error } = await supabase.auth.updateUser({ password: elements.newPassword.value });

  if (error) {
    elements.passwordUpdateMessage.textContent = "The password could not be updated. Please request a new reset link and try again.";
    elements.saveNewPasswordButton.disabled = false;
    elements.saveNewPasswordButton.textContent = "Save new password";
    return;
  }

  state.recoveryMode = false;
  state.authNotice = "Password updated. You can now sign in with your new password.";
  clearRecoveryParameters();
  await supabase.auth.signOut();
  elements.loginPassword.value = "";
}

async function logout() {
  await supabase.auth.signOut();
  clearAuthenticatedApp();
}

async function loadAuthenticatedApp(session) {
  if (!session?.user) return showLogin();
  setSyncStatus("connecting", true);
  state.user = session.user;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, active")
    .eq("id", session.user.id)
    .single();

  if (error || !profile?.active) {
    await supabase.auth.signOut();
    elements.loginMessage.textContent = "This account does not have access to the private calendar.";
    return showLogin();
  }

  state.profile = profile;
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, role, active")
    .eq("active", true)
    .order("created_at");

  if (profilesError) {
    showToast("Could not load the calendar members.");
    return;
  }

  state.profiles = new Map(profiles.map(item => [item.id, item]));
  state.otherProfile = profiles.find(item => item.id !== profile.id) || null;
  updateAccountUI();
  showApp();
  await Promise.all([loadItems(), loadNotifications()]);
  setupRealtime();
  setSyncStatus("synced");
}

function updateAccountUI() {
  const name = displayName(state.profile);
  const other = displayName(state.otherProfile);
  elements.currentUserName.textContent = name;
  elements.currentUserRole.textContent = state.profile.role === "owner" ? "CJ's calendar" : "my love";
  elements.avatar.textContent = name.slice(0, 1).toUpperCase();
  elements.avatar.classList.toggle("aleckz-avatar", state.profile.role !== "owner");
  elements.invitePartnerButton.textContent = `Invite ${other}`;
  elements.dayInviteButton.textContent = `Invite ${other}`;
  elements.inviteeName.textContent = other;
}

function showApp() {
  elements.authView.classList.add("hidden");
  elements.appView.classList.remove("hidden");
}

function showLogin() {
  state.recoveryMode = false;
  elements.authView.classList.remove("hidden");
  elements.appView.classList.add("hidden");
  elements.loginHeading.textContent = "shared calendar";
  elements.authDescription.textContent = "A private place for CJ and Aleckz to share schedules and make plans.";
  elements.loginForm.classList.remove("hidden");
  elements.recoveryRequestForm.classList.add("hidden");
  elements.passwordUpdateForm.classList.add("hidden");
  if (state.authNotice) {
    elements.loginMessage.textContent = state.authNotice;
    elements.loginMessage.classList.add("success");
    state.authNotice = "";
  } else {
    elements.loginMessage.textContent = "";
    elements.loginMessage.classList.remove("success");
  }
}

function clearAuthenticatedApp() {
  removeRealtime();
  state.user = null;
  state.profile = null;
  state.otherProfile = null;
  state.items = [];
  state.notifications = [];
  closeAllModals();
  showLogin();
}

function hasRecoveryParameters() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return hash.get("type") === "recovery" || query.get("type") === "recovery";
}

function clearRecoveryParameters() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

async function loadItems() {
  setSyncStatus("syncing", true);
  const { data, error } = await supabase
    .from("calendar_items")
    .select("id, item_type, title, template, event_date, start_time, end_time, notes, category, created_by, created_at, updated_at, location, status, invited_user_id, all_day, recurrence_group_id, response_note, suggested_date, suggested_start_time, suggested_end_time, suggested_location, responded_at, last_action_by")
    .order("event_date")
    .order("start_time");

  if (error) {
    setCalendarMessage("Could not load the calendar.", true);
  } else {
    state.items = data || [];
    renderCalendar();
    if (state.selectedDate && !elements.dayModal.classList.contains("hidden")) renderDayView();
    if (state.detailId && !elements.detailModal.classList.contains("hidden")) openDetail(state.detailId);
    setCalendarMessage("");
  }
  setSyncStatus("synced");
}

async function loadNotifications() {
  if (!state.user) return;
  const { data, error } = await supabase
    .from("calendar_notifications")
    .select("id, recipient_id, actor_id, calendar_item_id, notification_type, title, body, is_read, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (!error) {
    state.notifications = data || [];
    renderNotifications();
  }
}

function setupRealtime() {
  removeRealtime();
  state.calendarChannel = supabase
    .channel("shared-calendar-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "calendar_items" }, () => loadItems())
    .subscribe();

  state.notificationChannel = supabase
    .channel(`calendar-notifications-${state.user.id}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "calendar_notifications",
      filter: `recipient_id=eq.${state.user.id}`
    }, () => loadNotifications())
    .subscribe();
}

function removeRealtime() {
  if (state.calendarChannel) supabase.removeChannel(state.calendarChannel);
  if (state.notificationChannel) supabase.removeChannel(state.notificationChannel);
  state.calendarChannel = null;
  state.notificationChannel = null;
}

function renderCalendar() {
  if (!state.profile) return;
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  elements.monthLabel.textContent = state.currentDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  elements.monthJump.value = `${year}-${String(month + 1).padStart(2, "0")}`;
  elements.calendarDays.replaceChildren();

  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const isoDate = toISODate(date);
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.dataset.date = isoDate;
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }));
    if (date.getMonth() !== month) cell.classList.add("outside-month");
    if (isoDate === toISODate(new Date())) cell.classList.add("today");

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(date.getDate());
    cell.append(number);

    const eventList = document.createElement("div");
    eventList.className = "day-events";
    const items = itemsForDate(isoDate).filter(matchesCurrentFilter);
    items.slice(0, 4).forEach(item => eventList.append(createEventChip(item)));
    if (items.length > 4) {
      const more = document.createElement("span");
      more.className = "event-more";
      more.textContent = `+${items.length - 4} more`;
      eventList.append(more);
    }
    cell.append(eventList);

    cell.addEventListener("click", event => {
      if (event.target.closest(".event-chip")) return;
      openDayView(isoDate);
    });
    cell.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDayView(isoDate);
      }
    });
    cell.addEventListener("dblclick", event => {
      if (event.target.closest(".event-chip")) return;
      openEditor({ type: "schedule", date: isoDate });
    });
    cell.addEventListener("dragover", event => {
      if (!state.draggedItemId) return;
      event.preventDefault();
      cell.classList.add("drag-over");
    });
    cell.addEventListener("dragleave", () => cell.classList.remove("drag-over"));
    cell.addEventListener("drop", event => {
      event.preventDefault();
      cell.classList.remove("drag-over");
      copyDraggedItem(isoDate);
    });

    elements.calendarDays.append(cell);
  }
}

function createEventChip(item) {
  const button = document.createElement("button");
  const kind = kindForItem(item);
  button.className = `event-chip kind-${kind}`;
  button.type = "button";
  button.draggable = canEditItem(item);
  button.dataset.itemId = item.id;
  button.title = `${item.title} · ${item.all_day ? "All day" : formatTimeRange(item)}`;

  const time = document.createElement("span");
  time.className = "event-time";
  time.textContent = item.all_day ? "All day" : formatTime(item.start_time);
  const title = document.createElement("span");
  title.className = "event-title";
  title.textContent = item.title;
  button.append(time, title);

  if (item.item_type === "plan") {
    const status = document.createElement("span");
    status.className = "event-status";
    status.textContent = shortStatus(item.status);
    button.append(status);
  }

  button.addEventListener("click", event => {
    event.stopPropagation();
    if (item.item_type === "schedule" && canEditItem(item)) openEditor({ itemId: item.id });
    else openDetail(item.id);
  });

  button.addEventListener("dragstart", event => {
    if (!canEditItem(item)) return event.preventDefault();
    state.draggedItemId = item.id;
    button.classList.add("dragging");
    document.body.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", item.id);
  });
  button.addEventListener("dragend", () => finishDragging());
  return button;
}

function itemsForDate(isoDate) {
  return state.items
    .filter(item => item.event_date === isoDate && item.status !== "cancelled")
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function matchesCurrentFilter(item) {
  if (state.filter === "all") return true;
  if (state.filter === "together") return item.item_type === "plan";
  const profile = state.profiles.get(item.created_by);
  if (state.filter === "cj") return item.item_type === "schedule" && profile?.role === "owner";
  if (state.filter === "aleckz") return item.item_type === "schedule" && profile?.role !== "owner";
  return true;
}

function changeMonth(offset) {
  state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + offset, 1);
  renderCalendar();
}

async function copyDraggedItem(targetDate) {
  const item = state.items.find(entry => entry.id === state.draggedItemId);
  if (!item || !canEditItem(item)) return finishDragging();
  if (targetDate === item.event_date) {
    finishDragging();
    return showToast("Choose a different date to copy this entry.");
  }
  await copyItemToDate(item, targetDate);
  finishDragging();
}

async function copyItemToAdjacentMonth(offset) {
  const item = state.items.find(entry => entry.id === state.draggedItemId);
  if (!item || !canEditItem(item)) return finishDragging();
  const source = parseISODate(item.event_date);
  const targetMonth = new Date(source.getFullYear(), source.getMonth() + offset, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const target = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(source.getDate(), lastDay));
  await copyItemToDate(item, toISODate(target));
  state.currentDate = new Date(target.getFullYear(), target.getMonth(), 1);
  finishDragging();
  renderCalendar();
}

async function copyItemToDate(item, targetDate) {
  setCalendarMessage("Copying entry...");
  const payload = {
    item_type: item.item_type,
    title: item.title,
    template: item.template,
    event_date: targetDate,
    start_time: normaliseTime(item.start_time),
    end_time: normaliseTime(item.end_time),
    notes: item.notes || "",
    category: item.category,
    created_by: state.user.id,
    location: item.location || "",
    status: item.item_type === "schedule" ? "confirmed" : "pending",
    invited_user_id: item.item_type === "plan" ? (item.invited_user_id || state.otherProfile?.id) : null,
    all_day: Boolean(item.all_day),
    recurrence_group_id: null,
    response_note: "",
    suggested_date: null,
    suggested_start_time: null,
    suggested_end_time: null,
    suggested_location: "",
    responded_at: null,
    last_action_by: state.user.id
  };

  const { error } = await supabase.from("calendar_items").insert(payload);
  if (error) {
    setCalendarMessage("The entry could not be copied.", true);
    showToast("The entry could not be copied.");
  } else {
    await loadItems();
    showToast(`Copied to ${formatLongDate(targetDate)}.`);
  }
}

function finishDragging() {
  state.draggedItemId = null;
  document.body.classList.remove("is-dragging");
  $$(".dragging, .drag-over").forEach(item => item.classList.remove("dragging", "drag-over"));
}

function openDayView(isoDate) {
  state.selectedDate = isoDate;
  renderDayView();
  elements.dayModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function renderDayView() {
  const date = parseISODate(state.selectedDate);
  elements.dayTitle.textContent = date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const items = itemsForDate(state.selectedDate);
  const allDay = items.filter(item => item.all_day);
  const timed = items.filter(item => !item.all_day);

  elements.allDayItems.replaceChildren();
  elements.allDayItems.classList.toggle("hidden", allDay.length === 0);
  allDay.forEach(item => {
    const button = document.createElement("button");
    button.className = `all-day-item kind-${kindForItem(item)}`;
    button.type = "button";
    button.textContent = `All day · ${item.title}`;
    applyKindColours(button, item);
    button.addEventListener("click", () => item.item_type === "schedule" && canEditItem(item) ? openEditor({ itemId: item.id }) : openDetail(item.id));
    elements.allDayItems.append(button);
  });

  elements.timeline.replaceChildren();
  for (let slot = 0; slot < 48; slot += 1) {
    const minutes = slot * 30;
    if (slot % 2 === 0) {
      const label = document.createElement("span");
      label.className = "time-label";
      label.style.gridColumn = "1";
      label.style.gridRow = String(slot + 1);
      label.textContent = formatMinutes(minutes);
      elements.timeline.append(label);
    }
    const slotButton = document.createElement("button");
    slotButton.className = `time-slot ${slot % 2 ? "half-hour" : "whole-hour"}`;
    slotButton.type = "button";
    slotButton.style.gridColumn = "2";
    slotButton.style.gridRow = String(slot + 1);
    slotButton.setAttribute("aria-label", `Add schedule at ${formatMinutes(minutes)}`);
    slotButton.addEventListener("click", () => openEditor({
      type: "schedule",
      date: state.selectedDate,
      start: minutesToTime(minutes),
      end: minutesToTime(Math.min(minutes + 60, 1439))
    }));
    elements.timeline.append(slotButton);
  }

  timed.forEach(item => {
    const start = timeToMinutes(item.start_time);
    const end = timeToMinutes(item.end_time);
    const button = document.createElement("button");
    button.className = `timeline-event kind-${kindForItem(item)}`;
    button.type = "button";
    button.style.gridColumn = "2";
    button.style.gridRow = `${Math.floor(start / 30) + 1} / ${Math.max(Math.floor(start / 30) + 2, Math.ceil(end / 30) + 1)}`;
    const title = document.createElement("strong");
    title.textContent = item.title;
    const meta = document.createElement("span");
    meta.textContent = `${formatTimeRange(item)}${item.location ? ` · ${item.location}` : ""}`;
    button.append(title, meta);
    button.addEventListener("click", () => item.item_type === "schedule" && canEditItem(item) ? openEditor({ itemId: item.id }) : openDetail(item.id));
    elements.timeline.append(button);
  });
}

function closeDayView() {
  elements.dayModal.classList.add("hidden");
  state.selectedDate = null;
  syncBodyModalState();
}

function openEditor({ type = "schedule", date = null, start = "09:00", end = "17:00", itemId = null } = {}) {
  const item = itemId ? state.items.find(entry => entry.id === itemId) : null;
  if (item && !canEditItem(item)) return openDetail(item.id);

  state.editingId = item?.id || null;
  const itemType = item?.item_type || type;
  const itemDate = item?.event_date || date || toISODate(new Date());
  elements.itemType.value = itemType;
  elements.eventDate.value = itemDate;
  elements.startTime.value = normaliseTime(item?.start_time || start);
  elements.endTime.value = normaliseTime(item?.end_time || end);
  elements.eventAllDay.checked = Boolean(item?.all_day);
  elements.eventLocation.value = item?.location || "";
  elements.eventNotes.value = item?.notes || "";
  elements.formMessage.textContent = "";
  elements.formMessage.classList.remove("success");
  elements.repeatSchedule.checked = false;
  elements.repeatOptions.classList.add("hidden");
  elements.repeatEndDate.value = itemDate;
  $$(".weekday-pills input").forEach(input => { input.checked = false; });

  const isPlan = itemType === "plan";
  elements.scheduleFields.classList.toggle("hidden", isPlan);
  elements.planFields.classList.toggle("hidden", !isPlan);
  elements.repeatSection.classList.toggle("hidden", isPlan || Boolean(item));
  elements.editorLabel.textContent = isPlan ? `invite ${displayName(state.otherProfile)}` : "update my schedule";
  elements.editorHeading.textContent = item ? (isPlan ? "Edit plan" : "Edit schedule") : (isPlan ? "Make a plan together" : "Add schedule");
  elements.editorMeta.textContent = item ? `Created by ${displayName(state.profiles.get(item.created_by))}` : formatLongDate(itemDate);
  elements.saveEventButton.textContent = item ? "Save changes" : (isPlan ? `Send invite to ${displayName(state.otherProfile)}` : "Save schedule");
  elements.deleteEvent.classList.toggle("hidden", !item);

  if (isPlan) {
    const templateKey = item?.template && templates[item.template] ? item.template : "custom";
    elements.templateSelect.value = templateKey;
    elements.customEventTitle.value = templateKey === "custom" ? (item?.title || "") : "";
    elements.inviteeName.textContent = displayName(item?.invited_user_id ? state.profiles.get(item.invited_user_id) : state.otherProfile);
    updateCustomTitleField();
  } else {
    elements.scheduleType.value = item?.category || "work";
    elements.scheduleTitle.value = item?.category === "other" ? (item.title || "") : "";
    updateScheduleTitleField();
  }

  syncAllDayFields();
  elements.eventModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeEditor() {
  elements.eventModal.classList.add("hidden");
  state.editingId = null;
  elements.eventForm.reset();
  elements.formMessage.textContent = "";
  syncBodyModalState();
}

async function saveItem(event) {
  event.preventDefault();
  elements.formMessage.textContent = "";
  elements.saveEventButton.disabled = true;
  const existing = state.items.find(item => item.id === state.editingId) || null;
  const itemType = elements.itemType.value;
  const allDay = elements.eventAllDay.checked;
  const startTime = allDay ? "00:00" : elements.startTime.value;
  const endTime = allDay ? "23:59" : elements.endTime.value;

  if (!elements.eventDate.value || timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    elements.formMessage.textContent = "Choose a valid date and end time.";
    elements.saveEventButton.disabled = false;
    return;
  }

  let title;
  let template = null;
  let category;
  if (itemType === "schedule") {
    category = elements.scheduleType.value;
    title = category === "other" ? elements.scheduleTitle.value.trim() : scheduleLabels[category];
    if (!title) {
      elements.formMessage.textContent = "Enter a name for this schedule.";
      elements.saveEventButton.disabled = false;
      return;
    }
  } else {
    template = elements.templateSelect.value;
    title = template === "custom" ? elements.customEventTitle.value.trim() : templates[template]?.title;
    category = "plan";
    if (!title) {
      elements.formMessage.textContent = "Enter a name for this plan.";
      elements.saveEventButton.disabled = false;
      return;
    }
  }

  const isExistingLegacyPlan = itemType === "plan" && existing && !existing.invited_user_id;
  const payload = {
    item_type: itemType,
    title: title.slice(0, 80),
    template,
    event_date: elements.eventDate.value,
    start_time: startTime,
    end_time: endTime,
    notes: elements.eventNotes.value.trim(),
    category,
    location: elements.eventLocation.value.trim(),
    all_day: allDay,
    status: itemType === "schedule" || isExistingLegacyPlan ? "confirmed" : "pending",
    invited_user_id: itemType === "plan" ? (isExistingLegacyPlan ? null : (existing?.invited_user_id || state.otherProfile?.id)) : null,
    response_note: "",
    suggested_date: null,
    suggested_start_time: null,
    suggested_end_time: null,
    suggested_location: "",
    responded_at: null,
    last_action_by: state.user.id
  };

  let error;
  let savedCount = 1;
  if (existing) {
    ({ error } = await supabase.from("calendar_items").update(payload).eq("id", existing.id));
  } else if (itemType === "schedule" && elements.repeatSchedule.checked) {
    const repeatResult = buildRecurringPayloads(payload);
    if (repeatResult.error) {
      elements.formMessage.textContent = repeatResult.error;
      elements.saveEventButton.disabled = false;
      return;
    }
    savedCount = repeatResult.rows.length;
    ({ error } = await supabase.from("calendar_items").insert(repeatResult.rows));
  } else {
    ({ error } = await supabase.from("calendar_items").insert({ ...payload, created_by: state.user.id }));
  }

  elements.saveEventButton.disabled = false;
  if (error) {
    elements.formMessage.textContent = friendlyDatabaseError(error);
    return;
  }

  closeEditor();
  await loadItems();
  showToast(existing ? "Changes saved." : savedCount > 1 ? `${savedCount} schedule entries added.` : itemType === "plan" ? `Invitation sent to ${displayName(state.otherProfile)}.` : "Schedule added.");
}

function buildRecurringPayloads(payload) {
  const start = parseISODate(elements.eventDate.value);
  const end = parseISODate(elements.repeatEndDate.value);
  const weekdays = $$(".weekday-pills input:checked").map(input => Number(input.value));
  if (!elements.repeatEndDate.value || end < start) return { error: "Choose a repeat end date on or after the first date." };
  if (!weekdays.length) return { error: "Choose at least one weekday to repeat on." };
  const daysApart = Math.round((end - start) / 86400000);
  if (daysApart > 366) return { error: "A repeating schedule can cover up to one year at a time." };

  const recurrenceId = crypto.randomUUID();
  const rows = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = ((cursor.getDay() + 6) % 7) + 1;
    if (weekdays.includes(weekday)) {
      rows.push({
        ...payload,
        event_date: toISODate(cursor),
        created_by: state.user.id,
        recurrence_group_id: recurrenceId
      });
    }
  }
  if (!rows.length) return { error: "No selected weekdays occur in that date range." };
  return { rows };
}

async function deleteCurrentItem() {
  const item = state.items.find(entry => entry.id === state.editingId);
  if (!item || !canEditItem(item)) return;
  if (!window.confirm(`Delete “${item.title}”?`)) return;
  elements.deleteEvent.disabled = true;
  const { error } = await supabase.from("calendar_items").delete().eq("id", item.id);
  elements.deleteEvent.disabled = false;
  if (error) return elements.formMessage.textContent = "This entry could not be deleted.";
  closeEditor();
  await loadItems();
  showToast("Entry deleted.");
}

function openDetail(itemId) {
  const item = state.items.find(entry => entry.id === itemId);
  if (!item) return;
  state.detailId = item.id;
  const creator = state.profiles.get(item.created_by);
  const isPlan = item.item_type === "plan";
  elements.detailLabel.textContent = isPlan ? "plan together" : `${displayName(creator)}'s schedule`;
  elements.detailTitle.textContent = item.title;
  elements.detailStatus.textContent = humanStatus(item.status);
  elements.detailStatus.className = `status-pill ${item.status}`;
  elements.detailStatus.classList.toggle("hidden", !isPlan);
  elements.detailCreator.textContent = displayName(creator);
  elements.detailDate.textContent = formatLongDate(item.event_date);
  elements.detailTime.textContent = item.all_day ? "All day" : formatTimeRange(item);
  elements.detailLocation.textContent = item.location || "";
  elements.detailLocationRow.classList.toggle("hidden", !item.location);
  elements.detailNotes.textContent = item.notes || "";
  elements.detailNotesRow.classList.toggle("hidden", !item.notes);
  elements.detailMessage.textContent = "";
  elements.suggestionForm.classList.add("hidden");

  const hasSuggestion = isPlan && item.status === "changes_suggested" && item.suggested_date;
  elements.suggestionSummary.classList.toggle("hidden", !hasSuggestion);
  if (hasSuggestion) {
    elements.suggestionWhen.textContent = `${formatLongDate(item.suggested_date)} · ${formatTime(item.suggested_start_time)}–${formatTime(item.suggested_end_time)}`;
    elements.suggestionLocation.textContent = item.suggested_location || "No location suggested";
    elements.suggestionNote.textContent = item.response_note || "";
  }

  renderDetailActions(item);
  elements.detailModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function renderDetailActions(item) {
  elements.detailActions.replaceChildren();
  if (!item) return;
  const isCreator = item.created_by === state.user.id;
  const isInvitee = item.invited_user_id === state.user.id;

  if (isCreator) {
    if (item.item_type === "plan" && item.status === "changes_suggested" && item.suggested_date) {
      elements.detailActions.append(actionButton("Use suggested changes", "primary-button", () => applySuggestion(item)));
    }
    if (item.item_type === "plan" && item.status === "accepted") {
      elements.detailActions.append(actionButton("Confirm plan", "primary-button", () => confirmPlan(item)));
    }
    elements.detailActions.append(actionButton("Edit", "secondary-button", () => {
      closeDetail();
      openEditor({ itemId: item.id });
    }));
  }

  if (item.item_type === "plan" && isInvitee && item.status === "pending") {
    elements.detailActions.append(
      actionButton("Decline", "danger-button", () => respondToInvitation(item, "declined")),
      actionButton("Suggest changes", "secondary-button", () => showSuggestionForm(item)),
      actionButton("Accept", "primary-button", () => respondToInvitation(item, "accepted"))
    );
  }
}

function actionButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function showSuggestionForm(item) {
  elements.suggestedDate.value = item.event_date;
  elements.suggestedStartTime.value = normaliseTime(item.start_time);
  elements.suggestedEndTime.value = normaliseTime(item.end_time);
  elements.suggestedLocationInput.value = item.location || "";
  elements.responseNote.value = "";
  elements.suggestionForm.classList.remove("hidden");
  elements.detailActions.replaceChildren();
}

async function submitSuggestion(event) {
  event.preventDefault();
  const item = getDetailItem();
  if (!item) return;
  if (timeToMinutes(elements.suggestedEndTime.value) <= timeToMinutes(elements.suggestedStartTime.value)) {
    elements.detailMessage.textContent = "Choose an end time after the start time.";
    return;
  }
  await respondToInvitation(item, "changes_suggested", {
    p_note: elements.responseNote.value.trim(),
    p_suggested_date: elements.suggestedDate.value,
    p_suggested_start_time: elements.suggestedStartTime.value,
    p_suggested_end_time: elements.suggestedEndTime.value,
    p_suggested_location: elements.suggestedLocationInput.value.trim()
  });
}

async function respondToInvitation(item, status, extras = {}) {
  elements.detailMessage.textContent = "Saving response...";
  const { error } = await supabase.rpc("respond_to_calendar_invitation", {
    p_item_id: item.id,
    p_status: status,
    p_note: extras.p_note || "",
    p_suggested_date: extras.p_suggested_date || null,
    p_suggested_start_time: extras.p_suggested_start_time || null,
    p_suggested_end_time: extras.p_suggested_end_time || null,
    p_suggested_location: extras.p_suggested_location || ""
  });
  if (error) {
    elements.detailMessage.textContent = "Your response could not be saved.";
    return;
  }
  await loadItems();
  showToast(status === "accepted" ? "Invitation accepted." : status === "declined" ? "Invitation declined." : "Suggested changes sent.");
}

async function confirmPlan(item) {
  const { error } = await supabase.from("calendar_items").update({
    status: "confirmed",
    last_action_by: state.user.id
  }).eq("id", item.id);
  if (error) return elements.detailMessage.textContent = "The plan could not be confirmed.";
  await loadItems();
  showToast("Plan confirmed.");
}

async function applySuggestion(item) {
  const { error } = await supabase.from("calendar_items").update({
    event_date: item.suggested_date,
    start_time: normaliseTime(item.suggested_start_time),
    end_time: normaliseTime(item.suggested_end_time),
    location: item.suggested_location || item.location || "",
    status: "pending",
    response_note: "",
    suggested_date: null,
    suggested_start_time: null,
    suggested_end_time: null,
    suggested_location: "",
    responded_at: null,
    last_action_by: state.user.id
  }).eq("id", item.id);
  if (error) return elements.detailMessage.textContent = "The suggested changes could not be applied.";
  await loadItems();
  showToast(`Updated invitation sent back to ${displayName(state.otherProfile)}.`);
}

function closeDetail() {
  elements.detailModal.classList.add("hidden");
  elements.suggestionForm.classList.add("hidden");
  state.detailId = null;
  syncBodyModalState();
}

function getDetailItem() {
  return state.items.find(item => item.id === state.detailId) || null;
}

function renderNotifications() {
  const unread = state.notifications.filter(item => !item.is_read).length;
  elements.notificationBadge.textContent = String(unread);
  elements.notificationBadge.classList.toggle("hidden", unread === 0);
  elements.notificationsList.replaceChildren();

  if (!state.notifications.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No notifications yet.";
    elements.notificationsList.append(empty);
    return;
  }

  state.notifications.forEach(notification => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `notification-item ${notification.is_read ? "" : "unread"}`;
    const stateDot = document.createElement("i");
    stateDot.className = "notification-state";
    const copy = document.createElement("span");
    copy.className = "notification-copy";
    const title = document.createElement("strong");
    title.textContent = notification.title;
    const meta = document.createElement("span");
    meta.textContent = `${notification.body} · ${relativeTime(notification.created_at)}`;
    copy.append(title, meta);
    button.append(stateDot, copy);
    button.addEventListener("click", () => openNotification(notification));
    elements.notificationsList.append(button);
  });
}

async function openNotification(notification) {
  if (!notification.is_read) {
    await supabase.from("calendar_notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", notification.id);
    await loadNotifications();
  }
  elements.notificationPanel.classList.add("hidden");
  const item = state.items.find(entry => entry.id === notification.calendar_item_id);
  if (item) openDetail(item.id);
}

async function markAllNotificationsRead() {
  const unreadIds = state.notifications.filter(item => !item.is_read).map(item => item.id);
  if (!unreadIds.length) return;
  const { error } = await supabase.from("calendar_notifications").update({
    is_read: true,
    read_at: new Date().toISOString()
  }).in("id", unreadIds);
  if (!error) await loadNotifications();
}

function buildTimeOptions() {
  const selects = [elements.startTime, elements.endTime, elements.suggestedStartTime, elements.suggestedEndTime];
  selects.forEach(select => {
    select.replaceChildren();
    for (let minutes = 0; minutes < 1440; minutes += 30) {
      const option = document.createElement("option");
      option.value = minutesToTime(minutes);
      option.textContent = formatMinutes(minutes);
      select.append(option);
    }
    const finalOption = document.createElement("option");
    finalOption.value = "23:59";
    finalOption.textContent = "11:59 PM";
    select.append(finalOption);
  });
}

function syncAllDayFields() {
  const allDay = elements.eventAllDay.checked;
  elements.timeFields.classList.toggle("hidden", allDay);
  elements.startTime.required = !allDay;
  elements.endTime.required = !allDay;
}

function updateScheduleTitleField() {
  const custom = elements.scheduleType.value === "other";
  elements.scheduleTitleField.classList.toggle("hidden", !custom);
  elements.scheduleTitle.required = custom;
}

function updateCustomTitleField() {
  const custom = elements.templateSelect.value === "custom";
  elements.customTitleField.classList.toggle("hidden", !custom);
  elements.customEventTitle.required = custom;
}

function applyTemplateDuration() {
  const template = templates[elements.templateSelect.value];
  if (!template || elements.eventAllDay.checked) return;
  const end = Math.min(timeToMinutes(elements.startTime.value) + template.duration, 1439);
  elements.endTime.value = minutesToTime(end);
}

function setDefaultRepeatDay() {
  if (!elements.eventDate.value) return;
  const date = parseISODate(elements.eventDate.value);
  const weekday = ((date.getDay() + 6) % 7) + 1;
  $$(".weekday-pills input").forEach(input => { input.checked = Number(input.value) === weekday; });
  if (!elements.repeatEndDate.value || elements.repeatEndDate.value < elements.eventDate.value) {
    const end = new Date(date);
    end.setMonth(end.getMonth() + 1);
    elements.repeatEndDate.value = toISODate(end);
  }
}

function kindForItem(item) {
  if (item.item_type === "plan") return "together";
  return state.profiles.get(item.created_by)?.role === "owner" ? "cj" : "aleckz";
}

function applyKindColours(element, item) {
  const kind = kindForItem(item);
  const palette = kind === "cj"
    ? ["var(--cj)", "var(--cj-soft)", "var(--cj-dark)"]
    : kind === "aleckz"
      ? ["var(--aleckz)", "var(--aleckz-soft)", "var(--aleckz-dark)"]
      : ["var(--together)", "var(--together-soft)", "var(--together-dark)"];
  element.style.borderColor = palette[0];
  element.style.background = palette[1];
  element.style.color = palette[2];
}

function canEditItem(item) {
  return Boolean(state.user && item.created_by === state.user.id);
}

function displayName(profile) {
  if (!profile) return "your person";
  const value = profile.display_name || (profile.role === "owner" ? "CJ" : "Aleckz");
  if (value.toLowerCase() === "cj") return "CJ";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function setSyncStatus(text, syncing = false) {
  elements.syncStatus.textContent = `● ${text}`;
  elements.syncStatus.classList.toggle("syncing", syncing);
}

function setCalendarMessage(text, error = false) {
  elements.calendarMessage.textContent = text;
  elements.calendarMessage.classList.toggle("error", error);
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  state.toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), 3200);
}

function closeAllModals() {
  elements.dayModal.classList.add("hidden");
  elements.eventModal.classList.add("hidden");
  elements.detailModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function syncBodyModalState() {
  const anyOpen = [elements.dayModal, elements.eventModal, elements.detailModal]
    .some(modal => !modal.classList.contains("hidden"));
  document.body.classList.toggle("modal-open", anyOpen);
}

function normaliseTime(value) {
  return String(value || "00:00").slice(0, 5);
}

function timeToMinutes(value) {
  const [hours, minutes] = normaliseTime(value).split(":").map(Number);
  return (hours * 60) + minutes;
}

function minutesToTime(minutes) {
  const safe = Math.max(0, Math.min(1439, minutes));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function formatTime(value) {
  return formatMinutes(timeToMinutes(value));
}

function formatTimeRange(item) {
  return `${formatTime(item.start_time)}–${formatTime(item.end_time)}`;
}

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(value) {
  return parseISODate(value).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function shortStatus(status) {
  return ({ pending: "pending", changes_suggested: "change", accepted: "accepted", declined: "declined", confirmed: "confirmed" })[status] || status;
}

function humanStatus(status) {
  return ({ pending: "Pending response", changes_suggested: "Changes suggested", accepted: "Accepted", declined: "Declined", confirmed: "Confirmed", cancelled: "Cancelled" })[status] || status;
}

function relativeTime(value) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"]
  ];
  for (const [amount, unit] of units) {
    if (Math.abs(seconds) >= amount) return formatter.format(Math.round(seconds / amount), unit);
  }
  return "just now";
}

function friendlyDatabaseError(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("row-level security")) return "You can only change calendar entries you created.";
  if (message.includes("calendar_item_time_check")) return "The end time must be after the start time.";
  return "The calendar could not save this entry. Please try again.";
}
