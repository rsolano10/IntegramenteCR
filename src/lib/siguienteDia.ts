import type { PlanTask } from "./mockData";

// Lo que viene después de hoy (para el cierre): el próximo día con
// actividades y cuántas tiene, o null si con hoy termina la semana.
export interface SiguienteDia {
  dia: string;
  cantidad: number;
  esManana: boolean;
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function siguienteDia(dias: { dia: string; isToday?: boolean; tasks: PlanTask[] }[]): SiguienteDia | null {
  const hoy = dias.find((d) => d.isToday)?.dia;
  if (!hoy) return null;
  const i = DIAS_SEMANA.indexOf(hoy);
  // Los planes van de domingo a sábado: lo que queda es lo que tiene
  // actividades todavía por venir.
  for (let k = 1; k < 7; k++) {
    const dia = DIAS_SEMANA[(i + k) % 7];
    const d = dias.find((x) => x.dia === dia);
    if (d && d.tasks.some((t) => t.estado === "futuro" || t.estado === "pendiente")) return { dia, cantidad: d.tasks.length, esManana: k === 1 };
  }
  return null;
}

