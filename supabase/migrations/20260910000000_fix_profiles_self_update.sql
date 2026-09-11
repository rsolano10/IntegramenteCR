-- SECURITY FIX: "profiles: self update" RLS policy (id = auth.uid(), no
-- with_check) only restricts WHICH ROW a user can touch — Postgres/Supabase
-- separately grants UPDATE on every column to `authenticated` by default,
-- and RLS has no native column-level restriction. Combined, any logged-in
-- user could update ANY column on their own profile row, including `role`
-- and `is_active` — i.e. a familiar or paciente account could grant itself
-- full "profesional" clinic-staff access with a single authenticated API
-- call. Confirmed exploitable directly against production before this fix.
--
-- Fix: restrict the grant itself to only the columns that legitimately
-- need self-service editing (foto_url — avatar upload; must_change_password
-- — cleared after setting a real password; onboarding_tour_seen — product
-- tour dismissal). The RLS policy's row-level check still applies on top,
-- unchanged.
revoke update on public.profiles from authenticated;
grant update (foto_url, must_change_password, onboarding_tour_seen) on public.profiles to authenticated;
