-- Dosis o porción individual por tarea (plan_tasks.indicacion_individual,
-- business/integramente-recursos-spec.md §2.1 y §3.3). Mismas funciones que en
-- producción, solo se agrega esa columna al insert.

CREATE OR REPLACE FUNCTION public.agregar_tareas_plan(p_plan_id uuid, p_tasks jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, indicacion_individual, media_resource_id, sort_order)
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
    nullif(t ->> 'indicacion_individual', ''),
    nullif(t ->> 'media_resource_id', '')::uuid,
    v_orden + (row_number() over ())::int
  from jsonb_array_elements(p_tasks) as t;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_initial_plan(p_patient_id uuid, p_tasks jsonb, p_vista_completa boolean DEFAULT NULL::boolean, p_publish_at timestamp with time zone DEFAULT now(), p_mensaje_bienvenida text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, indicacion_individual, media_resource_id, sort_order)
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
    nullif(t ->> 'indicacion_individual', ''),
    nullif(t ->> 'media_resource_id', '')::uuid,
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
$function$;
