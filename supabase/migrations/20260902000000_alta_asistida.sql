-- Fase 7: alta asistida por la clínica (presencial).
-- must_change_password gates a forced password-change screen on first
-- login for accounts created with the generic starter password (see
-- admin-accounts' createAccount helper) — cleared once they set a real one.
alter table public.profiles add column must_change_password boolean not null default false;

-- The clinic filling the questionnaire in person on the patient's behalf
-- (assisted onboarding) needs write access to onboarding_answers, which
-- until now only familiar_admin had (see rls_policies.sql's comment: "the
-- questionnaire is filled once by the family..." — no longer the only path).
create policy "onboarding_answers: profesional insert" on public.onboarding_answers
  for insert with check (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );

create policy "onboarding_answers: profesional update" on public.onboarding_answers
  for update using (
    public.has_patient_link(patient_id, array['profesional_asignado']::public.patient_relation[])
  );
