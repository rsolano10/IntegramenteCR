-- Bug: "No pudimos enviar el mensaje" for any profesional opening a patient
-- they aren't personally linked to as profesional_asignado. self_onboard()
-- (family self-signup) never creates that link at all, and create_patient()
-- only links the ONE clinician who created the patient — so every other
-- clinic staff account, and every self-onboarded "pendiente" patient, hits
-- an RLS denial on mensajes insert. patients/patient_links already grant
-- full access to any is_profesional() account (platform_admin.sql) — this
-- brings mensajes in line with that same "profesional = clinic admin,
-- sees everything" model instead of requiring a specific link.
create policy "mensajes: profesional full access" on public.mensajes
  for all
  using (public.is_profesional())
  with check (public.is_profesional());
