-- Asistente IntegraMente conversacional (2026-10-13).
--   · El historial vive en el servidor (antes en el navegador): el
--     asistente recuerda conversaciones de días anteriores y el contexto no
--     depende de lo que mande el cliente.
--   · asistente_memoria: un resumen corto por cuenta con lo importante de
--     conversaciones viejas (qué probaron, qué funcionó), que se actualiza
--     solo cuando el historial crece.
--   · Mensajes "marcados" (derivados al equipo, emergencias, respuestas que
--     el filtro de seguridad reemplazó o que la familia calificó con 👎):
--     el equipo clínico los puede leer, con el resto de la conversación de
--     ese día como contexto. La familia lo sabe (aviso en el chat y en
--     Privacidad) y puede borrar su historial.
-- Escrituras de mensajes: solo la edge function asistente-ia (service role).

create table public.asistente_mensajes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete cascade,
  rol text not null check (rol in ('usuario', 'asistente')),
  texto text not null,
  categoria text,
  senales jsonb not null default '{}'::jsonb,
  sugerencias jsonb,
  whatsapp text,
  feedback smallint check (feedback in (-1, 1)),
  marcado boolean not null default false,
  motivo_marca text,
  revisado_at timestamptz,
  revisado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index asistente_mensajes_profile_idx on public.asistente_mensajes (profile_id, created_at desc);
create index asistente_mensajes_marcados_idx on public.asistente_mensajes (patient_id, created_at desc) where marcado;

alter table public.asistente_mensajes enable row level security;

create policy "asistente_mensajes: propios" on public.asistente_mensajes
  for select using (profile_id = auth.uid());

create table public.asistente_memoria (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete cascade,
  resumen text not null default '',
  resumido_hasta timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.asistente_memoria enable row level security;

create policy "asistente_memoria: propia" on public.asistente_memoria
  for select using (profile_id = auth.uid());

-- 👍 / 👎 sobre una respuesta propia. Un 👎 la marca para revisión.
create or replace function public.asistente_feedback(p_mensaje_id uuid, p_valor smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_valor is not null and p_valor not in (-1, 1) then
    raise exception 'Valor inválido.' using errcode = '22023';
  end if;
  update public.asistente_mensajes m
  set feedback = p_valor,
      marcado = m.marcado or p_valor = -1,
      motivo_marca = case when not m.marcado and p_valor = -1 then 'no_sirvio' else m.motivo_marca end
  where m.id = p_mensaje_id and m.profile_id = auth.uid() and m.rol = 'asistente';
end;
$$;

grant execute on function public.asistente_feedback(uuid, smallint) to authenticated;

create or replace function public.asistente_borrar_historial()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.asistente_mensajes where profile_id = auth.uid();
  delete from public.asistente_memoria where profile_id = auth.uid();
end;
$$;

grant execute on function public.asistente_borrar_historial() to authenticated;

-- Para la clínica: las conversaciones (agrupadas por día, hora de Costa
-- Rica) de un paciente que tienen al menos un mensaje marcado, completas
-- para que se entienda el contexto. Últimos 90 días.
create or replace function public.asistente_revision(p_patient_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  dia date,
  rol text,
  texto text,
  categoria text,
  marcado boolean,
  motivo_marca text,
  feedback smallint,
  revisado_at timestamptz,
  autor_nombre text
)
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
  with dias as (
    select distinct m.profile_id, (m.created_at at time zone 'America/Costa_Rica')::date as dia
    from public.asistente_mensajes m
    where m.patient_id = p_patient_id and m.marcado and m.created_at > now() - interval '90 days'
  )
  select m.id, m.created_at, d.dia, m.rol, m.texto, m.categoria, m.marcado, m.motivo_marca, m.feedback, m.revisado_at, pr.nombre
  from public.asistente_mensajes m
  join dias d on d.profile_id = m.profile_id and d.dia = (m.created_at at time zone 'America/Costa_Rica')::date
  left join public.profiles pr on pr.id = m.profile_id
  where m.patient_id = p_patient_id
  order by m.created_at;
end;
$$;

grant execute on function public.asistente_revision(uuid) to authenticated;

create or replace function public.asistente_marcar_revisadas(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede hacer esto.' using errcode = '42501';
  end if;
  update public.asistente_mensajes
  set revisado_at = now(), revisado_por = auth.uid()
  where patient_id = p_patient_id and marcado and revisado_at is null;
end;
$$;

grant execute on function public.asistente_marcar_revisadas(uuid) to authenticated;

-- Panel de la clínica: pacientes con conversaciones marcadas sin revisar.
create or replace function public.asistente_pendientes_revision()
returns table (patient_id uuid, patient_nombre text, pendientes bigint, ultimo_at timestamptz, motivos text[])
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
  select m.patient_id, pt.nombre, count(*), max(m.created_at), array_agg(distinct m.motivo_marca)
  from public.asistente_mensajes m
  join public.patients pt on pt.id = m.patient_id
  where m.marcado and m.revisado_at is null
  group by m.patient_id, pt.nombre
  order by max(m.created_at) desc;
end;
$$;

grant execute on function public.asistente_pendientes_revision() to authenticated;
