// Single source of truth for "what does everyone see about Rosa" — every
// role's view (familiar, participante, profesional) reads through these
// helpers instead of re-deriving its own copy of the same fact.

import { questions, resolveOptions, type Answers } from "./onboardingSchema";
import { computeProfiles } from "./clinicalEngine";
import { computeActiveAlerts } from "./alertsEngine";
import type { PlanDay, PlanTask } from "./mockData";

const DEFAULT_NAME = "Rosa Jiménez";
const DEFAULT_AGE = "79";
const DEFAULT_INTERESTS = ["Cocinar", "Música", "Plantas y jardín"];

export function getPatientName(a: Answers): string {
  const v = a.nombre_participante;
  return typeof v === "string" && v.trim() ? v.trim() : DEFAULT_NAME;
}

export function getPatientAge(a: Answers): string {
  const v = a.edad;
  return typeof v === "string" && v.trim() ? v.trim() : DEFAULT_AGE;
}

function labelFor(questionId: string, a: Answers): string | undefined {
  const value = a[questionId];
  if (typeof value !== "string") return undefined;
  const q = questions.find((qq) => qq.id === questionId);
  if (!q) return undefined;
  return resolveOptions(q, a).find((o) => o.value === value)?.label;
}

export function getInterestLabels(a: Answers): string[] {
  const raw = a.intereses_actuales;
  const list = Array.isArray(raw) ? raw.filter((v) => v !== "otra" && v !== "poco_interes" && v !== "no_se") : [];
  const q = questions.find((qq) => qq.id === "intereses_actuales");
  const opts = q ? resolveOptions(q, a) : [];
  const labels = list.map((v) => opts.find((o) => o.value === v)?.label).filter((x): x is string => !!x);
  return labels.length >= 2 ? labels : DEFAULT_INTERESTS;
}

// The one thing familiar Hoy, the activity detail page, and the participant's
// Hoy/Pasos all read — guaranteeing they show the same activity. Prefers the
// first task that isn't done yet, so once it's marked "realizado" the next
// task of the day (if any) naturally becomes the featured one.
export function todayFeaturedTask(plan: PlanDay[]): { day: PlanDay; task: PlanTask } | null {
  const day = plan.find((d) => d.isToday);
  if (!day || day.tasks.length === 0) return null;
  const task = day.tasks.find((t) => t.estado !== "realizado") ?? day.tasks[0];
  return { day, task };
}

export function computeAdherencia(plan: PlanDay[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const day of plan) {
    for (const task of day.tasks) {
      if (task.estado === "futuro") continue; // not due yet — doesn't count either way
      total += 1;
      if (task.estado === "realizado") done += 1;
    }
  }
  return { done, total };
}

const caidasSuffix: Record<string, string> = {
  no: "sin caídas registradas",
  casi_cae: "casi una caída registrada",
  una_vez: "una caída registrada",
  varias_veces: "caídas repetidas registradas",
};

export function summarizeProfile(a: Answers) {
  const banarse = labelFor("avdb_bano_aseo", a);
  const medicamentos = labelFor("manejo_medicamentos", a);
  const desplazamiento = labelFor("movilidad_dentro_casa", a);
  const caidas = typeof a.caidas_ultimos_6_meses === "string" ? caidasSuffix[a.caidas_ultimos_6_meses] : undefined;
  const comprension = labelFor("comprension_consignas", a);

  return {
    autonomia:
      banarse || medicamentos
        ? `Baño: ${banarse ?? "sin registrar"} · Medicamentos: ${(medicamentos ?? "sin registrar").toLowerCase()}`
        : "Perfil funcional pendiente de completar.",
    movilidad: desplazamiento ? `${desplazamiento}${caidas ? ` · ${caidas}` : ""}` : "Perfil de movimiento pendiente de completar.",
    comprension: comprension ? comprension : "Comprensión pendiente de evaluar.",
    intereses: getInterestLabels(a).join(" · "),
  };
}

export interface PlanRestriction {
  texto: string;
  color: "verde" | "amarillo" | "rojo";
}

// Turns the internal severity profiles into the concrete "what changes in
// the plan" copy the professional sees while editing — the engine's tiers
// stay internal, but their consequences for planning don't. The 4 axes
// (§8/§9/§10) stay independent here too — each contributes its own
// restriction line, never merged into one combined verdict.
export function getPlanRestrictions(a: Answers): PlanRestriction[] {
  const profiles = computeProfiles(a);
  const alertas = computeActiveAlerts(a);
  const items: PlanRestriction[] = [];

  if (profiles.fisico === "rojo" || alertas.some((al) => al.codigo === "alerta_caida")) {
    items.push({ texto: "Sin ejercicios de pie con desplazamiento — antecedente de caídas.", color: "rojo" });
  } else if (profiles.fisico === "amarillo") {
    items.push({ texto: "Actividades de pie solo con apoyo firme cerca.", color: "amarillo" });
  }

  if (a.comprension_consignas === "otra_guia_completa" || profiles.cognitivo === "rojo") {
    items.push({ texto: "Una sola instrucción a la vez, sin combinarla con otra tarea.", color: "rojo" });
  } else if (profiles.cognitivo === "amarillo") {
    items.push({ texto: "Máximo dos instrucciones seguidas antes de repetir.", color: "amarillo" });
  }

  if (alertas.some((al) => al.codigo === "alerta_deglucion") || profiles.nutricional === "rojo") {
    items.push({ texto: "Supervisión estrecha al comer — señales de dificultad para tragar.", color: "rojo" });
  } else if (profiles.nutricional === "amarillo") {
    items.push({ texto: "Priorizar frutas, vegetales y agua sobre ultraprocesados.", color: "amarillo" });
  }

  if (items.length === 0) {
    items.push({ texto: "Sin restricciones críticas activas esta semana.", color: "verde" });
  }

  return items;
}
