-- Supports "paciente sin familiar": the clinic can grant a patient who has
-- no familiar_admin the same full app access a familiar would get, decided
-- at accept time. Also lets a paciente (without exposing other people's
-- patient_links rows, which "patient_links: self read" deliberately hides)
-- find out whether THEIR OWN patient has a familiar at all — needed to
-- decide whether "Necesito ayuda" should compose a real message or just
-- point at "your familiar already got notified".
alter table public.patients add column vista_completa boolean not null default false;

create or replace function public.has_familiar_admin(p_patient_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.patient_links
    where patient_id = p_patient_id and relation = 'familiar_admin'
  )
  where public.has_patient_link(p_patient_id);
$$;

grant execute on function public.has_familiar_admin(uuid) to authenticated;

-- Mirrors "mensajes: familiar insert"/read — lets a participante (paciente
-- role) compose a real message to the clinic via "Necesito ayuda" when
-- there's no familiar to relay through.
create policy "mensajes: participante insert" on public.mensajes
  for insert with check (
    public.has_patient_link(patient_id, array['participante']::public.patient_relation[])
  );

create policy "mensajes: participante read" on public.mensajes
  for select using (
    public.has_patient_link(patient_id, array['participante']::public.patient_relation[])
  );
