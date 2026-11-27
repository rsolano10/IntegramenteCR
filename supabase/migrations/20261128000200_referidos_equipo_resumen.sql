-- Referidos, equipo clínico y resumen para el médico (2026-11-28).
--
-- Roles (profiles.role):
--   profesional  Clínica / Coordinación: ve y hace todo (las dos son lo
--                mismo a propósito: un solo rol, la especialidad dice cuál).
--   equipo       Equipo clínico: trabaja por tareas que le asigna la
--                coordinación (revisar un paciente, una semana, una
--                plantilla). Ve solo lo de sus tareas.
--   referidor    Profesional externo que refiere personas: ve a quién
--                refirió y, con permiso de la familia, su seguimiento.
-- El área de salud va en profiles.especialidad.
--
-- 1. Referidos: referidos (quién refirió a cada paciente; solo clínica y el
--    propio referidor), código de referido por profesional y personas que
--    el referidor recomienda desde la app (leads_referidos).
-- 2. Resumen de seguimiento: resumen_seguimiento(patient) para la familia,
--    la clínica, el equipo con una tarea y el referidor con permiso;
--    enlaces para compartir con el médico (resumenes_compartidos).
-- 3. Tareas del equipo clínico (tareas_equipo) y su contexto.
-- 4. Métricas de referidos para la administración.

alter table public.profiles add column if not exists institucion text;
alter table public.profiles add column if not exists codigo_referido text;
create unique index if not exists profiles_codigo_referido on public.profiles (lower(codigo_referido)) where codigo_referido is not null;

-- El permiso nuevo: compartir el avance con el profesional que refirió.
alter table public.consentimientos drop constraint if exists consentimientos_tipo_check;
alter table public.consentimientos add constraint consentimientos_tipo_check
  check (tipo in ('terminos', 'datos_salud', 'proveedores', 'rol_familiar', 'confidencialidad', 'ia_clara', 'ia_equipo', 'voz', 'whatsapp', 'compartir_referidor'));

create or replace function public.es_equipo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'equipo' and is_active);
$$;
create or replace function public.es_referidor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'referidor' and is_active);
$$;
grant execute on function public.es_equipo() to authenticated;
grant execute on function public.es_referidor() to authenticated;

-- La confidencialidad también la aceptan el equipo clínico y los referidores.
create or replace function public.registrar_consentimientos(p_version text, p_items jsonb, p_user_agent text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol text;
  v_patient uuid;
  v_item jsonb;
  v_tipo text;
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  select role::text into v_rol from public.profiles where id = v_uid;
  if v_rol is null then raise exception 'Perfil inexistente.'; end if;
  if coalesce(p_version, '') = '' then raise exception 'Falta la versión.'; end if;
  select pl.patient_id into v_patient from public.patient_links pl
    where pl.profile_id = v_uid and pl.relation in ('familiar_admin', 'participante')
    order by pl.created_at limit 1;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_tipo := v_item->>'tipo';
    if v_tipo = 'rol_familiar' and v_rol <> 'familiar' then continue; end if;
    if v_tipo = 'confidencialidad' and v_rol not in ('profesional', 'equipo', 'referidor') then continue; end if;
    if v_tipo = 'compartir_referidor' and v_rol not in ('familiar', 'paciente') then continue; end if;
    if coalesce(v_item->>'texto', '') = '' then raise exception 'Falta el texto del consentimiento %.', v_tipo; end if;
    insert into public.consentimientos (profile_id, patient_id, tipo, otorgado, version, texto, rol, user_agent)
    values (v_uid, v_patient, v_tipo, coalesce((v_item->>'otorgado')::boolean, false), p_version, v_item->>'texto', v_rol, left(p_user_agent, 300));
    if v_tipo = 'whatsapp' then
      update public.profiles set whatsapp_notifications_enabled = coalesce((v_item->>'otorgado')::boolean, false) where id = v_uid;
    end if;
  end loop;
end;
$$;

-- ─── 1. Referidos ───
create table if not exists public.referidos (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  referidor_id uuid not null references public.profiles(id) on delete cascade,
  origen text not null default 'manual' check (origen in ('enlace', 'manual')),
  creado_por uuid,
  created_at timestamptz not null default now()
);
create index if not exists referidos_referidor on public.referidos (referidor_id);
alter table public.referidos enable row level security;
drop policy if exists referidos_select on public.referidos;
create policy referidos_select on public.referidos for select to authenticated using (public.is_profesional() or referidor_id = auth.uid());
revoke insert, update, delete on public.referidos from anon, authenticated;

create table if not exists public.leads_referidos (
  id uuid primary key default gen_random_uuid(),
  referidor_id uuid not null references public.profiles(id) on delete cascade,
  nombre text not null check (length(btrim(nombre)) > 0),
  telefono text,
  motivo text,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'contactado', 'registrado', 'descartado')),
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leads_referidos enable row level security;
drop policy if exists leads_select on public.leads_referidos;
create policy leads_select on public.leads_referidos for select to authenticated using (public.is_profesional() or referidor_id = auth.uid());
revoke insert, update, delete on public.leads_referidos from anon, authenticated;

