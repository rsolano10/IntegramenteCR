-- Superficie el flag de posible duplicado (§7.1) en list_patients(), para
-- que la clínica lo vea directo en la tabla de pacientes, no solo al abrir
-- el detalle — mismo principio de "alertas destacadas, no enterradas" ya
-- aplicado a las alertas clínicas del §14.
drop function if exists public.list_patients();

create or replace function public.list_patients()
returns table (
  id uuid,
  nombre text,
  edad text,
  modalidad public.modalidad,
  plan_status public.plan_status,
  onboarding_complete boolean,
  created_at timestamptz,
  cognitivo public.tier,
  fisico public.tier,
  funcional public.tier,
  nutricional public.tier,
  links jsonb,
  needs_review boolean,
  needs_assignment boolean,
  posible_duplicado_de uuid,
  posible_duplicado_nombre text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;

  return query
  select
    pt.id,
    pt.nombre,
    pt.edad,
    pt.modalidad,
    pt.plan_status,
    pt.onboarding_complete,
    pt.created_at,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_cognitivo, cp.cognitivo) else null end as cognitivo,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_fisico, cp.fisico) else null end as fisico,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_funcional, cp.funcional) else null end as funcional,
    case when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(pt.tier_override_nutricional, cp.nutricional) else null end as nutricional,
    coalesce((
      select jsonb_agg(jsonb_build_object('profile_id', pl.profile_id, 'nombre', pr.nombre, 'role', pr.role, 'relation', pl.relation) order by pl.relation)
      from public.patient_links pl
      join public.profiles pr on pr.id = pl.profile_id
      where pl.patient_id = pt.id
    ), '[]'::jsonb) as links,
    coalesce(cur_tasks.total > 0 and cur_tasks.open_count = 0 and cur_plan.reviewed_at is null, false) as needs_review,
    coalesce(
      cur_tasks.total > 0 and cur_tasks.open_count = 0
      and not exists (
        select 1 from public.plans fp where fp.patient_id = pt.id and fp.status = 'published' and fp.publish_at > now()
      ),
      false
    ) as needs_assignment,
    pt.posible_duplicado_de,
    dup.nombre as posible_duplicado_nombre
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
  left join public.patients dup on dup.id = pt.posible_duplicado_de
  left join lateral (
    select p.id as plan_id, p.reviewed_at
    from public.plans p
    where p.patient_id = pt.id and p.status = 'published' and p.publish_at <= now()
    order by p.publish_at desc
    limit 1
  ) cur_plan on true
  left join lateral (
    select count(*) as total, count(*) filter (where pta.estado in ('pendiente', 'futuro')) as open_count
    from public.plan_tasks pta
    where pta.plan_id = cur_plan.plan_id
  ) cur_tasks on true
  order by pt.created_at desc;
end;
$$;

grant execute on function public.list_patients() to authenticated;
