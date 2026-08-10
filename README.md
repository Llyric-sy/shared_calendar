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

In-site notifications are active. Supabase Auth handles password-reset emails. Automatic invitation email or SMS requires a protected server-side provider key and must not be placed in this public GitHub Pages source. The database already contains private notification preferences so email can be connected first and SMS can be added later without redesigning the calendar.

## Next roadmap items

1. Shared free-time suggestions based on both schedules.
2. Proper location favourites and learned recommendations.
3. Secure email delivery through a Supabase Edge Function and transactional-email provider.
4. Optional SMS delivery through a paid SMS provider.
5. Google Calendar integration, followed by Microsoft Calendar integration.

The live database schema used by this milestone is documented in `supabase/schema-phase-02.sql`.
