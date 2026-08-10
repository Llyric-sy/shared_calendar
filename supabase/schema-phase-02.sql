begin;

alter table public.profiles
  drop constraint if exists profiles_role_check;

-- Keep the existing two authenticated accounts, but use the relationship label
-- shown by the private two-person calendar.
update public.profiles
set role = 'my_love'
where role = 'girlfriend';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'my_love'));

-- Extend the existing table in place so all current calendar entries survive.
alter table public.calendar_items
  drop constraint if exists calendar_items_category_check;

alter table public.calendar_items
  add constraint calendar_items_category_check
  check (category in (
    'work',
    'uni',
    'appointment',
    'busy',
    'gym',
    'other',
    'plan'
  ));

alter table public.calendar_items
  add column if not exists location text not null default '',
  add column if not exists status text not null default 'confirmed',
  add column if not exists invited_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists all_day boolean not null default false,
  add column if not exists recurrence_group_id uuid,
  add column if not exists response_note text not null default '',
  add column if not exists suggested_date date,
  add column if not exists suggested_start_time time,
  add column if not exists suggested_end_time time,
  add column if not exists suggested_location text not null default '',
  add column if not exists responded_at timestamptz,
  add column if not exists last_action_by uuid references public.profiles(id) on delete set null;

alter table public.calendar_items
  drop constraint if exists calendar_items_status_check,
  drop constraint if exists calendar_items_location_length_check,
  drop constraint if exists calendar_items_response_note_length_check,
  drop constraint if exists calendar_items_suggestion_time_check,
  drop constraint if exists calendar_items_shape_check;

alter table public.calendar_items
  add constraint calendar_items_status_check
    check (status in (
      'pending',
      'changes_suggested',
      'accepted',
      'declined',
      'confirmed',
      'cancelled'
    )),
  add constraint calendar_items_location_length_check
    check (char_length(location) <= 300),
  add constraint calendar_items_response_note_length_check
    check (char_length(response_note) <= 1000),
  add constraint calendar_items_suggestion_time_check
    check (
      suggested_start_time is null
      or suggested_end_time is null
      or suggested_end_time > suggested_start_time
    ),
  add constraint calendar_items_shape_check
    check (
      (
        item_type = 'schedule'
        and category in ('work', 'uni', 'appointment', 'busy', 'gym', 'other')
        and invited_user_id is null
        and status = 'confirmed'
      )
      or
      (
        item_type = 'plan'
        and category = 'plan'
      )
    );

create index if not exists calendar_items_date_idx
  on public.calendar_items(event_date, start_time);

create index if not exists calendar_items_created_by_idx
  on public.calendar_items(created_by);

create index if not exists calendar_items_invited_user_idx
  on public.calendar_items(invited_user_id)
  where invited_user_id is not null;

create index if not exists calendar_items_last_action_by_idx
  on public.calendar_items(last_action_by)
  where last_action_by is not null;

-- Harden the membership helpers used by RLS.
create or replace function public.is_calendar_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function public.is_calendar_member() from public, anon;
grant execute on function public.is_calendar_member() to authenticated;

create or replace function public.is_calendar_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'owner'
      and active = true
  );
$$;

revoke all on function public.is_calendar_owner() from public, anon;
grant execute on function public.is_calendar_owner() to authenticated;

-- Both people can see the complete private calendar. Each person can only
-- change or remove entries they created. Invitation responses go through the
-- restricted RPC below so an invitee cannot rewrite the inviter's entry.
drop policy if exists "Members can view calendar" on public.calendar_items;
drop policy if exists "Members can create allowed calendar items" on public.calendar_items;
drop policy if exists "Members can edit allowed calendar items" on public.calendar_items;
drop policy if exists "Members can delete allowed calendar items" on public.calendar_items;

create policy "Members can view calendar"
on public.calendar_items
for select
to authenticated
using (public.is_calendar_member());

create policy "Members can create own calendar items"
on public.calendar_items
for insert
to authenticated
with check (
  public.is_calendar_member()
  and created_by = (select auth.uid())
  and (
    (
      item_type = 'schedule'
      and category in ('work', 'uni', 'appointment', 'busy', 'gym', 'other')
      and invited_user_id is null
      and status = 'confirmed'
    )
    or
    (
      item_type = 'plan'
      and category = 'plan'
      and status = 'pending'
      and invited_user_id is not null
      and invited_user_id <> (select auth.uid())
      and exists (
        select 1
        from public.profiles invited_profile
        where invited_profile.id = invited_user_id
          and invited_profile.active = true
      )
    )
  )
);

