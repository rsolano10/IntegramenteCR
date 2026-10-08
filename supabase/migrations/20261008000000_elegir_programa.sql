-- Elección de programa al terminar el cuestionario (autoguiado vs orientado).
-- La familia elige; la clínica lo ve al evaluar y puede seguir cambiándolo
-- con set_patient_modalidad. El cobro llega después: por ahora solo se
-- registra la elección y cuándo se hizo.
--
-- programa_elegido_en null = todavía no eligió. Los pacientes que ya
-- existían se marcan como "ya elegido" (su modalidad la definió la clínica)
-- para no pedirles una elección que nunca les tocó hacer.

alter table public.patients add column programa_elegido_en timestamptz;
update public.patients set programa_elegido_en = created_at where programa_elegido_en is null;

create or replace function public.elegir_programa(p_modalidad public.modalidad)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
begin
  if p_modalidad not in ('autoguiado', 'orientado') then
    raise exception 'Programa inválido.' using errcode = '22023';
  end if;

  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;

  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  -- Una vez asignado el plan, cambiar de programa pasa por la clínica.
  update public.patients
  set modalidad = p_modalidad, programa_elegido_en = now()
  where id = v_patient_id and plan_status = 'pendiente';

  if not found then
    raise exception 'Tu programa ya fue asignado. Para cambiarlo, escribile a tu clínica.' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.elegir_programa(public.modalidad) to authenticated;

drop function if exists public.my_patient();

create function public.my_patient()
returns table (
  id uuid,
  nombre text,
  edad text,
  modalidad public.modalidad,
  plan_status public.plan_status,
  vista_completa boolean,
  welcome_message_pending boolean,
  needs_reregistration boolean,
  programa_elegido boolean
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
    coalesce(oa.schema_version, 1) < 2 as needs_reregistration,
    pt.programa_elegido_en is not null as programa_elegido
  from public.patient_links pl
  join public.patients pt on pt.id = pl.patient_id
  left join public.onboarding_answers oa on oa.patient_id = pt.id
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
end;
$$;

grant execute on function public.my_patient() to authenticated;
