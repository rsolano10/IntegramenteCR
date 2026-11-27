-- Derechos de la Ley 8968 sin trabajo manual del equipo.
--
--   - Acceso: el informe legible de «Mis datos y permisos» (exportar_mis_datos)
--     ahora incluye las notas del equipo (sin semáforos ni perfiles clínicos)
--     y deja constancia como una solicitud de acceso resuelta automáticamente
--     (como máximo una por día).
--   - Rectificación y oposición: se hacen en la app (Mi cuenta, Perfil de …,
--     permisos); ya no se piden.
--   - Eliminación: la persona la programa; se ejecuta sola a los 7 días
--     (pg_cron → función derechos-datos), salvo que la cancele antes. Se borra
--     lo no clínico, se retiran los permisos opcionales y se cierra la cuenta.
--     El expediente de salud se conserva el plazo legal (aplicar_retencion).

alter table public.solicitudes_datos
  add column if not exists automatica boolean not null default false,
  add column if not exists ejecutar_el timestamptz;

alter table public.solicitudes_datos drop constraint if exists solicitudes_datos_estado_check;
alter table public.solicitudes_datos
  add constraint solicitudes_datos_estado_check check (estado in ('pendiente', 'resuelta', 'rechazada', 'cancelada'));

create index if not exists solicitudes_datos_ejecutar on public.solicitudes_datos (ejecutar_el) where estado = 'pendiente' and ejecutar_el is not null;

-- 1. Acceso: el informe, con las notas del equipo -------------------------
create or replace function public.exportar_mis_datos()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pacientes uuid[];
  v_nombre text;
  v_patient uuid;
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  select coalesce(array_agg(patient_id), '{}') into v_pacientes
    from public.patient_links where profile_id = v_uid and relation in ('familiar_admin', 'participante');

  -- Constancia del acceso (una por día como máximo).
  if not exists (
    select 1 from public.solicitudes_datos
    where profile_id = v_uid and tipo = 'acceso' and automatica and created_at > now() - interval '1 day'
  ) then
    select nombre into v_nombre from public.profiles where id = v_uid;
    v_patient := v_pacientes[1];
    insert into public.solicitudes_datos (profile_id, patient_id, nombre, tipo, detalle, estado, respuesta, vence_el, automatica, resuelta_at)
    values (v_uid, v_patient, v_nombre, 'acceso', 'Informe de mis datos', 'resuelta', 'Entregado al instante en Mis datos y permisos.',
            (now() at time zone 'America/Costa_Rica')::date, true, now());
  end if;

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
        'notas_del_equipo', coalesce((select jsonb_agg(jsonb_build_object('texto', n.texto, 'fecha', n.created_at, 'autor', pr.nombre) order by n.created_at)
                    from public.notas_clinicas n left join public.profiles pr on pr.id = n.autor_id where n.patient_id = pa.id), '[]'),
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

-- 2. Eliminación programada ------------------------------------------------
create or replace function public.programar_eliminacion()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cuando timestamptz;
  v_nombre text;
  v_patient uuid;
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  if (select role from public.profiles where id = v_uid) not in ('familiar', 'paciente') then
    raise exception 'Las cuentas del equipo se cierran desde Administración.';
  end if;
  select ejecutar_el into v_cuando from public.solicitudes_datos
    where profile_id = v_uid and tipo = 'eliminacion' and estado = 'pendiente' and automatica;
  if v_cuando is not null then return v_cuando; end if;

  v_cuando := now() + interval '7 days';
  select nombre into v_nombre from public.profiles where id = v_uid;
  select pl.patient_id into v_patient from public.patient_links pl where pl.profile_id = v_uid order by pl.created_at limit 1;
  insert into public.solicitudes_datos (profile_id, patient_id, nombre, tipo, detalle, vence_el, automatica, ejecutar_el)
  values (v_uid, v_patient, v_nombre, 'eliminacion', 'Eliminar mis datos y cerrar la cuenta', (v_cuando at time zone 'America/Costa_Rica')::date, true, v_cuando);
  return v_cuando;
end;
$$;
revoke execute on function public.programar_eliminacion() from public, anon;
grant execute on function public.programar_eliminacion() to authenticated;

create or replace function public.cancelar_eliminacion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sin sesión.'; end if;
  update public.solicitudes_datos
    set estado = 'cancelada', respuesta = 'La cancelaste antes de la fecha. No se borró nada.', resuelta_at = now(), resuelta_por = v_uid
    where profile_id = v_uid and tipo = 'eliminacion' and estado = 'pendiente' and automatica;
  if not found then raise exception 'No hay una eliminación programada.'; end if;
end;
$$;
revoke execute on function public.cancelar_eliminacion() from public, anon;
grant execute on function public.cancelar_eliminacion() to authenticated;

-- La ejecuta la función derechos-datos (service role) cuando llega la fecha.
-- Devuelve la cuenta para que la función la bloquee en Auth.
create or replace function public.ejecutar_eliminacion(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare s public.solicitudes_datos;
begin
  select * into s from public.solicitudes_datos where id = p_id for update;
  if s.id is null or s.estado <> 'pendiente' or s.tipo <> 'eliminacion' or s.ejecutar_el > now() then return null; end if;

  delete from public.asistente_mensajes where profile_id = s.profile_id;
  delete from public.asistente_memoria where profile_id = s.profile_id;
  delete from public.asistente_uso where profile_id = s.profile_id;
  delete from public.agent_memory where user_id = s.profile_id;
  delete from public.clara_conversaciones where user_id = s.profile_id;
  delete from public.notifications_log where profile_id = s.profile_id;
  delete from public.onboarding_borradores where profile_id = s.profile_id;
  update public.profiles set whatsapp_phone = null, whatsapp_notifications_enabled = false, is_active = false where id = s.profile_id;
  insert into public.consentimientos (profile_id, patient_id, tipo, otorgado, version, texto, rol)
  select s.profile_id, s.patient_id, t, false, 'solicitud', 'Revocado al ejecutar la eliminación ' || s.id, 'administracion'
  from unnest(array['ia_clara', 'ia_equipo', 'voz', 'whatsapp']) t;

  update public.solicitudes_datos
    set estado = 'resuelta', resuelta_at = now(),
        respuesta = 'Hecho: borramos tus conversaciones, la memoria de Clara y del asistente, tu teléfono y los avisos, retiramos los permisos opcionales y cerramos la cuenta. El expediente de salud se conserva bloqueado el plazo que exige la ley.'
    where id = p_id;
  insert into public.audit_log (patient_id, entidad, accion, autor_id)
  values (s.patient_id, 'solicitud_datos', 'eliminacion:automatica', s.profile_id);
  return s.profile_id;
end;
$$;
revoke execute on function public.ejecutar_eliminacion(uuid) from public, anon, authenticated;

-- 3. Cada hora, la función ejecuta las eliminaciones vencidas --------------
select cron.unschedule('derechos-datos-tick') where exists (select 1 from cron.job where jobname = 'derechos-datos-tick');
select cron.schedule(
  'derechos-datos-tick',
  '17 * * * *',
  $$
  select net.http_post(
    url := 'https://vamjqcmklwrkjcgzwsnm.supabase.co/functions/v1/derechos-datos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'whatsapp_cron_secret')
    ),
    body := '{"accion":"tick"}'::jsonb
  );
  $$
);
