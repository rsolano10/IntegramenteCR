-- A paciente granted "vista completa" (no familiar, full app access) can
-- edit their own basic info from "Mi perfil" the same way a familiar_admin
-- edits their familiar's — mirrors the familiar-side policy added earlier.
create policy "patients: participante update basic fields" on public.patients
  for update using (
    public.has_patient_link(id, array['participante']::public.patient_relation[])
  );