create policy "Members can edit own calendar items"
on public.calendar_items
for update
to authenticated
using (
  public.is_calendar_member()
  and created_by = (select auth.uid())
)
with check (
  public.is_calendar_member()
  and created_by = (select auth.uid())
  and (
    (
      item_type = 'schedule'
      and category in ('work', 'uni', 'appointment', 'busy', 'gym', 'other')
      and invited_user_id is null
      and status = 'confirmed'
    )
    or
    (
      item_type = 'plan'
      and category = 'plan'
      and (
        (
          invited_user_id is null
          and status = 'confirmed'
        )
        or
        (
          invited_user_id is not null
          and invited_user_id <> (select auth.uid())
          and exists (
            select 1
            from public.profiles invited_profile
            where invited_profile.id = invited_user_id
              and invited_profile.active = true
          )
        )
      )
    )
  )
);

create policy "Members can delete own calendar items"
on public.calendar_items
for delete
to authenticated
using (
  public.is_calendar_member()
  and created_by = (select auth.uid())
);

-- The invitee can only change invitation response fields, never the inviter's
-- title, notes, date, time, or ownership.
create or replace function public.respond_to_calendar_invitation(
  p_item_id uuid,
  p_status text,
  p_note text default '',
  p_suggested_date date default null,
  p_suggested_start_time time default null,
  p_suggested_end_time time default null,
  p_suggested_location text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if not public.is_calendar_member() then
    raise exception 'Calendar access required';
  end if;

  if p_status not in ('accepted', 'declined', 'changes_suggested') then
    raise exception 'Invalid invitation response';
  end if;

  if p_status = 'changes_suggested' then
    if p_suggested_date is null
      or p_suggested_start_time is null
      or p_suggested_end_time is null
      or p_suggested_end_time <= p_suggested_start_time then
      raise exception 'A valid suggested date and time are required';
    end if;
  end if;

  update public.calendar_items
  set
    status = p_status,
    response_note = left(coalesce(p_note, ''), 1000),
    suggested_date = case when p_status = 'changes_suggested' then p_suggested_date else null end,
    suggested_start_time = case when p_status = 'changes_suggested' then p_suggested_start_time else null end,
    suggested_end_time = case when p_status = 'changes_suggested' then p_suggested_end_time else null end,
    suggested_location = case when p_status = 'changes_suggested' then left(coalesce(p_suggested_location, ''), 300) else '' end,
    responded_at = now(),
    last_action_by = (select auth.uid()),
    updated_at = now()
  where id = p_item_id
    and item_type = 'plan'
    and invited_user_id = (select auth.uid())
    and status in ('pending', 'changes_suggested', 'accepted');

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Invitation is not available to respond to';
  end if;
end;
$$;

revoke all on function public.respond_to_calendar_invitation(uuid, text, text, date, time, time, text)
  from public, anon;
grant execute on function public.respond_to_calendar_invitation(uuid, text, text, date, time, time, text)
  to authenticated;

-- In-site notifications work immediately and update live in both browsers.
create table if not exists public.calendar_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  calendar_item_id uuid references public.calendar_items(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'invitation',
    'accepted',
    'declined',
    'changes_suggested',
    'confirmed'
  )),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 1000),
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.calendar_notifications enable row level security;

create index if not exists calendar_notifications_recipient_idx
  on public.calendar_notifications(recipient_id, is_read, created_at desc);

create index if not exists calendar_notifications_actor_idx
  on public.calendar_notifications(actor_id)
  where actor_id is not null;

create index if not exists calendar_notifications_item_idx
  on public.calendar_notifications(calendar_item_id)
  where calendar_item_id is not null;

drop policy if exists "Members can view own notifications" on public.calendar_notifications;
drop policy if exists "Members can update own notifications" on public.calendar_notifications;

create policy "Members can view own notifications"
on public.calendar_notifications
for select
to authenticated
using (
  recipient_id = (select auth.uid())
  and public.is_calendar_member()
);

