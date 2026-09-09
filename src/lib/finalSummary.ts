// §13 RES-01 — resumen personalizado de cierre del cuestionario.
//
// Implementación determinística por plantillas (no LLM sin restricciones):
// cada elemento permitido (§13) se arma a partir de un valor concreto de las
// respuestas, nunca de texto libre generado sin control. `validateFinalSummary`
// existe como red de seguridad reutilizable — hoy es redundante porque esta
// función solo puede producir salidas conformes por construcción, pero es la
// misma validación que debe aplicarse si el generador se reemplaza más
// adelante por un LLM (decisión ya tomada por el usuario: "LLM con
// validación estricta posterior" — pendiente de una API key de Anthropic).
import type { Answers } from "./onboardingSchema";
import { nombreConTratamiento, participanteEsRespondente } from "./respondentVoice";

const interesLabels: Record<string, string> = {
  musica: "la música",
  fotos_recuerdos: "ver fotografías y recordar momentos",
  conversar: "conversar y compartir",
  leer: "la lectura",
  escribir: "escribir",
  cocinar: "la cocina",
  jardineria: "la jardinería",
  caminar: "caminar",
  bailar: "bailar",
  pintar_manualidades: "las manualidades",
  juegos_mesa: "los juegos de mesa",
  deportes_ver: "ver deportes",
  religioso_espiritual: "las actividades espirituales",
  cuidar_animales: "cuidar animales",
  television_peliculas: "ver televisión",
};

function pickIntereses(a: Answers): string {
  const raw = Array.isArray(a.intereses_actuales) ? a.intereses_actuales : [];
  const picked = raw.map((v) => interesLabels[v]).filter((x): x is string => !!x).slice(0, 2);
  if (picked.length === 0) return "";
  return picked.length === 1 ? picked[0] : `${picked[0]} y ${picked[1]}`;
}

function pickFortaleza(a: Answers): string {
  if (a.interes_iniciativa === "conserva_inicia") return "conserva iniciativa propia para participar en actividades";
  if (a.participacion_actividades_cotidianas === "iniciativa_propia") return "participa por iniciativa propia en tareas cotidianas";
  if (a.estructura_rutina_diaria === "estable") return "mantiene una rutina diaria bastante estable";
  if (a.percepcion_compania === "satisfecho") return "disfruta del contacto y la compañía de quienes le rodean";
  if (a.comprension_consignas === "varios_pasos") return "comprende bien instrucciones con varios pasos";
  if (a.disposicion_movimiento === "le_gusta_participa") return "le gusta participar en actividades de movimiento";
  return "muestra disposición para participar en las actividades que se le proponen";
}

function pickNecesidadApoyo(a: Answers): string {
  if (a.comprension_consignas === "otra_guia_completa") return "necesita que otra persona le guíe durante toda la actividad";
  if (a.comprension_consignas === "una_instruccion_demostracion") return "se beneficia de una instrucción a la vez y una demostración";
  if (a.comprension_consignas === "uno_dos_pasos") return "se beneficia de instrucciones breves, de uno o dos pasos";
  if (["ayuda_directa", "otra_persona"].includes(a.avdi_preparacion_alimentos as string)) return "necesita apoyo para preparar alimentos";
  if (["necesita_sostenido", "no_puede_pie"].includes(a.equilibrio_de_pie as string)) return "necesita acompañamiento para mantenerse de pie con seguridad";
  if (typeof a.origen_cambio_funcional === "string" && a.origen_cambio_funcional) return "se beneficia de recordatorios para organizar algunas tareas cotidianas";
  return "se beneficia de recordatorios y acompañamiento para organizar algunas actividades";
}

// Único elemento opcional del resumen (§13, punto 4: "si existe") — se omite
// por completo cuando no hay ninguna consideración relevante, en vez de
// forzar una frase de seguridad genérica.
function pickSeguridad(a: Answers): string | null {
  if (a.movilidad_dentro_casa === "baston") return "utiliza bastón para caminar";
  if (a.movilidad_dentro_casa === "andadera") return "utiliza andadera para caminar";
  const caidaRelevante = Array.isArray(a.consecuencias_caida) && a.consecuencias_caida.some((v) => v !== "no" && v !== "no_se");
  if (caidaRelevante) return "conviene tomar precauciones adicionales al caminar, dado un episodio reciente";
  if (a.respuesta_demanda_cognitiva === "cansa_despues" || a.respuesta_demanda_cognitiva === "frustra_sobrecarga") {
    return "suele cansarse después de varios minutos de actividad";
  }
  return null;
}

function pickAcompanamiento(a: Answers): string {
  switch (a.disponibilidad_acompanante) {
    case "diario":
      return "cuenta con acompañamiento familiar todos o casi todos los días";
    case "varias_semana":
      return "cuenta con acompañamiento familiar varias veces por semana";
    case "ocasional":
      return "cuenta con acompañamiento familiar de forma ocasional";
    case "sin_acompanante":
      return "por ahora no cuenta con una persona disponible para acompañarle en algunas actividades";
    default:
      return "iremos conociendo con quién cuenta para acompañarle en algunas actividades";
  }
}

export function buildFinalSummary(a: Answers): string {
  const nombre = nombreConTratamiento(a);
  const esPropia = participanteEsRespondente(a);
  const intereses = pickIntereses(a);
  const fortaleza = pickFortaleza(a);
  const necesidad = pickNecesidadApoyo(a);
  const seguridad = pickSeguridad(a);
  const acompanamiento = pickAcompanamiento(a);

  const s1 = esPropia ? "Nos encantó conocerte un poco más." : `Nos encantó conocer un poco más sobre ${nombre}.`;
  const s2 = intereses
    ? esPropia
      ? `Sos una persona que disfruta ${intereses}.`
      : `Es una persona que disfruta ${intereses}.`
    : esPropia
      ? "Iremos conociendo mejor tus gustos en las próximas semanas."
      : `Iremos conociendo mejor los gustos de ${nombre} en las próximas semanas.`;
  const s3 = `Actualmente ${fortaleza}, aunque ${necesidad}.`;
  const s4 = seguridad ? `También tomaremos en cuenta que ${seguridad}.` : null;
  const s5 = `Como ${acompanamiento}, combinaremos actividades que pueda realizar por sí mismo con otras para compartir.`;
  const s6 = esPropia
    ? "Prepararemos tu Plan de Salud Cerebral a partir de tus capacidades actuales, tus necesidades de apoyo y las experiencias que han sido significativas para vos."
    : `Prepararemos el Plan de Salud Cerebral de ${nombre} a partir de sus capacidades actuales, sus necesidades de apoyo y las experiencias que han sido significativas para él o ella.`;

  return [s1, s2, s3, s4, s5, s6].filter((x): x is string => !!x).join(" ");
}

const FORBIDDEN_PATTERNS = [
  /\bverde\b/i,
  /\bamarillo\b/i,
  /\brojo\b/i,
  /alucinaci/i,
  /delirio/i,
  /desinhibici/i,
  /diagn[oó]stic/i,
  /garantiz/i,
  /promet/i,
  /sustituye la atenci[oó]n profesional|reemplaza (la|una) (atenci[oó]n|valoraci[oó]n)/i,
];

// Red de seguridad reutilizable para cualquier generador de RES-01 (§13):
// rechaza (no recorta) una salida que viole alguna de las reglas duras.
export function validateFinalSummary(text: string): boolean {
  if (!text.trim() || text.length > 1200) return false;
  return !FORBIDDEN_PATTERNS.some((re) => re.test(text));
}
