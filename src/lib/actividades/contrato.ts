import type { Azar } from "./azar";

// Contrato común de las actividades interactivas (extras.modo = "interactiva").
// Cada actividad es un recurso de la Biblioteca: su fila en media_resources
// lleva en `extras` el tipo, el nivel que fijó la clínica y, si hace falta,
// ajustes propios. «Clasificar números» (modo "clasificar") es anterior y
// sigue con su propia forma.
//
// Reglas de producto (todas las actividades):
// - sin puntajes, conteos de aciertos/errores, rachas ni niveles alcanzados;
// - nada se guarda: el estado vive en memoria mientras la actividad está abierta;
// - el registro Sí / En parte / No lo hace la persona o su familiar, nunca la actividad;
// - sin castigo por error (mostaza, nunca rojo), sin tiempo, solo toques.

export type Nivel = "suave" | "medio" | "retador";
export const NIVELES: Nivel[] = ["suave", "medio", "retador"];
export const nivelLabel: Record<Nivel, string> = { suave: "Suave", medio: "Medio", retador: "Retador" };

export interface ExtrasInteractiva {
  modo: "interactiva";
  tipo: string;
  version?: number;
  nivel?: Nivel;
  // Ejercicios por sesión (3 a 10; 5 por defecto).
  ejercicios?: number;
  // Pisa los valores del nivel, campo por campo.
  config?: Record<string, unknown>;
}

export const EJERCICIOS = { min: 3, max: 10, porDefecto: 5 };

// Campos editables por la clínica (el formulario se arma con esto).
export type Campo =
  | { clave: string; tipo: "numero"; etiqueta: string; min: number; max: number; ayuda?: string }
  | { clave: string; tipo: "booleano"; etiqueta: string; ayuda?: string }
  | { clave: string; tipo: "opcion"; etiqueta: string; opciones: { valor: string; etiqueta: string }[]; ayuda?: string }
  | { clave: string; tipo: "multiple"; etiqueta: string; opciones: { valor: string; etiqueta: string }[]; ayuda?: string }
  | { clave: string; tipo: "lista"; etiqueta: string; ayuda?: string; numerica?: boolean };

export interface Contexto {
  azar: Azar;
  // Para las actividades que dependen del momento (orientación).
  ahora: Date;
}

export interface DefActividad<C, E> {
  tipo: string;
  version: number;
  // Nombre visible (clínica y familia).
  nombre: string;
  // Metadato interno para la clínica; nunca se muestra a la familia.
  area: string;
  funcion: string;
  porNivel: Record<Nivel, C>;
  campos: Campo[];
  // Lista de errores en lenguaje llano (vacía = válida).
  validar: (c: C) => string[];
  // Pura: misma configuración y misma semilla, mismos ejercicios.
  generar: (c: C, cantidad: number, ctx: Contexto) => E[];
  // Consigna para la persona (voseo, sin afirmaciones de salud).
  consigna: (c: C) => string;
  // Si la actividad fija su propia cantidad de ejercicios (orientación).
  cantidadFija?: (c: C) => number;
}

export function nivelDe(ex: Pick<ExtrasInteractiva, "nivel">): Nivel {
  return ex.nivel && NIVELES.includes(ex.nivel) ? ex.nivel : "suave";
}

export function cantidadEjercicios(ex: Pick<ExtrasInteractiva, "ejercicios">): number {
  const n = Number(ex.ejercicios);
  if (!Number.isFinite(n)) return EJERCICIOS.porDefecto;
  return Math.min(EJERCICIOS.max, Math.max(EJERCICIOS.min, Math.round(n)));
}

// Valores del nivel + lo que la clínica haya ajustado (solo claves conocidas).
export function resolverConfig<C extends object>(def: DefActividad<C, unknown>, ex: ExtrasInteractiva): C {
  const base = def.porNivel[nivelDe(ex)];
  const extra = ex.config ?? {};
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(out)) if (extra[k] !== undefined && extra[k] !== null && extra[k] !== "") out[k] = extra[k];
  if (typeof extra.semilla === "number") out.semilla = extra.semilla;
  return out as C;
}

// Ayudas de validación.
export function enRango(errores: string[], valor: unknown, min: number, max: number, nombre: string) {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < min || valor > max) errores.push(`${nombre} tiene que ser un número entre ${min} y ${max}.`);
}
