-- Replaces Panel.tsx's "adherencia" tile, which was never real data — it
-- read src/lib/store.ts's local Zustand demo state (onboarding2/plan),
-- seeded with a hardcoded "Rosa Jiménez" placeholder from before plans
-- lived in Supabase at all. Once the demo patients were deleted, the tile
-- kept showing her name and a percentage computed from mock data that no
-- longer corresponds to anything in the database. plan_tasks.estado is
-- real, queryable data for every patient today — this aggregates it the
-- same way computeAdherencia() in src/lib/patient.ts already does (skip
-- "futuro" tasks, "realizado" counts as done, everything else due doesn't),
-- just program-wide instead of one hardcoded patient, and only over tasks
-- a family could actually have seen (published, already live).
--
-- Same security model as list_patients()/list_pending_threads(): a plain
-- count carries no per-patient clinical detail, so no has_patient_link
-- gating is needed beyond "caller is profesional."
create or replace function public.get_program_adherencia()
returns table(done bigint, total bigint)
language plpgsql
stable security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (where pt.estado = 'realizado') as done,
    count(*) as total
  from public.plan_tasks pt
  join public.plans p on p.id = pt.plan_id
  where pt.estado <> 'futuro'
    and p.status = 'published'
    and p.publish_at <= now();
end;
$$;
