-- Cumplimiento legal (Ley 8968, protección de datos personales):
--   1. consentimientos: registro de solo agregar (append-only) de cada
--      consentimiento otorgado o revocado, con versión y texto exacto.
--      Sin FK a profiles a propósito: la prueba del consentimiento se
--      conserva aunque la cuenta se elimine.
--   2. solicitudes_datos: derechos de acceso, rectificación, eliminación y
--      oposición, con vencimiento a 5 días hábiles.
--   3. exportar_mis_datos(): copia de los datos de la cuenta en JSON.
--   4. resolver_solicitud_datos(): la administración resuelve; en una
--      eliminación borra lo no clínico (conversaciones, memoria de IA,
--      avisos, borradores, teléfono) y conserva el expediente clínico.
--   5. aplicar_retencion(): plazos de conservación, todos los días.

-- 1. Consentimientos -------------------------------------------------------
create table if not exists public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  patient_id uuid,
  tipo text not null check (tipo in ('terminos', 'datos_salud', 'proveedores', 'rol_familiar', 'confidencialidad', 'ia_clara', 'ia_equipo', 'voz', 'whatsapp')),
  otorgado boolean not null,
  version text not null,
  texto text not null,
  rol text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists consentimientos_perfil_tipo on public.consentimientos (profile_id, tipo, created_at desc);
create index if not exists consentimientos_paciente on public.consentimientos (patient_id);

alter table public.consentimientos enable row level security;
drop policy if exists consentimientos_select on public.consentimientos;
create policy consentimientos_select on public.consentimientos
  for select to authenticated
  using (profile_id = auth.uid() or public.is_profesional());
-- Sin políticas de insert/update/delete: solo se agrega por RPC y nunca se edita.
revoke insert, update, delete on public.consentimientos from anon, authenticated;

-- Registrar varias decisiones a la vez. El usuario sale del token
-- (auth.uid()), nunca del cliente; el rol y el paciente, de la base.
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
    if v_tipo = 'confidencialidad' and v_rol <> 'profesional' then continue; end if;
    if coalesce(v_item->>'texto', '') = '' then raise exception 'Falta el texto del consentimiento %.', v_tipo; end if;
    insert into public.consentimientos (profile_id, patient_id, tipo, otorgado, version, texto, rol, user_agent)
    values (v_uid, v_patient, v_tipo, coalesce((v_item->>'otorgado')::boolean, false), p_version, v_item->>'texto', v_rol, left(p_user_agent, 300));
    -- WhatsApp revocado: también se apaga el interruptor de avisos.
    if v_tipo = 'whatsapp' and not coalesce((v_item->>'otorgado')::boolean, false) then
      update public.profiles set whatsapp_notifications_enabled = false where id = v_uid;
    end if;
  end loop;
end;
$$;
revoke execute on function public.registrar_consentimientos(text, jsonb, text) from public, anon;
grant execute on function public.registrar_consentimientos(text, jsonb, text) to authenticated;

-- Última decisión por tipo de la cuenta que llama.
create or replace function public.mis_consentimientos()
returns table (tipo text, otorgado boolean, version text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (c.tipo) c.tipo, c.otorgado, c.version, c.created_at
  from public.consentimientos c
  where c.profile_id = auth.uid()
  order by c.tipo, c.created_at desc;
$$;
revoke execute on function public.mis_consentimientos() from public, anon;
grant execute on function public.mis_consentimientos() to authenticated;

-- Para las funciones del servidor (service_role): ¿esta cuenta autorizó?
create or replace function public.consentimiento_vigente(p_profile uuid, p_tipo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select c.otorgado from public.consentimientos c
    where c.profile_id = p_profile and c.tipo = p_tipo
    order by c.created_at desc limit 1
  ), false);
$$;
revoke execute on function public.consentimiento_vigente(uuid, text) from public, anon, authenticated;
grant execute on function public.consentimiento_vigente(uuid, text) to service_role;

