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

