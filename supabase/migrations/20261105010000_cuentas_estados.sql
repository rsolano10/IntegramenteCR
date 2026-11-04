-- Fases 3 y 4: estados de cuenta, semana gratis, aprobación, pagos manuales,
-- recursos de bienvenida, plantillas de semana y registro de la IA.
--
-- ═══ Máquina de estados de cuenta (Fase 4.1) ═══════════════════════════
-- El estado vive en profiles.estado_cuenta (uno por cuenta, no por
-- paciente: una cuenta sin paciente también tiene estado). No se escribe a
-- mano: se DERIVA de hechos guardados (correo confirmado, paciente creado,
-- aprobación, demo, pago, rechazo, última actividad) con
-- estado_cuenta_calculado(), y sincronizar_estado_cuenta() guarda el
-- cambio y lo registra en cuenta_estado_historial con fecha, motivo y
-- responsable (null = el sistema).
--
--   registrado              correo sin confirmar
--   cuestionario_pendiente  correo confirmado, sin paciente (cuestionario incompleto)
--   pendiente_aprobacion    paciente creado, la clínica no lo aprobó ni rechazó
--                           (patients.requiere_contacto marca "requiere contacto")
--   en_demo                 aprobado, dentro de la semana gratis, sin pago
--   demo_finalizada         terminó la semana gratis sin pago (seguimiento manual)
--   activa                  la clínica la marcó como pagada
--   inactiva                en_demo o activa, sin actividad en X días
--                           (config_clinica.dias_inactividad, 30 por decisión del producto)
--   rechazada               la clínica determinó que no es una cuenta válida
--
-- Transiciones automáticas: confirmar correo, terminar el cuestionario
-- (trigger en patient_links), vencer la demo e inactividad (cron cada
-- hora). Manuales (clínica, RPCs de abajo): aprobar, rechazar, requiere
-- contacto, marcar pagada / quitar pago.
--
-- Semana gratis (Fase 3.2): empieza cuando la clínica APRUEBA la cuenta
-- (aprobar_cuenta fija demo_inicio/demo_fin), no al terminar el
-- cuestionario, para no perder días esperando la revisión manual.

create type public.estado_cuenta as enum (
  'registrado', 'cuestionario_pendiente', 'pendiente_aprobacion', 'en_demo', 'demo_finalizada', 'activa', 'inactiva', 'rechazada'
);

