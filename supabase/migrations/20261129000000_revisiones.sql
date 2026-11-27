-- Revisiones del equipo integradas en cada pantalla (2026-11-29).
--
-- La revisión vive donde vive el trabajo: plantillas, borradores de semana,
-- semanas publicadas y la valoración (etapa y ejes) tienen su propio estado
-- de revisión, atado a una versión del contenido (huella). El equipo solo
-- sugiere; la coordinación acepta o descarta.
--
--   tareas_equipo     sigue siendo el pedido de revisión (a quién, para cuándo);
--                     suma revisar_borrador y valorar_paciente (con eje), la
--                     huella al pedirla y al aprobarla, y archivada (la del
--                     borrador que ya se publicó).
--   revision_items    comentarios y sugerencias anclados a una actividad, un
--                     día, un eje o todo el objeto. Una sugerencia guarda el
--                     cambio como datos para aplicarlo al aceptarla.
--   estado_revision   sin_revisar / en_revision / sugerencias / revisada /
--                     desactualizada, para cualquier objeto.
--   valoracion        etapa y ejes con su fuente; los ajustes aceptados van a
--                     las columnas que ya existen (etapa_cognitiva_override y
--                     tier_override_*), que usan la lista y las reglas.

-- ─── 1. Tareas: tipos nuevos, eje, huellas, archivada ───
alter table public.tareas_equipo drop constraint if exists tareas_equipo_tipo_check;
alter table public.tareas_equipo add constraint tareas_equipo_tipo_check
  check (tipo in ('revisar_paciente', 'revisar_semana', 'armar_semana', 'revisar_plantilla', 'revisar_borrador', 'valorar_paciente', 'otra'));
alter table public.tareas_equipo
  add column if not exists eje text check (eje in ('etapa', 'cognitivo', 'fisico', 'funcional', 'nutricional')),
  add column if not exists huella text,
  add column if not exists huella_aprobada text,
  add column if not exists archivada boolean not null default false;
alter table public.plantillas_semana add column if not exists huella_revisada text;

-- ─── 2. Huellas: una versión de cada objeto ───
create or replace function public.valor_eje(p_patient uuid, p_eje text)
returns text
language sql stable security definer set search_path = public as $$
  select case p_eje
    when 'etapa' then coalesce(p.etapa_cognitiva_override, array_to_string(public.etapas_cognitivas(p.id), ','))
    when 'cognitivo' then coalesce(p.tier_override_cognitivo, cp.cognitivo)::text
    when 'fisico' then coalesce(p.tier_override_fisico, cp.fisico)::text
    when 'funcional' then coalesce(p.tier_override_funcional, cp.funcional)::text
    when 'nutricional' then coalesce(p.tier_override_nutricional, cp.nutricional)::text
  end
  from public.patients p left join public.clinical_profiles cp on cp.patient_id = p.id
  where p.id = p_patient;
$$;

create or replace function public.huella_revision(p_objeto text, p_id uuid, p_eje text default null)
returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if p_id is null then return null; end if;
  if p_objeto = 'plantilla' then
    return (select md5(coalesce(string_agg(x.dia_idx || '|' || coalesce(x.hora::text, '') || '|' || x.media_resource_id || '|' || coalesce(x.nivel_interactivo::text, ''),
              ';' order by x.dia_idx, x.hora::text nulls first, x.media_resource_id::text), ''))
            from public.plantilla_tareas x where x.plantilla_id = p_id);
  elsif p_objeto = 'borrador' then
    return (select md5(coalesce((select string_agg(coalesce(e->>'dia', '') || '|' || coalesce(e->>'hora', '') || '|' || coalesce(e->>'mediaResourceId', e->>'titulo', '') || '|' || coalesce(e->>'nivelInteractivo', ''),
              ';' order by e->>'dia', e->>'hora', e->>'titulo') from jsonb_array_elements(b.tareas) e), ''))
            from public.semanas_borrador b where b.patient_id = p_id);
  elsif p_objeto = 'plan' then
    return (select md5(coalesce(string_agg(x.dia || '|' || coalesce(x.hora::text, '') || '|' || coalesce(x.media_resource_id::text, x.titulo), ';' order by x.sort_order), ''))
            from public.plan_tasks x where x.plan_id = p_id);
  elsif p_objeto = 'valoracion' then
    if p_eje is not null then return md5(coalesce(public.valor_eje(p_id, p_eje), '')); end if;
    return md5(coalesce(public.valor_eje(p_id, 'etapa'), '') || '|' || coalesce(public.valor_eje(p_id, 'cognitivo'), '') || '|' || coalesce(public.valor_eje(p_id, 'fisico'), '')
      || '|' || coalesce(public.valor_eje(p_id, 'funcional'), '') || '|' || coalesce(public.valor_eje(p_id, 'nutricional'), ''));
  end if;
  return null;
