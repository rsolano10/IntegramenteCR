-- Rediseño del modelo de recursos para que coincida con la taxonomía real de
-- business/INTEGRAMENTE_EN_CASA_CONTENIDOS.md (4 módulos, no las 5
-- categorías genéricas anteriores) y traiga los campos que el documento
-- exige (dominios, perfil, requisito, objetivo, materiales, progresión,
-- adaptación, bloque de "ciencia"). La tabla está vacía en producción
-- (0 filas) — se reemplaza `categoria` en vez de migrar datos.
drop index if exists public.media_resources_categoria_idx;
alter table public.media_resources drop column categoria;
drop type public.resource_category;

create type public.resource_modulo as enum ('sentidos', 'movimiento', 'musica', 'reminiscencia');

alter table public.media_resources
  add column modulo public.resource_modulo not null,
  add column codigo text unique,
  add column tipo_intervencion text,
  add column dominios text[],
  add column duracion_min int,
  add column duracion_max int,
  add column frecuencia text,
  add column perfil text,
  add column requisito text,
  add column objetivo text,
  add column materiales text,
  add column progresion text,
  add column adaptacion text,
  add column ciencia jsonb;

create index media_resources_modulo_idx on public.media_resources (modulo, activo);

comment on column public.media_resources.pasos is 'Cómo realizarla — pasos numerados.';
comment on column public.media_resources.por_que is 'Objetivo esperado — texto orientado a la familia (se muestra en la caja "¿Por qué esta actividad?").';

-- Las 34 actividades del documento son instrucciones para hacer en casa, no
-- todas tienen video/imagen — un recurso puede no tener ningún medio
-- adjunto (solo texto). Antes exigía exactamente uno de los dos.
alter table public.media_resources drop constraint media_resources_source_check;
alter table public.media_resources add constraint media_resources_source_check check (num_nonnulls(storage_path, external_url) <= 1);
alter table public.media_resources alter column media_kind drop not null;
alter table public.media_resources alter column media_kind drop default;

-- Vínculo vivo entre una tarea asignada y el recurso de biblioteca del que
-- vino (además de la copia de texto que plan_tasks ya guarda) — permite que
-- la vista de familia/paciente muestre lo que hoy se pierde al copiar:
-- video/imagen real, materiales, adaptación y el bloque de ciencia. Null
-- para tareas manuales que no vinieron de la biblioteca.
alter table public.plan_tasks add column media_resource_id uuid references public.media_resources (id) on delete set null;

drop function if exists public.assign_initial_plan(uuid, jsonb, boolean, timestamptz, text);

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

  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, nota_clinica, media_resource_id, sort_order)
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
$$;

grant execute on function public.assign_initial_plan(uuid, jsonb, boolean, timestamptz, text) to authenticated;
