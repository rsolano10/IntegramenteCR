-- Planificador: editar una semana ya publicada en vez de crear otra.
-- Antes, volver a publicar sobre la misma semana creaba un segundo plan,
-- y la vista de la familia (último plan publicado) escondía el primero.
-- Ahora las actividades nuevas se suman al plan existente, y las que
-- todavía no se registraron se pueden quitar.

create or replace function public.agregar_tareas_plan(p_plan_id uuid, p_tasks jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden int;
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede editar un plan.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'Plan no encontrado.' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(p_tasks, '[]'::jsonb)) = 0 then
    raise exception 'No hay actividades para agregar.' using errcode = '22023';
  end if;

  select coalesce(max(sort_order), 0) into v_orden from public.plan_tasks where plan_id = p_plan_id;

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, media_resource_id, sort_order)
  select
    p_plan_id,
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
    nullif(t ->> 'media_resource_id', '')::uuid,
    v_orden + (row_number() over ())::int
  from jsonb_array_elements(p_tasks) as t;
end;
$$;

grant execute on function public.agregar_tareas_plan(uuid, jsonb) to authenticated;

-- Solo actividades que la familia todavía no registró — lo ya hecho es
-- historial y no se borra.
create or replace function public.quitar_tarea_plan(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede editar un plan.' using errcode = '42501';
  end if;
  delete from public.plan_tasks where id = p_task_id and estado in ('pendiente', 'futuro');
  if not found then
    raise exception 'Esa actividad ya fue registrada por la familia y no se puede quitar.' using errcode = '22023';
  end if;
end;
$$;

grant execute on function public.quitar_tarea_plan(uuid) to authenticated;
