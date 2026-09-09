-- Calendar sync: each patient gets a stable, unguessable token used as the
-- ONLY access control for the public .ics feed (supabase/functions/
-- calendar-feed) — a phone's native calendar app can't send a Supabase Auth
-- JWT, so this can't reuse the RLS-based read policies. Same shape as
-- Google Calendar's "secret address in iCal format": a random 128-bit
-- value in the URL, not tied to any login session.
--
-- Already covered by the existing "patients: linked read" RLS policy (no
-- new policy needed) — a linked familiar/participante can already read
-- every other column on their own patient row, so they can read this one
-- too, to build/copy the subscribe link from the app.
alter table public.patients add column calendar_feed_token uuid not null default gen_random_uuid();

create unique index patients_calendar_feed_token_idx on public.patients (calendar_feed_token);
