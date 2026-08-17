import type { Semaforo } from "./mockData";

// Presentation lookup for a severity tier (dot/color/label). The tier itself
// now comes from the internal clinical engine (src/lib/clinicalEngine.ts) —
// this file no longer computes it, only renders it for the professional
// (clinician-facing) views. Never shown to the family/participant.
export const semaforoData: Record<
  Semaforo,
  {
    bg: string;
    ink: string;
    dot: string;
    dotLight: string;
    chip: string;
    short: string;
    chipShort: string;
  }
> = {
  verde: {
    bg: "bg-fila-fria",
    ink: "text-verde-profundo",
    dot: "bg-semaforo-verde",
    dotLight: "bg-semaforo-verde-claro",
    chip: "Verde · seguimiento en casa",
    short: "Verde",
    chipShort: "Estado verde · plan completo",
  },
  amarillo: {
    bg: "bg-aviso",
    ink: "text-semaforo-amarillo-texto",
    dot: "bg-semaforo-amarillo",
    dotLight: "bg-mostaza-vital",
    chip: "Amarillo · con acompañamiento",
    short: "Amarillo",
    chipShort: "Estado amarillo · plan limitado",
  },
  rojo: {
    bg: "bg-alerta",
    ink: "text-alerta-texto",
    dot: "bg-semaforo-rojo",
    dotLight: "bg-alerta-borde",
    chip: "Rojo · atención ahora",
    short: "Rojo",
    chipShort: "Estado rojo · plan en pausa",
  },
};

// Handoff §3 · Ajuste automático: tres «no» consecutivos abren la pantalla de ajuste.
export function rechazoTriggered(reg: string | null, noCount: number): boolean {
  return reg === "no" && noCount >= 3;
}

// Handoff §4 rule 6: toda edición de plan, perfil o alerta escribe una AuditEntry.
export interface AuditEntry {
  id: string;
  entidad: string;
  accion: string;
  autor: string;
  creadoEn: string;
}

let auditSeq = 0;
export function makeAuditEntry(entidad: string, accion: string, autor: string): AuditEntry {
  auditSeq += 1;
  return {
    id: `audit-${auditSeq}`,
    entidad,
    accion,
    autor,
    creadoEn: new Date().toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" }),
  };
}
