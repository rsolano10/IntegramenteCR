// El «siguiente paso» de cada familia en Usuarios: una sola acción, la más
// urgente, uniendo lo clínico (evaluar, revisar o asignar la semana) con lo
// de la cuenta (aprobar, cobrar, recontactar). Puro, con pruebas.
import type { FilaCuenta } from "./cuentas";
import type { PatientRow } from "./patients";

export type TipoPaso = "aprobar" | "duplicado" | "sin_semana" | "pagar" | "evaluar" | "revisar" | "asignar" | "contactar";
export type TonoPaso = "principal" | "aviso" | "secundario";

export interface Paso {
  tipo: TipoPaso;
  label: string;
  porque: string;
  tono: TonoPaso;
}

const DIA = 86_400_000;
const diasHasta = (iso: string | null, ahora: number) => (iso ? Math.ceil((new Date(iso).getTime() - ahora) / DIA) : null);
const diasDesde = (iso: string | null, ahora: number) => (iso ? Math.floor((ahora - new Date(iso).getTime()) / DIA) : null);
const hace = (d: number | null) => (d === null ? "" : d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`);

// Orden de urgencia (para «Lo urgente primero»).
export const ORDEN_PASOS: TipoPaso[] = ["aprobar", "duplicado", "sin_semana", "pagar", "evaluar", "revisar", "asignar", "contactar"];

// «22 nov» (el día siguiente al fin de la última semana).
const diaCorto = (fecha: string) => {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short" }).replace(".", "");
};

export function siguientePaso(
  p: Pick<PatientRow, "plan_status" | "needs_review" | "needs_assignment" | "posible_duplicado_de" | "posible_duplicado_nombre" | "sin_semana" | "termina_pronto" | "semana_fin">,
  f: FilaCuenta | undefined,
  ahora = Date.now(),
): Paso | null {
  if (f?.estado === "pendiente_aprobacion")
    return {
      tipo: "aprobar",
      label: "Aprobar cuenta",
      porque: f.requiere_contacto ? "Requiere contacto antes de aprobar" : `Completó el cuestionario ${hace(diasDesde(f.estado_desde, ahora))}`.trim(),
      tono: "principal",
    };
  if (p.posible_duplicado_de)
    return { tipo: "duplicado", label: "Revisar duplicado", porque: `Se parece a «${p.posible_duplicado_nombre ?? "otro paciente"}»`, tono: "aviso" };
  // La familia no tiene actividades hoy: lo más urgente después de aprobar.
  if (p.sin_semana)
    return {
      tipo: "sin_semana",
      label: "Armar semana",
      porque: p.semana_fin ? `Sin actividades desde el ${diaCorto(p.semana_fin)}` : "Todavía no tiene semana",
      tono: "aviso",
    };
  if (f && !f.pagada_desde && (f.estado === "en_demo" || f.estado === "demo_finalizada")) {
    const d = diasHasta(f.demo_fin, ahora);
    if (f.estado === "demo_finalizada")
      return { tipo: "pagar", label: "Marcar pagada", porque: `La semana gratis terminó ${hace(diasDesde(f.demo_fin, ahora))}`.trim(), tono: "aviso" };
    if (d !== null && d <= 2) return { tipo: "pagar", label: "Marcar pagada", porque: d <= 0 ? "La semana gratis termina hoy" : d === 1 ? "La semana gratis termina mañana" : "La semana gratis termina en 2 días", tono: "aviso" };
  }
  if (p.plan_status === "pendiente") return { tipo: "evaluar", label: "Evaluar", porque: "Completó el cuestionario: falta su evaluación", tono: "secundario" };
  if (p.needs_review) return { tipo: "revisar", label: "Revisar semana", porque: "Registró toda la semana", tono: "aviso" };
  if (p.needs_assignment)
    return {
      tipo: "asignar",
      label: "Asignar semana",
      porque: p.termina_pronto ? "La semana termina pronto y falta la siguiente" : "Falta la próxima semana",
      tono: "secundario",
    };
  if (f?.estado === "inactiva")
    return { tipo: "contactar", label: "Escribir por WhatsApp", porque: `Sin actividad ${hace(diasDesde(f.ultima_actividad, ahora)) || "hace tiempo"}`, tono: "secundario" };
  return null;
}

// Vistas rápidas de la lista (los botones con conteo).
export type Vista = "accion" | "aprobar" | "sin_semana" | "evaluar" | "revisar" | "asignar" | "gratis" | "inactivas" | "todas";

export function enVista(v: Vista, paso: Paso | null, f: FilaCuenta | undefined): boolean {
  switch (v) {
    case "todas":
      return true;
    case "accion":
      return paso !== null;
    case "gratis":
      return paso?.tipo === "pagar";
    case "inactivas":
      return f?.estado === "inactiva";
    default:
      return paso?.tipo === v;
  }
}
