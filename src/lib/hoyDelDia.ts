// Funciones del día para la pantalla "Hoy" (components/hoy/HoyDelDia.tsx).
import type { PlanTask } from "./mockData";

const REGISTRADA: PlanTask["estado"][] = ["realizado", "parcial", "no"];
export const estaRegistrada = (t: PlanTask) => REGISTRADA.includes(t.estado);

// "9:00 a.m." / "17:00" / texto libre → minutos desde medianoche.
export function minutosDe(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/i.exec(hora.trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const sufijo = m[3]?.toLowerCase().replace(/[\s.]/g, "");
  if (sufijo === "pm" && h < 12) h += 12;
  if (sufijo === "am" && h === 12) h = 0;
  return h * 60 + parseInt(m[2], 10);
}

export function ordenarDelDia(tasks: PlanTask[]): PlanTask[] {
  return [...tasks].sort((a, b) => (minutosDe(a.hora) ?? 24 * 60) - (minutosDe(b.hora) ?? 24 * 60));
}
