-- Lets the family account holder edit their own patient's basic info
-- (nombre/edad/modalidad) from the merged "Mi Perfil" modal — previously
-- only the clinic could update patients at all. Row-level only; the
-- frontend is responsible for never sending plan_status/onboarding_complete
-- here (same trust boundary already used by the clinic's own patient edit
-- modal, which also only ever sends a chosen subset of columns).
create policy "patients: familiar update basic fields" on public.patients
  for update using (
    public.has_patient_link(id, array['familiar_admin']::public.patient_relation[])
  );
