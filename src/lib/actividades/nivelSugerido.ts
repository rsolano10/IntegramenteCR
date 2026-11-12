// Nivel de los juegos para cada persona: el que sugiere su etapa cognitiva,
// el último que se le asignó y la sugerencia de subir o bajar según cómo le
// resultó a la familia (lo que perciben, no un puntaje). Nada cambia solo:
// la clínica decide. Puro, con pruebas.
import { NIVELES, nivelLabel, type Nivel } from "./contrato";

export type NivelCognitivo = "preventivo" | "dcl" | "leve" | "moderada" | "avanzada";
export type Dificultad = "facil" | "justo" | "dificil";
export const DIFICULTADES: Dificultad[] = ["facil", "justo", "dificil"];
export const dificultadLabel: Record<Dificultad, string> = { facil: "Fácil", justo: "Justo", dificil: "Difícil" };

// La etapa más comprometida manda: demencia (cualquier grado) → suave,
// deterioro cognitivo leve → medio, preventivo → retador.
export function nivelPorEtapa(etapas: readonly string[] | null | undefined): Nivel | null {
  if (!etapas?.length) return null;
  if (etapas.some((e) => e === "leve" || e === "moderada" || e === "avanzada")) return "suave";
  if (etapas.includes("dcl")) return "medio";
  if (etapas.includes("preventivo")) return "retador";
  return null;
}

// De dónde sale el nivel propuesto al asignar.
export type OrigenNivel = "elegido" | "ultimo" | "etapa" | "recurso";

export interface SesionJuego {
  resourceId: string;
  nivel: Nivel;
  dificultad: Dificultad | null;
  // Para ordenar: la más reciente al final.
  orden: number;
}

// Nivel con el que se propone asignar un juego a esta persona.
export function nivelPorDefecto({
  resourceId,
  historial,
  etapas,
  delRecurso,
}: {
  resourceId: string;
  historial: readonly SesionJuego[];
  etapas: readonly string[] | null | undefined;
  delRecurso: Nivel;
}): { nivel: Nivel; origen: "ultimo" | "etapa" | "recurso" } {
  const del = historial.filter((s) => s.resourceId === resourceId).sort((a, b) => a.orden - b.orden);
  if (del.length) return { nivel: del[del.length - 1].nivel, origen: "ultimo" };
  const porEtapa = nivelPorEtapa(etapas);
  if (porEtapa) return { nivel: porEtapa, origen: "etapa" };
  return { nivel: delRecurso, origen: "recurso" };
}

export interface Sugerencia {
  resourceId: string;
  actual: Nivel;
  nivel: Nivel;
  direccion: "subir" | "bajar";
  motivo: string;
}

// Las dos últimas veces que contaron cómo le resultó, en el mismo nivel:
// las dos «fácil» → subir; las dos «difícil» → bajar.
export function sugerenciaNivel(resourceId: string, historial: readonly SesionJuego[]): Sugerencia | null {
  const con = historial
    .filter((s) => s.resourceId === resourceId && s.dificultad)
    .sort((a, b) => a.orden - b.orden)
    .slice(-2);
  if (con.length < 2 || con[0].nivel !== con[1].nivel || con[0].dificultad !== con[1].dificultad) return null;
  const actual = con[1].nivel;
  const i = NIVELES.indexOf(actual);
  if (con[1].dificultad === "facil" && i < NIVELES.length - 1)
    return { resourceId, actual, nivel: NIVELES[i + 1], direccion: "subir", motivo: `Le resultó fácil las dos últimas veces en ${nivelLabel[actual].toLowerCase()}.` };
  if (con[1].dificultad === "dificil" && i > 0)
    return { resourceId, actual, nivel: NIVELES[i - 1], direccion: "bajar", motivo: `Le resultó difícil las dos últimas veces en ${nivelLabel[actual].toLowerCase()}.` };
  return null;
}

export function sugerenciasNivel(historial: readonly SesionJuego[]): Sugerencia[] {
  const ids = [...new Set(historial.map((s) => s.resourceId))];
  return ids.map((id) => sugerenciaNivel(id, historial)).filter((s): s is Sugerencia => s !== null);
}
