-- Fase 3: recurso-aware plan assignment + clinic note per task + publish
-- date + welcome message. media_resources gets the two fields plan_tasks
-- already has (pasos/por_que) so a library resource carries everything a
-- task needs; plan_tasks gets a clinic-authored note distinct from the
-- family-authored `comentario`; plans gets a real publish date instead of
-- "created_at = now" being the only signal of when a plan starts applying.

alter table public.media_resources add column pasos jsonb, add column por_que text;
alter table public.plan_tasks add column nota_clinica text;
alter table public.plans add column publish_at timestamptz not null default now();

-- New params change the function's overload identity, so the old 3-arg
-- version has to be dropped explicitly (same reason as the vista_completa
-- migration before it) — CREATE OR REPLACE alone would leave both defined.
drop function if exists public.assign_initial_plan(uuid, jsonb, boolean);

create or replace function public.assign_initial_plan(
  p_patient_id uuid,
  p_tasks jsonb,
  p_vista_completa boolean default null,
  p_publish_at timestamptz default now(),
  p_mensaje_bienvenida text default null
)
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

  insert into public.plans (patient_id, status, created_by, publish_at)
  values (p_patient_id, 'published', auth.uid(), coalesce(p_publish_at, now()))
  returning id into v_plan_id;

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, sort_order)
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
    case when t ? 'pasos' then t -> 'pasos' else null end,
    nullif(t ->> 'por_que', ''),
    nullif(t ->> 'nota_clinica', ''),
    (row_number() over ())::int
  from jsonb_array_elements(p_tasks) as t;

  update public.patients
  set plan_status = 'asignado', vista_completa = coalesce(p_vista_completa, vista_completa)
  where id = p_patient_id;

  if p_mensaje_bienvenida is not null and length(trim(p_mensaje_bienvenida)) > 0 then
    insert into public.mensajes (patient_id, texto, autor_id) values (p_patient_id, trim(p_mensaje_bienvenida), auth.uid());
    update public.patients set welcome_message_pending = true where id = p_patient_id;
  end if;
end;
$$;

grant execute on function public.assign_initial_plan(uuid, jsonb, boolean, timestamptz, text) to authenticated;

-- Lets familiar_admin/participante dismiss the one-time welcome modal once
-- they've seen it — a tiny RPC instead of a raw column UPDATE policy so the
-- write surface stays as narrow as the actual use case.
create or replace function public.dismiss_welcome_message(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_patient_link(p_patient_id, array['familiar_admin', 'participante']::public.patient_relation[]) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.patients set welcome_message_pending = false where id = p_patient_id;
end;
$$;

grant execute on function public.dismiss_welcome_message(uuid) to authenticated;
