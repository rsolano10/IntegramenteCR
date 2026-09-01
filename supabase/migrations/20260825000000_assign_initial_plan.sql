-- Lets the clinic accept a pending patient by creating their real first
-- weekly plan (plans + plan_tasks) atomically, flipping plan_status to
-- 'asignado' in the same transaction — no real plan-assignment UI existed
-- before this; Editor.tsx is a Rosa-only local demo, untouched.
create or replace function public.assign_initial_plan(p_patient_id uuid, p_tasks jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede asignar un plan.' using errcode = '42501';
  end if;

  if jsonb_array_length(p_tasks) = 0 then
    raise exception 'El plan necesita al menos una actividad.' using errcode = '22023';
  end if;

  insert into public.plans (patient_id, status, created_by)
  values (p_patient_id, 'published', auth.uid())
  returning id into v_plan_id;

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, sort_order)
  select
    v_plan_id,
    t ->> 'dia',
    coalesce((t ->> 'is_today')::boolean, false),
    nullif(t ->> 'hora', ''),
    t ->> 'titulo',
    (t ->> 'tipo')::public.task_tipo,
    'pendiente'::public.task_estado,
    nullif(t ->> 'duracion', ''),
    nullif(t ->> 'detalle', ''),
    nullif(t ->> 'precaucion', ''),
    (row_number() over ())::int
  from jsonb_array_elements(p_tasks) as t;

  update public.patients set plan_status = 'asignado' where id = p_patient_id;
end;
$$;

grant execute on function public.assign_initial_plan(uuid, jsonb) to authenticated;
