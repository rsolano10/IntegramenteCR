// Arma el modo "paso a paso" de una tarea (StepByStepActivity): preparación,
// una consigna por pantalla y cierre. Funciona con los tres formatos de
// recurso: pasos sueltos (cognitivos y los primeros 34), el texto "Tu
// actividad" de las fichas (gerontogimnasia con consignas numeradas,
// nutrición en párrafos con viñetas) o, si no hay nada, la descripción.
import type { PlanTask } from "./mockData";

export interface Paso {
  texto: string;
  lista?: string[];
}

export interface GuiaPasoAPaso {
  // "Prepará…" de las fichas (o los materiales).
  prepara: string | null;
  // Frases de contexto que no son una consigna ("Podés ver el video o
  // demostrarle estas consignas:").
  notas: string[];
  pasos: Paso[];
}

const NUMERADO = /^\d+\.\s+(.*)$/;
const VINETA = /^•\s*(.*)$/;

export function parsearActividad(actividad: string): GuiaPasoAPaso {
  const lineas = actividad.split("\n").map((l) => l.trim()).filter(Boolean);
  let prepara: string | null = null;
  const resto: string[] = [];
  for (const l of lineas) {
    if (!prepara && l.startsWith("Prepará ")) prepara = l;
    else resto.push(l);
  }

  // Gerontogimnasia: las consignas numeradas son los pasos; lo demás es contexto.
  if (resto.some((l) => NUMERADO.test(l))) {
    return {
      prepara,
      notas: resto.filter((l) => !NUMERADO.test(l)),
      pasos: resto.filter((l) => NUMERADO.test(l)).map((l) => ({ texto: NUMERADO.exec(l)![1] })),
    };
  }

  // Nutrición y similares: cada párrafo es un paso; las viñetas van con el
  // párrafo anterior ("Si usás una lata:" + su lista).
  const pasos: Paso[] = [];
  for (const l of resto) {
    const v = VINETA.exec(l);
    if (v && pasos.length > 0) {
      const ultimo = pasos[pasos.length - 1];
      ultimo.lista = [...(ultimo.lista ?? []), v[1]];
    } else {
      pasos.push({ texto: v ? v[1] : l });
    }
  }
  return { prepara, notas: [], pasos };
}

export function guiaDeTarea(task: PlanTask): GuiaPasoAPaso {
  if (task.pasos && task.pasos.length > 0) {
    return { prepara: task.materiales ?? null, notas: [], pasos: task.pasos.map((texto) => ({ texto })) };
  }
  if (task.actividad?.trim()) {
    const g = parsearActividad(task.actividad);
    return { ...g, prepara: g.prepara ?? task.materiales ?? null };
  }
  return { prepara: task.materiales ?? null, notas: [], pasos: task.detalle ? [{ texto: task.detalle }] : [] };
}
