-- La clínica ve qué familias se quedaron sin semana (antes «al día»).
--
-- needs_assignment solo se encendía si la familia había registrado TODA la
-- semana; una semana que terminaba sin registros dejaba a la familia «al
-- día» para siempre. Ahora se calcula por fecha real (Costa Rica):
--   sin_semana      la última semana ya terminó (o nunca hubo una) y no hay
--                   otra publicada: la familia no tiene actividades hoy.
--   termina_pronto  la semana en curso termina en 0 a 2 días y no hay
--                   siguiente publicada.
--   needs_assignment = sin_semana o termina_pronto o (todo registrado y sin
--                   siguiente), para lo que ya lo usaba.
--   needs_review    revisión de la clínica pendiente cuando todo está
--                   registrado o la semana terminó.
-- Más datos para la lista: avance de la última semana, si la familia la
-- evaluó, cuándo termina y desde cuándo no hay semana.
--
-- Fin de semana de un plan (igual que src/lib/planWeek.ts → weekDays):
-- publicado un domingo, dura de domingo a sábado; publicado otro día, hasta
-- el domingo siguiente.

drop function if exists public.list_patients();

create function public.list_patients()
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
  posible_duplicado_nombre text,
  sin_semana boolean,
  termina_pronto boolean,
  semana_fin date,
  semana_hechas integer,
  semana_total integer,
  semana_evaluada boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Costa_Rica')::date;
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;

  return query
  with base as (
    select
      pt.*,
      cp.cognitivo as cp_cognitivo, cp.fisico as cp_fisico, cp.funcional as cp_funcional, cp.nutricional as cp_nutricional,
      dup.nombre as dup_nombre,
      cur_plan.plan_id, cur_plan.reviewed_at, cur_plan.family_reviewed_at, cur_plan.inicio,
      case
        when cur_plan.inicio is null then null
        when extract(dow from cur_plan.inicio) = 0 then cur_plan.inicio + 6
        else cur_plan.inicio + (7 - extract(dow from cur_plan.inicio))::int
      end as fin,
      coalesce(cur_tasks.total, 0) as total,
      coalesce(cur_tasks.open_count, 0) as open_count,
      coalesce(cur_tasks.hechas, 0) as hechas,
      exists (select 1 from public.plans fp where fp.patient_id = pt.id and fp.status = 'published' and fp.publish_at > now()) as hay_siguiente
    from public.patients pt
    left join public.clinical_profiles cp on cp.patient_id = pt.id
    left join public.patients dup on dup.id = pt.posible_duplicado_de
    left join lateral (
      select p.id as plan_id, p.reviewed_at, p.family_reviewed_at, (p.publish_at at time zone 'America/Costa_Rica')::date as inicio
      from public.plans p
      where p.patient_id = pt.id and p.status = 'published' and p.publish_at <= now()
      order by p.publish_at desc
      limit 1
    ) cur_plan on true
    left join lateral (
      select
        count(*)::int as total,
        count(*) filter (where pta.estado in ('pendiente', 'futuro'))::int as open_count,
        count(*) filter (where pta.estado in ('realizado', 'parcial'))::int as hechas
      from public.plan_tasks pta
      where pta.plan_id = cur_plan.plan_id
    ) cur_tasks on true
  ),
  calc as (
    select b.*,
      -- Sin semana: cuenta ya en el programa (no pendiente), la última
      -- semana terminó o nunca hubo, y nada publicado a futuro.
      (b.plan_status <> 'pendiente' and not b.hay_siguiente and (b.fin is null or b.fin < v_hoy)) as sin,
      (not b.hay_siguiente and b.fin is not null and b.fin >= v_hoy and b.fin <= v_hoy + 2) as pronto
    from base b
  )
  select
    c.id,
    c.nombre,
    c.edad,
    c.modalidad,
    c.plan_status,
    c.onboarding_complete,
    c.created_at,
    case when public.has_patient_link(c.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(c.tier_override_cognitivo, c.cp_cognitivo) else null end,
    case when public.has_patient_link(c.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(c.tier_override_fisico, c.cp_fisico) else null end,
    case when public.has_patient_link(c.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(c.tier_override_funcional, c.cp_funcional) else null end,
    case when public.has_patient_link(c.id, array['profesional_asignado']::public.patient_relation[])
      then coalesce(c.tier_override_nutricional, c.cp_nutricional) else null end,
    coalesce((
      select jsonb_agg(jsonb_build_object('profile_id', pl.profile_id, 'nombre', pr.nombre, 'role', pr.role, 'relation', pl.relation) order by pl.relation)
      from public.patient_links pl
      join public.profiles pr on pr.id = pl.profile_id
      where pl.patient_id = c.id
    ), '[]'::jsonb),
    (c.plan_status <> 'pendiente' and c.plan_id is not null and c.total > 0 and c.reviewed_at is null and (c.open_count = 0 or c.fin < v_hoy)),
    (c.sin or c.pronto or (c.total > 0 and c.open_count = 0 and not c.hay_siguiente)),
    c.posible_duplicado_de,
    c.dup_nombre,
    c.sin,
    c.pronto,
    c.fin,
    c.hechas,
    c.total,
    c.family_reviewed_at is not null
  from calc c
  order by c.created_at desc;
end;
$$;
grant execute on function public.list_patients() to authenticated;