-- ¿Alguna cuenta del paciente (familiar o participante) autorizó este uso?
create or replace function public.consentimiento_paciente(p_patient uuid, p_tipo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patient_links pl
    where pl.patient_id = p_patient and pl.relation in ('familiar_admin', 'participante')
      and public.consentimiento_vigente(pl.profile_id, p_tipo)
  );
$$;
revoke execute on function public.consentimiento_paciente(uuid, text) from public, anon, authenticated;
grant execute on function public.consentimiento_paciente(uuid, text) to service_role;

-- Para la clínica: los permisos vigentes de cada cuenta de un paciente.
create or replace function public.consentimientos_de_paciente(p_patient uuid)
returns table (profile_id uuid, nombre text, relation text, tipo text, otorgado boolean, version text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (pl.profile_id, c.tipo) pl.profile_id, p.nombre, pl.relation::text, c.tipo, c.otorgado, c.version, c.created_at
  from public.patient_links pl
  join public.profiles p on p.id = pl.profile_id
  join public.consentimientos c on c.profile_id = pl.profile_id
  where pl.patient_id = p_patient and public.is_profesional()
  order by pl.profile_id, c.tipo, c.created_at desc;
$$;
revoke execute on function public.consentimientos_de_paciente(uuid) from public, anon;
grant execute on function public.consentimientos_de_paciente(uuid) to authenticated;

-- 2. Solicitudes de derechos ------------------------------------------------
create table if not exists public.solicitudes_datos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  patient_id uuid,
  nombre text,
  tipo text not null check (tipo in ('acceso', 'rectificacion', 'eliminacion', 'oposicion')),
  detalle text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'resuelta', 'rechazada')),
  respuesta text,
  vence_el date not null,
  created_at timestamptz not null default now(),
  resuelta_at timestamptz,
  resuelta_por uuid
);
create index if not exists solicitudes_datos_estado on public.solicitudes_datos (estado, vence_el);
alter table public.solicitudes_datos enable row level security;
drop policy if exists solicitudes_datos_select on public.solicitudes_datos;
create policy solicitudes_datos_select on public.solicitudes_datos
  for select to authenticated
  using (profile_id = auth.uid() or public.es_admin());
revoke insert, update, delete on public.solicitudes_datos from anon, authenticated;

-- n días hábiles (lunes a viernes) después de una fecha.
create or replace function public.sumar_dias_habiles(p_desde date, p_dias int)
returns date
language plpgsql
immutable
as $$
declare d date := p_desde; n int := 0;
begin
  while n < p_dias loop
    d := d + 1;
    if extract(isodow from d) < 6 then n := n + 1; end if;
  end loop;
  return d;
end;
$$;

