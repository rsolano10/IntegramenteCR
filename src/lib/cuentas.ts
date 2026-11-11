// Seguimiento de cuentas (Seguimiento.tsx): tipos, etiquetas de estado y
// validaciones de la cola de aprobación (Fase 4.3).
import type { Answers } from "./onboardingSchema";
import type { EstadoCuenta } from "./useMyPatient";

export interface FilaCuenta {
  profile_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  role: string;
  estado: EstadoCuenta | null;
  estado_desde: string | null;
  registrado_en: string;
  patient_id: string | null;
  paciente_nombre: string | null;
  paciente_edad: string | null;
  modalidad: string | null;
  demo_fin: string | null;
  ultima_actividad: string | null;
  requiere_contacto: boolean;
  requiere_contacto_nota: string | null;
  rechazo_motivo: string | null;
  pagada_desde: string | null;
  posible_duplicado: boolean;
  telefono_duplicado: boolean;
  semana_gratis_solicitada: boolean;
}

export const estadoInfo: Record<EstadoCuenta, { label: string; clase: string }> = {
  registrado: { label: "Registrado", clase: "bg-campo text-tinta-suave" },
  cuestionario_pendiente: { label: "Cuestionario pendiente", clase: "bg-beige-serenidad text-tinta" },
  pendiente_aprobacion: { label: "Pendiente de aprobación", clase: "bg-aviso text-aviso-texto" },
  en_demo: { label: "En demo", clase: "bg-fila-fria text-verde-profundo" },
  demo_finalizada: { label: "Demo finalizada", clase: "bg-fila-calida text-[#7a5a1f]" },
  activa: { label: "Activa", clase: "bg-[#e3efe3] text-semaforo-verde-texto" },
  inactiva: { label: "Inactiva", clase: "bg-[#eceae4] text-tinta-tenue" },
  rechazada: { label: "Rechazada", clase: "bg-riesgo text-riesgo-texto" },
};

export function validacionesCuenta(f: Pick<FilaCuenta, "telefono" | "paciente_edad" | "paciente_nombre" | "telefono_duplicado" | "posible_duplicado">, answers: Answers | null): string[] {
  const v: string[] = [];
  if (!f.paciente_nombre?.trim()) v.push("Falta el nombre de la persona.");
  if (!f.telefono && !(typeof answers?.whatsapp_telefono === "string" && answers.whatsapp_telefono.trim())) v.push("No dejó teléfono.");
  const edad = Number((f.paciente_edad ?? "").replace(/[^\d]/g, ""));
  if (!f.paciente_edad?.trim()) v.push("Falta la edad.");
  else if (!edad || edad < 40 || edad > 110) v.push(`Edad fuera de rango (${f.paciente_edad}).`);
  if (f.telefono_duplicado) v.push("Teléfono repetido en otra cuenta.");
  if (f.posible_duplicado) v.push("Posible paciente duplicado (mismo nombre y edad).");
  return v;
}


const DIA_MS = 86_400_000;
const diasHasta = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DIA_MS) : null);
const diasDesde = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DIA_MS) : null);

// Detalle corto según el estado: cuánto le queda a la demo, hace cuánto
// terminó, última actividad.
export function detalleCuenta(f: FilaCuenta): string | null {
  if (f.estado === "en_demo") {
    const d = diasHasta(f.demo_fin);
    if (d === null) return null;
    return d <= 0 ? "La semana gratis termina hoy" : d === 1 ? "La semana gratis termina mañana" : `Quedan ${d} días de semana gratis`;
  }
  if (f.estado === "demo_finalizada") {
    const d = diasDesde(f.demo_fin);
    return d === null ? null : d === 0 ? "Terminó hoy" : `Terminó hace ${d} ${d === 1 ? "día" : "días"}`;
  }
  if (f.estado === "activa" || f.estado === "inactiva") {
    const d = diasDesde(f.ultima_actividad);
    return d === null ? "Sin actividad registrada" : d === 0 ? "Activo hoy" : `Última actividad hace ${d} ${d === 1 ? "día" : "días"}`;
  }
  if (f.estado === "pendiente_aprobacion" && f.requiere_contacto) return `Requiere contacto${f.requiere_contacto_nota ? `: ${f.requiere_contacto_nota}` : ""}`;
  if (f.estado === "rechazada" && f.rechazo_motivo) return `Motivo: ${f.rechazo_motivo}`;
  return null;
}

