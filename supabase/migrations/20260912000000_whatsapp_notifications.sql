-- Modelo de datos para recordatorios de actividades por WhatsApp (ver plan
-- de la sesión): un teléfono por cuenta, un interruptor general, y una
-- bitácora de envíos para evitar duplicados y contar el tope diario.
alter table public.profiles
  add column whatsapp_phone text,
  add column whatsapp_notifications_enabled boolean not null default true;

-- Alta asistida por la clínica: mismo patrón que `especialidad`, lee el
-- teléfono de los metadatos de invitación/creación.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, nombre, especialidad, whatsapp_phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'familiar'),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'especialidad',
    new.raw_user_meta_data ->> 'whatsapp_phone'
  );
  return new;
end;
$$;

-- Autoregistro: agrega el teléfono como quinto parámetro (con default para
-- no romper la firma existente en llamadas viejas) y lo guarda en el
-- profile de quien llama — self_onboard/reregister_onboarding corren
-- SECURITY DEFINER, así que este update no necesita ampliar el grant de
-- columnas de `profiles` (20260910000000_fix_profiles_self_update.sql).
drop function if exists public.self_onboard(text, text, jsonb, uuid);

create or replace function public.self_onboard(p_nombre text, p_edad text, p_answers jsonb, p_posible_duplicado_de uuid default null, p_whatsapp_phone text default null)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients;
  v_role public.app_role;
  v_relation public.patient_relation;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is null or v_role not in ('familiar', 'paciente') then
    raise exception 'Solo una cuenta familiar o paciente puede crear un perfil.' using errcode = '42501';
  end if;
  v_relation := case when v_role = 'familiar' then 'familiar_admin' else 'participante' end;

  if exists (select 1 from public.patient_links where profile_id = auth.uid()) then
    raise exception 'Ya tenés un perfil creado.' using errcode = '42501';
  end if;

  if p_posible_duplicado_de is not null and not exists (
    select 1 from public.check_possible_duplicate(p_nombre, p_edad) d where d.id = p_posible_duplicado_de
  ) then
    p_posible_duplicado_de := null;
  end if;

  insert into public.patients (nombre, edad, modalidad, onboarding_complete, posible_duplicado_de)
  values (p_nombre, nullif(btrim(p_edad), ''), 'orientado', true, p_posible_duplicado_de)
  returning * into v_patient;

  insert into public.patient_links (patient_id, profile_id, relation)
  values (v_patient.id, auth.uid(), v_relation);

  insert into public.onboarding_answers (patient_id, answers, schema_version)
  values (v_patient.id, p_answers, 2);

  if p_whatsapp_phone is not null and length(btrim(p_whatsapp_phone)) > 0 then
    update public.profiles set whatsapp_phone = btrim(p_whatsapp_phone) where id = auth.uid();
  end if;

  return v_patient;
end;
$$;

grant execute on function public.self_onboard(text, text, jsonb, uuid, text) to authenticated;

drop function if exists public.reregister_onboarding(text, text, jsonb);

create or replace function public.reregister_onboarding(p_nombre text, p_edad text, p_answers jsonb, p_whatsapp_phone text default null)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_patient public.patients;
begin
  select patient_id into v_patient_id
  from public.patient_links
  where profile_id = auth.uid() and relation in ('familiar_admin', 'participante')
  limit 1;

  if v_patient_id is null then
    raise exception 'No encontramos un perfil para volver a registrar.' using errcode = '42501';
  end if;

  update public.patients
  set nombre = coalesce(nullif(btrim(p_nombre), ''), nombre), edad = coalesce(nullif(btrim(p_edad), ''), edad)
  where id = v_patient_id
  returning * into v_patient;

  insert into public.onboarding_answers (patient_id, answers, schema_version, updated_at)
  values (v_patient_id, p_answers, 2, now())
  on conflict (patient_id) do update set answers = excluded.answers, schema_version = 2, updated_at = now();

  if p_whatsapp_phone is not null and length(btrim(p_whatsapp_phone)) > 0 then
    update public.profiles set whatsapp_phone = btrim(p_whatsapp_phone) where id = auth.uid();
  end if;

  return v_patient;
end;
$$;

grant execute on function public.reregister_onboarding(text, text, jsonb, text) to authenticated;

-- Bitácora de envíos de WhatsApp: idempotencia (no reintentar lo ya
-- intentado), conteo del tope diario por destinatario, y auditoría. Solo el
-- edge function (service role) escribe acá — nunca el cliente.
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  plan_task_id uuid references public.plan_tasks (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null check (tipo in ('prep', 'start', 'close')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  whatsapp_message_id text,
  status text not null check (status in ('sent', 'failed', 'skipped_quiet_hours', 'skipped_cap', 'skipped_not_configured')),
  error text,
  created_at timestamptz not null default now()
);

comment on table public.notifications_log is 'Auditoría de recordatorios de WhatsApp — escrita únicamente por whatsapp-notify-tick (service role), nunca por el cliente.';

create index notifications_log_patient_idx on public.notifications_log (patient_id, created_at desc);
create index notifications_log_profile_day_idx on public.notifications_log (profile_id, created_at);

alter table public.notifications_log enable row level security;

create policy "notifications_log: profesional read" on public.notifications_log
  for select using (public.is_profesional());

grant select on public.notifications_log to authenticated;
