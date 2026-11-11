import { crearAzar } from "./azar";
import { clasificarObjetos } from "./clasificarObjetos";
import { contarPorTipo } from "./contarPorTipo";
import { cantidadEjercicios, resolverConfig, type DefActividad, type ExtrasInteractiva, type Nivel } from "./contrato";
import { encontrarIguales } from "./encontrarIguales";
import { formarPalabra } from "./formarPalabra";
import { ordenarPasos, ordenarSecuencia } from "./ordenar";
import { orientacionHoy } from "./orientacionHoy";
import { pagoExacto } from "./pagoExacto";
import { parejas } from "./parejas";
import { recordarPosiciones } from "./recordarPosiciones";

// Registro único de las actividades interactivas (lógica, sin interfaz). Los
// componentes de cada tipo están en components/actividades/interactivas.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Def = DefActividad<any, any>;

export const ACTIVIDADES: Def[] = [
  clasificarObjetos,
  ordenarSecuencia,
  ordenarPasos,
  encontrarIguales,
  contarPorTipo,
  parejas,
  recordarPosiciones,
  formarPalabra,
  pagoExacto,
  orientacionHoy,
];

export const actividadPorTipo = (tipo: string | undefined): Def | undefined => ACTIVIDADES.find((a) => a.tipo === tipo);

export type Sesion =
  | { ok: true; def: Def; config: Record<string, unknown>; ejercicios: unknown[] }
  | { ok: false; errores: string[] };

// Prepara una sesión: resuelve el tipo y la configuración, valida y genera
// los ejercicios. Nunca lanza: si algo falla devuelve los errores.
export function prepararSesion(ex: ExtrasInteractiva, semilla: number, ahora = new Date()): Sesion {
  const def = actividadPorTipo(ex.tipo);
  if (!def) return { ok: false, errores: [`No existe la actividad «${ex.tipo}».`] };
  try {
    const config = resolverConfig(def, ex) as Record<string, unknown>;
    const errores = def.validar(config);
    if (errores.length) return { ok: false, errores };
    const s = typeof config.semilla === "number" ? config.semilla : semilla;
    const cantidad = def.cantidadFija ? def.cantidadFija(config) : cantidadEjercicios(ex);
    const ejercicios = def.generar(config, cantidad, { azar: crearAzar(s), ahora });
    if (!ejercicios.length) return { ok: false, errores: ["La actividad no generó ejercicios."] };
    return { ok: true, def, config, ejercicios };
  } catch {
    return { ok: false, errores: ["La configuración no es válida."] };
  }
}

// Errores de configuración para el editor (vacío = se puede guardar).
export function erroresDeActividad(ex: ExtrasInteractiva): string[] {
  const s = prepararSesion(ex, 1);
  return s.ok ? [] : s.errores;
}

// Resumen de un nivel de una actividad (para elegir la dificultad al asignar).
export function resumenNivel(ex: ExtrasInteractiva, nivel: Nivel): string | null {
  const def = actividadPorTipo(ex.tipo);
  if (!def) return null;
  try {
    return def.resumen(resolverConfig(def, { ...ex, nivel }));
  } catch {
    return null;
  }
}
