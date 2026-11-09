// Cálculos del resumen semanal (pantalla Resumen). Funciones puras, con
// pruebas en resumenSemana.test.ts.

export interface TareaResumen {
  titulo: string;
  estado: string;
  dia: string;
  modulo: string | null;
}

// Los planes van de domingo a sábado.
export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const registrada = (t: TareaResumen) => t.estado === "realizado" || t.estado === "parcial";

export function calcularResumen(tareas: TareaResumen[]) {
  const total = tareas.filter((t) => t.estado !== "futuro").length;
  const hechas = tareas.filter((t) => t.estado === "realizado").length;
  const conAyuda = tareas.filter((t) => t.estado === "parcial").length;
  const logradas = hechas + conAyuda;
  const pct = total ? logradas / total : 0;

  // Días con al menos una actividad hecha, en orden de la semana.
  const diasConPlan = DIAS_SEMANA.filter((d) => tareas.some((t) => t.dia === d));
  const activos = DIAS_SEMANA.map((d) => tareas.some((t) => t.dia === d && registrada(t)));
  let racha = 0;
  let actual = 0;
  for (const a of activos) {
    actual = a ? actual + 1 : 0;
    racha = Math.max(racha, actual);
  }

  const porArea = new Map<string, { hechas: number; total: number }>();
  for (const t of tareas) {
    if (!t.modulo || t.estado === "futuro") continue;
    const a = porArea.get(t.modulo) ?? { hechas: 0, total: 0 };
    a.total += 1;
    if (registrada(t)) a.hechas += 1;
    porArea.set(t.modulo, a);
  }

  return {
    total,
    hechas,
    conAyuda,
    logradas,
    pct,
    diasActivos: activos.filter(Boolean).length,
    diasConPlan: diasConPlan.length,
    activosPorDia: activos,
    racha,
    porArea: [...porArea.entries()].map(([modulo, v]) => ({ modulo, ...v })).sort((a, b) => b.total - a.total),
  };
}

// El titular celebra lo logrado; nunca pinta una semana floja como fracaso.
export function titularSemana(pct: number): { titulo: string; frase: string } {
  if (pct >= 0.9) return { titulo: "¡Semana redonda!", frase: "Hicieron casi todo lo del plan. ¡Qué constancia!" };
  if (pct >= 0.6) return { titulo: "¡Qué buena semana!", frase: "La mayoría de las actividades quedaron hechas." };
  if (pct >= 0.3) return { titulo: "Cada paso cuenta", frase: "Lo que hicieron esta semana suma, y mucho." };
  if (pct > 0) return { titulo: "Un buen comienzo", frase: "Toda rutina empieza así. La próxima semana seguimos." };
  return { titulo: "Una semana para retomar", frase: "No pasa nada: la próxima semana es una nueva oportunidad." };
}