-- ─── Configuración de la clínica (una sola fila) ───────────────────────
create table public.config_clinica (
  id smallint primary key default 1 check (id = 1),
  dias_demo int not null default 7 check (dias_demo between 1 and 60),
  dias_inactividad int not null default 30 check (dias_inactividad between 1 and 365),
  max_cambios_ia_pct int not null default 30 check (max_cambios_ia_pct between 0 and 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);
insert into public.config_clinica (id) values (1);
alter table public.config_clinica enable row level security;
create policy "config_clinica: profesional read" on public.config_clinica for select using (public.is_profesional());
create policy "config_clinica: profesional update" on public.config_clinica for update using (public.is_profesional()) with check (public.is_profesional());

-- ─── Hechos ─────────────────────────────────────────────────────────────
alter table public.patients
  add column aprobada_en timestamptz,
  add column aprobada_por uuid references public.profiles (id),
  add column rechazada_en timestamptz,
  add column rechazo_motivo text,
  add column requiere_contacto boolean not null default false,
  add column requiere_contacto_nota text,
  add column demo_inicio timestamptz,
  add column demo_fin timestamptz,
  add column pagada_desde timestamptz,
  add column pago_nota text;

alter table public.profiles
  add column estado_cuenta public.estado_cuenta,
  add column estado_desde timestamptz;

-- Última actividad: cada registro de una tarea.
alter table public.plan_tasks add column registrado_en timestamptz;
create or replace function public.marcar_registro_tarea()
returns trigger
language plpgsql
as $$
begin
  if new.estado is distinct from old.estado and new.estado::text not in ('pendiente', 'futuro') then
    new.registrado_en := now();
  end if;
  return new;
end;
$$;
create trigger plan_tasks_registrado_en before update of estado on public.plan_tasks
  for each row execute function public.marcar_registro_tarea();

create table public.cuenta_estado_historial (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  de public.estado_cuenta,
  a public.estado_cuenta not null,
  motivo text,
  responsable_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index cuenta_estado_historial_profile_idx on public.cuenta_estado_historial (profile_id, created_at desc);
alter table public.cuenta_estado_historial enable row level security;
create policy "cuenta_estado_historial: profesional read" on public.cuenta_estado_historial for select using (public.is_profesional());

-- ─── Cálculo ────────────────────────────────────────────────────────────
create or replace function public.paciente_de_cuenta(p_profile_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select patient_id from public.patient_links
  where profile_id = p_profile_id and relation in ('familiar_admin', 'participante')
  order by created_at limit 1;
$$;

create or replace function public.ultima_actividad_paciente(p_patient_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public, auth
as $$
  select greatest(
    (select max(u.last_sign_in_at) from public.patient_links pl join auth.users u on u.id = pl.profile_id
       where pl.patient_id = p_patient_id and pl.relation in ('familiar_admin', 'participante')),
    (select max(t.registrado_en) from public.plan_tasks t join public.plans p on p.id = t.plan_id where p.patient_id = p_patient_id),
    (select max(p.family_reviewed_at) from public.plans p where p.patient_id = p_patient_id),
    (select aprobada_en from public.patients where id = p_patient_id)
  );
$$;

create or replace function public.estado_cuenta_calculado(p_profile_id uuid)
returns public.estado_cuenta
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_confirmado boolean;
  v_role public.app_role;
  v_pid uuid;
  p public.patients;
  v_base public.estado_cuenta;
  v_dias int;
begin
  select role into v_role from public.profiles where id = p_profile_id;
  if v_role is null or v_role = 'profesional' then return null; end if;
  select email_confirmed_at is not null into v_confirmado from auth.users where id = p_profile_id;
  if not coalesce(v_confirmado, false) then return 'registrado'; end if;

  v_pid := public.paciente_de_cuenta(p_profile_id);
  if v_pid is null then return 'cuestionario_pendiente'; end if;
  select * into p from public.patients where id = v_pid;

  if p.rechazada_en is not null then return 'rechazada'; end if;
  if p.aprobada_en is null then return 'pendiente_aprobacion'; end if;

  if p.pagada_desde is not null then v_base := 'activa';
  elsif p.demo_fin is not null and now() < p.demo_fin then v_base := 'en_demo';
  else return 'demo_finalizada';
  end if;

  select dias_inactividad into v_dias from public.config_clinica where id = 1;
  if coalesce(public.ultima_actividad_paciente(v_pid), p.aprobada_en) < now() - make_interval(days => coalesce(v_dias, 30)) then
    return 'inactiva';
  end if;
  return v_base;
end;
$$;

create or replace function public.sincronizar_estado_cuenta(p_profile_id uuid, p_motivo text default null, p_responsable uuid default null)
returns public.estado_cuenta
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual public.estado_cuenta;
  v_nuevo public.estado_cuenta;
begin
  select estado_cuenta into v_actual from public.profiles where id = p_profile_id;
  v_nuevo := public.estado_cuenta_calculado(p_profile_id);
  if v_nuevo is null or v_nuevo is not distinct from v_actual then return v_actual; end if;
  update public.profiles set estado_cuenta = v_nuevo, estado_desde = now() where id = p_profile_id;
  insert into public.cuenta_estado_historial (profile_id, patient_id, de, a, motivo, responsable_id)
  values (p_profile_id, public.paciente_de_cuenta(p_profile_id), v_actual, v_nuevo, p_motivo, p_responsable);
  return v_nuevo;
end;
$$;

create or replace function public.sincronizar_estados_paciente(p_patient_id uuid, p_motivo text default null, p_responsable uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  for r in select profile_id from public.patient_links where patient_id = p_patient_id and relation in ('familiar_admin', 'participante') loop
    perform public.sincronizar_estado_cuenta(r.profile_id, p_motivo, p_responsable);
  end loop;
end;
$$;

-- Cron: vencimiento de demo e inactividad (y cualquier desfase).
create or replace function public.sincronizar_todos_los_estados()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r record; n int := 0; v_antes public.estado_cuenta; v_despues public.estado_cuenta;
begin
  for r in select id, estado_cuenta from public.profiles where role <> 'profesional' loop
    v_antes := r.estado_cuenta;
    v_despues := public.sincronizar_estado_cuenta(r.id, 'Actualización automática');
    if v_despues is distinct from v_antes then n := n + 1; end if;
  end loop;
  return n;
end;
$$;
revoke execute on function public.sincronizar_todos_los_estados() from public, anon, authenticated;

-- Triggers de las transiciones automáticas.
create or replace function public.trg_estado_por_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.sincronizar_estado_cuenta(new.id, 'Cuenta creada');
  return new;
end;
$$;
create trigger profiles_estado_inicial after insert on public.profiles
  for each row execute function public.trg_estado_por_perfil();

create or replace function public.trg_estado_por_confirmacion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.sincronizar_estado_cuenta(new.id, 'Correo confirmado');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_confirmado after update of email_confirmed_at on auth.users
  for each row execute function public.trg_estado_por_confirmacion();

create or replace function public.trg_estado_por_vinculo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.relation in ('familiar_admin', 'participante') then
    perform public.sincronizar_estado_cuenta(new.profile_id, 'Cuestionario completo');
  end if;
  return new;
end;
$$;
create trigger patient_links_estado after insert on public.patient_links
  for each row execute function public.trg_estado_por_vinculo();

-- ─── Acciones de la clínica ─────────────────────────────────────────────
create or replace function public.aprobar_cuenta(p_patient_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_dias int;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  select dias_demo into v_dias from public.config_clinica where id = 1;
  update public.patients
  set aprobada_en = now(), aprobada_por = auth.uid(), rechazada_en = null, rechazo_motivo = null,
      requiere_contacto = false, requiere_contacto_nota = null,
      demo_inicio = coalesce(demo_inicio, now()), demo_fin = coalesce(demo_fin, now() + make_interval(days => coalesce(v_dias, 7)))
  where id = p_patient_id and aprobada_en is null;
  if not found then raise exception 'La cuenta ya estaba aprobada o no existe.' using errcode = '22023'; end if;
  perform public.sincronizar_estados_paciente(p_patient_id, 'Aprobada por la clínica', auth.uid());
end;
$$;

create or replace function public.rechazar_cuenta(p_patient_id uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare v_motivo text := nullif(btrim(coalesce(p_motivo, '')), ''); r record; v_nombre text;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if v_motivo is null then raise exception 'Escribí el motivo del rechazo.' using errcode = '22023'; end if;
  update public.patients set rechazada_en = now(), rechazo_motivo = v_motivo, requiere_contacto = false
  where id = p_patient_id returning nombre into v_nombre;
  if v_nombre is null then raise exception 'Paciente no encontrado.' using errcode = '22023'; end if;
  perform public.sincronizar_estados_paciente(p_patient_id, 'Rechazada: ' || v_motivo, auth.uid());
end;
$$;

create or replace function public.marcar_requiere_contacto(p_patient_id uuid, p_valor boolean, p_nota text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  update public.patients set requiere_contacto = p_valor, requiere_contacto_nota = case when p_valor then nullif(btrim(coalesce(p_nota, '')), '') else null end
  where id = p_patient_id;
  -- No cambia el estado (sigue pendiente_aprobacion), pero se registra.
  for r in select pl.profile_id, pr.estado_cuenta from public.patient_links pl join public.profiles pr on pr.id = pl.profile_id
           where pl.patient_id = p_patient_id and pl.relation in ('familiar_admin', 'participante') loop
    insert into public.cuenta_estado_historial (profile_id, patient_id, de, a, motivo, responsable_id)
    values (r.profile_id, p_patient_id, r.estado_cuenta, coalesce(r.estado_cuenta, 'pendiente_aprobacion'),
            case when p_valor then 'Requiere contacto' || coalesce(': ' || nullif(btrim(p_nota), ''), '') else 'Contacto resuelto' end, auth.uid());
  end loop;
end;
$$;

create or replace function public.marcar_cuenta_pagada(p_patient_id uuid, p_pagada boolean, p_nota text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  update public.patients
  set pagada_desde = case when p_pagada then coalesce(pagada_desde, now()) else null end,
      pago_nota = nullif(btrim(coalesce(p_nota, '')), ''),
      aprobada_en = case when p_pagada then coalesce(aprobada_en, now()) else aprobada_en end,
      aprobada_por = case when p_pagada then coalesce(aprobada_por, auth.uid()) else aprobada_por end
  where id = p_patient_id;
  perform public.sincronizar_estados_paciente(p_patient_id, case when p_pagada then 'Marcada como pagada' || coalesce(': ' || nullif(btrim(p_nota), ''), '') else 'Pago retirado' end, auth.uid());
end;
$$;

create or replace function public.actualizar_config_clinica(p_dias_demo int, p_dias_inactividad int, p_max_cambios_ia_pct int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  update public.config_clinica set dias_demo = p_dias_demo, dias_inactividad = p_dias_inactividad, max_cambios_ia_pct = p_max_cambios_ia_pct,
    updated_at = now(), updated_by = auth.uid() where id = 1;
  perform public.sincronizar_todos_los_estados();
end;
$$;

grant execute on function public.aprobar_cuenta(uuid), public.rechazar_cuenta(uuid, text), public.marcar_requiere_contacto(uuid, boolean, text),
  public.marcar_cuenta_pagada(uuid, boolean, text), public.actualizar_config_clinica(int, int, int) to authenticated;

-- ─── Panel de seguimiento (Fase 4.2 / 4.3) ──────────────────────────────
create or replace function public.panel_cuentas()
returns table (
  profile_id uuid, nombre text, email text, telefono text, role public.app_role, estado public.estado_cuenta, estado_desde timestamptz,
  registrado_en timestamptz, patient_id uuid, paciente_nombre text, paciente_edad text, modalidad public.modalidad,
  demo_fin timestamptz, ultima_actividad timestamptz, requiere_contacto boolean, requiere_contacto_nota text,
  rechazo_motivo text, pagada_desde timestamptz, posible_duplicado boolean, telefono_duplicado boolean, semana_gratis_solicitada boolean
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  return query
  select pr.id, pr.nombre, u.email::text, pr.whatsapp_phone, pr.role, pr.estado_cuenta, pr.estado_desde,
         u.created_at, pt.id, pt.nombre, pt.edad, pt.modalidad, pt.demo_fin,
         case when pt.id is null then u.last_sign_in_at else public.ultima_actividad_paciente(pt.id) end,
         coalesce(pt.requiere_contacto, false), pt.requiere_contacto_nota, pt.rechazo_motivo, pt.pagada_desde,
         pt.posible_duplicado_de is not null,
         pr.whatsapp_phone is not null and exists (select 1 from public.profiles o where o.id <> pr.id and o.whatsapp_phone = pr.whatsapp_phone),
         pt.semana_gratis_solicitada_en is not null
  from public.profiles pr
  join auth.users u on u.id = pr.id
  left join public.patients pt on pt.id = public.paciente_de_cuenta(pr.id)
  where pr.role <> 'profesional' and pr.is_active
  order by u.created_at desc;
end;
$$;
grant execute on function public.panel_cuentas() to authenticated;

-- ─── Recursos de bienvenida (Fase 3.3) ──────────────────────────────────
alter table public.plans add column origen text not null default 'clinica' check (origen in ('clinica', 'bienvenida'));
alter table public.plan_tasks add column es_onboarding boolean not null default false;

create table public.recursos_bienvenida (
  id uuid primary key default gen_random_uuid(),
  media_resource_id uuid not null references public.media_resources (id) on delete cascade,
  dia_offset int not null default 0 check (dia_offset between 0 and 6),
  hora text,
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.recursos_bienvenida enable row level security;
create policy "recursos_bienvenida: profesional all" on public.recursos_bienvenida for all using (public.is_profesional()) with check (public.is_profesional());

-- Regla 4.3: solo las cuentas aprobadas reciben recursos asignados por la
-- clínica. Las tareas de bienvenida (es_onboarding) no dependen de esto.
create or replace function public.exigir_cuenta_aprobada()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_aprobada timestamptz;
begin
  if new.es_onboarding then return new; end if;
  select pt.aprobada_en into v_aprobada from public.plans p join public.patients pt on pt.id = p.patient_id where p.id = new.plan_id;
  if v_aprobada is null then
    raise exception 'Primero aprobá la cuenta: solo las cuentas aprobadas pueden recibir recursos de la clínica.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger plan_tasks_exigir_aprobada before insert on public.plan_tasks
  for each row execute function public.exigir_cuenta_aprobada();

-- Los días del plan se guardan por nombre ("Lunes"), en hora de Costa Rica.
create or replace function public.dia_semana_cr(p_fecha timestamptz)
returns text language sql immutable as $$
  select (array['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'])[extract(dow from (p_fecha at time zone 'America/Costa_Rica'))::int + 1];
$$;

create or replace function public.asignar_recursos_bienvenida(p_patient_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_plan uuid;
begin
  if exists (select 1 from public.plans where patient_id = p_patient_id) then return null; end if;
  if not exists (select 1 from public.recursos_bienvenida where activo) then return null; end if;
  insert into public.plans (patient_id, status, created_by, publish_at, origen)
  values (p_patient_id, 'published', null, now(), 'bienvenida') returning id into v_plan;
  insert into public.plan_tasks (plan_id, dia, is_today, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, media_resource_id, sort_order, es_onboarding)
  select v_plan, public.dia_semana_cr(now() + make_interval(days => rb.dia_offset)), rb.dia_offset = 0, rb.hora, mr.titulo, mr.tipo::public.task_tipo,
         'pendiente', mr.duracion, mr.detalle, mr.precaucion, case when mr.pasos is null then null else to_jsonb(mr.pasos) end, mr.por_que,
         mr.id, row_number() over (order by rb.dia_offset, rb.orden), true
  from public.recursos_bienvenida rb join public.media_resources mr on mr.id = rb.media_resource_id
  where rb.activo and mr.activo;
  return v_plan;
end;
$$;

create or replace function public.trg_bienvenida_por_vinculo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.relation in ('familiar_admin', 'participante') then perform public.asignar_recursos_bienvenida(new.patient_id); end if;
  return new;
end;
$$;
create trigger patient_links_bienvenida after insert on public.patient_links
  for each row execute function public.trg_bienvenida_por_vinculo();

-- ─── Plantillas de semana (Fase 4.4) ────────────────────────────────────
create table public.plantillas_semana (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) > 0),
  descripcion text,
  perfil_objetivo text,
  archivada boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.plantilla_tareas (
  id uuid primary key default gen_random_uuid(),
  plantilla_id uuid not null references public.plantillas_semana (id) on delete cascade,
  dia_idx int not null check (dia_idx between 0 and 6), -- 0 = primer día de la semana del plan
  hora text,
  media_resource_id uuid not null references public.media_resources (id) on delete cascade,
  orden int not null default 0
);
create index plantilla_tareas_plantilla_idx on public.plantilla_tareas (plantilla_id);
alter table public.plantillas_semana enable row level security;
alter table public.plantilla_tareas enable row level security;
create policy "plantillas_semana: profesional all" on public.plantillas_semana for all using (public.is_profesional()) with check (public.is_profesional());
create policy "plantilla_tareas: profesional all" on public.plantilla_tareas for all using (public.is_profesional()) with check (public.is_profesional());

create or replace function public.duplicar_plantilla(p_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_nueva uuid;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  insert into public.plantillas_semana (nombre, descripcion, perfil_objetivo, created_by)
  select nombre || ' (copia)', descripcion, perfil_objetivo, auth.uid() from public.plantillas_semana where id = p_id
  returning id into v_nueva;
  if v_nueva is null then raise exception 'Plantilla no encontrada.' using errcode = '22023'; end if;
  insert into public.plantilla_tareas (plantilla_id, dia_idx, hora, media_resource_id, orden)
  select v_nueva, dia_idx, hora, media_resource_id, orden from public.plantilla_tareas where plantilla_id = p_id;
  return v_nueva;
end;
$$;
grant execute on function public.duplicar_plantilla(uuid) to authenticated;

-- ─── Personalización con IA (Fase 4.5) ──────────────────────────────────
-- Cada ejecución queda registrada (entrada, salida cruda, resultado
-- validado, modelo, fecha) para auditoría. La escribe la edge function
-- personalizar-semana con service role.
create table public.ia_personalizaciones (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  plantilla_id uuid references public.plantillas_semana (id) on delete set null,
  modelo text,
  entrada jsonb not null,
  salida_raw text,
  resultado jsonb,
  estado text not null check (estado in ('ok', 'invalida', 'error')),
  error text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.ia_personalizaciones enable row level security;
create policy "ia_personalizaciones: profesional read" on public.ia_personalizaciones for select using (public.is_profesional());

-- Semana en borrador (desde una plantilla, con o sin IA). Nada llega a la
-- familia hasta que la clínica la publica desde el planificador.
create table public.semanas_borrador (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  plantilla_id uuid references public.plantillas_semana (id) on delete set null,
  ia_id uuid references public.ia_personalizaciones (id) on delete set null,
  tareas jsonb not null,
  cambios jsonb,
  aviso text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.semanas_borrador enable row level security;
create policy "semanas_borrador: profesional all" on public.semanas_borrador for all using (public.is_profesional()) with check (public.is_profesional());

-- ─── Vista de la familia ────────────────────────────────────────────────
drop function if exists public.my_patient();
create function public.my_patient()
returns table (
  id uuid, nombre text, edad text, modalidad public.modalidad, plan_status public.plan_status, vista_completa boolean,
  welcome_message_pending boolean, needs_reregistration boolean, programa_elegido boolean,
  estado_cuenta public.estado_cuenta, demo_fin timestamptz, rechazo_motivo text, tiene_plan_visible boolean
)
language plpgsql security definer stable set search_path = public as $$
begin
  return query
  select pt.id, pt.nombre, pt.edad, pt.modalidad, pt.plan_status, pt.vista_completa, pt.welcome_message_pending,
         coalesce(oa.schema_version, 1) < 2, pt.programa_elegido_en is not null,
         pr.estado_cuenta, pt.demo_fin, pt.rechazo_motivo,
         exists (select 1 from public.plans p where p.patient_id = pt.id and p.status = 'published' and p.publish_at <= now())
  from public.patient_links pl
  join public.patients pt on pt.id = pl.patient_id
  join public.profiles pr on pr.id = pl.profile_id
  left join public.onboarding_answers oa on oa.patient_id = pt.id
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
end;
$$;
grant execute on function public.my_patient() to authenticated;

-- ─── Datos existentes ───────────────────────────────────────────────────
-- Pacientes que ya tenían un plan de la clínica: se consideran aprobados
-- desde su primer plan (su semana gratis ya pasó salvo que sea reciente).
update public.patients pt
set aprobada_en = sub.primer, demo_inicio = sub.primer, demo_fin = sub.primer + interval '7 days'
from (select patient_id, min(created_at) primer from public.plans group by patient_id) sub
where sub.patient_id = pt.id and pt.plan_status = 'asignado' and pt.aprobada_en is null;

select public.sincronizar_todos_los_estados();
update public.cuenta_estado_historial set motivo = 'Estado inicial' where motivo = 'Actualización automática';

-- Cada hora: vencimiento de demos e inactividad.
select cron.schedule('sincronizar-estados-cuenta', '7 * * * *', $$select public.sincronizar_todos_los_estados()$$);
