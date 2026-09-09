-- Fase 11: fuerza a los pacientes ya evaluados con el cuestionario viejo
-- (schema_version < 2, ver 20260903000000_onboarding_schema_version.sql) a
-- completar el cuestionario nuevo antes de seguir usando la app — decisión
-- ya tomada con el usuario: re-registro completo, sin migración best-effort.

-- self_onboard debía fijar schema_version = 2 explícitamente: la columna
-- por defecto vale 1, así que sin este cambio CADA paciente nuevo (creado
-- ya con el cuestionario nuevo) quedaría marcado como si necesitara
-- re-registro. Mismo cuerpo que antes, solo agrega la columna al insert.
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

  insert into public.onboarding_answers (patient_id, answers, schema_version)
  values (v_patient.id, p_answers, 2);

  return v_patient;
end;
$$;

-- Re-registro: a diferencia de self_onboard, NO exige que el llamador no
-- tenga perfil — exige lo contrario, que ya tenga uno (familiar_admin o
-- participante), y actualiza ese mismo paciente en vez de crear uno nuevo.
-- SECURITY DEFINER porque "participante" no tiene policy de UPDATE propia
-- sobre onboarding_answers (por diseño, ver rls_policies.sql) — mismo
-- patrón que self_onboard ya usa para sortear esa misma restricción.
create or replace function public.reregister_onboarding(p_nombre text, p_edad text, p_answers jsonb)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_patient public.patients;
begin
  select patient_id into v_patient_id
  from public.patient_links
  where profile_id = auth.uid() and relation in ('familiar_admin', 'participante')
  limit 1;

  if v_patient_id is null then
    raise exception 'No encontramos un perfil para volver a registrar.' using errcode = '42501';
  end if;

  update public.patients
  set nombre = coalesce(nullif(btrim(p_nombre), ''), nombre), edad = coalesce(nullif(btrim(p_edad), ''), edad)
  where id = v_patient_id
  returning * into v_patient;

  insert into public.onboarding_answers (patient_id, answers, schema_version, updated_at)
  values (v_patient_id, p_answers, 2, now())
  on conflict (patient_id) do update set answers = excluded.answers, schema_version = 2, updated_at = now();

  return v_patient;
end;
$$;

grant execute on function public.reregister_onboarding(text, text, jsonb) to authenticated;

-- useMyPatient() necesita saber si el paciente vinculado ya está en la
-- versión nueva del cuestionario, para que RouteGuard pueda exigir el
-- re-registro — expuesto vía la misma función que ya arma el objeto
-- "mi paciente" para familiar/paciente.
create or replace function public.my_patient()
returns table (
  id uuid,
  nombre text,
  edad text,
  modalidad public.modalidad,
  plan_status public.plan_status,
  vista_completa boolean,
  welcome_message_pending boolean,
  needs_reregistration boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  select
    pt.id,
    pt.nombre,
    pt.edad,
    pt.modalidad,
    pt.plan_status,
    pt.vista_completa,
    pt.welcome_message_pending,
    coalesce(oa.schema_version, 1) < 2 as needs_reregistration
  from public.patient_links pl
  join public.patients pt on pt.id = pl.patient_id
  left join public.onboarding_answers oa on oa.patient_id = pt.id
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
end;
$$;

grant execute on function public.my_patient() to authenticated;