create or replace function public.solicitar_derecho(p_tipo text, p_detalle text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_patient uuid;
  v_nombre text;
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  if p_tipo not in ('acceso', 'rectificacion', 'eliminacion', 'oposicion') then raise exception 'Tipo inválido.'; end if;
  if exists (select 1 from public.solicitudes_datos where profile_id = v_uid and tipo = p_tipo and estado = 'pendiente') then
    raise exception 'Ya tenés una solicitud de este tipo en trámite.';
  end if;
  select pl.patient_id into v_patient from public.patient_links pl where pl.profile_id = v_uid order by pl.created_at limit 1;
  select nombre into v_nombre from public.profiles where id = v_uid;
  insert into public.solicitudes_datos (profile_id, patient_id, nombre, tipo, detalle, vence_el)
  values (v_uid, v_patient, v_nombre, p_tipo, left(nullif(trim(p_detalle), ''), 2000), public.sumar_dias_habiles((now() at time zone 'America/Costa_Rica')::date, 5))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.solicitar_derecho(text, text) from public, anon;
grant execute on function public.solicitar_derecho(text, text) to authenticated;

-- 3. Exportación -------------------------------------------------------------
-- Lo que la cuenta ingresó o recibió. No incluye las notas internas ni los
-- semáforos de la clínica: el expediente clínico se pide al equipo tratante.
create or replace function public.exportar_mis_datos()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pacientes uuid[];
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  select coalesce(array_agg(patient_id), '{}') into v_pacientes
    from public.patient_links where profile_id = v_uid and relation in ('familiar_admin', 'participante');

  return jsonb_build_object(
    'generado_el', now(),
    'responsable', 'IntegraMente en Casa',
    'cuenta', (select jsonb_build_object('id', p.id, 'nombre', p.nombre, 'rol', p.role, 'correo', u.email, 'telefono_whatsapp', p.whatsapp_phone,
                 'avisos_whatsapp', p.whatsapp_notifications_enabled, 'creada', p.created_at, 'estado', p.estado_cuenta)
               from public.profiles p left join auth.users u on u.id = p.id where p.id = v_uid),
    'consentimientos', coalesce((select jsonb_agg(to_jsonb(c) - 'profile_id' order by c.created_at) from public.consentimientos c where c.profile_id = v_uid), '[]'),
    'solicitudes', coalesce((select jsonb_agg(to_jsonb(s) - 'profile_id' order by s.created_at) from public.solicitudes_datos s where s.profile_id = v_uid), '[]'),
    'personas_participantes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', pa.nombre, 'edad', pa.edad, 'modalidad', pa.modalidad, 'alta', pa.created_at,
        'cuestionario', (select oa.answers from public.onboarding_answers oa where oa.patient_id = pa.id),
        'planes', coalesce((select jsonb_agg(jsonb_build_object(
            'publicado', pl.publish_at, 'estado', pl.status, 'animo_semana', pl.week_mood, 'favorita', pl.review_favorita,
            'preocupacion', pl.review_preocupacion, 'comentario', pl.feedback_mensaje,
            'actividades', coalesce((select jsonb_agg(jsonb_build_object('dia', t.dia, 'hora', t.hora, 'titulo', t.titulo, 'estado', t.estado,
                'comentario', t.comentario, 'registrado_en', t.registrado_en) order by t.sort_order) from public.plan_tasks t where t.plan_id = pl.id), '[]')
          ) order by pl.publish_at) from public.plans pl where pl.patient_id = pa.id and pl.status = 'published'), '[]'),
        'mensajes', coalesce((select jsonb_agg(jsonb_build_object('texto', m.texto, 'fecha', m.created_at, 'propio', m.autor_id = v_uid) order by m.created_at)
                    from public.mensajes m where m.patient_id = pa.id), '[]'),
        'pedidos_de_ayuda', coalesce((select jsonb_agg(jsonb_build_object('nota', h.nota, 'fecha', h.created_at) order by h.created_at)
                    from public.pedidos_ayuda h where h.patient_id = pa.id), '[]'),
        'alertas', coalesce((select jsonb_agg(jsonb_build_object('tipo', a.tipo, 'fecha', a.created_at) order by a.created_at)
                    from public.alertas_riesgo a where a.patient_id = pa.id), '[]')
      )) from public.patients pa where pa.id = any(v_pacientes)), '[]'),
    'asistente', jsonb_build_object(
      'mensajes', coalesce((select jsonb_agg(jsonb_build_object('rol', am.rol, 'texto', am.texto, 'fecha', am.created_at) order by am.created_at)
                  from public.asistente_mensajes am where am.profile_id = v_uid), '[]'),
      'memoria', (select amem.resumen from public.asistente_memoria amem where amem.profile_id = v_uid)
    ),
    'clara', jsonb_build_object(
      'memoria', (select ag.resumen_previo from public.agent_memory ag where ag.user_id = v_uid),
      'conversaciones', coalesce((select jsonb_agg(jsonb_build_object('id', cc.conversation_id, 'fecha', cc.created_at) order by cc.created_at)
                        from public.clara_conversaciones cc where cc.user_id = v_uid), '[]')
    ),
    'avisos_whatsapp', coalesce((select jsonb_agg(jsonb_build_object('tipo', n.tipo, 'programado', n.scheduled_for, 'estado', n.status, 'entregado', n.delivered_at, 'leido', n.read_at) order by n.created_at)
                       from public.notifications_log n where n.profile_id = v_uid), '[]')
  );
