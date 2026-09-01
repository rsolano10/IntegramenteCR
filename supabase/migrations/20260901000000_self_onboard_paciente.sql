-- Fase 6: self_onboard now accepts a paciente-role caller too, not just
-- familiar — a person without a caregiver can register themselves. The
-- relation created follows the caller's own role instead of always being
-- familiar_admin.
create or replace function public.self_onboard(p_nombre text, p_edad text, p_answers jsonb)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients;
  v_role public.app_role;
  v_relation public.patient_relation;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is null or v_role not in ('familiar', 'paciente') then
    raise exception 'Solo una cuenta familiar o paciente puede crear un perfil.' using errcode = '42501';
  end if;
  v_relation := case when v_role = 'familiar' then 'familiar_admin' else 'participante' end;

  if exists (select 1 from public.patient_links where profile_id = auth.uid()) then
    raise exception 'Ya tenés un perfil creado.' using errcode = '42501';
  end if;

  insert into public.patients (nombre, edad, modalidad, onboarding_complete)
  values (p_nombre, nullif(btrim(p_edad), ''), 'orientado', true)
  returning * into v_patient;

  insert into public.patient_links (patient_id, profile_id, relation)
  values (v_patient.id, auth.uid(), v_relation);

  insert into public.onboarding_answers (patient_id, answers)
  values (v_patient.id, p_answers);

  return v_patient;
end;
$$;

grant execute on function public.self_onboard(text, text, jsonb) to authenticated;
