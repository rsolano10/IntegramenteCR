-- Revisión de experiencia de las actividades (2026-11-27):
-- 1. plan_tasks.doble_tarea: la clínica decide por actividad si se ofrece el
--    reto cognitivo (doble tarea). Por defecto no: «doble tarea nunca por
--    defecto» (reglas de gerontogimnasia).
-- 2. perfil_recursos: la familia recibe también sus datos de nutrición, para
--    que la sesión muestre solo los cuidados que le aplican.

alter table public.plan_tasks add column if not exists doble_tarea boolean not null default false;

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

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, indicacion_individual, nivel_interactivo, doble_tarea, media_resource_id, sort_order)
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
    case when t ->> 'nivel_interactivo' in ('suave', 'medio', 'retador') then t ->> 'nivel_interactivo' end,
    coalesce((t ->> 'doble_tarea')::boolean, false),
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

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, indicacion_individual, nivel_interactivo, doble_tarea, media_resource_id, sort_order)
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
    case when t ->> 'nivel_interactivo' in ('suave', 'medio', 'retador') then t ->> 'nivel_interactivo' end,
    coalesce((t ->> 'doble_tarea')::boolean, false),
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


create or replace function public.perfil_recursos(p_patient_id uuid default null)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_patient_id uuid := p_patient_id;
  v_pro boolean := public.is_profesional();
  v_ruta text;
  p public.patients;
begin
  if v_patient_id is null then
    select pl.patient_id into v_patient_id
    from public.patient_links pl
    where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
    limit 1;
  elsif not v_pro and not exists (
    select 1 from public.patient_links pl where pl.profile_id = auth.uid() and pl.patient_id = v_patient_id
  ) then
    raise exception 'Sin acceso a este paciente.' using errcode = '42501';
  end if;
  if v_patient_id is null then
    return null;
  end if;

  -- La familia recibe su etapa y los datos de nutrición que cargó la
  -- clínica (para mostrar solo los cuidados que le aplican). Nunca la ruta
  -- física ni la supervisión.
  if not v_pro then
    return jsonb_build_object(
      'etapas', to_jsonb(public.etapas_cognitivas(v_patient_id)),
      'nutricion', (select nullif(pt.nutricion, '{}'::jsonb) from public.patients pt where pt.id = v_patient_id)
    );
  end if;

  select * into p from public.patients where id = v_patient_id;
  select coalesce(p.tier_override_fisico::text, cp.fisico::text) into v_ruta
  from public.clinical_profiles cp where cp.patient_id = v_patient_id;
  return jsonb_build_object(
    'etapas', to_jsonb(public.etapas_cognitivas(v_patient_id)),
    'etapaOverride', p.etapa_cognitiva_override,
    'rutaOverride', p.tier_override_fisico::text,
    'ruta', coalesce(v_ruta, p.tier_override_fisico::text),
    'supervision', p.supervision,
    'nutricion', p.nutricion
  );
end;
$$;

grant execute on function public.perfil_recursos(uuid) to authenticated;
