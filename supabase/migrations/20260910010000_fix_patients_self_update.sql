-- SECURITY FIX (same class as 20260910000000_fix_profiles_self_update.sql):
-- "patients: familiar update basic fields" / "patients: participante update
-- basic fields" RLS policies gate WHICH ROW (their own linked patient) but
-- have no with_check or column restriction, and Supabase grants blanket
-- UPDATE on every `patients` column to `authenticated` by default. A
-- familiar/participante account could therefore directly PATCH their own
-- patient row's `tier_override_*` (clinical severity overrides — meant to
-- be a profesional-only judgment call), `modalidad`, `plan_status`,
-- `posible_duplicado_de`, `calendar_feed_token`, `onboarding_complete`, or
-- `welcome_message_pending` via a raw API call, even though no current UI
-- exercises this.
--
-- Column-level grants alone can't fix the tier-override/modalidad gap the
-- way they did for profiles: `authenticated` is ONE shared Postgres role
-- for every app role, so a grant wide enough for profesional to write
-- tier_override_* is *also* usable by a familiar whose OWN "familiar
-- update basic fields" RLS policy already makes their row visible for
-- UPDATE (RLS combines multiple permissive policies with OR and has no
-- concept of "this column only via that policy"). So: the grant is
-- restricted to `nombre, edad` only (what "basic fields" actually means),
-- and modalidad/tier overrides move to two SECURITY DEFINER RPCs that
-- check profesional_asignado explicitly — same pattern already used for
-- every other privileged write in this schema (self_onboard,
-- assign_initial_plan, etc.), rather than relying on grants.
revoke update on public.patients from authenticated;
grant update (nombre, edad) on public.patients to authenticated;

create or replace function public.set_patient_tier_override(p_patient_id uuid, p_axis text, p_value public.tier)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_patient_link(p_patient_id, array['profesional_asignado']::public.patient_relation[]) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if p_axis = 'cognitivo' then
    update public.patients set tier_override_cognitivo = p_value where id = p_patient_id;
  elsif p_axis = 'fisico' then
    update public.patients set tier_override_fisico = p_value where id = p_patient_id;
  elsif p_axis = 'funcional' then
    update public.patients set tier_override_funcional = p_value where id = p_patient_id;
  elsif p_axis = 'nutricional' then
    update public.patients set tier_override_nutricional = p_value where id = p_patient_id;
  else
    raise exception 'Eje inválido: %', p_axis using errcode = '22023';
  end if;
end;
$$;

grant execute on function public.set_patient_tier_override(uuid, text, public.tier) to authenticated;

create or replace function public.set_patient_modalidad(p_patient_id uuid, p_modalidad public.modalidad)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_patient_link(p_patient_id, array['profesional_asignado']::public.patient_relation[]) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.patients set modalidad = p_modalidad where id = p_patient_id;
end;
$$;

grant execute on function public.set_patient_modalidad(uuid, public.modalidad) to authenticated;
