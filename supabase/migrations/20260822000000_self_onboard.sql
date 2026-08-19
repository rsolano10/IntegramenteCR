-- Lets a self-signup familiar account create their own real patient the
-- first time they finish onboarding — until now Consent/OnboardingStep only
-- ever wrote to local Zustand, so every new account showed the demo
-- fallback data ("Marcela"/"Rosa Jiménez") and never appeared for the
-- clinic. Same insert-patient + insert-own-link atomicity as create_patient
-- (20260820100000_platform_admin.sql), plus the onboarding_answers row so
-- the existing recompute_clinical_profile trigger fires immediately.
create or replace function public.self_onboard(p_nombre text, p_edad text, p_answers jsonb)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'familiar') then
    raise exception 'Solo una cuenta familiar puede crear un perfil.' using errcode = '42501';
  end if;

  if exists (select 1 from public.patient_links where profile_id = auth.uid()) then
    raise exception 'Ya tenés un perfil creado.' using errcode = '42501';
  end if;

  insert into public.patients (nombre, edad, modalidad, onboarding_complete)
  values (p_nombre, nullif(btrim(p_edad), ''), 'orientado', true)
  returning * into v_patient;

  insert into public.patient_links (patient_id, profile_id, relation)
  values (v_patient.id, auth.uid(), 'familiar_admin');

  insert into public.onboarding_answers (patient_id, answers)
  values (v_patient.id, p_answers);

  return v_patient;
end;
$$;

grant execute on function public.self_onboard(text, text, jsonb) to authenticated;
