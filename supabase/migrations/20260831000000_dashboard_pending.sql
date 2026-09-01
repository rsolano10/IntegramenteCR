-- Fase 5/7: list_patients() gains two computed flags so Panel.tsx can show
-- real "needs attention" buckets instead of the placeholder alert row.
-- needs_review: current plan is fully registered but the clinic hasn't left
-- feedback yet. needs_assignment: current plan is fully registered and no
-- future plan is queued. A patient can be true on both at once.
-- New return columns change the function's identity — CREATE OR REPLACE
-- alone can't change an existing function's return type, so it's dropped
-- first (same reason as the assign_initial_plan migrations before it).
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
  overall public.tier,
  links jsonb,
  needs_review boolean,
  needs_assignment boolean
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
    case
      when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[]) then coalesce(pt.tier_override, cp.overall)
      else null
    end as overall,
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
    ) as needs_assignment
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
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
