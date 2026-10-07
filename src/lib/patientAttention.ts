import type { PatientRow } from "../components/profesional/PatientDetailModal";

// One "what does this patient need from me right now" signal, computed the
// same way Panel.tsx's three pendientes buckets already are (plan_status,
// needs_review, needs_assignment from list_patients()) — reused here so the
// roster (Usuarios) surfaces the exact same attention state as the
// dashboard, instead of the clinic having to cross-reference the two.
export type Attention = "nuevo" | "revisar" | "asignar";

export function attentionFor(p: PatientRow): Attention | null {
  if (p.plan_status === "pendiente") return "nuevo";
  if (p.needs_review) return "revisar";
  if (p.needs_assignment) return "asignar";
  return null;
}

// Same warm/amber family Panel.tsx already uses for all 3 pendientes
// buckets (bg-aviso / bg-fila-calida, always semaforo-amarillo-texto) — one
// consistent "this needs you" color across the app, not a new hue per type.
export const attentionMeta: Record<Attention, { label: string; shortLabel: string; bg: string; text: string; dot: string }> = {
  nuevo: {
    label: "Nuevo — por evaluar",
    shortLabel: "Por evaluar",
    bg: "bg-aviso",
    text: "text-semaforo-amarillo-texto",
    dot: "bg-semaforo-amarillo",
  },
  revisar: {
    label: "Semana lista para revisar",
    shortLabel: "Revisar semana",
    bg: "bg-fila-calida",
    text: "text-semaforo-amarillo-texto",
    dot: "bg-semaforo-amarillo",
  },
  asignar: {
    label: "Falta asignar la próxima semana",
    shortLabel: "Asignar plan",
    bg: "bg-aviso",
    text: "text-semaforo-amarillo-texto",
    dot: "bg-semaforo-amarillo",
  },
};

const attentionRank: Record<Attention, number> = { nuevo: 0, revisar: 1, asignar: 2 };

// null (no atención pendiente) always ranks last — "acción primero" sort.
export function attentionRankOf(p: PatientRow): number {
  const a = attentionFor(p);
  return a ? attentionRank[a] : 3;
}
