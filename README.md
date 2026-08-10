# Our Shared Calendar

A private GitHub Pages calendar for CJ and Aleckz, backed by Supabase.

## Current milestone — two-person schedules and invitations

- Existing email/password access remains restricted to the two approved accounts.
- A forgot-password flow sends a secure recovery link and lets the account owner choose a new password on the site.
- CJ's personal schedule uses muted blue.
- Aleckz's personal schedule uses lilac/muted purple.
- Plans together use muted gold.
- Both people can add work, university, appointments, busy time, gym, or custom schedules.
- Only the creator can edit or delete a personal schedule entry.
- A schedule can be repeated across selected weekdays and a date range.
- Owned entries can be dragged onto another date to create a copy.
- Adjacent-month copy targets support cross-month schedule copying.
- The invitation button automatically names the other person.
- Invitations support pending, accepted, changes suggested, declined, and confirmed states.
- In-site notifications update through Supabase Realtime.
- Existing calendar data is retained.
- The cancelled friend-calendar database API is disabled without deleting its stored data.

## Notifications

In-site notifications are active. Supabase Auth handles password-reset emails.

The secure email-delivery path is installed but intentionally disabled. Invitation, response, suggested-change, and confirmation actions can call the protected `send-calendar-email` Supabase Edge Function, which currently exits without sending anything because `EMAIL_NOTIFICATIONS_ENABLED` defaults to `false`. No email-provider key is stored in the public GitHub Pages source.

To activate email later without changing the website code:

1. Verify a sending domain with the chosen provider.
2. Add `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` as protected Supabase Function secrets.
3. Set `EMAIL_NOTIFICATIONS_ENABLED=true`.
4. Set `email_enabled=true` for the recipient's private notification preference.

SMS remains a separate later option because it uses a different paid provider.

## Next roadmap items

1. Shared free-time suggestions based on both schedules.
2. Proper location favourites and learned recommendations.
3. Activate the prepared email delivery channel when wanted.
4. Optional SMS delivery through a paid SMS provider.
5. Google Calendar integration, followed by Microsoft Calendar integration.

The live database schema used by this milestone is documented in `supabase/schema-phase-02.sql`.