end;
$$;
revoke execute on function public.exportar_mis_datos() from public, anon;
grant execute on function public.exportar_mis_datos() to authenticated;

-- 4. Resolver una solicitud (solo administración) ---------------------------
create or replace function public.resolver_solicitud_datos(p_id uuid, p_estado text, p_respuesta text, p_borrar boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.solicitudes_datos;
begin
  if not public.es_admin() then raise exception 'Solo la administración.'; end if;
  if p_estado not in ('resuelta', 'rechazada') then raise exception 'Estado inválido.'; end if;
  if coalesce(trim(p_respuesta), '') = '' then raise exception 'Escribí la respuesta para la persona.'; end if;
  select * into s from public.solicitudes_datos where id = p_id for update;
  if s.id is null then raise exception 'Solicitud inexistente.'; end if;

  if p_borrar and p_estado = 'resuelta' and s.tipo in ('eliminacion', 'oposicion') then
    -- Datos no clínicos de la cuenta. El expediente (cuestionario, planes,
    -- registros, notas) se conserva el plazo que exige la normativa de salud.
    delete from public.asistente_mensajes where profile_id = s.profile_id;
    delete from public.asistente_memoria where profile_id = s.profile_id;
    delete from public.asistente_uso where profile_id = s.profile_id;
    delete from public.agent_memory where user_id = s.profile_id;
    delete from public.clara_conversaciones where user_id = s.profile_id;
    delete from public.notifications_log where profile_id = s.profile_id;
    delete from public.onboarding_borradores where profile_id = s.profile_id;
    update public.profiles set whatsapp_phone = null, whatsapp_notifications_enabled = false where id = s.profile_id;
    insert into public.consentimientos (profile_id, patient_id, tipo, otorgado, version, texto, rol)
    select s.profile_id, s.patient_id, t, false, 'solicitud', 'Revocado al resolver la solicitud de ' || s.tipo || ' ' || s.id, 'administracion'
    from unnest(array['ia_clara', 'ia_equipo', 'voz', 'whatsapp']) t;
  end if;

  update public.solicitudes_datos
    set estado = p_estado, respuesta = trim(p_respuesta), resuelta_at = now(), resuelta_por = auth.uid()
    where id = p_id;
  insert into public.audit_log (patient_id, entidad, accion, autor_id)
  values (s.patient_id, 'solicitud_datos', s.tipo || ':' || p_estado || case when p_borrar then ':borrado' else '' end, auth.uid());
end;
$$;
revoke execute on function public.resolver_solicitud_datos(uuid, text, text, boolean) from public, anon;
grant execute on function public.resolver_solicitud_datos(uuid, text, text, boolean) to authenticated;

-- 5. Retención -------------------------------------------------------------
-- Plazos en docs/legal/retencion.md. mensajes ya tiene su propia purga (1 año).
create or replace function public.aplicar_retencion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications_log where created_at < now() - interval '12 months';
  delete from public.whatsapp_inbound where created_at < now() - interval '12 months';
  delete from public.clara_conversaciones where created_at < now() - interval '12 months';
  delete from public.chat_messages where created_at < now() - interval '12 months';
  delete from public.solicitudes_rechazadas where created_at < now() - interval '12 months';
  delete from public.onboarding_borradores where updated_at < now() - interval '6 months';
  delete from public.asistente_mensajes where created_at < now() - interval '24 months';
  delete from public.asistente_uso where created_at < now() - interval '24 months';
  -- Lo que se le mandó al modelo y su respuesta cruda: se vacía a los 24 meses.
  update public.ia_personalizaciones set entrada = '{}'::jsonb, salida_raw = null
    where created_at < now() - interval '24 months' and (entrada <> '{}'::jsonb or salida_raw is not null);
end;
$$;
revoke execute on function public.aplicar_retencion() from public, anon, authenticated;

select cron.schedule('aplicar-retencion', '30 9 * * *', $$select public.aplicar_retencion();$$);
