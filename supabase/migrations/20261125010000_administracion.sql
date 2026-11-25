-- Rol de administración (negocio). El administrador es un profesional con
-- profiles.es_admin = true: ve todo lo de la clínica y además la sección
-- Administración (Resumen, Cobros, Equipo, Configuración, Cumplimiento).
--
-- 1. pagos: cada pago (SINPE Móvil o transferencia) cubre un período. Antes
--    una cuenta quedaba «pagada» para siempre (patients.pagada_desde); ahora
--    patients.pagado_hasta dice hasta cuándo está al día.
-- 2. registrar_pago / anular_pago: el registro y su efecto en la cuenta.
-- 3. equipo_resumen: carga de cada profesional (para administración).
-- 4. cobertura_permisos: cuántas cuentas aceptaron la versión legal vigente
--    y cuántas dieron cada permiso.

alter table public.patients add column if not exists pagado_hasta date;

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  monto integer not null check (monto >= 0),
  medio text not null check (medio in ('sinpe', 'transferencia', 'otro')),
  referencia text,
  fecha_pago date not null,
  cubre_desde date not null,
  cubre_hasta date not null,
  nota text,
  registrado_por uuid,
  created_at timestamptz not null default now()
);
create index if not exists pagos_paciente on public.pagos (patient_id, cubre_hasta desc);
create index if not exists pagos_fecha on public.pagos (fecha_pago desc);
alter table public.pagos enable row level security;
drop policy if exists pagos_select on public.pagos;
create policy pagos_select on public.pagos for select to authenticated using (public.is_profesional());
revoke insert, update, delete on public.pagos from anon, authenticated;

