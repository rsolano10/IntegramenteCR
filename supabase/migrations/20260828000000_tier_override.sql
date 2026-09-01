-- Lets the clinic override the auto-computed severity tier when they judge
-- the questionnaire alone got it wrong — clinical_profiles stays trigger-only
-- (see its own comment), this lives on patients instead so it never fights
-- the automatic recompute.
alter table public.patients add column tier_override public.tier;

-- list_patients() now returns the EFFECTIVE tier (override if set, else the
-- auto-computed one) so every list/dashboard view reflects it without extra
-- frontend logic — same shape as before, only the `overall` value changes.
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
  links jsonb
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
    ), '[]'::jsonb) as links
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
  order by pt.created_at desc;
end;
$$;

grant execute on function public.list_patients() to authenticated;
