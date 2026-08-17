// "Motor de Decisiones Clínicas" — internal only, never shown to the user.
// Computes five independent severity profiles from the onboarding answers,
// used solely to personalize content difficulty. Where the source spec's
// tables don't cover an edge case explicitly, this applies one consistent
// fallback throughout: any red-tier variable that isn't itself an explicit
// auto-trigger still counts toward "amarillo" (never silently ignored), and
// two or more amber variables also read as "amarillo" — only the specific
// auto-triggers named in the spec (documented inline below) force "rojo".

import type { Answers } from "./onboardingSchema";
import type { Semaforo } from "./mockData";

export type Tier = Semaforo; // "verde" | "amarillo" | "rojo"

export interface Profiles {
  cognitivo: Tier;
  movimiento: Tier;
  funcional: Tier;
  nutricional: Tier;
  conductual: Tier | null; // null = module wasn't applicable, not evaluated
}

function tierOf(value: unknown, map: Record<string, Tier | null>): Tier | null {
  if (typeof value !== "string") return null;
  return map[value] ?? null;
}

function worstOfRest(tiers: (Tier | null)[]): Tier {
  if (tiers.includes("rojo")) return "rojo";
  if (tiers.some((t) => t === "amarillo")) return "amarillo";
  return "verde";
}

const freq4Tier: Record<string, Tier | null> = {
  nunca: "verde",
  algunas: "amarillo",
  frecuente: "rojo",
  no_seguro: null,
};

function cognitivo(a: Answers): Tier {
  // Auto-trigger: following only one instruction (or none) is Rojo outright.
  if (a.memoria_instrucciones === "una") return "rojo";
  const instruccionesTier: Tier | null =
    a.memoria_instrucciones === "varias" ? "verde" : a.memoria_instrucciones === "dos" ? "amarillo" : null;
  return worstOfRest([
    tierOf(a.memoria_repite, freq4Tier),
    tierOf(a.memoria_olvida, freq4Tier),
    tierOf(a.memoria_desorientacion, freq4Tier),
    tierOf(a.memoria_lenguaje, freq4Tier),
    instruccionesTier,
  ]);
}

function movimiento(a: Answers): Tier {
  // Auto-trigger: two or more falls is a high fall risk — Rojo outright.
  if (a.movimiento_caidas === "dos_mas") return "rojo";
  const desplazamiento: Record<string, Tier> = {
    sin_ayuda: "verde",
    baston: "amarillo",
    andadera: "amarillo",
    apoyo_persona: "rojo",
    silla_ruedas: "rojo",
    sentado_cama: "rojo",
  };
  const seguridad: Record<string, Tier> = {
    completamente_seguro: "verde",
    a_veces_inseguro: "amarillo",
    necesita_apoyo: "rojo",
    no_puede_caminar: "rojo",
  };
  const caidas: Record<string, Tier | null> = { ninguna: "verde", una: "amarillo", dos_mas: "rojo", no_seguro: null };
  const levantarse: Record<string, Tier> = {
    sin_dificultad: "verde",
    con_impulso: "amarillo",
    necesita_ayuda: "rojo",
    no_puede: "rojo",
  };
  const depie: Record<string, Tier> = { sin_apoyo: "verde", poco_tiempo: "amarillo", necesita_apoyo: "rojo", no_puede: "rojo" };
  return worstOfRest([
    tierOf(a.movimiento_desplazamiento, desplazamiento),
    tierOf(a.movimiento_seguridad, seguridad),
    tierOf(a.movimiento_caidas, caidas),
    tierOf(a.movimiento_levantarse, levantarse),
    tierOf(a.movimiento_depie, depie),
  ]);
}

function funcional(a: Answers): Tier {
  const vars = [
    a.funcional_medicamentos,
    a.funcional_desayuno,
    a.funcional_ropa,
    a.funcional_banarse,
    a.funcional_compra,
    a.funcional_telefono,
  ];
  const reds = vars.filter((v) => v === "no_puede").length;
  const ambers = vars.filter((v) => v === "con_ayuda").length;
  // Spec: "dos o más actividades en Rojo -> Rojo. Predominio de 'con ayuda' -> Amarillo."
  if (reds >= 2) return "rojo";
  if (reds >= 1 || ambers >= 1) return "amarillo";
  return "verde";
}

function nutricional(a: Answers): Tier {
  // Auto-trigger: frequent difficulty swallowing — Rojo, and general
  // recommendations are withheld (handled by callers, not scoring here).
  if (a.nutricion_masticar_tragar === "frecuentemente") return "rojo";
  // "Importante" weight loss combined with eating less reads as the
  // spec's "pérdida de peso importante + menor ingesta" red signal.
  const pesoRojo = a.nutricion_perdida_peso === "si" && a.nutricion_come_menos === "si";
  if (pesoRojo) return "rojo";
  const pesoTier: Tier | null = a.nutricion_perdida_peso === "si" || a.nutricion_come_menos === "si" ? "amarillo" : "verde";
  const masticar: Record<string, Tier | null> = { no: "verde", a_veces: "amarillo", frecuentemente: "rojo", no_se: null };
  const ultra: Record<string, Tier> = {
    casi_nunca: "verde",
    "1_2_semana": "amarillo",
    "3_mas_semana": "rojo",
    todos_dias: "rojo",
  };
  const frutas: Record<string, Tier> = {
    todos_dias: "verde",
    "3_mas_semana": "verde",
    "1_2_semana": "amarillo",
    casi_nunca: "rojo",
  };
  const agua: Record<string, Tier | null> = { menos_3: "rojo", "3_5": "amarillo", "6_8": "verde", mas_8: "verde", no_se: null };
  return worstOfRest([
    pesoTier,
    tierOf(a.nutricion_masticar_tragar, masticar),
    tierOf(a.nutricion_ultraprocesados, ultra),
    tierOf(a.nutricion_frutas_veg, frutas),
    tierOf(a.nutricion_agua, agua),
  ]);
}

function conductual(a: Answers): Tier | null {
  const applicable = ["conductual_irritabilidad", "conductual_ideas_falsas", "conductual_deambulacion", "conductual_ansiedad"].some(
    (id) => typeof a[id] === "string",
  );
  if (!applicable) return null;
  const scale3: Record<string, Tier> = { no: "verde", ocasional: "amarillo", frecuente: "rojo", leve: "amarillo", severa: "rojo" };
  const tiers = [a.conductual_irritabilidad, a.conductual_ideas_falsas, a.conductual_deambulacion, a.conductual_ansiedad].map((v) =>
    tierOf(v, scale3),
  );
  // Spec: any behavior that represents a safety risk moves the whole
  // profile to Rojo automatically — a single "frecuente/severa" is enough.
  if (tiers.includes("rojo")) return "rojo";
  return worstOfRest(tiers);
}

export function computeProfiles(a: Answers): Profiles {
  return {
    cognitivo: cognitivo(a),
    movimiento: movimiento(a),
    funcional: funcional(a),
    nutricional: nutricional(a),
    conductual: conductual(a),
  };
}

export function overallTier(p: Profiles): Tier {
  const tiers = [p.cognitivo, p.movimiento, p.funcional, p.nutricional, p.conductual].filter((t): t is Tier => t !== null);
  if (tiers.includes("rojo")) return "rojo";
  if (tiers.includes("amarillo")) return "amarillo";
  return "verde";
}