-- Registrar un pago: cubre desde el día siguiente al último período pagado
-- (o desde la fecha del pago, si ya venció o es el primero) por p_meses.
create or replace function public.registrar_pago(
  p_patient_id uuid,
  p_monto integer,
  p_medio text,
  p_referencia text default null,
  p_fecha date default null,
  p_meses integer default 1,
  p_nota text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fecha date := coalesce(p_fecha, (now() at time zone 'America/Costa_Rica')::date);
  v_hasta_actual date;
  v_desde date;
  v_hasta date;
  v_id uuid;
begin
  if not public.is_profesional() then raise exception 'No autorizado.' using errcode = '42501'; end if;
  if p_medio not in ('sinpe', 'transferencia', 'otro') then raise exception 'Medio de pago inválido.'; end if;
  if coalesce(p_meses, 0) < 1 or p_meses > 12 then raise exception 'Meses fuera de rango.'; end if;
  if coalesce(p_monto, -1) < 0 then raise exception 'Monto inválido.'; end if;

  select pagado_hasta into v_hasta_actual from public.patients where id = p_patient_id for update;
  v_desde := greatest(v_fecha, coalesce(v_hasta_actual + 1, v_fecha));
  v_hasta := (v_desde + make_interval(months => p_meses))::date - 1;

  insert into public.pagos (patient_id, monto, medio, referencia, fecha_pago, cubre_desde, cubre_hasta, nota, registrado_por)
  values (p_patient_id, p_monto, p_medio, nullif(btrim(coalesce(p_referencia, '')), ''), v_fecha, v_desde, v_hasta, nullif(btrim(coalesce(p_nota, '')), ''), auth.uid())
  returning id into v_id;

  update public.patients set pagado_hasta = v_hasta where id = p_patient_id;
  -- La cuenta pasa a activa (mismo efecto que «Marcar pagada»).
  perform public.marcar_cuenta_pagada(p_patient_id, true, 'Pago ' || p_medio || coalesce(' ' || nullif(btrim(p_referencia), ''), ''));
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (p_patient_id, 'pago', 'registrar:' || v_id, auth.uid());
  return v_id;
end;
$$;
revoke execute on function public.registrar_pago(uuid, integer, text, text, date, integer, text) from public, anon;
grant execute on function public.registrar_pago(uuid, integer, text, text, date, integer, text) to authenticated;

-- Anular un pago mal registrado (solo administración): recalcula hasta cuándo
-- está al día la familia.
create or replace function public.anular_pago(p_pago_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient uuid;
begin
  if not public.es_admin() then raise exception 'Solo la administración.' using errcode = '42501'; end if;
  delete from public.pagos where id = p_pago_id returning patient_id into v_patient;
  if v_patient is null then raise exception 'Pago inexistente.'; end if;
  update public.patients set pagado_hasta = (select max(cubre_hasta) from public.pagos where patient_id = v_patient) where id = v_patient;
  insert into public.audit_log (patient_id, entidad, accion, autor_id) values (v_patient, 'pago', 'anular:' || p_pago_id, auth.uid());
end;
$$;
revoke execute on function public.anular_pago(uuid) from public, anon;
grant execute on function public.anular_pago(uuid) to authenticated;

-- Hasta cuándo está pagada cada familia (para Cobros).
create or replace function public.estado_cobros()
returns table (patient_id uuid, pagado_hasta date, ultimo_pago date, ultimo_monto integer, ultimo_medio text)
language sql
stable
security definer
set search_path = public
as $$
  select pt.id, pt.pagado_hasta, ult.fecha_pago, ult.monto, ult.medio
  from public.patients pt
  left join lateral (select p.fecha_pago, p.monto, p.medio from public.pagos p where p.patient_id = pt.id order by p.fecha_pago desc, p.created_at desc limit 1) ult on true
  where public.is_profesional();
$$;
revoke execute on function public.estado_cobros() from public, anon;
grant execute on function public.estado_cobros() to authenticated;

-- Equipo: cada profesional con su carga.
create or replace function public.equipo_resumen(p_version text)
returns table (
  profile_id uuid,
  nombre text,
  especialidad text,
  es_admin boolean,
  activo boolean,
  familias integer,
  sin_semana integer,
  confidencialidad_vigente boolean,
  ultimo_acceso timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pr.id,
    pr.nombre,
    pr.especialidad,
    coalesce(pr.es_admin, false),
    pr.is_active,
    (select count(*)::int from public.patient_links pl where pl.profile_id = pr.id and pl.relation = 'profesional_asignado'),
    0,
    exists (
      select 1 from (
        select distinct on (c.tipo) c.otorgado, c.version from public.consentimientos c
        where c.profile_id = pr.id and c.tipo = 'confidencialidad' order by c.tipo, c.created_at desc
      ) x where x.otorgado and x.version = p_version
    ),
    (select u.last_sign_in_at from auth.users u where u.id = pr.id)
  from public.profiles pr
  where pr.role = 'profesional' and public.es_admin()
  order by pr.is_active desc, pr.nombre;
$$;
revoke execute on function public.equipo_resumen(text) from public, anon;
grant execute on function public.equipo_resumen(text) to authenticated;

-- Cobertura de permisos: sobre las cuentas de familia y participantes.
create or replace function public.cobertura_permisos(p_version text)
returns table (tipo text, otorgados integer, total integer)
language sql
stable
security definer
set search_path = public
as $$
  with cuentas as (
    select id from public.profiles where role in ('familiar', 'paciente') and is_active
  ),
  ultimos as (
    select distinct on (c.profile_id, c.tipo) c.profile_id, c.tipo, c.otorgado, c.version
    from public.consentimientos c join cuentas on cuentas.id = c.profile_id
    order by c.profile_id, c.tipo, c.created_at desc
  ),
  total as (select count(*)::int n from cuentas)
  select t.tipo,
    (select count(*)::int from ultimos u where u.tipo = t.tipo and u.otorgado and (t.tipo <> 'terminos' or u.version = p_version)),
    (select n from total)
  from (values ('terminos'), ('ia_clara'), ('ia_equipo'), ('voz'), ('whatsapp')) as t(tipo)
  where public.es_admin();
$$;
revoke execute on function public.cobertura_permisos(text) from public, anon;
grant execute on function public.cobertura_permisos(text) to authenticated;
