-- Extends the self-update grant from 20260910000000_fix_profiles_self_update.sql
-- (which locked column-level UPDATE down to foto_url/must_change_password/
-- onboarding_tour_seen after the privilege-escalation fix). "Mi cuenta" needs
-- a user to edit their own display name, specialty label, and WhatsApp phone
-- — none of these grant any authority (that remains only `role`/`is_active`,
-- still outside this grant), so they're safe additions to the same list.
grant update (nombre, especialidad, whatsapp_phone, whatsapp_notifications_enabled) on public.profiles to authenticated;
