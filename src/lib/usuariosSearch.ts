import { roleLabel, type ManagedAccount } from "./adminAccounts";
import { planTiers, type Semaforo } from "./mockData";
import { semaforoData } from "./rules";
import type { PatientRow } from "./patients";

const modalidadLabel = Object.fromEntries(planTiers.map((t) => [t.id, t.nombre]));

const ejeKeys = ["cognitivo", "fisico", "funcional", "nutricional"] as const;

// Every visible column, flattened to searchable text — typing "familiar" or
// "confirmado" matches on the same words the table already shows, instead
// of needing a separate filter control for each column. Shared by
// CuentasTab's own search and Usuarios.tsx's cross-tab global search.
export function accountHaystack(a: ManagedAccount): string {
  const confirmed = !!a.email_confirmed_at;
  return [
    a.nombre,
    a.email,
    roleLabel[a.role],
    a.especialidad ?? "",
    ...a.links.map((l) => l.patient_nombre),
    confirmed ? "Confirmado" : "Pendiente",
    new Date(a.created_at).toLocaleDateString("es-CR"),
  ]
    .join(" ")
    .toLowerCase();
}

// Same reasoning as accountHaystack — shared by PacientesTab and the
// global search.
export function patientHaystack(p: PatientRow): string {
  return [
    p.nombre,
    p.edad ?? "",
    modalidadLabel[p.modalidad] ?? p.modalidad,
    ...ejeKeys.map((k) => (p[k] ? semaforoData[p[k] as Semaforo].short : "Sin evaluar")),
    p.plan_status === "asignado" ? "Asignado" : "Pendiente",
    ...p.links.map((l) => l.nombre),
  ]
    .join(" ")
    .toLowerCase();
}
