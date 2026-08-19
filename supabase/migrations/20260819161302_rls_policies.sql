-- Row Level Security: every table a signed-in user can reach is scoped
-- through patient_links via has_patient_link() (defined in core_schema).

alter table public.profiles enable row level security;

create policy "profiles: self read" on public.profiles
  for select using (id = auth.uid());

create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid());

alter table public.patients enable row level security;

create policy "patients: linked read" on public.patients
  for select using (public.has_patient_link(id));

create policy "patients: profesional update" on public.patients
  for update using (public.has_patient_link(id, array['profesional_asignado']::public.patient_relation[]));

alter table public.patient_links enable row level security;

create policy "patient_links: self read" on public.patient_links
  for select using (profile_id = auth.uid());

alter table public.onboarding_answers enable row level security;

create policy "onboarding_answers: familiar/profesional read" on public.onboarding_answers
  for select using (
    public.has_patient_link(patient_id, array['familiar_admin', 'profesional_asignado']::public.patient_relation[])
  );

create policy "onboarding_answers: familiar insert" on public.onboarding_answers
  for insert with check (
    public.has_patient_link(patient_id, array['familiar_admin']::public.patient_relation[])
  );

create policy "onboarding_answers: familiar update" on public.onboarding_answers
  for update using (
    public.has_patient_link(patient_id, array['familiar_admin']::public.patient_relation[])
  );

-- Deliberately no policy at all here for paciente or profesional-insert/delete —
-- the questionnaire is filled once by the family, edited by the family, and
-- read by the clinic. Nothing else is a valid path.

alter table public.clinical_profiles enable row level security;

create policy "clinical_profiles: profesional only" on public.clinical_profiles
  for select using (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

-- No insert/update/delete policy for any role — only the security-definer
-- trigger (recompute_clinical_profile) writes to this table.

alter table public.plans enable row level security;

create policy "plans: published visible to all linked, draft to clinic only" on public.plans
  for select using (
    (status = 'published' and public.has_patient_link(patient_id))
    or public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

create policy "plans: profesional insert" on public.plans
  for insert with check (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

create policy "plans: profesional update" on public.plans
  for update using (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

alter table public.plan_tasks enable row level security;

create policy "plan_tasks: select via plan visibility" on public.plan_tasks
  for select using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id
        and (
          (p.status = 'published' and public.has_patient_link(p.patient_id))
          or public.has_patient_link(p.patient_id, array['profesional_asignado']::public.patient_relation[])
        )
    )
  );

create policy "plan_tasks: profesional insert" on public.plan_tasks
  for insert with check (
    exists (
      select 1 from public.plans p
      where p.id = plan_id
        and public.has_patient_link(p.patient_id, array['profesional_asignado']::public.patient_relation[])
    )
  );

create policy "plan_tasks: profesional update" on public.plan_tasks
  for update using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id
        and public.has_patient_link(p.patient_id, array['profesional_asignado']::public.patient_relation[])
    )
  );

create policy "plan_tasks: familiar/participante mark registro on published plan" on public.plan_tasks
  for update using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id
        and p.status = 'published'
        and public.has_patient_link(p.patient_id, array['familiar_admin', 'participante']::public.patient_relation[])
    )
  );

create policy "plan_tasks: profesional delete" on public.plan_tasks
  for delete using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id
        and public.has_patient_link(p.patient_id, array['profesional_asignado']::public.patient_relation[])
    )
  );

alter table public.mensajes enable row level security;

create policy "mensajes: familiar/profesional read" on public.mensajes
  for select using (
    public.has_patient_link(patient_id, array['familiar_admin', 'profesional_asignado']::public.patient_relation[])
  );

create policy "mensajes: profesional write" on public.mensajes
  for insert with check (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

alter table public.audit_log enable row level security;

create policy "audit_log: profesional read" on public.audit_log
  for select using (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

create policy "audit_log: any linked insert" on public.audit_log
  for insert with check (public.has_patient_link(patient_id));

alter table public.chat_messages enable row level security;

create policy "chat_messages: familiar read" on public.chat_messages
  for select using (
    public.has_patient_link(patient_id, array['familiar_admin']::public.patient_relation[])
  );

create policy "chat_messages: familiar insert" on public.chat_messages
  for insert with check (
    public.has_patient_link(patient_id, array['familiar_admin']::public.patient_relation[])
  );
