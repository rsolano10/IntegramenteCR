-- Avisos de riesgo reales.
-- "Avisar a tu profesional" (pantallas de alerta: caída, cambio agudo,
-- extravío, ideación, maltrato) y la preferencia "avisar automáticamente"
-- solo cambiaban un valor en el navegador — nadie recibía nada. Ahora cada
-- aviso queda registrado, aparece destacado en el panel de la clínica y en
-- el chat del paciente, y dispara un correo al equipo clínico
-- (admin-accounts → notify_risk_alert).

create table public.alertas_riesgo (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  tipo text not null check (tipo in ('ideacion', 'maltrato', 'caida', 'cambio', 'extravio')),
  automatica boolean not null default false,
  creado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  vista_at timestamptz,
  atendida_at timestamptz,
  atendida_por uuid references public.profiles (id) on delete set null
);

create index alertas_riesgo_abiertas_idx on public.alertas_riesgo (created_at desc) where atendida_at is null;
create index alertas_riesgo_patient_idx on public.alertas_riesgo (patient_id, created_at desc);

alter table public.alertas_riesgo enable row level security;

create policy "alertas_riesgo: profesional read" on public.alertas_riesgo
  for select using (public.is_profesional());

create policy "alertas_riesgo: familia read propias" on public.alertas_riesgo
  for select using (public.has_patient_link(patient_id, array['familiar_admin', 'participante']::public.patient_relation[]));

-- Preferencia "avisar automáticamente" — antes en localStorage (se perdía
-- al cambiar de teléfono). Default true: es lo que la app ya prometía.
alter table public.profiles add column avisar_riesgo_auto boolean not null default true;
grant update (avisar_riesgo_auto) on public.profiles to authenticated;

-- Envía (o reutiliza) un aviso. Mismo tipo y paciente, todavía sin
-- atender y de los últimos 30 min → se devuelve el existente en vez de
-- duplicar (tocar el botón dos veces, recargar la pantalla, aviso
-- automático + manual). `nueva` le dice al cliente si hay que mandar el
-- correo.
create or replace function public.enviar_alerta_riesgo(p_tipo text, p_automatica boolean default false)
returns table (id uuid, created_at timestamptz, vista_at timestamptz, nueva boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_patient_id uuid;
  v_existente public.alertas_riesgo;
  v_nueva public.alertas_riesgo;
  v_etiqueta text;
begin
  select pl.patient_id into v_patient_id
  from public.patient_links pl
  where pl.profile_id = auth.uid() and pl.relation in ('familiar_admin', 'participante')
  limit 1;
  if v_patient_id is null then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  select * into v_existente
  from public.alertas_riesgo a
  where a.patient_id = v_patient_id and a.tipo = p_tipo and a.atendida_at is null and a.created_at > now() - interval '30 minutes'
  order by a.created_at desc
  limit 1;

  if v_existente.id is not null then
    return query select v_existente.id, v_existente.created_at, v_existente.vista_at, false;
    return;
  end if;

  insert into public.alertas_riesgo (patient_id, tipo, automatica, creado_por)
  values (v_patient_id, p_tipo, coalesce(p_automatica, false), auth.uid())
  returning * into v_nueva;

  v_etiqueta := case p_tipo
    when 'ideacion' then 'posible riesgo de autolesión'
    when 'maltrato' then 'sospecha de maltrato o abandono'
    when 'caida' then 'caída'
    when 'cambio' then 'cambio repentino de salud'
    when 'extravio' then 'riesgo de extravío'
  end;

  -- También en la conversación, para que quede en el historial que ven
  -- ambas partes.
  insert into public.mensajes (patient_id, texto, autor_id)
  values (v_patient_id, '⚠ Aviso de riesgo enviado desde la app: ' || v_etiqueta || '.', auth.uid());

  return query select v_nueva.id, v_nueva.created_at, v_nueva.vista_at, true;
end;
$$;

grant execute on function public.enviar_alerta_riesgo(text, boolean) to authenticated;

create or replace function public.list_alertas_abiertas()
returns table (id uuid, patient_id uuid, patient_nombre text, tipo text, automatica boolean, created_at timestamptz, vista_at timestamptz, creado_por_nombre text)
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;
  return query
  select a.id, a.patient_id, pt.nombre, a.tipo, a.automatica, a.created_at, a.vista_at, pr.nombre
  from public.alertas_riesgo a
  join public.patients pt on pt.id = a.patient_id
  left join public.profiles pr on pr.id = a.creado_por
  where a.atendida_at is null
  order by a.created_at desc;
end;
$$;

grant execute on function public.list_alertas_abiertas() to authenticated;

-- La clínica abrió el aviso (la familia ve "tu profesional ya lo vio").
create or replace function public.marcar_alerta_vista(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.alertas_riesgo set vista_at = coalesce(vista_at, now()) where id = p_id;
end;
$$;

grant execute on function public.marcar_alerta_vista(uuid) to authenticated;

create or replace function public.atender_alerta(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.alertas_riesgo
  set atendida_at = now(), atendida_por = auth.uid(), vista_at = coalesce(vista_at, now())
  where id = p_id;
end;
$$;

grant execute on function public.atender_alerta(uuid) to authenticated;

-- Bug relacionado: "Mensajes sin responder" del panel filtraba por vínculo
-- profesional_asignado, que los pacientes autoregistrados nunca tienen —
-- sus mensajes jamás aparecían como pendientes. El rol profesional es el
-- administrador de la clínica y ve todos.
create or replace function public.list_pending_threads()
returns table (
  patient_id uuid,
  patient_nombre text,
  last_message text,
  last_author_nombre text,
  last_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede ver esta información.' using errcode = '42501';
  end if;

  return query
  select pt.id, pt.nombre, m.texto, pr.nombre, m.created_at
  from public.patients pt
  join lateral (
    select mm.texto, mm.autor_id, mm.created_at
    from public.mensajes mm
    where mm.patient_id = pt.id
    order by mm.created_at desc
    limit 1
  ) m on true
  left join public.profiles pr on pr.id = m.autor_id
  where pr.role is distinct from 'profesional'
  order by m.created_at asc;
end;
$$;

-- Marca de "correo al equipo ya enviado" — la escribe solo admin-accounts
-- (service role), así un mismo aviso nunca dispara dos correos.
alter table public.alertas_riesgo add column correo_enviado_at timestamptz;
