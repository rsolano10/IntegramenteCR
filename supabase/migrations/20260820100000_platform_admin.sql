-- Turns the profesional role into a clinic+admin hybrid: full read/write
-- access to the patient roster and the ability to manage every account
-- (not just familiar/paciente). Fixes three latent bugs surfaced while
-- designing this — none of them hit yet because nothing exercised these
-- paths, but the new admin features would hit all three on day one.

-- Bug: plans.created_by / mensajes.autor_id / audit_log.autor_id reference
-- profiles(id) with no ON DELETE clause (defaults to NO ACTION), so
-- deleting any account that ever authored a plan or a message throws
-- 23503. History should survive account deletion with authorship blanked.
alter table public.plans
  drop constraint plans_created_by_fkey,
  add constraint plans_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.mensajes
  drop constraint mensajes_autor_id_fkey,
  add constraint mensajes_autor_id_fkey foreign key (autor_id) references public.profiles (id) on delete set null;

alter table public.audit_log
  drop constraint audit_log_autor_id_fkey,
  add constraint audit_log_autor_id_fkey foreign key (autor_id) references public.profiles (id) on delete set null;

-- Widen patient roster access for admin/roster management. Additive to the
-- existing "linked read" / "profesional update" policies — Postgres ORs
-- permissive policies together. Safe to widen: this table only holds
-- nombre/edad/modalidad/plan_status. clinical_profiles and
-- onboarding_answers are untouched and still require a profesional_asignado
-- link — severity data stays exactly as protected as before.
create policy "patients: profesional read all" on public.patients
  for select using (public.is_profesional());

create policy "patients: profesional insert" on public.patients
  for insert with check (public.is_profesional());

create policy "patients: profesional delete" on public.patients
  for delete using (public.is_profesional());

-- patient_links never touches auth.users, so linking/unlinking an account
-- to a patient can go straight from the browser under RLS — no edge
-- function needed. No UPDATE policy: relation is part of the composite
-- primary key, so "change the relation" is a delete + insert.
create policy "patient_links: profesional read all" on public.patient_links
  for select using (public.is_profesional());

create policy "patient_links: profesional insert" on public.patient_links
  for insert with check (public.is_profesional());

create policy "patient_links: profesional delete" on public.patient_links
  for delete using (public.is_profesional());

-- Bug: a plain client-side insert into patients would pass RLS's INSERT
-- check but then return zero rows from .select(), because the freshly
-- inserted patient has no patient_link yet and the SELECT policy is
-- link-scoped. This RPC does insert-patient + insert-own-link atomically
-- so the caller always gets the row back and is immediately linked.
create or replace function public.create_patient(p_nombre text, p_edad text default null, p_modalidad public.modalidad default 'orientado')
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients;
begin
  if not public.is_profesional() then
    raise exception 'Solo el equipo clínico puede crear pacientes.' using errcode = '42501';
  end if;

  insert into public.patients (nombre, edad, modalidad)
  values (p_nombre, nullif(btrim(p_edad), ''), p_modalidad)
  returning * into v_patient;

  insert into public.patient_links (patient_id, profile_id, relation)
  values (v_patient.id, auth.uid(), 'profesional_asignado');

  return v_patient;
end;
$$;

grant execute on function public.create_patient(text, text, public.modalidad) to authenticated;

-- Bug: the old list_managed_accounts left-joined patient_links directly,
-- so an account linked to more than one patient came back as duplicate
-- rows (Cuentas.tsx keys by account id — this would produce React
-- duplicate-key warnings and doubled UI rows the moment an account gets a
-- second patient linked, which the new "vincular cuenta" feature enables
-- immediately). Also widened: it used to filter to role in
-- (familiar,paciente), making clinic staff invisible to account
-- management. drop+recreate because the return shape changes.
drop function public.list_managed_accounts();

create or replace function public.list_managed_accounts()
returns table (
  id uuid,
  email text,
  nombre text,
  role public.app_role,
  especialidad text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz,
  links jsonb
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
  select
    p.id,
    u.email::text,
    p.nombre,
    p.role,
    p.especialidad,
    u.email_confirmed_at,
    u.invited_at,
    p.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object('patient_id', pl.patient_id, 'patient_nombre', pt.nombre, 'relation', pl.relation) order by pt.nombre)
      from public.patient_links pl
      join public.patients pt on pt.id = pl.patient_id
      where pl.profile_id = p.id
    ), '[]'::jsonb) as links
  from public.profiles p
  join auth.users u on u.id = p.id
  order by u.email_confirmed_at nulls first, p.created_at desc;
end;
$$;

grant execute on function public.list_managed_accounts() to authenticated;

-- New: the patient-facing counterpart to list_managed_accounts, for the
-- Pacientes admin page. overall (severity tier) is only surfaced when the
-- caller specifically has a profesional_asignado link to THAT patient —
-- preserves the same guarantee clinical_profiles' RLS already enforces,
-- just re-expressed inside a roster view that any profesional can read.
create or replace function public.list_patients()
returns table (
  id uuid,
  nombre text,
  edad text,
  modalidad public.modalidad,
  plan_status public.plan_status,
  onboarding_complete boolean,
  created_at timestamptz,
  overall public.tier,
  links jsonb
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
  select
    pt.id,
    pt.nombre,
    pt.edad,
    pt.modalidad,
    pt.plan_status,
    pt.onboarding_complete,
    pt.created_at,
    case
      when public.has_patient_link(pt.id, array['profesional_asignado']::public.patient_relation[]) then cp.overall
      else null
    end as overall,
    coalesce((
      select jsonb_agg(jsonb_build_object('profile_id', pl.profile_id, 'nombre', pr.nombre, 'role', pr.role, 'relation', pl.relation) order by pl.relation)
      from public.patient_links pl
      join public.profiles pr on pr.id = pl.profile_id
      where pl.patient_id = pt.id
    ), '[]'::jsonb) as links
  from public.patients pt
  left join public.clinical_profiles cp on cp.patient_id = pt.id
  order by pt.created_at desc;
end;
$$;

grant execute on function public.list_patients() to authenticated;