create policy "Members can update own notifications"
on public.calendar_notifications
for update
to authenticated
using (
  recipient_id = (select auth.uid())
  and public.is_calendar_member()
)
with check (
  recipient_id = (select auth.uid())
  and public.is_calendar_member()
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.queue_calendar_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
  recipient uuid;
  notification_kind text;
  notification_title text;
  notification_body text;
begin
  select display_name
  into actor_name
  from public.profiles
  where id = coalesce((select auth.uid()), new.last_action_by, new.created_by);

  actor_name := coalesce(actor_name, 'Your person');

  if tg_op = 'INSERT'
    and new.item_type = 'plan'
    and new.status = 'pending'
    and new.invited_user_id is not null then

    recipient := new.invited_user_id;
    notification_kind := 'invitation';
    notification_title := actor_name || ' invited you';
    notification_body := new.title;

  elsif tg_op = 'UPDATE'
    and new.item_type = 'plan'
    and new.status is distinct from old.status then

    if new.status in ('accepted', 'declined', 'changes_suggested') then
      recipient := new.created_by;
      notification_kind := new.status;
      notification_title := case new.status
        when 'accepted' then actor_name || ' accepted your invitation'
        when 'declined' then actor_name || ' declined your invitation'
        else actor_name || ' suggested changes'
      end;
      notification_body := new.title;
    elsif new.status = 'confirmed' and new.invited_user_id is not null then
      recipient := new.invited_user_id;
      notification_kind := 'confirmed';
      notification_title := actor_name || ' confirmed the plan';
      notification_body := new.title;
    end if;
  end if;

  if recipient is not null then
    insert into public.calendar_notifications (
      recipient_id,
      actor_id,
      calendar_item_id,
      notification_type,
      title,
      body
    ) values (
      recipient,
      coalesce((select auth.uid()), new.last_action_by, new.created_by),
      new.id,
      notification_kind,
      notification_title,
      notification_body
    );
  end if;

  return new;
end;
$$;

drop trigger if exists calendar_item_notification_trigger on public.calendar_items;
create trigger calendar_item_notification_trigger
after insert or update of status on public.calendar_items
for each row
execute function private.queue_calendar_notification();

-- Store future delivery preferences now. External email/SMS delivery remains
-- disabled until a protected provider key is configured in an Edge Function.
create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  phone_e164 text,
  updated_at timestamptz not null default now(),
  constraint notification_phone_format_check
    check (phone_e164 is null or phone_e164 ~ '^\\+[1-9][0-9]{7,14}$')
);

alter table public.notification_preferences enable row level security;

insert into public.notification_preferences(profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;

drop policy if exists "Members can view own notification preferences" on public.notification_preferences;
drop policy if exists "Members can update own notification preferences" on public.notification_preferences;

create policy "Members can view own notification preferences"
on public.notification_preferences
for select
to authenticated
using (
  profile_id = (select auth.uid())
  and public.is_calendar_member()
);

create policy "Members can update own notification preferences"
on public.notification_preferences
for update
to authenticated
using (
  profile_id = (select auth.uid())
  and public.is_calendar_member()
)
with check (
  profile_id = (select auth.uid())
  and public.is_calendar_member()
);

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.calendar_items to authenticated;
grant select, update on public.calendar_notifications to authenticated;
grant select, update on public.notification_preferences to authenticated;

revoke all on public.calendar_notifications from anon;
revoke all on public.notification_preferences from anon;
revoke all on public.calendar_items from anon;

-- The friend-calendar page was cancelled. Keep its data, but close the API
-- functions that made name-only access possible.
revoke all on public.friends, public.friend_events from anon, authenticated;
revoke all on function public.friend_login(text) from public, anon, authenticated;
revoke all on function public.friend_calendar(uuid) from public, anon, authenticated;
revoke all on function public.create_friend_event(uuid, text, text, date, time, time, text)
  from public, anon, authenticated;
revoke all on function public.update_friend_event(uuid, uuid, text, text, date, time, time, text)
  from public, anon, authenticated;
revoke all on function public.delete_friend_event(uuid, uuid)
  from public, anon, authenticated;

-- This function is used by a database event trigger, not by browser clients.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'calendar_notifications'
  ) then
    alter publication supabase_realtime add table public.calendar_notifications;
  end if;
end;
$$;

commit;
