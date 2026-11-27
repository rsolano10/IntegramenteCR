import type { NutricionFlags } from "../reglasRecursos";
import type { Item } from "./tipos";

// Cuidados de nutrición según la persona. Cada cuidado de una receta nombra
// la condición a la que aplica («Con warfarina…», «Si le cuesta tragar…»).
// Con el perfil de nutrición cargado por la clínica, la familia ve solo los
// que le aplican; los que no nombran ninguna condición se ven siempre. Sin
// perfil cargado (null), se ven todos: no sabemos, así que no ocultamos.

type Regla = [RegExp, (n: NutricionFlags) => boolean];

const algunaAlergia = (n: NutricionFlags) => Object.values(n.alergias ?? {}).some(Boolean);

const REGLAS: Regla[] = [
  [/warfarina|anticoagul/i, (n) => !!n.anticoagulantes],
  [/tragar|masticar|textura|disfagia|atragant|consistencia/i, (n) => !!n.disfagia],
  [/potasio|c[áa]lculos/i, (n) => !!n.potasio || !!n.renal],
  [/renal|ri[ñn][óo]n/i, (n) => !!n.renal],
  [/\bgota\b/i, (n) => !!n.gota],
  [/diabetes/i, (n) => !!n.diabetes],
  [/sodio|presi[óo]n alta|hipertensi/i, (n) => !!n.sodio],
  [/l[íi]quidos/i, (n) => !!n.restriccion_liquidos],
  [/cel[íi]ac|gluten/i, (n) => !!n.celiaquia],
  [/bajo peso|poco apetito|desnutrici/i, (n) => !!n.desnutricion],
  [/alergia al pescado|alergia a los mariscos/i, (n) => !!n.alergias?.pescado],
  [/alergia al huevo/i, (n) => !!n.alergias?.huevo],
  [/alergia a la (prote[íi]na de la )?leche|alergia a los l[áa]cteos/i, (n) => !!n.alergias?.leche],
  [/alergia a (los )?(frutos secos|nueces|man[íi])/i, (n) => !!n.alergias?.frutos_secos],
  // «Con alergia, evitalo»: cualquier alergia registrada.
  [/\balergias?\b(?! a| al)/i, algunaAlergia],
];

// A qué condiciones apunta un cuidado (vacío: es general).
export const condicionesDe = (texto: string) => REGLAS.filter(([re]) => re.test(texto));

export function cuidadoAplica(texto: string, n: NutricionFlags | null | undefined): boolean {
  if (!n) return true;
  const reglas = condicionesDe(texto);
  return reglas.length === 0 || reglas.some(([, aplica]) => aplica(n));
}

export function cuidadosQueAplican(items: Item[], n: NutricionFlags | null | undefined): Item[] {
  return items.filter((i) => cuidadoAplica(i.texto, n));
}