end;
$$;

-- El objeto que revisa una tarea.
create or replace function public.objeto_de_tarea(t public.tareas_equipo, out objeto text, out objeto_id uuid)
language sql immutable as $$
  select
    case t.tipo
      when 'revisar_plantilla' then 'plantilla'
      when 'revisar_borrador' then 'borrador'
      when 'armar_semana' then 'borrador'
      when 'revisar_semana' then 'plan'
      when 'valorar_paciente' then 'valoracion'
      when 'revisar_paciente' then 'valoracion'
    end,
    case t.tipo
      when 'revisar_plantilla' then t.plantilla_id
      when 'revisar_semana' then t.plan_id
      when 'otra' then null
      else t.patient_id
    end;
$$;

create or replace function public.huella_tarea(t public.tareas_equipo)
returns text
language sql stable security definer set search_path = public as $$
  select public.huella_revision((public.objeto_de_tarea(t)).objeto, (public.objeto_de_tarea(t)).objeto_id, t.eje);
$$;

-- ¿Quien llama puede revisar este objeto? La coordinación siempre; el
-- equipo, si tiene una tarea (no cancelada) sobre él.
create or replace function public.puede_revisar(p_objeto text, p_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_profesional() or exists (
    select 1 from public.tareas_equipo t
    where t.asignada_a = auth.uid() and t.estado <> 'cancelada'
      and (public.objeto_de_tarea(t)).objeto = p_objeto
      and (public.objeto_de_tarea(t)).objeto_id = p_id
  );
$$;

-- ─── 3. Comentarios y sugerencias ───
create table if not exists public.revision_items (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid references public.tareas_equipo(id) on delete set null,
  objeto text not null check (objeto in ('plantilla', 'borrador', 'plan', 'valoracion')),
  objeto_id uuid not null,
  patient_id uuid references public.patients(id) on delete cascade,
  eje text check (eje in ('etapa', 'cognitivo', 'fisico', 'funcional', 'nutricional')),
  clase text not null check (clase in ('comentario', 'sugerencia')),
  ancla jsonb not null default '{"tipo": "general"}'::jsonb,
  cambio jsonb,
  texto text,
  para_proxima boolean not null default false,
  estado text not null default 'abierta' check (estado in ('abierta', 'aceptada', 'descartada', 'resuelta', 'archivada')),
  autor_id uuid references public.profiles(id) on delete set null,
  autor_area text,
  created_at timestamptz not null default now(),
  decidida_por uuid references public.profiles(id) on delete set null,
  decidida_en timestamptz
);
create index if not exists revision_items_objeto on public.revision_items (objeto, objeto_id, estado);
create index if not exists revision_items_proxima on public.revision_items (patient_id) where para_proxima and estado = 'abierta';
alter table public.revision_items enable row level security;
drop policy if exists revision_items_select on public.revision_items;
create policy revision_items_select on public.revision_items for select to authenticated
  using (public.is_profesional() or autor_id = auth.uid() or public.puede_revisar(objeto, objeto_id));
revoke insert, update, delete on public.revision_items from anon, authenticated;

create or replace function public.revision_agregar(
  p_objeto text, p_objeto_id uuid, p_clase text, p_ancla jsonb default null, p_cambio jsonb default null,
  p_texto text default null, p_eje text default null, p_para_proxima boolean default false, p_tarea uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_patient uuid;
  v_area text;
begin
  if not public.puede_revisar(p_objeto, p_objeto_id) then raise exception 'No tenés una revisión pedida sobre esto.' using errcode = '42501'; end if;
  if p_clase not in ('comentario', 'sugerencia') then raise exception 'Clase inválida.'; end if;
  if p_clase = 'sugerencia' and p_cambio is null then raise exception 'Falta el cambio sugerido.'; end if;
  if p_clase = 'comentario' and coalesce(btrim(p_texto), '') = '' then raise exception 'Escribí el comentario.'; end if;
  v_patient := case p_objeto
    when 'plantilla' then null
    when 'plan' then (select patient_id from public.plans where id = p_objeto_id)
    else p_objeto_id end;
  select especialidad into v_area from public.profiles where id = auth.uid();
  insert into public.revision_items (tarea_id, objeto, objeto_id, patient_id, eje, clase, ancla, cambio, texto, para_proxima, autor_id, autor_area)
  values (p_tarea, p_objeto, p_objeto_id, v_patient, p_eje, p_clase, coalesce(p_ancla, '{"tipo": "general"}'::jsonb), p_cambio,
          nullif(btrim(coalesce(p_texto, '')), ''), coalesce(p_para_proxima, false), auth.uid(), v_area)
  returning id into v_id;
  -- Quien empieza a comentar ya está revisando.
  update public.tareas_equipo t set estado = 'en_curso', updated_at = now()
   where t.asignada_a = auth.uid() and t.estado = 'pendiente'
     and (public.objeto_de_tarea(t)).objeto = p_objeto and (public.objeto_de_tarea(t)).objeto_id = p_objeto_id;
  return v_id;
end;
$$;
revoke execute on function public.revision_agregar(text, uuid, text, jsonb, jsonb, text, text, boolean, uuid) from public, anon;
grant execute on function public.revision_agregar(text, uuid, text, jsonb, jsonb, text, text, boolean, uuid) to authenticated;

-- La coordinación decide (aceptada / descartada / resuelta). Quien la
-- escribió puede retirarla mientras siga abierta.
create or replace function public.revision_decidir(p_id uuid, p_estado text)
returns void
language plpgsql security definer set search_path = public as $$
declare i public.revision_items;
begin
  select * into i from public.revision_items where id = p_id;
  if i.id is null then raise exception 'No existe.'; end if;
  if p_estado = 'retirar' then
    if i.autor_id <> auth.uid() or i.estado <> 'abierta' then raise exception 'Solo podés retirar lo tuyo mientras está abierto.' using errcode = '42501'; end if;
    delete from public.revision_items where id = p_id;
    return;
  end if;
  if not public.is_profesional() then raise exception 'Lo decide la coordinación.' using errcode = '42501'; end if;
  if p_estado not in ('aceptada', 'descartada', 'resuelta', 'abierta') then raise exception 'Estado inválido.'; end if;
  update public.revision_items set estado = p_estado, decidida_por = case when p_estado = 'abierta' then null else auth.uid() end,
    decidida_en = case when p_estado = 'abierta' then null else now() end where id = p_id;
end;
$$;
revoke execute on function public.revision_decidir(uuid, text) from public, anon;
grant execute on function public.revision_decidir(uuid, text) to authenticated;

-- Lo de un objeto, con quién lo escribió. En un borrador también trae lo
-- que quedó «para la próxima semana» desde el seguimiento.
create or replace function public.revision_items_de(p_objeto text, p_objeto_id uuid)
returns table (
  id uuid, tarea_id uuid, objeto text, eje text, clase text, ancla jsonb, cambio jsonb, texto text, para_proxima boolean,
  estado text, autor_id uuid, autor_nombre text, autor_area text, created_at timestamptz, decidida_nombre text, decidida_en timestamptz
)
language sql stable security definer set search_path = public as $$
  select i.id, i.tarea_id, i.objeto, i.eje, i.clase, i.ancla, i.cambio, i.texto, i.para_proxima, i.estado,
    i.autor_id, a.nombre, coalesce(i.autor_area, a.especialidad), i.created_at, d.nombre, i.decidida_en
  from public.revision_items i
  left join public.profiles a on a.id = i.autor_id
  left join public.profiles d on d.id = i.decidida_por
  where public.puede_revisar(p_objeto, p_objeto_id)
    and i.estado <> 'archivada'
    and ((i.objeto = p_objeto and i.objeto_id = p_objeto_id)
      or (p_objeto = 'borrador' and i.para_proxima and i.patient_id = p_objeto_id and i.estado = 'abierta'))
  order by i.created_at;
$$;
revoke execute on function public.revision_items_de(text, uuid) from public, anon;
grant execute on function public.revision_items_de(text, uuid) to authenticated;

-- ─── 4. Estado de revisión de cualquier objeto ───
create or replace function public.estado_revision(p_objeto text, p_id uuid, p_eje text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_abiertas int;
  v_tareas jsonb;
  v_pend boolean;
  v_ok int;
  v_viejas int;
  v_estado text;
begin
  if not public.puede_revisar(p_objeto, p_id) then return null; end if;
  select count(*) into v_abiertas from public.revision_items i
   where i.objeto = p_objeto and i.objeto_id = p_id and i.clase = 'sugerencia' and i.estado = 'abierta'
     and (p_eje is null or i.eje = p_eje);

  with ts as (
    select t.*, a.nombre as revisor, a.especialidad as area,
      (t.estado = 'resuelta' and t.resultado = 'aprobado') as aprobada,
      (t.estado = 'resuelta' and t.resultado = 'aprobado' and t.huella_aprobada is distinct from public.huella_tarea(t)) as vieja
    from public.tareas_equipo t join public.profiles a on a.id = t.asignada_a
    where not t.archivada and t.estado <> 'cancelada'
      and (public.objeto_de_tarea(t)).objeto = p_objeto and (public.objeto_de_tarea(t)).objeto_id = p_id
      and (p_eje is null or t.eje = p_eje or t.eje is null)
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'revisor', revisor, 'area', area, 'estado', estado, 'resultado', resultado,
           'eje', eje, 'vence', vence, 'resuelta_en', resuelta_en, 'desactualizada', vieja) order by created_at), '[]'::jsonb),
         bool_or(estado in ('pendiente', 'en_curso')),
         count(*) filter (where aprobada and not vieja),
         count(*) filter (where vieja)
    into v_tareas, v_pend, v_ok, v_viejas
  from ts;

  v_estado := case
    when v_abiertas > 0 then 'sugerencias'
    when coalesce(v_pend, false) then 'en_revision'
    when v_ok > 0 then 'revisada'
    when v_viejas > 0 then 'desactualizada'
    else 'sin_revisar' end;
  return jsonb_build_object('estado', v_estado, 'abiertas', v_abiertas, 'tareas', v_tareas);
end;
$$;
revoke execute on function public.estado_revision(text, uuid, text) from public, anon;
grant execute on function public.estado_revision(text, uuid, text) to authenticated;

create or replace function public.estados_revision(p_objeto text, p_ids uuid[])
returns table (id uuid, estado jsonb)
language sql stable security definer set search_path = public as $$
  select x, public.estado_revision(p_objeto, x) from unnest(p_ids) x;
$$;
revoke execute on function public.estados_revision(text, uuid[]) from public, anon;
grant execute on function public.estados_revision(text, uuid[]) to authenticated;

-- ─── 5. Valoración: etapa y ejes con su fuente ───
create or replace function public.valoracion_paciente(p_patient uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.patients; cp public.clinical_profiles;
begin
  if not public.puede_revisar('valoracion', p_patient) then raise exception 'Sin acceso.' using errcode = '42501'; end if;
  select * into p from public.patients where id = p_patient;
  select * into cp from public.clinical_profiles where patient_id = p_patient;
  return jsonb_build_object(
    'etapa', jsonb_build_object('derivadas', to_jsonb(public.etapas_cognitivas(p_patient)), 'ajuste', p.etapa_cognitiva_override),
    'ejes', jsonb_build_object(
      'cognitivo', jsonb_build_object('motor', cp.cognitivo, 'ajuste', p.tier_override_cognitivo),
      'fisico', jsonb_build_object('motor', cp.fisico, 'ajuste', p.tier_override_fisico),
      'funcional', jsonb_build_object('motor', cp.funcional, 'ajuste', p.tier_override_funcional),
      'nutricional', jsonb_build_object('motor', cp.nutricional, 'ajuste', p.tier_override_nutricional)
    ),
    'estados', jsonb_build_object(
      'etapa', public.estado_revision('valoracion', p_patient, 'etapa'),
      'cognitivo', public.estado_revision('valoracion', p_patient, 'cognitivo'),
      'fisico', public.estado_revision('valoracion', p_patient, 'fisico'),
      'funcional', public.estado_revision('valoracion', p_patient, 'funcional'),
      'nutricional', public.estado_revision('valoracion', p_patient, 'nutricional')
    )
  );
end;
$$;
revoke execute on function public.valoracion_paciente(uuid) from public, anon;
grant execute on function public.valoracion_paciente(uuid) to authenticated;

-- La coordinación aplica un ajuste (propio o aceptado de una sugerencia).
-- p_valor null = volver a lo que calcula el motor.
create or replace function public.ajustar_valoracion(p_patient uuid, p_eje text, p_valor text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_profesional() then raise exception 'Lo ajusta la coordinación.' using errcode = '42501'; end if;
  if p_eje = 'etapa' then
    if p_valor is not null and p_valor not in ('preventivo', 'dcl', 'leve', 'moderada', 'avanzada') then raise exception 'Etapa inválida.'; end if;
    update public.patients set etapa_cognitiva_override = p_valor where id = p_patient;
  elsif p_eje in ('cognitivo', 'fisico', 'funcional', 'nutricional') then
    if p_valor is not null and p_valor not in ('verde', 'amarillo', 'rojo') then raise exception 'Color inválido.'; end if;
    execute format('update public.patients set %I = $1::public.tier where id = $2', 'tier_override_' || p_eje) using p_valor, p_patient;
  else
    raise exception 'Eje inválido.';
  end if;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (p_patient, 'valoracion', p_eje || ':' || coalesce(p_valor, 'motor'), auth.uid());
end;
$$;
revoke execute on function public.ajustar_valoracion(uuid, text, text) from public, anon;
grant execute on function public.ajustar_valoracion(uuid, text, text) to authenticated;

-- Para el Panel: ejes en rojo sin una revisión vigente.
create or replace function public.ejes_rojos_sin_revisar()
returns table (patient_id uuid, nombre text, ejes text[])
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, array_agg(e order by e)
  from public.patients p
  cross join unnest(array['cognitivo', 'fisico', 'funcional', 'nutricional']) e
  where public.is_profesional() and p.plan_status <> 'pendiente'
    and public.valor_eje(p.id, e) = 'rojo'
    and (public.estado_revision('valoracion', p.id, e)->>'estado') = 'sin_revisar'
  group by p.id, p.nombre
  order by p.nombre;
$$;
revoke execute on function public.ejes_rojos_sin_revisar() from public, anon;
grant execute on function public.ejes_rojos_sin_revisar() to authenticated;

-- ─── 6. Tareas: crear (con eje y huella), responder (huella aprobada) ───
drop function if exists public.crear_tarea_equipo(text, text, text, uuid, uuid, uuid, uuid, date);
create or replace function public.crear_tarea_equipo(
  p_tipo text, p_titulo text, p_detalle text, p_asignada_a uuid,
  p_patient uuid default null, p_plan uuid default null, p_plantilla uuid default null, p_vence date default null, p_eje text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; t public.tareas_equipo;
begin
  if not public.is_profesional() then raise exception 'Solo la clínica o la coordinación.' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_asignada_a and role in ('equipo', 'profesional') and is_active) then
    raise exception 'Elegí a alguien del equipo clínico.';
  end if;
  if p_tipo in ('revisar_borrador', 'armar_semana', 'valorar_paciente', 'revisar_paciente', 'revisar_semana') and p_patient is null then
    raise exception 'Elegí el paciente.';
  end if;
  insert into public.tareas_equipo (tipo, titulo, detalle, patient_id, plan_id, plantilla_id, asignada_a, creada_por, vence, eje)
  values (p_tipo, btrim(p_titulo), nullif(btrim(coalesce(p_detalle, '')), ''), p_patient, p_plan, p_plantilla, p_asignada_a, auth.uid(), p_vence,
          case when p_tipo = 'valorar_paciente' then p_eje end)
  returning * into t;
  update public.tareas_equipo set huella = public.huella_tarea(t) where id = t.id;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (p_patient, 'tarea_equipo', 'crear:' || t.id, auth.uid());
  return t.id;
end;
$$;
revoke execute on function public.crear_tarea_equipo(text, text, text, uuid, uuid, uuid, uuid, date, text) from public, anon;
grant execute on function public.crear_tarea_equipo(text, text, text, uuid, uuid, uuid, uuid, date, text) to authenticated;

create or replace function public.responder_tarea_equipo(p_id uuid, p_estado text, p_resultado text default null, p_respuesta text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare t public.tareas_equipo; v_huella text;
begin
  select * into t from public.tareas_equipo where id = p_id;
  if t.id is null then raise exception 'Tarea inexistente.'; end if;
  if not (public.is_profesional() or t.asignada_a = auth.uid()) then raise exception 'No es tu tarea.' using errcode = '42501'; end if;
  if p_estado = 'cancelada' and not public.is_profesional() then raise exception 'Solo la coordinación cancela tareas.' using errcode = '42501'; end if;
  if p_estado not in ('pendiente', 'en_curso', 'resuelta', 'cancelada') then raise exception 'Estado inválido.'; end if;
  v_huella := public.huella_tarea(t);
  update public.tareas_equipo set
    estado = p_estado,
    resultado = case when p_estado = 'resuelta' then coalesce(p_resultado, 'comentario') else resultado end,
    respuesta = coalesce(nullif(btrim(coalesce(p_respuesta, '')), ''), respuesta),
    resuelta_en = case when p_estado = 'resuelta' then now() else null end,
    huella_aprobada = case when p_estado = 'resuelta' and p_resultado = 'aprobado' then v_huella else huella_aprobada end,
    updated_at = now()
  where id = p_id;
  if p_estado = 'resuelta' and p_resultado = 'aprobado' and t.plantilla_id is not null and t.tipo = 'revisar_plantilla' then
    update public.plantillas_semana set revisada_por = t.asignada_a, revisada_en = now(), huella_revisada = v_huella where id = t.plantilla_id;
  end if;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (t.patient_id, 'tarea_equipo', p_estado || ':' || p_id, auth.uid());
end;
$$;

-- Al publicar o descartar un borrador: sus revisiones quedan archivadas
-- (la próxima semana empieza de cero) y las abiertas se cancelan.
create or replace function public.archivar_revisiones_borrador()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.tareas_equipo
     set estado = case when estado in ('pendiente', 'en_curso') then 'cancelada' else estado end,
         respuesta = case when estado in ('pendiente', 'en_curso') then coalesce(respuesta, 'La semana se publicó o se descartó antes de la revisión.') else respuesta end,
         archivada = true, updated_at = now()
   where patient_id = old.patient_id and tipo in ('revisar_borrador', 'armar_semana') and not archivada;
  update public.revision_items set estado = 'archivada'
   where objeto = 'borrador' and objeto_id = old.patient_id and estado = 'abierta';
  return old;
end;
$$;
drop trigger if exists semanas_borrador_archivar on public.semanas_borrador;
create trigger semanas_borrador_archivar after delete on public.semanas_borrador
  for each row execute function public.archivar_revisiones_borrador();

-- ─── 7. Lista y contexto de las tareas ───
drop function if exists public.tareas_equipo_lista();
create function public.tareas_equipo_lista()
returns table (
  id uuid, tipo text, titulo text, detalle text, estado text, resultado text, respuesta text, vence date,
  created_at timestamptz, resuelta_en timestamptz,
  patient_id uuid, paciente text, plan_id uuid, plan_inicio timestamptz, plantilla_id uuid, plantilla text,
  asignada_a uuid, asignada_nombre text, asignada_area text, creada_por_nombre text, eje text, archivada boolean, aportes integer
)
language sql stable security definer set search_path = public as $$
  select t.id, t.tipo, t.titulo, t.detalle, t.estado, t.resultado, t.respuesta, t.vence, t.created_at, t.resuelta_en,
    t.patient_id, pt.nombre, t.plan_id, pl.publish_at, t.plantilla_id, ps.nombre,
    t.asignada_a, a.nombre, a.especialidad, c.nombre, t.eje, t.archivada,
    (select count(*)::int from public.revision_items i where i.tarea_id = t.id or (i.autor_id = t.asignada_a
       and i.objeto = (public.objeto_de_tarea(t)).objeto and i.objeto_id = (public.objeto_de_tarea(t)).objeto_id and i.created_at >= t.created_at))
  from public.tareas_equipo t
  left join public.patients pt on pt.id = t.patient_id
  left join public.plans pl on pl.id = t.plan_id
  left join public.plantillas_semana ps on ps.id = t.plantilla_id
  join public.profiles a on a.id = t.asignada_a
  left join public.profiles c on c.id = t.creada_por
  where public.is_profesional() or t.asignada_a = auth.uid()
  order by (t.estado in ('pendiente', 'en_curso')) desc, t.vence nulls last, t.created_at desc;
$$;
revoke execute on function public.tareas_equipo_lista() from public, anon;
grant execute on function public.tareas_equipo_lista() to authenticated;

-- Lo que hace falta para revisar en el mismo calendario de la clínica.
create or replace function public.tarea_contexto(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t public.tareas_equipo;
begin
  select * into t from public.tareas_equipo where id = p_id;
  if t.id is null or not (public.is_profesional() or t.asignada_a = auth.uid()) then raise exception 'Sin acceso.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'resumen', case when t.patient_id is not null then public.resumen_datos(t.patient_id) end,
    'perfil', case when t.patient_id is not null then (
      select jsonb_build_object('nombre', p.nombre, 'edad', p.edad, 'etapas', to_jsonb(public.etapas_cognitivas(p.id)), 'etapaOverride', p.etapa_cognitiva_override,
        'ruta', public.valor_eje(p.id, 'fisico'), 'supervision', p.supervision, 'nutricion', p.nutricion)
      from public.patients p where p.id = t.patient_id) end,
    'valoracion', case when t.tipo in ('valorar_paciente', 'revisar_paciente') then public.valoracion_paciente(t.patient_id) end,
    'semana', case when t.plan_id is not null then (
      select jsonb_build_object('inicio', p.publish_at, 'mensaje', p.feedback_mensaje, 'tareas', coalesce((
        select jsonb_agg(jsonb_build_object('id', x.id, 'dia', x.dia, 'hora', x.hora, 'titulo', x.titulo, 'estado', x.estado, 'modulo', mr.modulo, 'codigo', mr.codigo,
          'media_resource_id', x.media_resource_id, 'nivel_interactivo', x.nivel_interactivo,
          'indicacion', x.indicacion_individual, 'nota_clinica', x.nota_clinica, 'comentario', x.comentario) order by x.sort_order)
        from public.plan_tasks x left join public.media_resources mr on mr.id = x.media_resource_id where x.plan_id = p.id), '[]'::jsonb))
      from public.plans p where p.id = t.plan_id) end,
    'borrador', case when t.tipo in ('revisar_borrador', 'armar_semana') then (
      select jsonb_build_object('tareas', b.tareas, 'plantilla', (select s.nombre from public.plantillas_semana s where s.id = b.plantilla_id), 'actualizado', b.updated_at)
      from public.semanas_borrador b where b.patient_id = t.patient_id) end,
    'plantilla', case when t.plantilla_id is not null then (
      select jsonb_build_object('nombre', s.nombre, 'descripcion', s.descripcion, 'perfil_objetivo', s.perfil_objetivo, 'tareas', coalesce((
        select jsonb_agg(jsonb_build_object('dia_idx', x.dia_idx, 'hora', x.hora, 'titulo', mr.titulo, 'modulo', mr.modulo, 'codigo', mr.codigo, 'duracion', mr.duracion,
          'media_resource_id', x.media_resource_id, 'nivel_interactivo', x.nivel_interactivo, 'extras', mr.extras) order by x.dia_idx, x.orden)
        from public.plantilla_tareas x join public.media_resources mr on mr.id = x.media_resource_id where x.plantilla_id = s.id), '[]'::jsonb))
      from public.plantillas_semana s where s.id = t.plantilla_id) end
  );
end;
$$;
revoke execute on function public.tarea_contexto(uuid) from public, anon;
grant execute on function public.tarea_contexto(uuid) to authenticated;

-- El equipo con una tarea sobre el paciente también ve el seguimiento.
create or replace function public.puede_ver_seguimiento(p_patient uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_profesional()
    or exists (select 1 from public.patient_links pl where pl.patient_id = p_patient and pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante'))
    or (public.es_referidor() and exists (select 1 from public.referidos r where r.patient_id = p_patient and r.referidor_id = auth.uid())
        and public.consentimiento_paciente(p_patient, 'compartir_referidor'))
    or (public.es_equipo() and exists (select 1 from public.tareas_equipo t where t.patient_id = p_patient and t.asignada_a = auth.uid() and t.estado <> 'cancelada'));
$$;
