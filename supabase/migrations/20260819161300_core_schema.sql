-- Core identity schema: who's who, and which patient each account is
-- linked to. `patient_links` is what every later RLS policy checks against
-- instead of assuming a single global patient.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('familiar', 'paciente', 'profesional');
create type public.modalidad as enum ('autoguiado', 'orientado', 'clinico');
create type public.plan_status as enum ('pendiente', 'asignado');
create type public.patient_relation as enum ('familiar_admin', 'participante', 'profesional_asignado');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  nombre text not null,
  especialidad text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user. Populated by the on_auth_user_created trigger below, never written directly by the client.';

-- Auto-create a profile row whenever someone signs up, reading the role
-- from the metadata passed to supabase.auth.signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, nombre, especialidad)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'familiar'),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'especialidad'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  edad text,
  modalidad public.modalidad not null default 'orientado',
  plan_status public.plan_status not null default 'pendiente',
  onboarding_complete boolean not null default false,
  welcome_message_pending boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.patients is 'One row per person receiving care. A family can have more than one over time; a clinician can have many.';

create table public.patient_links (
  patient_id uuid not null references public.patients (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  relation public.patient_relation not null,
  created_at timestamptz not null default now(),
  primary key (patient_id, profile_id, relation)
);

comment on table public.patient_links is 'Join table every RLS policy in later migrations checks — "does this signed-in user have a link to this patient, and in what capacity".';

-- security definer so it can be called inside RLS policies (which run as
-- the querying role) without those policies needing direct access to
-- patient_links themselves.
create or replace function public.has_patient_link(p_patient_id uuid, p_relations public.patient_relation[] default null)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_links pl
    where pl.patient_id = p_patient_id
      and pl.profile_id = auth.uid()
      and (p_relations is null or pl.relation = any (p_relations))
  );
$$;