-- Al registrarse con el enlace del referidor (?ref=CODIGO): queda el primero.
create or replace function public.aplicar_referido(p_codigo text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_patient uuid;
  v_ref public.profiles;
begin
  select pl.patient_id into v_patient from public.patient_links pl
    where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante') order by pl.created_at limit 1;
  if v_patient is null then return null; end if;
  select * into v_ref from public.profiles
    where lower(codigo_referido) = lower(btrim(p_codigo)) and role = 'referidor' and is_active limit 1;
  if v_ref.id is null then return null; end if;
  insert into public.referidos (patient_id, referidor_id, origen, creado_por)
  values (v_patient, v_ref.id, 'enlace', auth.uid()) on conflict (patient_id) do nothing;
  return v_ref.nombre;
end;
$$;
revoke execute on function public.aplicar_referido(text) from public, anon;
grant execute on function public.aplicar_referido(text) to authenticated;

-- Quién lo refirió (para la familia: pedir o retirar el permiso de compartir).
create or replace function public.mi_referidor()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nombre', p.nombre, 'especialidad', p.especialidad, 'institucion', p.institucion)
  from public.patient_links pl
  join public.referidos r on r.patient_id = pl.patient_id
  join public.profiles p on p.id = r.referidor_id
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
$$;
grant execute on function public.mi_referidor() to authenticated;

-- La clínica asigna (o quita) quién refirió a un paciente.
create or replace function public.asignar_referidor(p_patient uuid, p_referidor uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_profesional() then raise exception 'Solo la clínica.' using errcode = '42501'; end if;
  if p_referidor is null then
    delete from public.referidos where patient_id = p_patient;
    return;
  end if;
  if not exists (select 1 from public.profiles where id = p_referidor and role = 'referidor') then raise exception 'No es un profesional referidor.'; end if;
  insert into public.referidos (patient_id, referidor_id, origen, creado_por) values (p_patient, p_referidor, 'manual', auth.uid())
  on conflict (patient_id) do update set referidor_id = excluded.referidor_id, origen = 'manual', creado_por = auth.uid();
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (p_patient, 'referido', 'asignar:' || p_referidor, auth.uid());
end;
$$;
revoke execute on function public.asignar_referidor(uuid, uuid) from public, anon;
grant execute on function public.asignar_referidor(uuid, uuid) to authenticated;

-- En qué momento del programa está una persona (para referidores y métricas).
create or replace function public.estado_programa(pt public.patients)
returns text language sql stable as $$
  select case
    when pt.rechazada_en is not null then 'no_continuo'
    when pt.pagado_hasta >= current_date or (pt.pagada_desde is not null and pt.pagado_hasta is null) then 'pagando'
    when pt.pagado_hasta is not null then 'vencido'
    when pt.demo_fin is not null and pt.demo_fin >= now() then 'semana_gratis'
    when pt.demo_fin is not null then 'termino_prueba'
    when pt.aprobada_en is null then 'en_revision'
    else 'activo'
  end;
$$;

-- El referidor: las personas que refirió.
create or replace function public.mis_referidos()
returns table (
  patient_id uuid, nombre text, referido_en timestamptz, origen text, estado text, programa text,
  comparte boolean, ultima_actividad timestamptz, semana_hechas integer, semana_total integer
)
language sql stable security definer set search_path = public as $$
  select pt.id, pt.nombre, r.created_at, r.origen, public.estado_programa(pt), pt.modalidad::text,
    public.consentimiento_paciente(pt.id, 'compartir_referidor'),
    (select max(t.registrado_en) from public.plan_tasks t join public.plans p on p.id = t.plan_id where p.patient_id = pt.id),
    sem.hechas, sem.total
  from public.referidos r
  join public.patients pt on pt.id = r.patient_id
  left join lateral (
    select count(*) filter (where t.estado in ('realizado', 'parcial'))::int hechas, count(*)::int total
    from public.plan_tasks t
    where t.plan_id = (select p.id from public.plans p where p.patient_id = pt.id and p.status = 'published' and p.publish_at <= now() order by p.publish_at desc limit 1)
  ) sem on true
  where r.referidor_id = auth.uid() and public.es_referidor()
  order by r.created_at desc;
$$;
revoke execute on function public.mis_referidos() from public, anon;
grant execute on function public.mis_referidos() to authenticated;

-- El referidor recomienda a alguien (la clínica lo contacta).
create or replace function public.crear_lead_referido(p_nombre text, p_telefono text, p_motivo text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.es_referidor() then raise exception 'Solo profesionales referidores.' using errcode = '42501'; end if;
  if coalesce(btrim(p_nombre), '') = '' then raise exception 'Falta el nombre.'; end if;
  insert into public.leads_referidos (referidor_id, nombre, telefono, motivo)
  values (auth.uid(), btrim(p_nombre), nullif(btrim(coalesce(p_telefono, '')), ''), nullif(btrim(coalesce(p_motivo, '')), ''))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.crear_lead_referido(text, text, text) from public, anon;
grant execute on function public.crear_lead_referido(text, text, text) to authenticated;

create or replace function public.actualizar_lead_referido(p_id uuid, p_estado text, p_nota text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_profesional() then raise exception 'Solo la clínica.' using errcode = '42501'; end if;
  update public.leads_referidos set estado = p_estado, nota = coalesce(nullif(btrim(coalesce(p_nota, '')), ''), nota), updated_at = now() where id = p_id;
end;
$$;
revoke execute on function public.actualizar_lead_referido(uuid, text, text) from public, anon;
grant execute on function public.actualizar_lead_referido(uuid, text, text) to authenticated;

-- ─── 3. Tareas del equipo clínico (antes del resumen: se usa en el acceso) ───
create table if not exists public.tareas_equipo (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('revisar_paciente', 'revisar_semana', 'armar_semana', 'revisar_plantilla', 'otra')),
  titulo text not null check (length(btrim(titulo)) > 0),
  detalle text,
  patient_id uuid references public.patients(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  plantilla_id uuid references public.plantillas_semana(id) on delete set null,
  asignada_a uuid not null references public.profiles(id) on delete cascade,
  creada_por uuid references public.profiles(id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'resuelta', 'cancelada')),
  resultado text check (resultado in ('aprobado', 'con_cambios', 'comentario')),
  respuesta text,
  vence date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resuelta_en timestamptz
);
create index if not exists tareas_equipo_asignada on public.tareas_equipo (asignada_a, estado);
create index if not exists tareas_equipo_paciente on public.tareas_equipo (patient_id);
alter table public.tareas_equipo enable row level security;
drop policy if exists tareas_equipo_select on public.tareas_equipo;
create policy tareas_equipo_select on public.tareas_equipo for select to authenticated using (public.is_profesional() or asignada_a = auth.uid());
revoke insert, update, delete on public.tareas_equipo from anon, authenticated;

alter table public.plantillas_semana add column if not exists revisada_por uuid references public.profiles(id) on delete set null;
alter table public.plantillas_semana add column if not exists revisada_en timestamptz;

-- ─── 2. Resumen de seguimiento ───
-- ¿Puede quien llama ver el seguimiento de este paciente?
create or replace function public.puede_ver_seguimiento(p_patient uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_profesional()
    or exists (select 1 from public.patient_links pl where pl.patient_id = p_patient and pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante'))
    or (public.es_referidor() and exists (select 1 from public.referidos r where r.patient_id = p_patient and r.referidor_id = auth.uid())
        and public.consentimiento_paciente(p_patient, 'compartir_referidor'))
    or (public.es_equipo() and exists (select 1 from public.tareas_equipo t where t.patient_id = p_patient and t.asignada_a = auth.uid() and t.estado <> 'cancelada'));
$$;
revoke execute on function public.puede_ver_seguimiento(uuid) from public, anon;
grant execute on function public.puede_ver_seguimiento(uuid) to authenticated;

-- El resumen en sí (sin control de acceso: lo llaman las funciones de abajo).
-- Lo que se hizo en casa en las últimas 8 semanas, por semana y por área,
-- lo que contó la familia y los avisos. Sin semáforos ni puntajes: es un
-- documento que comparte la familia.
create or replace function public.resumen_datos(p_patient uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  with pt as (select * from public.patients where id = p_patient),
  planes as (
    select p.* from public.plans p
    where p.patient_id = p_patient and p.status = 'published' and p.publish_at <= now()
    order by p.publish_at desc limit 8
  ),
  tareas as (
    select t.*, pl.publish_at, mr.modulo::text as modulo
    from public.plan_tasks t join planes pl on pl.id = t.plan_id
    left join public.media_resources mr on mr.id = t.media_resource_id
    where not coalesce(t.es_onboarding, false)
  )
  select jsonb_build_object(
    'generado_en', now(),
    'persona', (select jsonb_build_object(
      'nombre', pt.nombre, 'edad', pt.edad, 'programa', pt.modalidad::text,
      'desde', coalesce(pt.aprobada_en, pt.created_at)) from pt),
    'totales', (select jsonb_build_object(
      'semanas', (select count(*) from planes),
      'actividades', count(*),
      'hechas', count(*) filter (where estado = 'realizado'),
      'en_parte', count(*) filter (where estado = 'parcial'),
      'no', count(*) filter (where estado = 'no'),
      'sin_registrar', count(*) filter (where estado in ('pendiente', 'futuro'))) from tareas),
    'semanas', coalesce((select jsonb_agg(jsonb_build_object(
      'inicio', pl.publish_at,
      'total', (select count(*) from tareas t where t.plan_id = pl.id),
      'hechas', (select count(*) from tareas t where t.plan_id = pl.id and t.estado = 'realizado'),
      'en_parte', (select count(*) from tareas t where t.plan_id = pl.id and t.estado = 'parcial'),
      'animo', pl.week_mood,
      'lo_que_mas_gusto', pl.review_favorita,
      'preocupacion', pl.review_preocupacion,
      'mensaje_equipo', pl.feedback_mensaje) order by pl.publish_at desc) from planes pl), '[]'::jsonb),
    'por_area', coalesce((select jsonb_agg(x order by x.total desc) from (
      select coalesce(modulo, 'otra') as modulo, count(*)::int as total,
        count(*) filter (where estado in ('realizado', 'parcial'))::int as hechas
      from tareas group by 1) x), '[]'::jsonb),
    'ultimas', coalesce((select jsonb_agg(x order by x.fecha desc) from (
      select t.registrado_en as fecha, t.titulo, t.modulo, t.estado::text as estado, t.comentario, t.dificultad_percibida
      from tareas t where t.registrado_en is not null order by t.registrado_en desc limit 12) x), '[]'::jsonb),
    'avisos', (select jsonb_build_object(
      'alertas_90_dias', (select count(*) from public.alertas_riesgo a where a.patient_id = p_patient and a.created_at > now() - interval '90 days'),
      'ultima_alerta', (select max(a.created_at) from public.alertas_riesgo a where a.patient_id = p_patient),
      'pedidos_ayuda_90_dias', (select count(*) from public.pedidos_ayuda h where h.patient_id = p_patient and h.created_at > now() - interval '90 days')))
  );
$$;
revoke execute on function public.resumen_datos(uuid) from public, anon, authenticated;

create or replace function public.resumen_seguimiento(p_patient uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_patient uuid := p_patient;
begin
  if v_patient is null then
    select pl.patient_id into v_patient from public.patient_links pl
      where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante') order by pl.created_at limit 1;
  end if;
  if v_patient is null or not public.puede_ver_seguimiento(v_patient) then
    raise exception 'Sin acceso a este seguimiento.' using errcode = '42501';
  end if;
  return public.resumen_datos(v_patient);
end;
$$;
revoke execute on function public.resumen_seguimiento(uuid) from public, anon;
grant execute on function public.resumen_seguimiento(uuid) to authenticated;

-- Enlaces para compartir con el médico: los crea la familia (o la clínica),
-- vencen (30 días por defecto) y se pueden revocar.
create table if not exists public.resumenes_compartidos (
  token text primary key default encode(extensions.gen_random_bytes(18), 'hex'),
  patient_id uuid not null references public.patients(id) on delete cascade,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expira timestamptz not null,
  revocado_en timestamptz,
  vistas integer not null default 0,
  ultima_vista timestamptz
);
alter table public.resumenes_compartidos enable row level security;
drop policy if exists resumenes_select on public.resumenes_compartidos;
create policy resumenes_select on public.resumenes_compartidos for select to authenticated using (
  public.is_profesional() or exists (select 1 from public.patient_links pl where pl.patient_id = resumenes_compartidos.patient_id and pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante'))
);
revoke insert, update, delete on public.resumenes_compartidos from anon, authenticated;

create or replace function public.crear_resumen_compartido(p_patient uuid default null, p_dias integer default 30)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_patient uuid := p_patient;
  v_token text;
begin
  if v_patient is null then
    select pl.patient_id into v_patient from public.patient_links pl
      where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante') order by pl.created_at limit 1;
  end if;
  if v_patient is null then raise exception 'Sin paciente.'; end if;
  if not (public.is_profesional() or exists (select 1 from public.patient_links pl where pl.patient_id = v_patient and pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante'))) then
    raise exception 'Sin acceso.' using errcode = '42501';
  end if;
  insert into public.resumenes_compartidos (patient_id, creado_por, expira)
  values (v_patient, auth.uid(), now() + make_interval(days => greatest(1, least(coalesce(p_dias, 30), 90))))
  returning token into v_token;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (v_patient, 'resumen_compartido', 'crear', auth.uid());
  return v_token;
end;
$$;
revoke execute on function public.crear_resumen_compartido(uuid, integer) from public, anon;
grant execute on function public.crear_resumen_compartido(uuid, integer) to authenticated;

create or replace function public.revocar_resumen_compartido(p_token text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.resumenes_compartidos r set revocado_en = now()
  where r.token = p_token and r.revocado_en is null and (public.is_profesional() or exists (
    select 1 from public.patient_links pl where pl.patient_id = r.patient_id and pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')));
end;
$$;
revoke execute on function public.revocar_resumen_compartido(text) from public, anon;
grant execute on function public.revocar_resumen_compartido(text) to authenticated;

-- El médico abre el enlace sin cuenta.
create or replace function public.resumen_por_enlace(p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.resumenes_compartidos;
begin
  select * into r from public.resumenes_compartidos where token = p_token;
  if r.token is null or r.revocado_en is not null or r.expira < now() then return null; end if;
  update public.resumenes_compartidos set vistas = vistas + 1, ultima_vista = now() where token = p_token;
  return public.resumen_datos(r.patient_id) || jsonb_build_object('enlace_vence', r.expira);
end;
$$;
grant execute on function public.resumen_por_enlace(text) to anon, authenticated;

-- ─── 3 (sigue). Tareas: crear, responder, listar, contexto ───
create or replace function public.crear_tarea_equipo(
  p_tipo text, p_titulo text, p_detalle text, p_asignada_a uuid,
  p_patient uuid default null, p_plan uuid default null, p_plantilla uuid default null, p_vence date default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_profesional() then raise exception 'Solo la clínica o la coordinación.' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_asignada_a and role in ('equipo', 'profesional') and is_active) then
    raise exception 'Elegí a alguien del equipo clínico.';
  end if;
  insert into public.tareas_equipo (tipo, titulo, detalle, patient_id, plan_id, plantilla_id, asignada_a, creada_por, vence)
  values (p_tipo, btrim(p_titulo), nullif(btrim(coalesce(p_detalle, '')), ''), p_patient, p_plan, p_plantilla, p_asignada_a, auth.uid(), p_vence)
  returning id into v_id;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (p_patient, 'tarea_equipo', 'crear:' || v_id, auth.uid());
  return v_id;
end;
$$;
revoke execute on function public.crear_tarea_equipo(text, text, text, uuid, uuid, uuid, uuid, date) from public, anon;
grant execute on function public.crear_tarea_equipo(text, text, text, uuid, uuid, uuid, uuid, date) to authenticated;

create or replace function public.responder_tarea_equipo(p_id uuid, p_estado text, p_resultado text default null, p_respuesta text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare t public.tareas_equipo;
begin
  select * into t from public.tareas_equipo where id = p_id;
  if t.id is null then raise exception 'Tarea inexistente.'; end if;
  if not (public.is_profesional() or t.asignada_a = auth.uid()) then raise exception 'No es tu tarea.' using errcode = '42501'; end if;
  if p_estado = 'cancelada' and not public.is_profesional() then raise exception 'Solo la coordinación cancela tareas.' using errcode = '42501'; end if;
  if p_estado not in ('pendiente', 'en_curso', 'resuelta', 'cancelada') then raise exception 'Estado inválido.'; end if;
  update public.tareas_equipo set
    estado = p_estado,
    resultado = case when p_estado = 'resuelta' then coalesce(p_resultado, 'comentario') else resultado end,
    respuesta = coalesce(nullif(btrim(coalesce(p_respuesta, '')), ''), respuesta),
    resuelta_en = case when p_estado = 'resuelta' then now() else null end,
    updated_at = now()
  where id = p_id;
  -- Una plantilla aprobada queda marcada como revisada por esa persona.
  if p_estado = 'resuelta' and p_resultado = 'aprobado' and t.plantilla_id is not null then
    update public.plantillas_semana set revisada_por = t.asignada_a, revisada_en = now() where id = t.plantilla_id;
  end if;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (t.patient_id, 'tarea_equipo', p_estado || ':' || p_id, auth.uid());
end;
$$;
revoke execute on function public.responder_tarea_equipo(uuid, text, text, text) from public, anon;
grant execute on function public.responder_tarea_equipo(uuid, text, text, text) to authenticated;

create or replace function public.tareas_equipo_lista()
returns table (
  id uuid, tipo text, titulo text, detalle text, estado text, resultado text, respuesta text, vence date,
  created_at timestamptz, resuelta_en timestamptz,
  patient_id uuid, paciente text, plan_id uuid, plan_inicio timestamptz, plantilla_id uuid, plantilla text,
  asignada_a uuid, asignada_nombre text, asignada_area text, creada_por_nombre text
)
language sql stable security definer set search_path = public as $$
  select t.id, t.tipo, t.titulo, t.detalle, t.estado, t.resultado, t.respuesta, t.vence, t.created_at, t.resuelta_en,
    t.patient_id, pt.nombre, t.plan_id, pl.publish_at, t.plantilla_id, ps.nombre,
    t.asignada_a, a.nombre, a.especialidad, c.nombre
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

-- Lo que el equipo necesita para resolver una tarea: el seguimiento del
-- paciente, la semana (actividades) y la plantilla (actividades por día).
create or replace function public.tarea_contexto(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t public.tareas_equipo;
begin
  select * into t from public.tareas_equipo where id = p_id;
  if t.id is null or not (public.is_profesional() or t.asignada_a = auth.uid()) then raise exception 'Sin acceso.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'resumen', case when t.patient_id is not null then public.resumen_datos(t.patient_id) end,
    'semana', case when t.plan_id is not null then (
      select jsonb_build_object('inicio', p.publish_at, 'mensaje', p.feedback_mensaje, 'tareas', coalesce((
        select jsonb_agg(jsonb_build_object('dia', x.dia, 'hora', x.hora, 'titulo', x.titulo, 'estado', x.estado, 'modulo', mr.modulo, 'codigo', mr.codigo,
          'indicacion', x.indicacion_individual, 'nota_clinica', x.nota_clinica, 'comentario', x.comentario) order by x.sort_order)
        from public.plan_tasks x left join public.media_resources mr on mr.id = x.media_resource_id where x.plan_id = p.id), '[]'::jsonb))
      from public.plans p where p.id = t.plan_id) end,
    'plantilla', case when t.plantilla_id is not null then (
      select jsonb_build_object('nombre', s.nombre, 'descripcion', s.descripcion, 'perfil_objetivo', s.perfil_objetivo, 'tareas', coalesce((
        select jsonb_agg(jsonb_build_object('dia_idx', x.dia_idx, 'hora', x.hora, 'titulo', mr.titulo, 'modulo', mr.modulo, 'codigo', mr.codigo, 'duracion', mr.duracion) order by x.dia_idx, x.orden)
        from public.plantilla_tareas x join public.media_resources mr on mr.id = x.media_resource_id where x.plantilla_id = s.id), '[]'::jsonb))
      from public.plantillas_semana s where s.id = t.plantilla_id) end
  );
end;
$$;
revoke execute on function public.tarea_contexto(uuid) from public, anon;
grant execute on function public.tarea_contexto(uuid) to authenticated;

-- Para asignar: el equipo clínico activo (y la coordinación), con su área.
create or replace function public.equipo_clinico()
returns table (profile_id uuid, nombre text, especialidad text, rol text, pendientes integer)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.especialidad, p.role::text,
    (select count(*)::int from public.tareas_equipo t where t.asignada_a = p.id and t.estado in ('pendiente', 'en_curso'))
  from public.profiles p
  where p.role in ('equipo', 'profesional') and p.is_active and public.is_profesional()
  order by p.role desc, p.nombre;
$$;
revoke execute on function public.equipo_clinico() from public, anon;
grant execute on function public.equipo_clinico() to authenticated;

-- Para elegir el referidor de un paciente.
create or replace function public.referidores_lista()
returns table (profile_id uuid, nombre text, especialidad text, institucion text, codigo text, activo boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.especialidad, p.institucion, p.codigo_referido, p.is_active
  from public.profiles p where p.role = 'referidor' and public.is_profesional() order by p.is_active desc, p.nombre;
$$;
revoke execute on function public.referidores_lista() from public, anon;
grant execute on function public.referidores_lista() to authenticated;

-- ─── 4. Métricas de referidos (administración) ───
create or replace function public.metricas_referidos()
returns table (
  referidor_id uuid, nombre text, especialidad text, institucion text, activo boolean,
  referidos integer, en_revision integer, en_prueba integer, pagando integer,
  pagando_autoguiado integer, pagando_con_sesiones integer, no_continuaron integer,
  leads integer, leads_registrados integer, ultimo_referido timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.especialidad, p.institucion, p.is_active,
    count(r.patient_id)::int,
    count(*) filter (where public.estado_programa(pt) = 'en_revision')::int,
    count(*) filter (where public.estado_programa(pt) in ('semana_gratis', 'termino_prueba'))::int,
    count(*) filter (where public.estado_programa(pt) = 'pagando')::int,
    count(*) filter (where public.estado_programa(pt) = 'pagando' and pt.modalidad = 'autoguiado')::int,
    count(*) filter (where public.estado_programa(pt) = 'pagando' and pt.modalidad <> 'autoguiado')::int,
    count(*) filter (where public.estado_programa(pt) in ('no_continuo', 'vencido'))::int,
    (select count(*)::int from public.leads_referidos l where l.referidor_id = p.id),
    (select count(*)::int from public.leads_referidos l where l.referidor_id = p.id and l.estado = 'registrado'),
    max(r.created_at)
  from public.profiles p
  left join public.referidos r on r.referidor_id = p.id
  left join public.patients pt on pt.id = r.patient_id
  where p.role = 'referidor' and public.es_admin()
  group by p.id
  order by count(r.patient_id) desc, p.nombre;
$$;
revoke execute on function public.metricas_referidos() from public, anon;
grant execute on function public.metricas_referidos() to authenticated;
