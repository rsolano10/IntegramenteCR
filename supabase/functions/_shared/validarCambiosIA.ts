// Validación de la salida de la IA al personalizar una semana (Fase 4.5).
// Pura y sin dependencias: la usa la edge function personalizar-semana y la
// prueban los tests de src/lib/validarCambiosIA.test.ts.
//
// Reglas (obligatorias, del pedido del producto):
//   - solo recursos del catálogo: el reemplazo tiene que estar entre los
//     candidatos que la clínica calculó para ESA tarea (misma área, nivel
//     compatible y permitido por las reglas de seguridad del paciente);
//   - "mover" solo cambia el día (0–6), nunca el recurso;
//   - una tarea se toca a lo sumo una vez;
//   - justificación corta obligatoria;
//   - límite de cambios (porcentaje configurable). Los reemplazos de tareas
//     que la plantilla trae pero el paciente NO puede hacer (permitido =
//     false) son obligatorios por seguridad y no cuentan para el límite;
//   - cualquier cosa fuera de esto invalida TODA la respuesta: la semana
//     queda igual a la plantilla y se avisa a la clínica.

export interface CandidatoIA {
  id: string;
  titulo: string;
}

export interface TareaIA {
  id: string;
  dia_idx: number;
  titulo: string;
  modulo: string;
  permitido: boolean;
  motivo?: string | null;
  candidatos: CandidatoIA[];
}

export type CambioIA =
  | { tarea_id: string; accion: "reemplazar"; recurso_id: string; justificacion: string; obligatorio: boolean }
  | { tarea_id: string; accion: "mover"; dia_idx: number; justificacion: string; obligatorio: false };

export type ResultadoValidacion = { ok: true; cambios: CambioIA[] } | { ok: false; error: string };

export function maxCambiosPermitidos(totalTareas: number, pct: number): number {
  return Math.floor((totalTareas * Math.max(0, Math.min(100, pct))) / 100);
}

export function validarCambiosIA(salida: unknown, tareas: TareaIA[], pct: number): ResultadoValidacion {
  if (!salida || typeof salida !== "object" || !Array.isArray((salida as { cambios?: unknown }).cambios)) {
    return { ok: false, error: "La respuesta no tiene la forma esperada ({ cambios: [...] })." };
  }
  const porId = new Map(tareas.map((t) => [t.id, t]));
  const vistos = new Set<string>();
  const cambios: CambioIA[] = [];
  for (const [i, c] of ((salida as { cambios: unknown[] }).cambios).entries()) {
    if (!c || typeof c !== "object") return { ok: false, error: `Cambio ${i + 1}: no es un objeto.` };
    const x = c as Record<string, unknown>;
    const tarea = typeof x.tarea_id === "string" ? porId.get(x.tarea_id) : undefined;
    if (!tarea) return { ok: false, error: `Cambio ${i + 1}: la tarea no existe en la plantilla.` };
    if (vistos.has(tarea.id)) return { ok: false, error: `Cambio ${i + 1}: la tarea «${tarea.titulo}» se modifica dos veces.` };
    vistos.add(tarea.id);
    const just = typeof x.justificacion === "string" ? x.justificacion.trim() : "";
    if (!just || just.length > 240) return { ok: false, error: `Cambio ${i + 1}: falta una justificación corta.` };
    if (x.accion === "reemplazar") {
      if (typeof x.recurso_id !== "string" || !tarea.candidatos.some((k) => k.id === x.recurso_id)) {
        return { ok: false, error: `Cambio ${i + 1}: el recurso elegido no está entre los permitidos para «${tarea.titulo}».` };
      }
      cambios.push({ tarea_id: tarea.id, accion: "reemplazar", recurso_id: x.recurso_id, justificacion: just, obligatorio: !tarea.permitido });
    } else if (x.accion === "mover") {
      if (!tarea.permitido) return { ok: false, error: `Cambio ${i + 1}: «${tarea.titulo}» no está permitida y hay que reemplazarla, no moverla.` };
      const d = x.dia_idx;
      if (typeof d !== "number" || !Number.isInteger(d) || d < 0 || d > 6 || d === tarea.dia_idx) {
        return { ok: false, error: `Cambio ${i + 1}: día inválido para mover «${tarea.titulo}».` };
      }
      cambios.push({ tarea_id: tarea.id, accion: "mover", dia_idx: d, justificacion: just, obligatorio: false });
    } else {
      return { ok: false, error: `Cambio ${i + 1}: acción desconocida.` };
    }
  }
  const opcionales = cambios.filter((c) => !c.obligatorio).length;
  const max = maxCambiosPermitidos(tareas.length, pct);
  if (opcionales > max) return { ok: false, error: `La IA propuso ${opcionales} cambios y el máximo es ${max} (${pct}%).` };
  return { ok: true, cambios };
}
