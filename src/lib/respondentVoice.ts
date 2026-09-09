// Motor de plantillas de voz/tratamiento — resuelve las variables de
// identidad del §4 de business/general_rules.md (`rol_respondente`,
// `participante_es_respondente`, `nombre_participante`, `tratamiento_preferido`,
// `referencia_persona`, `relacion_otro`) contra las respuestas de las
// Pantallas 1-3, para que cada pregunta pueda resolver "vos" / "[nombre]" /
// "don Juan" / "tu familiar" / "su paciente" dinámicamente (§3.1) en vez de
// tener cada variante hardcodeada pantalla por pantalla.
import type { Answers } from "./onboardingSchema";

export type RolRespondente = "propia_persona" | "familiar" | "cuidador" | "profesional" | "otra_persona";

// El documento fuente reutiliza el mismo texto para "familiar" y "cuidador"
// en casi todas las transiciones (§3.1, §6 Etapa 2, §7.1 SG-00, etc.) y no
// define copy separado para "otra persona" — se agrupa con el mismo tono de
// tercera persona que familiar/cuidador.
export type VoiceGroup = "propia_persona" | "familiar_cuidador" | "profesional";

export function rolRespondente(a: Answers): RolRespondente | null {
  const v = a.rol_respondente;
  return typeof v === "string" && v ? (v as RolRespondente) : null;
}

export function participanteEsRespondente(a: Answers): boolean {
  return rolRespondente(a) === "propia_persona";
}

export function voiceGroup(a: Answers): VoiceGroup {
  const rol = rolRespondente(a);
  if (rol === "propia_persona") return "propia_persona";
  if (rol === "profesional") return "profesional";
  return "familiar_cuidador"; // familiar, cuidador, otra_persona, o sin responder todavía
}

function nombreParticipante(a: Answers): string {
  return typeof a.nombre_participante === "string" ? a.nombre_participante.trim() : "";
}

// §3.1, fila "Nombre no ingresado": si todavía no hay nombre, cada frase cae
// a una forma genérica en vez de dejar "[nombre]" sin resolver.
const SIN_NOMBRE_GENERICO = "la persona que realizará las actividades";

// La forma de nombrar a la persona dentro de una oración en tercera persona
// — "[nombre]", "don Juan", "doña Ana", o el genérico si no hay nombre.
// `tratamiento_preferido` = nombre_simple | don_dona | sin_tratamiento (Pantalla 3).
// El documento no define cómo se decide "don" vs "doña" — se agrega
// `tratamiento_genero` (don | doña) como sub-pregunta solo cuando se elige
// "don_dona", ver Fase 2.
export function nombreConTratamiento(a: Answers): string {
  const nombre = nombreParticipante(a);
  if (!nombre) return SIN_NOMBRE_GENERICO;
  if (a.tratamiento_preferido === "don_dona") {
    const genero = a.tratamiento_genero === "dona" ? "doña" : "don";
    return `${genero} ${nombre}`;
  }
  return nombre;
}

// El pronombre/referencia usada para hablar DE la persona (no para
// dirigirse al respondente) — "vos" cuando la propia persona responde por
// sí misma, o el nombre/tratamiento resuelto en los demás casos. Úsese
// dentro de oraciones como `Queremos conocer un poco mejor a ${referenciaPersona(a)}`.
export function referenciaPersona(a: Answers): string {
  if (participanteEsRespondente(a)) return "vos";
  return nombreConTratamiento(a);
}

// La forma corta usada en §3.1 para "tu familiar"/"su paciente" cuando la
// oración ya trae su propio verbo/posesivo y no necesita el nombre — ej.
// "Esta información nos ayudará a seleccionar recomendaciones adecuadas y
// seguras para ${referenciaPosesiva(a)}".
export function referenciaPosesiva(a: Answers): string {
  const group = voiceGroup(a);
  if (group === "propia_persona") return "vos";
  if (group === "profesional") return "su paciente";
  return nombreConTratamiento(a) === SIN_NOMBRE_GENERICO ? "su familiar" : nombreConTratamiento(a);
}

export function relacionOtro(a: Answers): string {
  return typeof a.relacion_otro === "string" ? a.relacion_otro.trim() : "";
}
