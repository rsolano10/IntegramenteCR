// Onboarding conversation, as data — business/general_rules.md §6+.
// One question per screen, adaptive: `applicable` skips a question when its
// condition isn't met, `options`/`title`/`body` can depend on prior answers.

import { voiceGroup, nombreConTratamiento, participanteEsRespondente, referenciaPosesiva } from "./respondentVoice";

export type Answers = Record<string, string | string[]>;

export interface Option {
  value: string;
  label: string;
}

export interface Warning {
  when: (value: string) => boolean;
  message: string;
  ctaLabel: string;
  to: string;
}

// A growing share of the questionnaire's copy depends on who's answering
// (§3.1/§4 of business/general_rules.md: "vos" for the person themself, "tu
// familiar"/"su paciente" etc. otherwise) — title/subtitle/body/cta can be a
// plain string (existing questions) or resolved against the VoiceContext
// built from the identification screens (see respondentVoice.ts).
export interface Question {
  id: string;
  module?: string;
  title: string | ((a: Answers) => string);
  subtitle?: string | ((a: Answers) => string);
  example?: string;
  type: "single" | "multi" | "text" | "info";
  options?: Option[] | ((a: Answers) => Option[]);
  exclusive?: string[];
  // Caps how many values a multi-select question accepts (e.g. EMO-01 "máx.
  // 2 respuestas", RUT-06/INT-03 "hasta 3 opciones") — enforced by
  // toggleMultiAnswer, not just documented in the option list.
  maxSelect?: number;
  applicable?: (a: Answers) => boolean;
  warning?: Warning;
  body?: string | ((a: Answers) => string);
  cta?: string;
}

export function resolveText(value: string | ((a: Answers) => string) | undefined, a: Answers): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "function" ? value(a) : value;
}

// §8.4: escala común fija para todas las preguntas AVDI (visualmente
// consistente, reutilizada tal cual en cada pregunta del subbloque).
const avdiScale: Option[] = [
  { value: "independiente", label: "Lo realiza por sí mismo" },
  { value: "recordatorios_supervision", label: "Lo realiza con recordatorios o supervisión" },
  { value: "ayuda_directa", label: "Necesita ayuda directa" },
  { value: "otra_persona", label: "Otra persona debe hacerlo por completo" },
  { value: "nunca_realizada", label: "Nunca ha realizado esta actividad" },
  { value: "no_se", label: "No lo sé" },
];

// §8.5: escala común fija para AVDB.
const avdbScale: Option[] = [
  { value: "independiente", label: "Lo realiza por sí mismo" },
  { value: "recordatorios_supervision", label: "Necesita recordatorios o supervisión" },
  { value: "ayuda_parcial", label: "Necesita ayuda parcial" },
  { value: "otra_persona", label: "Otra persona debe hacerlo" },
  { value: "no_se", label: "No lo sé" },
];

const avdiKeys = ["avdi_finanzas", "avdi_compras_organizacion", "avdi_preparacion_alimentos", "avdi_telefono", "avdi_agenda_responsabilidades"];

function avdiNecesitaAyuda(a: Answers): boolean {
  return avdiKeys.some((k) => ["recordatorios_supervision", "ayuda_directa", "otra_persona"].includes(a[k] as string));
}

function avdiAyudaDirectaCount(a: Answers): number {
  return avdiKeys.filter((k) => ["ayuda_directa", "otra_persona"].includes(a[k] as string)).length;
}

// §8.3: aparece únicamente si existe síndrome demencial, se reportaron
// cambios de ánimo/conducta tras un evento de salud (SG-03A), hay
// irritabilidad marcada (EMO-01) o la conducta es la preocupación
// principal (EVOL-03).
function condConductualAplicable(a: Answers): boolean {
  const demencia = a.diagnostico_cognitivo_informado === "demencia";
  const eventosConducta =
    Array.isArray(a.cambios_posteriores_evento) &&
    (a.cambios_posteriores_evento.includes("animo_conducta") || a.cambios_posteriores_evento.includes("varias_areas"));
  const irritabilidadMarcada = Array.isArray(a.estado_emocional_actual) && a.estado_emocional_actual.includes("irritable");
  const preocupacionConducta = a.preocupacion_principal === "conducta";
  return demencia || eventosConducta || irritabilidadMarcada || preocupacionConducta;
}

// §8.5: aparece si hay demencia moderada/avanzada, ayuda directa en 2+ AVDI,
// u otra persona guía toda la actividad (COG-04). El documento agrega un
// cuarto disparador ("dificultades físicas importantes"), pero esa variable
// vive en el Bloque 3 (Movimiento, §9), que en el flujo lineal se responde
// DESPUÉS de este bloque — no es evaluable aquí en un recorrido hacia
// adelante. Se deja fuera intencionalmente (agregarla sería código muerto);
// queda registrado para la revisión de la Fase 12.
function avdbAplicable(a: Answers): boolean {
  const demenciaAvanzada = a.etapa_demencia_informada === "moderada" || a.etapa_demencia_informada === "avanzada";
  const dosOMasAvdi = avdiAyudaDirectaCount(a) >= 2;
  const otraGuiaTodo = a.comprension_consignas === "otra_guia_completa";
  return demenciaAvanzada || dosOMasAvdi || otraGuiaTodo;
}

// §9.6: aparece si se reportó dolor crónico/artritis (Bloque 1), dolor
// durante el movimiento, una caída con lesión persistente, o cirugía
// reciente.
function zonasLimitacionAplicable(a: Answers): boolean {
  const dolorCronico = Array.isArray(a.antecedentes_medicos) && a.antecedentes_medicos.includes("dolor_cronico");
  const dolorMovimiento = Array.isArray(a.sintomas_durante_movimiento) && a.sintomas_durante_movimiento.includes("dolor");
  const caidaConLesion =
    Array.isArray(a.consecuencias_caida) && (a.consecuencias_caida.includes("fractura") || a.consecuencias_caida.includes("dolor_continua"));
  const cirugiaReciente = Array.isArray(a.eventos_salud_ultimo_anio) && a.eventos_salud_ultimo_anio.includes("cirugia");
  return dolorCronico || dolorMovimiento || caidaConLesion || cirugiaReciente;
}

export const questions: Question[] = [
  // §6 Etapa 1 — Bienvenida y definición de quién responde.
  {
    id: "bienvenida",
    type: "info",
    title: "Bienvenido a IntegraMente en Casa",
    body: "Nos alegra acompañarte. Antes de comenzar, queremos conocer un poco más sobre la persona que realizará las actividades. Esto nos permitirá preparar recomendaciones que realmente se ajusten a sus necesidades, capacidades e intereses. Solo tomará unos minutos.",
    cta: "Comenzar",
  },
  {
    id: "rol_respondente",
    type: "single",
    title: "Para comenzar, cuéntanos: ¿quién está completando esta información?",
    options: [
      { value: "propia_persona", label: "Estoy respondiendo para mí" },
      { value: "familiar", label: "Soy familiar de la persona" },
      { value: "cuidador", label: "Soy su cuidador o cuidadora" },
      { value: "profesional", label: "Soy un profesional" },
      { value: "otra_persona", label: "Otra persona" },
    ],
  },
  {
    id: "relacion_otro",
    type: "text",
    title: "¿Cuál es tu relación con la persona que completará el plan?",
    applicable: (a) => a.rol_respondente === "otra_persona",
  },

  // §6 Etapa 2 — Conocer a la persona.
  {
    id: "transicion_conocer_persona",
    type: "info",
    title: "Conozcamos a la persona",
    body: (a) => {
      const group = voiceGroup(a);
      if (group === "propia_persona") {
        return "Queremos conocerte un poco mejor. Con esta información podremos preparar actividades y recomendaciones más cercanas a tu realidad.";
      }
      if (group === "profesional") {
        return "Queremos conocer un poco mejor a su paciente. La información permitirá adaptar el contenido a sus características y necesidades actuales.";
      }
      return "Queremos conocer un poco mejor a tu familiar. Con esta información podremos preparar actividades y recomendaciones que se ajusten a su vida cotidiana.";
    },
    cta: "Continuar",
  },
  {
    id: "nombre_participante",
    module: "Conozcamos a la persona",
    type: "text",
    title: (a) => (participanteEsRespondente(a) ? "¿Cómo te gustaría que te llamemos?" : "¿Cómo se llama la persona para quien prepararemos el plan?"),
  },
  {
    id: "tratamiento_preferido",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Cómo prefieres que nos refiramos a él o ella?",
    options: [
      { value: "nombre_simple", label: "Nombre simple (ej. Juan)" },
      { value: "don_dona", label: "Don-Doña + Nombre (ej. Don Juan)" },
      { value: "sin_tratamiento", label: "Sin tratamiento específico" },
    ],
  },
  {
    // El documento no define cómo se decide "don" vs "doña" — se agrega
    // esta sub-pregunta solo cuando se elige "Don-Doña + Nombre".
    id: "tratamiento_genero",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Don o doña?",
    options: [
      { value: "don", label: "Don" },
      { value: "dona", label: "Doña" },
    ],
    applicable: (a) => a.tratamiento_preferido === "don_dona",
  },
  {
    id: "edad",
    module: "Conozcamos a la persona",
    type: "text",
    title: (a) => (participanteEsRespondente(a) ? "¿Cuántos años tienes?" : `¿Cuántos años tiene ${nombreConTratamiento(a)}?`),
    example: 'Si no la conocés con exactitud, escribí un aproximado o "No lo sé".',
  },
  {
    id: "escolaridad",
    module: "Conozcamos a la persona",
    type: "single",
    title: (a) => `¿Cuál es el nivel educativo más alto que completó ${nombreConTratamiento(a)}?`,
    options: [
      { value: "no_asistio", label: "No asistió a educación formal" },
      { value: "primaria_incompleta", label: "Primaria incompleta" },
      { value: "primaria_completa", label: "Primaria completa" },
      { value: "secundaria_incompleta", label: "Secundaria incompleta" },
      { value: "secundaria_completa", label: "Secundaria completa" },
      { value: "tecnica", label: "Formación técnica" },
      { value: "universidad", label: "Universidad" },
      { value: "posgrado", label: "Posgrado" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "situacion_ocupacional_actual",
    module: "Conozcamos a la persona",
    type: "single",
    title: (a) => `¿Actualmente ${nombreConTratamiento(a)} trabaja, está pensionado o realiza principalmente actividades en casa?`,
    options: [
      { value: "trabaja", label: "Trabaja actualmente" },
      { value: "pensionado", label: "Está pensionado o jubilado" },
      { value: "hogar", label: "Se dedica principalmente al hogar" },
      { value: "voluntariado", label: "Realiza trabajo voluntario" },
      { value: "no_trabaja", label: "No trabaja actualmente" },
      { value: "otro", label: "Otro" },
    ],
  },
  {
    // La ocupación se usa para generar actividades significativas más
    // adelante (ej. "como trabajó de comerciante, incluiremos actividades
    // de organización y cálculo cotidiano") — se deja disponible para el
    // motor de personalización, no solo como dato demográfico.
    id: "ocupacion_principal",
    module: "Conozcamos a la persona",
    type: "text",
    title: "¿A qué se dedicó la mayor parte de su vida?",
    example: "Por ejemplo: docente, agricultor, comerciante, ama de casa, secretaria, profesional en salud… (podés dejarlo en blanco si preferís responder después o no lo sabés)",
  },
  {
    id: "convivencia_actual",
    module: "Conozcamos a la persona",
    type: "multi",
    title: (a) => `¿Con quién vive actualmente ${nombreConTratamiento(a)}?`,
    options: [
      { value: "solo", label: "Vive solo" },
      { value: "pareja", label: "Con su pareja" },
      { value: "familiares", label: "Con hijos u otros familiares" },
      { value: "cuidador", label: "Con una persona cuidadora" },
      { value: "residencia", label: "En una residencia o centro" },
      { value: "otro", label: "Otro" },
    ],
  },
  {
    id: "frecuencia_apoyo",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Cuenta con alguien que lo visite o le ayude con regularidad?",
    options: [
      { value: "todos_los_dias", label: "Sí, todos los días" },
      { value: "varias_semana", label: "Sí, varias veces por semana" },
      { value: "ocasional", label: "Ocasionalmente" },
      { value: "sin_apoyo", label: "No cuenta con apoyo habitual" },
      { value: "no_se", label: "No lo sé" },
    ],
    applicable: (a) => Array.isArray(a.convivencia_actual) && a.convivencia_actual.includes("solo"),
  },
  {
    id: "mejor_momento_dia",
    module: "Conozcamos a la persona",
    type: "single",
    title: (a) => `¿En qué momento del día suele sentirse o desenvolverse mejor ${nombreConTratamiento(a)}?`,
    options: [
      { value: "manana", label: "En la mañana" },
      { value: "mediodia", label: "Al mediodía" },
      { value: "tarde", label: "En la tarde" },
      { value: "noche", label: "En la noche" },
      { value: "varia", label: "Varía mucho" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // §6 Etapa 3 — Transición hacia los bloques clínicos.
  {
    id: "transicion_bloques_clinicos",
    type: "info",
    title: "Antes de seguir",
    body: (a) =>
      `Gracias. Ya conocemos un poco mejor a ${nombreConTratamiento(a)}. Ahora te haremos algunas preguntas sobre su salud, su vida cotidiana y las actividades que disfruta. No hay respuestas correctas o incorrectas: queremos comprender qué le resulta fácil, en qué necesita apoyo y qué cosas son importantes para él o ella.`,
    cta: "Continuar",
  },

  // §7 Bloque 1 — Salud general, antecedentes médicos y cambios cognitivos.
  {
    id: "transicion_salud_general",
    type: "info",
    title: "Su salud general",
    body: (a) => {
      const group = voiceGroup(a);
      if (group === "propia_persona") {
        return "Ahora queremos conocer un poco sobre tu salud general y saber si has notado cambios en tu memoria o en tu manera de desenvolverte. Esta información nos ayudará a seleccionar recomendaciones adecuadas y seguras para vos.";
      }
      if (group === "profesional") {
        return `Ahora queremos conocer algunos antecedentes de salud de ${nombreConTratamiento(a)} y su situación cognitiva actual. Esta información permitirá adaptar el plan a sus necesidades y condiciones de seguridad.`;
      }
      return `Ahora queremos conocer un poco sobre la salud general de ${nombreConTratamiento(a)} y saber si han observado cambios en su memoria o en su manera de desenvolverse. Esta información nos ayudará a seleccionar recomendaciones adecuadas y seguras para ${referenciaPosesiva(a)}.`;
    },
    cta: "Continuar",
  },
  {
    id: "salud_general_percibida",
    module: "Salud general",
    type: "single",
    title: (a) => `En general, ¿cómo describirías la salud actual de ${nombreConTratamiento(a)}?`,
    options: [
      { value: "muy_buena", label: "Muy buena" },
      { value: "buena", label: "Buena" },
      { value: "regular", label: "Regular" },
      { value: "delicada", label: "Delicada" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "antecedentes_medicos",
    module: "Salud general",
    type: "multi",
    title: (a) => `¿Tiene ${nombreConTratamiento(a)} alguna de las siguientes condiciones de salud?`,
    exclusive: ["ninguna", "no_se"],
    options: [
      { value: "presion_alta", label: "Presión alta" },
      { value: "diabetes", label: "Diabetes" },
      { value: "colesterol", label: "Colesterol o triglicéridos elevados" },
      { value: "cardiaca", label: "Enfermedad del corazón" },
      { value: "derrame_microinfartos", label: "Antecedentes de derrame o microinfartos" },
      { value: "parkinson", label: "Parkinson" },
      { value: "epilepsia", label: "Epilepsia o convulsiones" },
      { value: "renal", label: "Enfermedad renal" },
      { value: "respiratoria", label: "Enfermedad respiratoria" },
      { value: "tiroides", label: "Enfermedad de tiroides" },
      { value: "dolor_cronico", label: "Dolor crónico, artritis o artrosis" },
      { value: "vision", label: "Problemas de visión" },
      { value: "audicion", label: "Problemas de audición" },
      { value: "cancer", label: "Cáncer" },
      { value: "depresion", label: "Depresión" },
      { value: "ansiedad", label: "Trastorno de ansiedad" },
      { value: "otra", label: "Otra condición" },
      { value: "ninguna", label: "Ninguna de las anteriores" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "otro_antecedente_medico",
    module: "Salud general",
    type: "text",
    title: "¿Cuál otra condición de salud deberíamos tomar en cuenta?",
    applicable: (a) => Array.isArray(a.antecedentes_medicos) && a.antecedentes_medicos.includes("otra"),
  },
  {
    id: "eventos_salud_ultimo_anio",
    module: "Salud general",
    type: "multi",
    title: (a) => `Durante el último año, ¿ha vivido ${nombreConTratamiento(a)} alguna de estas situaciones?`,
    exclusive: ["ninguna", "no_se"],
    options: [
      { value: "derrame", label: "Derrame o evento cerebrovascular" },
      { value: "golpe_cabeza", label: "Golpe importante en la cabeza" },
      { value: "convulsiones", label: "Convulsiones" },
      { value: "cirugia", label: "Cirugía importante" },
      { value: "hospitalizacion", label: "Hospitalización prolongada" },
      { value: "infeccion_grave", label: "Infección o enfermedad grave" },
      { value: "caida_lesion", label: "Caída con lesión" },
      { value: "ninguna", label: "Ninguna" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "cambios_posteriores_evento",
    module: "Salud general",
    type: "multi",
    title: (a) => `Después de esa situación, ¿notaron algún cambio en ${nombreConTratamiento(a)}?`,
    applicable: (a) =>
      Array.isArray(a.eventos_salud_ultimo_anio) &&
      a.eventos_salud_ultimo_anio.some((v) => v !== "ninguna" && v !== "no_se"),
    options: [
      { value: "memoria_pensamiento", label: "Sí, memoria/pensamiento" },
      { value: "animo_conducta", label: "Sí, ánimo o conducta" },
      { value: "movimiento_equilibrio", label: "Sí, movimiento o equilibrio" },
      { value: "independencia", label: "Sí, independencia" },
      { value: "varias_areas", label: "Sí, en varias áreas" },
      { value: "sin_cambios", label: "No notaron cambios" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "manejo_medicamentos",
    module: "Salud general",
    type: "single",
    title: (a) => `¿Toma ${nombreConTratamiento(a)} medicamentos de manera regular?`,
    options: [
      { value: "solo_organiza", label: "Sí, los organiza y toma por sí mismo" },
      { value: "recordatorios", label: "Sí, pero necesita recordatorios" },
      { value: "prepara_supervisa", label: "Sí, otra persona los prepara o supervisa" },
      { value: "administra", label: "Sí, otra persona debe administrárselos" },
      { value: "no_toma", label: "No toma regularmente" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "errores_medicacion",
    module: "Salud general",
    type: "single",
    title: "En los últimos meses, ¿ha olvidado dosis, repetido medicamentos o cometido algún error al tomarlos?",
    applicable: (a) => ["recordatorios", "prepara_supervisa", "administra"].includes(a.manejo_medicamentos as string),
    options: [
      { value: "no", label: "No" },
      { value: "una_vez", label: "Ocurrió una vez" },
      { value: "varias_veces", label: "Ha ocurrido varias veces" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "cambio_agudo_reportado",
    module: "Salud general",
    type: "single",
    title: (a) =>
      `En los últimos meses, ¿${nombreConTratamiento(a)} ha presentado un cambio repentino en su memoria, orientación, conducta, estado de alerta o manera de desenvolverse?`,
    options: [
      { value: "no", label: "No" },
      { value: "si", label: "Sí" },
      { value: "no_seguro", label: "No estoy seguro" },
    ],
  },
  {
    id: "inicio_cambio_agudo",
    module: "Salud general",
    type: "single",
    title: "¿El cambio apareció en horas o en pocos días?",
    applicable: (a) => a.cambio_agudo_reportado === "si",
    options: [
      { value: "si", label: "Sí" },
      { value: "gradual", label: "No, ha ocurrido de manera gradual" },
      { value: "no_se", label: "No lo sé" },
    ],
    warning: {
      when: (v) => v === "si",
      message:
        "Gracias por indicarlo. Los cambios repentinos en la memoria, la conducta o el nivel de alerta pueden estar relacionados con una situación de salud que necesita atención. Recomendamos consultar con un profesional antes de iniciar actividades que requieran esfuerzo físico o cognitivo.",
      ctaLabel: "Entendido, continuar",
      to: "/app/alerta/cambio",
    },
  },
  {
    id: "indicadores_cambio_agudo",
    module: "Salud general",
    type: "single",
    title: (a) =>
      `Para orientarte mejor: ¿has notado que ${nombreConTratamiento(a)} está mucho más confundido, somnoliento, agitado o diferente de lo habitual desde hace pocos días?`,
    applicable: (a) => a.cambio_agudo_reportado === "no_seguro",
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
      { value: "no_seguro", label: "Todavía no estoy seguro" },
    ],
    warning: {
      when: (v) => v === "si",
      message:
        "Gracias por indicarlo. Los cambios repentinos en la memoria, la conducta o el nivel de alerta pueden estar relacionados con una situación de salud que necesita atención. Recomendamos consultar con un profesional antes de iniciar actividades que requieran esfuerzo físico o cognitivo.",
      ctaLabel: "Entendido, continuar",
      to: "/app/alerta/cambio",
    },
  },
  {
    id: "estado_diagnostico_cognitivo",
    module: "Diagnóstico",
    type: "single",
    title: (a) =>
      `¿Algún profesional le ha indicado a ${nombreConTratamiento(a)} un diagnóstico relacionado con su memoria, pensamiento o funcionamiento cognitivo?`,
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
      { value: "no_se", label: "No lo sé" },
      { value: "en_proceso", label: "Está en proceso de valoración" },
    ],
  },

  // Ruta "Sí": tipo de diagnóstico (§7.4).
  {
    id: "diagnostico_cognitivo_informado",
    module: "Diagnóstico",
    type: "single",
    title: "¿Cuál diagnóstico le indicó el profesional? Selecciona la opción más cercana a lo que les explicaron.",
    applicable: (a) => a.estado_diagnostico_cognitivo === "si",
    options: [
      { value: "dcl", label: "Deterioro cognitivo leve" },
      { value: "demencia", label: "Enfermedad de Alzheimer, demencia vascular, con cuerpos de Lewy, frontotemporal, asociada a Parkinson, mixta u otro tipo de deterioro o demencia" },
      { value: "otro", label: "Otro diagnóstico que afecta memoria o pensamiento" },
      { value: "no_recuerdo", label: "No recuerdo el nombre del diagnóstico" },
    ],
  },
  {
    id: "diagnostico_texto_usuario",
    module: "Diagnóstico",
    type: "text",
    title: "Si lo deseas, puedes escribir cómo aparece el diagnóstico en el informe o cómo se lo explicó el profesional.",
    applicable: (a) => typeof a.diagnostico_cognitivo_informado === "string" && a.diagnostico_cognitivo_informado !== "",
  },

  // Ruta DCL (§7.5) y síndrome demencial (§7.6) comparten `tiempo_desde_diagnostico`.
  {
    id: "etapa_demencia_informada",
    module: "Diagnóstico",
    type: "single",
    title: "¿Les han explicado en qué etapa se encuentra actualmente?",
    applicable: (a) => a.diagnostico_cognitivo_informado === "demencia",
    options: [
      { value: "leve", label: "Etapa leve o inicial" },
      { value: "moderada", label: "Etapa moderada" },
      { value: "avanzada", label: "Etapa avanzada" },
      { value: "otra", label: "Les explicaron otra clasificación" },
      { value: "no_conocen", label: "No conocen la etapa" },
    ],
  },
  {
    id: "otra_clasificacion_demencia",
    module: "Diagnóstico",
    type: "text",
    title: "¿Cómo les explicaron la etapa o el nivel de avance? (ej.: GDS 4, CDR 1, etapa intermedia...)",
    applicable: (a) => a.etapa_demencia_informada === "otra",
  },
  {
    id: "tiempo_desde_diagnostico",
    module: "Diagnóstico",
    type: "single",
    title: (a) =>
      a.diagnostico_cognitivo_informado === "dcl"
        ? "¿Hace cuánto recibió el diagnóstico de deterioro cognitivo leve?"
        : "¿Hace cuánto recibió el diagnóstico?",
    applicable: (a) => a.diagnostico_cognitivo_informado === "dcl" || a.diagnostico_cognitivo_informado === "demencia",
    options: [
      { value: "menos_6m", label: "Menos de 6 meses" },
      { value: "6m_2a", label: "Entre 6 meses y 2 años" },
      { value: "2a_5a", label: "Entre 2 y 5 años" },
      { value: "mas_5a", label: "Más de 5 años" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "autonomia_reportada_dcl",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `Actualmente, ¿${nombreConTratamiento(a)} continúa realizando la mayoría de sus actividades cotidianas por sí mismo?`,
    applicable: (a) => a.diagnostico_cognitivo_informado === "dcl",
    options: [
      { value: "independiente", label: "Sí, mantiene independencia" },
      { value: "con_estrategias", label: "Sí, pero utiliza recordatorios o estrategias" },
      { value: "ayuda_algunas", label: "Necesita ayuda en algunas actividades" },
      { value: "ayuda_frecuente", label: "Necesita ayuda frecuente" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "conciencia_diagnostico",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `¿${nombreConTratamiento(a)} conoce o comprende el diagnóstico que recibió?`,
    applicable: (a) => a.diagnostico_cognitivo_informado === "demencia",
    options: [
      { value: "conoce_habla", label: "Sí, lo conoce y puede hablar del tema" },
      { value: "conoce_malestar", label: "Lo conoce pero le genera malestar" },
      { value: "parcial", label: "Parece comprenderlo solo parcialmente" },
      { value: "no_reconoce", label: "No reconoce o no recuerda el diagnóstico" },
      { value: "familia_prefiere_no_hablar", label: "La familia prefiere no hablar del diagnóstico" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "areas_apoyo_demencia",
    module: "Diagnóstico",
    type: "multi",
    title: (a) => `Actualmente, ¿en cuáles áreas necesita más apoyo ${nombreConTratamiento(a)}?`,
    applicable: (a) => a.diagnostico_cognitivo_informado === "demencia",
    exclusive: ["aun_no", "no_se"],
    options: [
      { value: "recordar_reciente", label: "Recordar información reciente" },
      { value: "ubicarse_fecha", label: "Ubicarse en el día o fecha" },
      { value: "orientarse_lugares", label: "Orientarse en lugares" },
      { value: "comprender_instrucciones", label: "Comprender instrucciones" },
      { value: "expresarse", label: "Expresarse o encontrar palabras" },
      { value: "tomar_decisiones", label: "Tomar decisiones" },
      { value: "organizar_actividades", label: "Organizar actividades cotidianas" },
      { value: "manejar_emociones", label: "Manejar emociones o conducta" },
      { value: "moverse_seguridad", label: "Moverse con seguridad" },
      { value: "cuidar_alimentacion", label: "Cuidar su alimentación" },
      { value: "aun_no", label: "Aún no necesita apoyo importante" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // Ruta "otro diagnóstico" (§7.7).
  {
    id: "otro_diagnostico_cognitivo",
    module: "Diagnóstico",
    type: "text",
    title: "¿Cuál diagnóstico le indicaron? (ej.: secuelas de derrame, Parkinson, depresión, lesión cerebral...)",
    applicable: (a) => a.diagnostico_cognitivo_informado === "otro",
  },
  {
    id: "relacion_diagnostico_cognicion",
    module: "Diagnóstico",
    type: "single",
    title: "¿Les explicaron si este diagnóstico puede estar relacionado con los cambios en la memoria o el pensamiento?",
    applicable: (a) => a.diagnostico_cognitivo_informado === "otro",
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
      { value: "no_seguros", label: "No están seguros" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // Ruta "No lo sé" / "no recuerdo el diagnóstico" (§7.9) — ambas confluyen aquí.
  {
    id: "valoracion_cognitiva_conocida",
    module: "Diagnóstico",
    type: "single",
    title: (a) =>
      `Está bien si no conoces el diagnóstico. ¿Alguna vez ${nombreConTratamiento(a)} ha sido valorado por cambios en su memoria o pensamiento?`,
    applicable: (a) => a.estado_diagnostico_cognitivo === "no_se" || a.diagnostico_cognitivo_informado === "no_recuerdo",
    options: [
      { value: "si", label: "Sí" },
      { value: "pendiente", label: "Tiene una valoración pendiente" },
      { value: "no", label: "No" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // Ruta "en proceso de valoración" (§7.10).
  {
    id: "motivo_valoracion_actual",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `¿Qué motivó la valoración de ${nombreConTratamiento(a)}?`,
    applicable: (a) => a.estado_diagnostico_cognitivo === "en_proceso",
    options: [
      { value: "quejas_propias", label: "Quejas de la propia persona" },
      { value: "familia_observo", label: "Cambios observados por la familia" },
      { value: "recomendacion_medica", label: "Recomendación médica" },
      { value: "cambios_actividades", label: "Cambios en actividades cotidianas" },
      { value: "cambios_emocionales", label: "Cambios emocionales o conductuales" },
      { value: "otro", label: "Otro motivo" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "etapa_proceso_valoracion",
    module: "Diagnóstico",
    type: "single",
    title: "¿En qué etapa se encuentra la valoración?",
    applicable: (a) => a.estado_diagnostico_cognitivo === "en_proceso",
    options: [
      { value: "cita_pendiente", label: "Cita pendiente" },
      { value: "pruebas_realizadas", label: "Ya realizó pruebas o exámenes" },
      { value: "esperando_resultados", label: "Esperando resultados" },
      { value: "seguimiento", label: "En seguimiento" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // Ruta "sin diagnóstico" (§7.8).
  {
    id: "motivo_sin_diagnostico",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `Aunque ${nombreConTratamiento(a)} no tiene un diagnóstico, ¿qué los motivó a buscar actividades para su salud cerebral?`,
    applicable: (a) => a.estado_diagnostico_cognitivo === "no",
    options: [
      { value: "prevenir", label: "Desea prevenir y mantenerse activo" },
      { value: "olvidos", label: "Ha notado algunos olvidos" },
      { value: "familia_cambios", label: "La familia ha observado cambios" },
      { value: "dificultad_atencion", label: "Dificultades de atención o concentración" },
      { value: "cambios_emocionales", label: "Ha tenido cambios emocionales o mucho estrés" },
      { value: "profesional_recomendo", label: "Un profesional recomendó realizar actividades" },
      { value: "otro", label: "Otro motivo" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "motivo_sin_diagnostico_otro",
    module: "Diagnóstico",
    type: "text",
    title: "Contanos un poco más sobre ese motivo.",
    applicable: (a) => a.motivo_sin_diagnostico === "otro",
  },
  {
    id: "objetivo_preventivo",
    module: "Diagnóstico",
    type: "single",
    title: "¿Qué le gustaría cuidar o fortalecer principalmente?",
    applicable: (a) => a.motivo_sin_diagnostico === "prevenir",
    options: [
      { value: "memoria", label: "Memoria" },
      { value: "atencion", label: "Atención y concentración" },
      { value: "agilidad_mental", label: "Agilidad mental" },
      { value: "organizacion", label: "Organización y planificación" },
      { value: "lenguaje", label: "Lenguaje" },
      { value: "bienestar_emocional", label: "Bienestar emocional" },
      { value: "activo_general", label: "Mantenerse activo en general" },
      { value: "habitos_neuroprotectores", label: "Hábitos neuroprotectores (ejercicio físico y cognitivo, alimentación)" },
      { value: "no_seguro", label: "No está seguro" },
    ],
  },
  {
    id: "cambio_cognitivo_sin_diagnostico",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `En comparación con años anteriores, ¿han notado cambios en la memoria, el pensamiento o la manera de desenvolverse de ${nombreConTratamiento(a)}?`,
    applicable: (a) =>
      a.estado_diagnostico_cognitivo === "no" &&
      ["olvidos", "familia_cambios", "dificultad_atencion", "cambios_emocionales", "otro", "no_se"].includes(a.motivo_sin_diagnostico as string),
    options: [
      { value: "sin_cambios", label: "No se han observado cambios" },
      { value: "leves", label: "Cambios leves" },
      { value: "evidentes", label: "Cambios evidentes" },
      { value: "interfieren", label: "Los cambios interfieren con algunas actividades cotidianas" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "profesional_referente",
    module: "Diagnóstico",
    type: "single",
    title: "¿Qué tipo de profesional recomendó realizar actividades?",
    applicable: (a) => a.motivo_sin_diagnostico === "profesional_recomendo",
    options: [
      { value: "medico_general", label: "Médico general" },
      { value: "geriatra", label: "Geriatra" },
      { value: "neurologo", label: "Neurólogo" },
      { value: "psiquiatra", label: "Psiquiatra" },
      { value: "psicologo", label: "Psicólogo o neuropsicólogo" },
      { value: "terapeuta", label: "Terapeuta" },
      { value: "otro", label: "Otro" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "estado_valoracion_cognitiva",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `¿${nombreConTratamiento(a)} ha recibido alguna valoración por sus cambios de memoria o pensamiento?`,
    applicable: (a) => a.estado_diagnostico_cognitivo === "no" && typeof a.motivo_sin_diagnostico === "string" && a.motivo_sin_diagnostico !== "prevenir",
    options: [
      { value: "normal", label: "Sí, resultados normales" },
      { value: "seguimiento", label: "Sí, continúa en seguimiento" },
      { value: "cita_pendiente", label: "Tiene cita pendiente" },
      { value: "no_valorado", label: "No ha sido valorado" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // Evolución cognitiva común (§7.11) — se omite solo en la ruta "No lo sé" (ND).
  {
    id: "tiempo_evolucion_cognitiva",
    module: "Diagnóstico",
    type: "single",
    title: (a) => `¿Hace cuánto comenzaron a notar cambios en la memoria, el pensamiento o la forma de desenvolverse de ${nombreConTratamiento(a)}?`,
    applicable: (a) => a.estado_diagnostico_cognitivo !== "no_se",
    options: [
      { value: "sin_cambios", label: "No se han observado cambios" },
      { value: "menos_6m", label: "Menos de 6 meses" },
      { value: "6m_2a", label: "Entre 6 meses y 2 años" },
      { value: "2a_5a", label: "Entre 2 y 5 años" },
      { value: "mas_5a", label: "Más de 5 años" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "patron_evolucion_cognitiva",
    module: "Diagnóstico",
    type: "single",
    title: "Pensando en el último año, ¿cómo han evolucionado estos cambios?",
    applicable: (a) => a.estado_diagnostico_cognitivo !== "no_se",
    options: [
      { value: "estable", label: "Se ha mantenido estable" },
      { value: "avance_lento", label: "Avanzado lentamente" },
      { value: "avance_rapido", label: "Avanzado con rapidez" },
      { value: "periodos_variables", label: "Periodos de mejoría y empeoramiento" },
      { value: "mejora", label: "Ha mejorado" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "preocupacion_principal",
    module: "Diagnóstico",
    type: "single",
    title: (a) =>
      participanteEsRespondente(a)
        ? "En este momento, ¿qué es lo que más te preocupa o te gustaría fortalecer?"
        : `En este momento, ¿qué es lo que más les preocupa o les gustaría fortalecer en ${nombreConTratamiento(a)}?`,
    applicable: (a) => a.estado_diagnostico_cognitivo !== "no_se",
    options: [
      { value: "memoria", label: "Memoria" },
      { value: "atencion", label: "Atención o concentración" },
      { value: "orientacion", label: "Orientación" },
      { value: "comunicacion", label: "Comunicación" },
      { value: "independencia", label: "Independencia" },
      { value: "animo", label: "Estado de ánimo" },
      { value: "conducta", label: "Conducta" },
      { value: "movilidad", label: "Movilidad" },
      { value: "alimentacion", label: "Alimentación" },
      { value: "prevenir", label: "Desea prevenir y mantenerse activo" },
      { value: "otra", label: "Otra preocupación" },
      { value: "no_seguro", label: "No está seguro" },
    ],
  },
  {
    id: "preocupacion_otra",
    module: "Diagnóstico",
    type: "text",
    title: "¿Qué otra situación te gustaría que tomemos en cuenta?",
    applicable: (a) => a.preocupacion_principal === "otra",
  },

  {
    id: "transicion_cierre_bloque1",
    type: "info",
    title: "Gracias",
    body: (a) => {
      const nombre = nombreConTratamiento(a);
      if (a.diagnostico_cognitivo_informado === "demencia") {
        return `Gracias. Ya comprendemos mejor la condición actual de ${nombre} y algunos de los apoyos que puede necesitar. A continuación conoceremos cómo se comunica, comprende y participa en las actividades cotidianas.`;
      }
      if (
        a.estado_diagnostico_cognitivo === "no" &&
        ["leves", "evidentes", "interfieren"].includes(a.cambio_cognitivo_sin_diagnostico as string)
      ) {
        return "Gracias. Los cambios que nos compartiste nos ayudarán a adaptar las actividades. IntegraMente en Casa no realiza diagnósticos, pero sí puede ofrecer recomendaciones acordes con la información que nos brindaste.";
      }
      if (a.motivo_sin_diagnostico === "prevenir") {
        return `Gracias. Tomaremos en cuenta que el objetivo de ${nombre} es mantenerse activo y cuidar su salud cerebral de forma preventiva.`;
      }
      return `Gracias. Ya conocemos mejor la salud general de ${nombre} y el motivo por el que utilizará IntegraMente en Casa. Ahora queremos comprender cómo se desenvuelve en aspectos como la memoria, la atención y la comunicación.`;
    },
    cta: "Continuar",
    // La ruta SG-06 = "No lo sé" salta directamente al bloque cognitivo común
    // (§7.9), sin pasar por este cierre — el propio COG-00 sirve de transición.
    applicable: (a) => a.estado_diagnostico_cognitivo !== "no_se",
  },

  // §8.1 Cognición y comunicación.
  {
    id: "transicion_cognicion",
    type: "info",
    title: "Memoria, atención y comunicación",
    body: (a) =>
      participanteEsRespondente(a)
        ? "Ahora queremos conocer cómo te desenvolvés en actividades que requieren recordar, concentrarte, comunicarte u organizarte. No hay respuestas correctas o incorrectas. Lo importante es comprender qué te resulta fácil y en qué momentos podrías beneficiarte de apoyo."
        : `Ahora queremos conocer cómo se desenvuelve ${nombreConTratamiento(a)} en actividades que requieren recordar, concentrarse, comunicarse u organizarse. No hay respuestas correctas o incorrectas. Queremos comprender sus fortalezas y los apoyos que pueden resultarle útiles.`,
    cta: "Continuar",
  },
  {
    id: "memoria_reciente_funcional",
    module: "Cognición y comunicación",
    type: "single",
    title: (a) => `En comparación con años anteriores, ¿cómo está la memoria de ${nombreConTratamiento(a)} para conversaciones, citas o situaciones recientes?`,
    options: [
      { value: "igual", label: "Se mantiene igual" },
      { value: "olvidos_con_recordatorios", label: "Ha presentado algunos olvidos pero los resuelve con recordatorios" },
      { value: "olvida_frecuente", label: "Olvida información con frecuencia" },
      { value: "recordatorio_constante", label: "Necesita que le recuerden la información constantemente" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "repeticion_perdida_hilo",
    module: "Cognición y comunicación",
    type: "single",
    title: (a) => `¿${nombreConTratamiento(a)} repite preguntas o pierde el hilo de lo que estaba haciendo?`,
    options: [
      { value: "casi_nunca", label: "Casi nunca" },
      { value: "algunas_veces", label: "Algunas veces" },
      { value: "con_frecuencia", label: "Con frecuencia" },
      { value: "muchas_veces_dia", label: "Muchas veces durante el día" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "atencion_funcional",
    module: "Cognición y comunicación",
    type: "single",
    title: "¿Cuánto tiempo puede mantenerse atento en una conversación o actividad?",
    options: [
      { value: "sin_dificultad", label: "Se mantiene atento sin dificultad" },
      { value: "distrae_continua", label: "Se distrae algunas veces pero puede continuar" },
      { value: "necesita_retomar", label: "Necesita recordatorios para retomar" },
      { value: "periodos_muy_cortos", label: "Solo se mantiene atento durante periodos muy cortos" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "comprension_consignas",
    module: "Cognición y comunicación",
    type: "single",
    title: (a) => `Cuando ${nombreConTratamiento(a)} realiza una actividad, ¿qué tipo de explicación suele comprender mejor?`,
    options: [
      { value: "varios_pasos", label: "Puede seguir varios pasos" },
      { value: "uno_dos_pasos", label: "Comprende mejor uno o dos pasos a la vez" },
      { value: "una_instruccion_demostracion", label: "Necesita una instrucción por vez y una demostración" },
      { value: "otra_guia_completa", label: "Otra persona debe guiarle durante toda la actividad" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "organizacion_decisiones",
    module: "Cognición y comunicación",
    type: "single",
    title: "Cuando debe organizar una actividad o resolver una situación cotidiana, ¿qué apoyo necesita?",
    options: [
      { value: "por_si_mismo", label: "Puede hacerlo por sí mismo" },
      { value: "con_tiempo_lista", label: "Lo logra si tiene tiempo, recordatorios o una lista" },
      { value: "necesita_opciones", label: "Necesita que le expliquen las opciones" },
      { value: "otra_decide", label: "Otra persona debe organizar o decidir por él o ella" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "comunicacion_expresiva",
    module: "Cognición y comunicación",
    type: "single",
    title: (a) => `¿Cómo se comunica actualmente ${nombreConTratamiento(a)}?`,
    options: [
      { value: "facilidad", label: "Conversa y expresa sus ideas con facilidad" },
      { value: "tarda_palabras", label: "A veces tarda en encontrar palabras" },
      { value: "frases_cortas", label: "Se comunica mejor con frases cortas o preguntas sencillas" },
      { value: "palabras_gestos", label: "Utiliza principalmente palabras sueltas, sonidos o gestos" },
      { value: "muchas_dificultades", label: "Tiene muchas dificultades para expresar lo que necesita" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "respuesta_demanda_cognitiva",
    module: "Cognición y comunicación",
    type: "single",
    title: "Cuando realiza actividades que requieren pensar o concentrarse, ¿qué suele ocurrir?",
    options: [
      { value: "sin_cansarse", label: "Las realiza sin cansarse" },
      { value: "cansa_despues", label: "Se cansa después de un rato" },
      { value: "frustra_sobrecarga", label: "Se frustra o se sobrecarga con facilidad" },
      { value: "evita", label: "Generalmente evita este tipo de actividades" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // §8.2 Estado emocional, conducta y sueño.
  {
    id: "transicion_emocional",
    type: "info",
    title: "Ánimo y descanso",
    body: (a) =>
      participanteEsRespondente(a)
        ? "El estado de ánimo y el descanso también pueden influir en la memoria, la energía y las ganas de participar. Queremos conocer cómo te has sentido últimamente."
        : `El estado de ánimo y el descanso también pueden influir en la memoria, la energía y las ganas de participar. Queremos conocer cómo se ha sentido ${nombreConTratamiento(a)} últimamente.`,
    cta: "Continuar",
  },
  {
    id: "estado_emocional_actual",
    module: "Ánimo y descanso",
    type: "multi",
    title: (a) => `Durante las últimas semanas, ¿cómo ha estado ${nombreConTratamiento(a)} la mayor parte del tiempo?`,
    example: "Elegí hasta 2 opciones.",
    maxSelect: 2,
    options: [
      { value: "tranquilo", label: "Tranquilo y estable" },
      { value: "preocupado", label: "Preocupado o ansioso" },
      { value: "triste", label: "Triste o desanimado" },
      { value: "irritable", label: "Irritable" },
      { value: "cambiante", label: "Emocionalmente cambiante" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "interes_iniciativa",
    module: "Ánimo y descanso",
    type: "single",
    title: "¿Mantiene interés por conversar, participar o realizar actividades?",
    options: [
      { value: "conserva_inicia", label: "Sí, conserva sus intereses y suele iniciar actividades" },
      { value: "participa_si_invitan", label: "Participa cuando alguien lo invita" },
      { value: "perdido_interes_varias", label: "Ha perdido interés en varias actividades" },
      { value: "casi_sin_iniciativa", label: "Casi no muestra iniciativa ni interés" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "patron_sueno",
    module: "Ánimo y descanso",
    type: "multi",
    title: (a) => `En general, ¿cómo está durmiendo ${nombreConTratamiento(a)}?`,
    example: "Elegí hasta 2 opciones.",
    maxSelect: 2,
    options: [
      { value: "duerme_bien", label: "Duerme bien y suele descansar" },
      { value: "le_cuesta_dormirse", label: "Le cuesta dormirse" },
      { value: "despierta_varias_veces", label: "Se despierta varias veces" },
      { value: "duerme_mucho_dia", label: "Duerme mucho durante el día" },
      { value: "camina_de_noche", label: "Se levanta o camina durante la noche" },
      { value: "duerme_pocas_horas", label: "Duerme pocas horas" },
      { value: "muy_variable", label: "Su sueño cambia mucho" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "impacto_diurno_sueno",
    module: "Ánimo y descanso",
    type: "single",
    title: "¿Estas dificultades de sueño afectan su energía, su ánimo o su funcionamiento durante el día?",
    applicable: (a) =>
      Array.isArray(a.patron_sueno) && a.patron_sueno.some((v) => v !== "duerme_bien" && v !== "no_se"),
    options: [
      { value: "no_afecta", label: "No parecen afectarlo" },
      { value: "algunas_veces", label: "Lo afectan algunas veces" },
      { value: "con_frecuencia", label: "Lo afectan con frecuencia" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // §8.3 Cambios conductuales — bloque condicional (§8.3, ver condConductualAplicable).
  {
    id: "transicion_conductual",
    type: "info",
    title: "Cambios en la conducta",
    body: "Algunas condiciones pueden producir cambios en la manera de reaccionar o comportarse. Conocerlos nos ayudará a evitar actividades que generen malestar y a ofrecer estrategias más adecuadas.",
    cta: "Continuar",
    applicable: condConductualAplicable,
  },
  {
    id: "cambios_conductuales",
    module: "Cambios en la conducta",
    type: "multi",
    title: (a) => `¿Han observado alguno de estos cambios en ${nombreConTratamiento(a)}?`,
    applicable: condConductualAplicable,
    exclusive: ["ninguno", "prefiero_no_responder", "no_se"],
    options: [
      { value: "agitacion", label: "Se muestra más agitado o inquieto" },
      { value: "irritabilidad", label: "Se irrita o enoja con facilidad" },
      { value: "resistencia_cuidados", label: "Se resiste a algunas actividades o cuidados" },
      { value: "deambulacion", label: "Camina sin rumbo o intenta salir de casa" },
      { value: "desconfianza", label: "Desconfía de otras personas" },
      { value: "creencias_no_compartidas", label: "Cree que ocurren cosas que los demás no observan" },
      { value: "percepciones_no_compartidas", label: "Ve o escucha cosas que otras personas no perciben" },
      { value: "repeticiones", label: "Realiza preguntas, movimientos o acciones repetitivas" },
      { value: "cambios_comportamiento_habitual", label: "Actúa de forma distinta a su costumbre, sin filtrar lo que dice o hace" },
      { value: "ninguno", label: "Ninguno" },
      { value: "prefiero_no_responder", label: "Prefiero no responder" },
      { value: "no_se", label: "No lo sé" },
    ],
    warning: {
      when: (v) => v === "deambulacion",
      message: "Vamos a activar las recomendaciones de prevención de extravío.",
      ctaLabel: "Ver las medidas",
      to: "/app/alerta/extravio",
    },
  },
  {
    id: "impacto_cambios_conductuales",
    module: "Cambios en la conducta",
    type: "single",
    title: "¿Con qué frecuencia estos cambios dificultan la rutina o generan preocupación?",
    applicable: (a) =>
      condConductualAplicable(a) &&
      Array.isArray(a.cambios_conductuales) &&
      a.cambios_conductuales.some((v) => !["ninguno", "prefiero_no_responder", "no_se"].includes(v)),
    options: [
      { value: "ocasional_manejable", label: "Ocasionalmente, se pueden manejar" },
      { value: "varias_semana", label: "Varias veces por semana" },
      { value: "todos_dias", label: "Todos o casi todos los días" },
      { value: "preocupacion_importante", label: "Generan una preocupación importante" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "riesgo_conductual",
    module: "Cambios en la conducta",
    type: "single",
    title: (a) => `¿Alguno de estos cambios podría poner en riesgo a ${nombreConTratamiento(a)} o a otra persona?`,
    applicable: condConductualAplicable,
    options: [
      { value: "no", label: "No" },
      { value: "supervision", label: "Tal vez, requiere supervisión" },
      { value: "riesgo_actual", label: "Sí, existe un riesgo actual" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // §8.4 Actividades instrumentales de la vida diaria (AVDI).
  {
    id: "transicion_avdi",
    type: "info",
    title: "Actividades cotidianas",
    body: (a) =>
      `Ahora queremos conocer cómo se desenvuelve ${nombreConTratamiento(a)} en algunas actividades cotidianas. Si nunca ha realizado una actividad por costumbre o por la forma en que se organizaba su familia, puedes indicarlo. Esto no significa que tenga una dificultad.`,
    cta: "Continuar",
  },
  {
    id: "avdi_finanzas",
    module: "Actividades cotidianas",
    type: "single",
    title: (a) => `¿Cómo maneja ${nombreConTratamiento(a)} el dinero, los pagos o los asuntos bancarios?`,
    options: avdiScale,
  },
  {
    id: "avdi_compras_organizacion",
    module: "Actividades cotidianas",
    type: "single",
    title: "¿Cómo realiza compras o prepara lo que necesita para una actividad cotidiana?",
    options: avdiScale,
  },
  {
    id: "avdi_preparacion_alimentos",
    module: "Actividades cotidianas",
    type: "single",
    title: "¿Cómo prepara alimentos o utiliza la cocina?",
    options: avdiScale,
  },
  {
    id: "riesgo_cocina",
    module: "Actividades cotidianas",
    type: "multi",
    title: "¿Han observado alguna situación de riesgo al utilizar la cocina?",
    applicable: (a) => ["recordatorios_supervision", "ayuda_directa", "otra_persona"].includes(a.avdi_preparacion_alimentos as string),
    exclusive: ["no"],
    options: [
      { value: "no", label: "No" },
      { value: "olvido_apagar", label: "Ha olvidado apagar la cocina o algún electrodoméstico" },
      { value: "quemado_alimentos", label: "Ha quemado alimentos" },
      { value: "utensilios_inseguros", label: "Ha utilizado utensilios de manera insegura" },
      { value: "ya_no_usa_cocina", label: "Ya no utiliza la cocina por seguridad" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "avdi_telefono",
    module: "Actividades cotidianas",
    type: "single",
    title: "¿Cómo utiliza el teléfono para llamar, responder mensajes o comunicarse con otras personas?",
    options: avdiScale,
  },
  {
    id: "avdi_agenda_responsabilidades",
    module: "Actividades cotidianas",
    type: "single",
    title: "¿Cómo organiza citas, horarios o actividades pendientes?",
    options: avdiScale,
  },
  {
    id: "origen_cambio_funcional",
    module: "Actividades cotidianas",
    type: "single",
    title: "¿Esta necesidad de ayuda representa un cambio respecto a cómo se desenvolvía antes?",
    applicable: avdiNecesitaAyuda,
    options: [
      { value: "antes_mas_independiente", label: "Sí, antes lo hacía con mayor independencia" },
      { value: "siempre_necesito_apoyo", label: "No, siempre ha necesitado este apoyo" },
      { value: "condicion_fisica", label: "La dificultad se relaciona principalmente con una condición física" },
      { value: "fisica_y_cognitiva", label: "La dificultad se relaciona tanto con aspectos físicos como cognitivos" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  // §8.5 Actividades básicas de la vida diaria (AVDB) — bloque condicional.
  {
    id: "transicion_avdb",
    type: "info",
    title: "Cuidado personal",
    body: (a) => `Para seleccionar actividades cómodas y realistas, necesitamos conocer si ${nombreConTratamiento(a)} requiere apoyo en algunos cuidados personales.`,
    cta: "Continuar",
    applicable: avdbAplicable,
  },
  {
    id: "avdb_bano_aseo",
    module: "Cuidado personal",
    type: "single",
    title: (a) => `¿Qué apoyo necesita ${nombreConTratamiento(a)} para bañarse y realizar su aseo personal?`,
    applicable: avdbAplicable,
    options: avdbScale,
  },
  {
    id: "avdb_vestido",
    module: "Cuidado personal",
    type: "single",
    title: "¿Qué apoyo necesita para elegir su ropa y vestirse?",
    applicable: avdbAplicable,
    options: avdbScale,
  },
  {
    id: "avdb_alimentacion",
    module: "Cuidado personal",
    type: "single",
    title: "¿Qué apoyo necesita para comer?",
    applicable: avdbAplicable,
    options: avdbScale,
  },
  {
    id: "avdb_uso_bano",
    module: "Cuidado personal",
    type: "single",
    title: "¿Qué apoyo necesita para ir al baño y realizar su higiene?",
    applicable: avdbAplicable,
    options: avdbScale,
  },
  {
    id: "evolucion_dependencia_basica",
    module: "Cuidado personal",
    type: "single",
    title: "¿Esta necesidad de apoyo ha aumentado durante el último año?",
    applicable: (a) =>
      avdbAplicable(a) &&
      ["avdb_bano_aseo", "avdb_vestido", "avdb_alimentacion", "avdb_uso_bano"].some((k) =>
        ["recordatorios_supervision", "ayuda_parcial", "otra_persona"].includes(a[k] as string),
      ),
    options: [
      { value: "estable", label: "No, se ha mantenido estable" },
      { value: "aumentado_poco_a_poco", label: "Ha aumentado poco a poco" },
      { value: "aumentado_rapido", label: "Ha aumentado con rapidez" },
      { value: "varia_segun_dia", label: "Varía según el día" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  {
    id: "transicion_cierre_bloque2",
    type: "info",
    title: "Gracias",
    body: (a) =>
      `Gracias. Ya comprendemos mejor cómo se comunica ${nombreConTratamiento(a)}, qué tipo de instrucciones le resultan más útiles y en cuáles actividades cotidianas puede necesitar apoyo. Ahora queremos conocer cómo se mueve y qué actividades físicas puede realizar con seguridad.`,
    cta: "Continuar",
  },

  // §9 Bloque 3 — Movimiento, ejercicio y seguridad física.
  {
    id: "transicion_movimiento",
    type: "info",
    title: "Movimiento y seguridad",
    body: (a) =>
      participanteEsRespondente(a)
        ? "Ahora queremos conocer cómo te movés y qué actividades físicas realizás. Esto nos ayudará a seleccionar ejercicios cómodos, útiles y seguros para vos."
        : `Ahora queremos conocer cómo se mueve ${nombreConTratamiento(a)} y qué actividades físicas realiza. Esto nos ayudará a seleccionar ejercicios adecuados a sus capacidades y condiciones de seguridad.`,
    cta: "Continuar",
  },
  {
    id: "movilidad_dentro_casa",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `¿Cómo se moviliza habitualmente ${nombreConTratamiento(a)} dentro de la casa?`,
    options: [
      { value: "sin_ayuda", label: "Camina sin ayuda" },
      { value: "baston", label: "Camina con bastón" },
      { value: "andadera", label: "Camina con andadera" },
      { value: "acompanado", label: "Camina si otra persona lo acompaña o sostiene" },
      { value: "silla_ruedas", label: "Se moviliza principalmente en silla de ruedas" },
      { value: "cama", label: "Permanece la mayor parte en cama" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "movilidad_fuera_casa",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `¿Cómo se moviliza ${nombreConTratamiento(a)} fuera de la casa?`,
    applicable: (a) => a.movilidad_dentro_casa !== "silla_ruedas" && a.movilidad_dentro_casa !== "cama",
    options: [
      { value: "sale_camina_sin_ayuda", label: "Sale y camina sin ayuda" },
      { value: "sale_baston_andadera", label: "Sale con bastón o andadera" },
      { value: "necesita_acompanado", label: "Necesita ir acompañado" },
      { value: "distancias_cortas", label: "Solo camina distancias cortas" },
      { value: "no_sale", label: "Generalmente no sale" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "levantarse_silla",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `¿Puede ${nombreConTratamiento(a)} levantarse de una silla?`,
    options: [
      { value: "sin_manos", label: "Sí, sin usar las manos" },
      { value: "apoyandose", label: "Sí, apoyándose en brazos de la silla o mueble" },
      { value: "supervision", label: "Necesita supervisión o ayuda mínima" },
      { value: "ayuda_fisica", label: "Necesita que otra persona lo levante" },
      { value: "no_logra", label: "No logra hacerlo" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "equilibrio_de_pie",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `Cuando está de pie, ¿cómo es el equilibrio de ${nombreConTratamiento(a)}?`,
    applicable: (a) => a.movilidad_dentro_casa !== "silla_ruedas" && a.movilidad_dentro_casa !== "cama",
    options: [
      { value: "estable_sin_apoyo", label: "Estable sin apoyo" },
      { value: "estable_apoyo_cerca", label: "Estable con apoyo cerca" },
      { value: "pie_delante_otro", label: "Estable y puede colocar un pie delante del otro" },
      { value: "pies_juntos_ojos_cerrados", label: "Estable con pies juntos y ojos cerrados por 10s" },
      { value: "pierde_a_veces", label: "Pierde el equilibrio algunas veces" },
      { value: "necesita_sostenido", label: "Necesita que otra persona lo sostenga" },
      { value: "no_puede_pie", label: "No puede mantenerse de pie" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "control_postural_sentado",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `Cuando está sentado, ¿${nombreConTratamiento(a)} puede mantener el cuerpo estable?`,
    applicable: (a) => a.movilidad_dentro_casa === "silla_ruedas" || a.movilidad_dentro_casa === "cama",
    options: [
      { value: "sin_apoyo", label: "Sí, sin apoyo" },
      { value: "respaldo_apoyabrazos", label: "Necesita respaldo o apoyabrazos" },
      { value: "tiende_inclinarse", label: "Tiende a inclinarse o perder la postura" },
      { value: "necesita_acomodo", label: "Necesita que otra persona lo acomode" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "movilidad_extremidades",
    module: "Movimiento y seguridad",
    type: "single",
    title: "Mientras está sentado o acostado, ¿puede mover los brazos y las piernas?",
    applicable: (a) => a.movilidad_dentro_casa === "silla_ruedas" || a.movilidad_dentro_casa === "cama",
    options: [
      { value: "facilidad", label: "Sí, con facilidad" },
      { value: "dificultad_una", label: "Dificultad en una extremidad" },
      { value: "dificultad_varias", label: "Dificultad en varias extremidades" },
      { value: "muy_limitados", label: "Movimientos muy limitados" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "caidas_ultimos_6_meses",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `Durante los últimos seis meses, ¿${nombreConTratamiento(a)} se ha caído o ha estado a punto de caerse?`,
    options: [
      { value: "no", label: "No" },
      { value: "casi_cae", label: "Casi se cae pero no cayó" },
      { value: "una_vez", label: "Se ha caído una vez" },
      { value: "varias_veces", label: "Se ha caído varias veces" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "consecuencias_caida",
    module: "Movimiento y seguridad",
    type: "multi",
    title: "¿Alguna caída le provocó una lesión o un cambio importante?",
    applicable: (a) => ["casi_cae", "una_vez", "varias_veces"].includes(a.caidas_ultimos_6_meses as string),
    exclusive: ["no", "no_se"],
    options: [
      { value: "no", label: "No" },
      { value: "dolor_moretones_mejoraron", label: "Dolor o moretones que ya mejoraron" },
      { value: "dolor_continua", label: "Dolor que continúa" },
      { value: "fractura", label: "Una fractura" },
      { value: "golpe_cabeza", label: "Un golpe en la cabeza" },
      { value: "mayor_dificultad_caminar", label: "Mayor dificultad para caminar" },
      { value: "mas_miedo", label: "Más miedo de caminar o salir" },
      { value: "no_se", label: "No lo sé" },
    ],
    warning: {
      when: (v) => ["fractura", "golpe_cabeza", "dolor_continua", "mayor_dificultad_caminar"].includes(v),
      message: "Vamos a suspender las actividades de pie hasta revisar esto con más cuidado.",
      ctaLabel: "Ver qué hacer ante una caída",
      to: "/app/alerta/caida",
    },
  },
  {
    id: "valoracion_posterior_caida",
    module: "Movimiento y seguridad",
    type: "single",
    title: "¿Esta situación fue valorada por un profesional?",
    applicable: (a) =>
      Array.isArray(a.consecuencias_caida) &&
      a.consecuencias_caida.some((v) => ["fractura", "golpe_cabeza", "dolor_continua", "mayor_dificultad_caminar"].includes(v)),
    options: [
      { value: "si_puede_actividad", label: "Sí, ya puede realizar actividad física" },
      { value: "si_restricciones", label: "Sí, pero mantiene restricciones" },
      { value: "en_valoracion", label: "Todavía en valoración o recuperación" },
      { value: "no_valorada", label: "No fue valorada" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "sintomas_durante_movimiento",
    module: "Movimiento y seguridad",
    type: "multi",
    title: (a) => `Cuando ${nombreConTratamiento(a)} camina o realiza algún esfuerzo, ¿presenta alguna de estas molestias?`,
    exclusive: ["ninguna", "no_se"],
    options: [
      { value: "dolor", label: "Dolor" },
      { value: "mareo", label: "Mareo" },
      { value: "falta_aire", label: "Falta de aire" },
      { value: "dolor_pecho", label: "Dolor o presión en el pecho" },
      { value: "debilidad", label: "Debilidad" },
      { value: "cansancio_intenso", label: "Cansancio intenso" },
      { value: "perdida_equilibrio", label: "Pérdida de equilibrio" },
      { value: "ninguna", label: "Ninguna" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "intensidad_sintomas_movimiento",
    module: "Movimiento y seguridad",
    type: "single",
    title: "¿Con qué frecuencia o intensidad aparecen estas molestias?",
    applicable: (a) => Array.isArray(a.sintomas_durante_movimiento) && a.sintomas_durante_movimiento.some((v) => v !== "ninguna" && v !== "no_se"),
    options: [
      { value: "leves_ocasionales", label: "Leves y ocasionales" },
      { value: "frecuentes", label: "Frecuentes" },
      { value: "esfuerzo_pequeno", label: "Con esfuerzos pequeños" },
      { value: "presentes_ahora", label: "Están presentes en este momento" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "zonas_limitacion_fisica",
    module: "Movimiento y seguridad",
    type: "multi",
    title: "¿En qué parte del cuerpo presenta dolor o dificultad para moverse?",
    applicable: zonasLimitacionAplicable,
    exclusive: ["no_se"],
    options: [
      { value: "cuello", label: "Cuello" },
      { value: "hombros_brazos", label: "Hombros o brazos" },
      { value: "manos", label: "Manos" },
      { value: "espalda", label: "Espalda" },
      { value: "cadera", label: "Cadera" },
      { value: "rodillas", label: "Rodillas" },
      { value: "tobillos_pies", label: "Tobillos o pies" },
      { value: "un_lado_cuerpo", label: "En un lado del cuerpo" },
      { value: "varias_zonas", label: "En varias zonas" },
      { value: "otra", label: "Otra" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "restriccion_profesional_ejercicio",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `¿Algún profesional le ha indicado a ${nombreConTratamiento(a)} que debe evitar o modificar ciertos movimientos o ejercicios?`,
    options: [
      { value: "no", label: "No" },
      { value: "si", label: "Sí" },
      { value: "en_recuperacion", label: "En recuperación, aún sin indicaciones claras" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "movimientos_restringidos",
    module: "Movimiento y seguridad",
    type: "multi",
    title: "¿Qué movimiento, zona del cuerpo o tipo de ejercicio debe evitar?",
    applicable: (a) => a.restriccion_profesional_ejercicio === "si",
    options: [
      { value: "pie", label: "Ejercicios de pie" },
      { value: "levantar_peso", label: "Levantar peso" },
      { value: "agacharse", label: "Agacharse" },
      { value: "gradas", label: "Subir o bajar gradas" },
      { value: "levantar_brazos", label: "Levantar los brazos" },
      { value: "cuello", label: "Movimientos de cuello" },
      { value: "espalda", label: "Movimientos de espalda" },
      { value: "cadera_rodillas", label: "Movimientos de cadera o rodillas" },
      { value: "intenso", label: "Ejercicio intenso" },
      { value: "otra", label: "Otra indicación" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "restriccion_texto_usuario",
    module: "Movimiento y seguridad",
    type: "text",
    title: "Contanos brevemente cuál es esa otra indicación.",
    applicable: (a) => Array.isArray(a.movimientos_restringidos) && a.movimientos_restringidos.includes("otra"),
  },
  {
    id: "frecuencia_actividad_fisica",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `En una semana habitual, ¿cuántos días realiza ${nombreConTratamiento(a)} alguna actividad física o movimiento intencional?`,
    example: "Ej.: caminar, bailar, ejercicios, jardinería.",
    options: [
      { value: "ningun_dia", label: "Ningún día" },
      { value: "uno_dos", label: "Uno o dos días" },
      { value: "tres_cuatro", label: "Tres o cuatro días" },
      { value: "cinco_mas", label: "Cinco días o más" },
      { value: "varia_mucho", label: "Varía mucho" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "duracion_actividad_fisica",
    module: "Movimiento y seguridad",
    type: "single",
    title: "Cuando realiza actividad física, ¿cuánto tiempo suele mantenerse activo?",
    applicable: (a) => typeof a.frecuencia_actividad_fisica === "string" && a.frecuencia_actividad_fisica !== "ningun_dia",
    options: [
      { value: "menos_10", label: "Menos de 10 min" },
      { value: "10_20", label: "10-20 min" },
      { value: "20_30", label: "20-30 min" },
      { value: "mas_30", label: "Más de 30 min" },
      { value: "depende_dia", label: "Depende mucho del día" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "preferencias_actividad_fisica",
    module: "Movimiento y seguridad",
    type: "multi",
    title: (a) => `¿Qué tipos de movimiento realiza o disfruta ${nombreConTratamiento(a)}?`,
    options: [
      { value: "caminar", label: "Caminar" },
      { value: "bailar", label: "Bailar" },
      { value: "ejercicios_sentado", label: "Ejercicios sentado" },
      { value: "estiramientos", label: "Estiramientos" },
      { value: "fuerza", label: "Ejercicios de fuerza" },
      { value: "yoga_respiracion", label: "Yoga o respiración y movimiento" },
      { value: "bicicleta", label: "Bicicleta" },
      { value: "natacion", label: "Natación" },
      { value: "jardineria", label: "Jardinería" },
      { value: "tareas_hogar", label: "Tareas del hogar" },
      { value: "juegos_pelota", label: "Juegos con pelota" },
      { value: "otro", label: "Otro" },
      { value: "no_actualmente", label: "Actualmente no realiza actividad física" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "disposicion_movimiento",
    module: "Movimiento y seguridad",
    type: "single",
    title: (a) => `¿Cómo se siente ${nombreConTratamiento(a)} ante la idea de realizar actividades de movimiento?`,
    options: [
      { value: "le_gusta_participa", label: "Le gusta y suele participar" },
      { value: "participa_si_invitan", label: "Participa si alguien lo invita" },
      { value: "poca_motivacion", label: "Tiene poca motivación" },
      { value: "temor_caerse", label: "Siente temor de caerse o lastimarse" },
      { value: "rechaza", label: "Suele rechazar este tipo de actividades" },
    ],
  },
  {
    id: "transicion_cierre_bloque3",
    type: "info",
    title: "Gracias",
    body: (a) => {
      const nombre = nombreConTratamiento(a);
      const alertaGrave =
        (Array.isArray(a.consecuencias_caida) &&
          a.consecuencias_caida.some((v) => ["fractura", "golpe_cabeza", "dolor_continua", "mayor_dificultad_caminar"].includes(v))) ||
        ["esfuerzo_pequeno", "presentes_ahora"].includes(a.intensidad_sintomas_movimiento as string) ||
        (Array.isArray(a.sintomas_durante_movimiento) && a.sintomas_durante_movimiento.includes("dolor_pecho"));
      if (alertaGrave) {
        return "Antes de incluir algunos ejercicios, necesitaremos tomar en cuenta la situación de salud que nos indicaste. Mientras se consulta con un profesional, el plan evitará actividades que puedan representar un riesgo.";
      }
      const tieneRestricciones =
        a.restriccion_profesional_ejercicio === "si" ||
        (Array.isArray(a.zonas_limitacion_fisica) && a.zonas_limitacion_fisica.length > 0) ||
        (Array.isArray(a.movimientos_restringidos) && a.movimientos_restringidos.length > 0);
      if (tieneRestricciones) {
        return "Gracias. Tomaremos en cuenta las molestias y restricciones que nos indicaste. Seleccionaremos únicamente actividades compatibles con esta información y señalaremos cuándo es recomendable contar con acompañamiento.";
      }
      return `Gracias. Ya conocemos mejor cómo se mueve ${nombre}, qué actividades disfruta y qué apoyos necesita para realizarlas con seguridad. Utilizaremos esta información para adaptar la posición, la duración y la dificultad de sus ejercicios.`;
    },
    cta: "Continuar",
  },

  // §10 Bloque 4 — Alimentación, hidratación y condiciones nutricionales.
  {
    id: "transicion_nutricion",
    type: "info",
    title: "Alimentación e hidratación",
    body: (a) => {
      const intro = participanteEsRespondente(a)
        ? "Ahora queremos conocer un poco sobre tu alimentación e hidratación. Esta información nos ayudará a ofrecerte recomendaciones generales que se ajusten mejor a tus hábitos y condiciones de salud."
        : `Ahora queremos conocer un poco sobre la alimentación e hidratación de ${nombreConTratamiento(a)}. Esta información nos ayudará a ofrecer recomendaciones generales que se ajusten mejor a sus hábitos, necesidades y condiciones de salud.`;
      return `${intro} IntegraMente en Casa no sustituye una valoración nutricional ni modifica dietas indicadas por profesionales.`;
    },
    cta: "Continuar",
  },
  {
    id: "regularidad_alimentacion",
    module: "Alimentación e hidratación",
    type: "single",
    title: (a) => `En general, ¿cómo está comiendo ${nombreConTratamiento(a)}?`,
    options: [
      { value: "regular_horarios", label: "Come con regularidad y mantiene horarios" },
      { value: "salta_comidas", label: "Algunas veces come poco o se salta comidas" },
      { value: "come_poco_rechaza", label: "Con frecuencia come poco o rechaza alimentos" },
      { value: "necesita_recordatorio", label: "Necesita que otra persona le recuerde o le ofrezca la comida" },
      { value: "muy_variable", label: "Su alimentación cambia mucho de un día a otro" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "cambio_apetito",
    module: "Alimentación e hidratación",
    type: "single",
    title: (a) => `Durante las últimas semanas, ¿cómo ha estado el apetito de ${nombreConTratamiento(a)}?`,
    options: [
      { value: "como_costumbre", label: "Se mantiene como de costumbre" },
      { value: "disminuido_poco", label: "Ha disminuido un poco" },
      { value: "disminuido_importante", label: "Ha disminuido de manera importante" },
      { value: "aumentado", label: "Ha aumentado" },
      { value: "varia_mucho", label: "Varía mucho" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "perdida_peso_no_intencional",
    module: "Alimentación e hidratación",
    type: "single",
    title: "¿Ha perdido peso recientemente sin proponérselo?",
    applicable: (a) => a.cambio_apetito === "disminuido_importante" || a.regularidad_alimentacion === "come_poco_rechaza",
    options: [
      { value: "no", label: "No" },
      { value: "si_poco", label: "Sí, un poco" },
      { value: "si_evidente", label: "Sí, de manera evidente" },
      { value: "ropa_holgada", label: "La ropa le queda más holgada, pero no conocen el peso" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "valoracion_perdida_peso",
    module: "Alimentación e hidratación",
    type: "single",
    title: "¿La disminución del apetito o la pérdida de peso ha sido consultada con un profesional?",
    applicable: (a) => ["si_poco", "si_evidente", "ropa_holgada"].includes(a.perdida_peso_no_intencional as string),
    options: [
      { value: "si_recomendaciones", label: "Sí, ya recibió recomendaciones" },
      { value: "si_seguimiento", label: "Sí, continúa en seguimiento" },
      { value: "no", label: "No" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "patron_hidratacion",
    module: "Alimentación e hidratación",
    type: "single",
    title: (a) => `Durante el día, ¿${nombreConTratamiento(a)} toma líquidos con regularidad?`,
    example: "Agua, leche, sopas, etc.",
    options: [
      { value: "iniciativa_propia", label: "Sí, por iniciativa propia" },
      { value: "si_le_ofrecen", label: "Toma líquidos si se le ofrecen o recuerdan" },
      { value: "toma_poco", label: "Generalmente toma muy poco" },
      { value: "rechaza_frecuente", label: "Rechaza los líquidos con frecuencia" },
      { value: "restriccion_indicada", label: "Tiene una restricción de líquidos indicada por un profesional" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "posibles_signos_baja_hidratacion",
    module: "Alimentación e hidratación",
    type: "multi",
    title: "¿Han notado alguna de estas situaciones?",
    applicable: (a) => a.patron_hidratacion === "toma_poco" || a.patron_hidratacion === "rechaza_frecuente",
    exclusive: ["ninguna", "no_se"],
    options: [
      { value: "boca_seca", label: "Boca muy seca" },
      { value: "orina_oscura", label: "Orina muy oscura o escasa" },
      { value: "estrenimiento", label: "Estreñimiento frecuente" },
      { value: "mareos_debilidad", label: "Mareos o debilidad" },
      { value: "confusion", label: "Mayor confusión de lo habitual" },
      { value: "ninguna", label: "Ninguna" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "indicaciones_alimentarias",
    module: "Alimentación e hidratación",
    type: "multi",
    title: (a) => `¿${nombreConTratamiento(a)} sigue alguna alimentación especial o tiene indicaciones relacionadas con lo que puede comer o beber?`,
    exclusive: ["no_sigue", "no_se"],
    options: [
      { value: "diabetes", label: "Alimentación para diabetes" },
      { value: "baja_sal", label: "Alimentación baja en sal" },
      { value: "renal", label: "Alimentación para enfermedad renal" },
      { value: "restriccion_liquidos", label: "Restricción de líquidos" },
      { value: "colesterol", label: "Alimentación para colesterol o triglicéridos" },
      { value: "sin_gluten", label: "Dieta sin gluten" },
      { value: "alergia", label: "Alergia o intolerancia alimentaria" },
      { value: "textura_modificada", label: "Alimentos con textura modificada" },
      { value: "otra", label: "Otra indicación" },
      { value: "no_sigue", label: "No sigue una alimentación especial" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "otra_indicacion_alimentaria",
    module: "Alimentación e hidratación",
    type: "text",
    title: "¿Cuál otra indicación alimentaria debemos tomar en cuenta?",
    applicable: (a) => Array.isArray(a.indicaciones_alimentarias) && a.indicaciones_alimentarias.includes("otra"),
  },
  {
    id: "dificultades_alimentacion",
    module: "Alimentación e hidratación",
    type: "multi",
    title: (a) => `¿${nombreConTratamiento(a)} presenta alguna dificultad al comer o beber?`,
    exclusive: ["sin_dificultades", "no_se"],
    options: [
      { value: "masticar", label: "Le cuesta masticar algunos alimentos" },
      { value: "tose", label: "Tose mientras come o bebe" },
      { value: "atraganta", label: "Se atraganta" },
      { value: "alimento_no_pasa", label: "Siente que los alimentos no pasan bien" },
      { value: "voz_cambia", label: "Su voz cambia o suena húmeda después de comer" },
      { value: "guarda_comida", label: "Guarda comida en la boca" },
      { value: "come_lento", label: "Come muy lentamente" },
      { value: "sin_dificultades", label: "No presenta dificultades" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "origen_dificultad_masticacion",
    module: "Alimentación e hidratación",
    type: "single",
    title: "¿La dificultad para masticar se relaciona con los dientes, una prótesis dental o la dureza de algunos alimentos?",
    applicable: (a) => Array.isArray(a.dificultades_alimentacion) && a.dificultades_alimentacion.length === 1 && a.dificultades_alimentacion[0] === "masticar",
    options: [
      { value: "si", label: "Sí" },
      { value: "no_seguros", label: "No están seguros" },
      { value: "no", label: "No" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "valoracion_deglucion",
    module: "Alimentación e hidratación",
    type: "single",
    title: "¿Esta dificultad para tragar ha sido valorada por un profesional?",
    applicable: (a) =>
      Array.isArray(a.dificultades_alimentacion) &&
      a.dificultades_alimentacion.some((v) => ["tose", "atraganta", "alimento_no_pasa", "voz_cambia", "guarda_comida"].includes(v)),
    options: [
      { value: "si_indicaciones", label: "Sí, con indicaciones específicas" },
      { value: "en_proceso", label: "En proceso de valoración" },
      { value: "no_valorada", label: "No ha sido valorada" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "apoyo_durante_alimentacion",
    module: "Alimentación e hidratación",
    type: "single",
    title: (a) => `¿Qué apoyo necesita ${nombreConTratamiento(a)} para alimentarse?`,
    options: [
      { value: "independiente", label: "Elige, sirve y come por sí mismo" },
      { value: "otra_prepara", label: "Come por sí mismo pero otra persona prepara o sirve" },
      { value: "recordatorios", label: "Necesita recordatorios o supervisión" },
      { value: "ayuda_fisica_parcial", label: "Necesita ayuda física durante parte de la comida" },
      { value: "otra_alimenta", label: "Otra persona debe alimentarlo" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "responsable_preparacion_alimentos",
    module: "Alimentación e hidratación",
    type: "single",
    title: (a) => `¿Quién decide o prepara habitualmente los alimentos de ${nombreConTratamiento(a)}?`,
    // Auto-skip (§10.5, NUT-08): si en el Bloque 2 (AVDI) ya respondió que
    // prepara alimentos por sí mismo, se registra automáticamente como
    // responsable y no se vuelve a preguntar.
    applicable: (a) => a.avdi_preparacion_alimentos !== "independiente",
    options: [
      { value: "propia_persona", label: "La propia persona" },
      { value: "pareja", label: "Su pareja" },
      { value: "otro_familiar", label: "Otro familiar" },
      { value: "cuidador", label: "Una persona cuidadora" },
      { value: "residencia", label: "Una residencia o centro" },
      { value: "servicio_alimentacion", label: "Un servicio de alimentación" },
      { value: "varia_segun_dia", label: "Varía según el día" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "variedad_alimentaria",
    module: "Alimentación e hidratación",
    type: "single",
    title: (a) => `Pensando en una semana habitual, ¿cómo describirías la alimentación de ${nombreConTratamiento(a)}?`,
    options: [
      { value: "variada", label: "Variada, incluye diferentes grupos" },
      { value: "variedad_limitada", label: "Variedad limitada pero acepta varios alimentos" },
      { value: "siempre_lo_mismo", label: "Tiende a comer siempre lo mismo" },
      { value: "rechaza_muchos", label: "Rechaza muchos alimentos" },
      { value: "depende_otro", label: "Depende de lo que otra persona le ofrezca" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "preferencias_alimentarias",
    module: "Alimentación e hidratación",
    type: "multi",
    title: (a) => `¿Hay alimentos o preparaciones que ${nombreConTratamiento(a)} disfrute especialmente?`,
    options: [
      { value: "frutas", label: "Frutas" },
      { value: "vegetales", label: "Vegetales" },
      { value: "sopas", label: "Sopas" },
      { value: "arroz_frijoles", label: "Arroz y frijoles" },
      { value: "huevos", label: "Huevos" },
      { value: "pescado", label: "Pescado" },
      { value: "pollo_carnes", label: "Pollo o carnes" },
      { value: "lacteos", label: "Lácteos" },
      { value: "panes_cereales", label: "Panes o cereales" },
      { value: "postres", label: "Postres" },
      { value: "cafe_bebidas", label: "Café u otras bebidas habituales" },
      { value: "otra", label: "Otra preparación" },
    ],
  },
  {
    id: "preferencias_alimentarias_otra",
    module: "Alimentación e hidratación",
    type: "text",
    title: "Contanos cuál otra preparación disfruta.",
    applicable: (a) => Array.isArray(a.preferencias_alimentarias) && a.preferencias_alimentarias.includes("otra"),
  },
  {
    id: "transicion_cierre_bloque4",
    type: "info",
    title: "Gracias",
    body: (a) => {
      const nombre = nombreConTratamiento(a);
      const alertaGrave =
        a.cambio_apetito === "disminuido_importante" ||
        ["si_evidente"].includes(a.perdida_peso_no_intencional as string) ||
        (Array.isArray(a.dificultades_alimentacion) &&
          a.dificultades_alimentacion.some((v) => ["tose", "atraganta", "alimento_no_pasa", "voz_cambia"].includes(v)) &&
          a.valoracion_deglucion !== "si_indicaciones");
      if (alertaGrave) {
        return "Antes de definir algunas recomendaciones, necesitaremos tomar en cuenta la situación que nos indicaste sobre su alimentación. Mientras se consulta con un profesional, el plan evitará sugerencias que puedan representar un riesgo.";
      }
      const tieneRestricciones =
        Array.isArray(a.indicaciones_alimentarias) && a.indicaciones_alimentarias.some((v) => v !== "no_sigue" && v !== "no_se");
      if (tieneRestricciones) {
        return "Gracias. Tomaremos en cuenta las indicaciones alimentarias que nos compartiste. Las recomendaciones respetarán siempre lo indicado por sus profesionales de salud.";
      }
      const necesitaApoyo =
        ["recordatorios", "ayuda_fisica_parcial", "otra_alimenta"].includes(a.apoyo_durante_alimentacion as string) ||
        ["salta_comidas", "come_poco_rechaza", "necesita_recordatorio"].includes(a.regularidad_alimentacion as string);
      if (necesitaApoyo) {
        return `Gracias. Ya conocemos mejor los hábitos de alimentación de ${nombre} y el apoyo que puede necesitar. Compartiremos recomendaciones también con quien le acompaña durante las comidas.`;
      }
      return `Gracias. Ya conocemos mejor los hábitos de alimentación e hidratación de ${nombre}. Ahora queremos conocer un poco sobre su vida social, sus rutinas y las actividades que disfruta.`;
    },
    cta: "Continuar",
  },

  // §11 Bloque 5 — Vida social, estimulación y rutina.
  {
    id: "transicion_rutina",
    type: "info",
    title: "Rutina y vida social",
    body: (a) =>
      participanteEsRespondente(a)
        ? "Ahora queremos conocer cómo es tu rutina, con qué frecuencia compartís con otras personas y qué actividades realizás durante la semana. Una vida activa y significativa puede incluir muchas cosas: conversar, ayudar en casa, aprender, salir, escuchar música o participar en la comunidad."
        : `Ahora queremos conocer cómo es la rutina de ${nombreConTratamiento(a)}, con qué frecuencia comparte con otras personas y qué actividades realiza durante la semana. Esto nos ayudará a preparar un plan que se ajuste a su realidad y no únicamente a sus dificultades.`,
    cta: "Continuar",
  },
  {
    id: "frecuencia_contacto_social",
    module: "Rutina y vida social",
    type: "single",
    title: (a) => `¿Con qué frecuencia ${nombreConTratamiento(a)} conversa o comparte con familiares, amistades u otras personas?`,
    options: [
      { value: "casi_todos_dias", label: "Todos o casi todos los días" },
      { value: "varias_semana", label: "Varias veces por semana" },
      { value: "algunas_mes", label: "Algunas veces al mes" },
      { value: "casi_nunca", label: "Casi nunca" },
      { value: "acompanado_poco_contacto", label: "Vive acompañado pero conversa o comparte poco" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "percepcion_compania",
    module: "Rutina y vida social",
    type: "single",
    title: (a) =>
      participanteEsRespondente(a)
        ? "¿Sentís que tenés suficiente compañía y contacto con otras personas?"
        : `¿${nombreConTratamiento(a)} parece sentirse acompañado y satisfecho con el contacto que tiene con otras personas?`,
    options: [
      { value: "satisfecho", label: "Sí, parece satisfecho" },
      { value: "quisiera_mas", label: "Algunas veces quisiera compartir más" },
      { value: "solo_aislado", label: "Con frecuencia se siente solo o aislado" },
      { value: "prefiere_solo", label: "Prefiere estar solo y parece sentirse bien así" },
      { value: "no_logra_expresar", label: "No logra expresar cómo se siente" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "frecuencia_estimulacion_cognitiva",
    module: "Rutina y vida social",
    type: "single",
    title: (a) => `¿Con qué frecuencia ${nombreConTratamiento(a)} realiza actividades que le hacen pensar, recordar, aprender o resolver algo?`,
    example: "Leer, conversar, escribir, jugar, cocinar, usar tecnología, organizar, aprender.",
    options: [
      { value: "casi_todos_dias", label: "Todos o casi todos los días" },
      { value: "varias_semana", label: "Varias veces por semana" },
      { value: "algunas_mes", label: "Algunas veces al mes" },
      { value: "casi_nunca", label: "Casi nunca" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "forma_participacion_cognitiva",
    module: "Rutina y vida social",
    type: "single",
    title: "Cuando realiza este tipo de actividades, ¿cómo suele participar?",
    options: [
      { value: "inicia_por_si_mismo", label: "Las inicia y realiza por sí mismo" },
      { value: "si_se_propone", label: "Participa si alguien se las propone" },
      { value: "necesita_acompanamiento", label: "Necesita acompañamiento para mantener la actividad" },
      { value: "se_cansa_pierde_interes", label: "Se cansa o pierde el interés rápidamente" },
      { value: "no_desea_participar", label: "Generalmente no desea participar" },
      { value: "no_realiza", label: "Actualmente no realiza estas actividades" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "estructura_rutina_diaria",
    module: "Rutina y vida social",
    type: "single",
    title: (a) => `¿Cómo es la rutina diaria de ${nombreConTratamiento(a)}?`,
    options: [
      { value: "estable", label: "Mantiene horarios y actividades bastante estables" },
      { value: "poco_estructurada", label: "Tiene algunas rutinas pero los días son poco estructurados" },
      { value: "cambia_mucho", label: "La rutina cambia mucho de un día a otro" },
      { value: "sin_actividades_definidas", label: "Pasa gran parte del día sin actividades definidas" },
      { value: "depende_otro", label: "Depende de otra persona para organizar su día" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "actividades_predominantes",
    module: "Rutina y vida social",
    type: "multi",
    title: (a) => `En un día habitual, ¿en qué pasa ${nombreConTratamiento(a)} la mayor parte de su tiempo?`,
    example: "Elegí hasta 3 opciones.",
    maxSelect: 3,
    options: [
      { value: "conversando", label: "Conversando o compartiendo" },
      { value: "tareas_hogar", label: "Tareas del hogar" },
      { value: "trabajando_estudiando", label: "Trabajando o estudiando" },
      { value: "leyendo_aprendiendo", label: "Leyendo, escribiendo o aprendiendo" },
      { value: "musica_pasatiempos", label: "Escuchando música o pasatiempos" },
      { value: "caminando_actividad_fisica", label: "Caminando o actividad física" },
      { value: "television", label: "Viendo televisión" },
      { value: "dispositivos", label: "Usando teléfono/tableta/computadora" },
      { value: "descansando", label: "Descansando o durmiendo" },
      { value: "residencia_centro_diurno", label: "Residencia o centro diurno" },
      { value: "otra", label: "Otra actividad" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "participacion_actividades_cotidianas",
    module: "Rutina y vida social",
    type: "single",
    title: (a) => `¿Participa ${nombreConTratamiento(a)} en actividades sencillas del hogar o de su vida cotidiana?`,
    example: "Ordenar objetos, doblar ropa, regar plantas, preparar algo sencillo, cuidar mascota, etc.",
    options: [
      { value: "iniciativa_propia", label: "Sí, por iniciativa propia" },
      { value: "si_se_propone", label: "Participa si alguien se lo propone" },
      { value: "con_supervision", label: "Participa con supervisión o ayuda" },
      { value: "muy_poco", label: "Participa muy poco" },
      { value: "no_participa", label: "Actualmente no participa" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "frecuencia_salidas",
    module: "Rutina y vida social",
    type: "single",
    title: (a) => `¿Con qué frecuencia ${nombreConTratamiento(a)} sale de casa?`,
    options: [
      { value: "casi_todos_dias", label: "Todos o casi todos los días" },
      { value: "varias_semana", label: "Varias veces por semana" },
      { value: "algunas_mes", label: "Algunas veces al mes" },
      { value: "casi_nunca", label: "Casi nunca" },
      { value: "no_puede_salir", label: "Actualmente no puede salir" },
      { value: "prefiere_no_salir", label: "Prefiere no salir" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "barreras_para_salir",
    module: "Rutina y vida social",
    type: "multi",
    title: "¿Cuál es la principal razón por la que sale poco?",
    applicable: (a) => ["casi_nunca", "no_puede_salir", "prefiere_no_salir"].includes(a.frecuencia_salidas as string),
    options: [
      { value: "dificultad_caminar", label: "Dificultades para caminar" },
      { value: "miedo_caerse", label: "Miedo de caerse" },
      { value: "problemas_salud", label: "Problemas de salud" },
      { value: "desorientacion_acompanamiento", label: "Se desorienta o necesita acompañamiento" },
      { value: "sin_quien_acompane", label: "No tiene quién lo acompañe" },
      { value: "falta_transporte", label: "Falta de transporte" },
      { value: "ansiedad_inseguridad", label: "Ansiedad o inseguridad" },
      { value: "perdio_interes", label: "Ha perdido el interés" },
      { value: "prefiere_casa", label: "Prefiere permanecer en casa" },
      { value: "otra", label: "Otra razón" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "cambio_nivel_participacion",
    module: "Rutina y vida social",
    type: "single",
    title: (a) => `En comparación con años anteriores, ¿${nombreConTratamiento(a)} realiza menos actividades o comparte menos con otras personas?`,
    options: [
      { value: "se_mantiene", label: "No, se mantiene parecido" },
      { value: "disminuido_poco", label: "Sí, ha disminuido un poco" },
      { value: "disminuido_considerable", label: "Sí, ha disminuido considerablemente" },
      { value: "participa_mas", label: "Actualmente participa más que antes" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "motivos_disminucion_participacion",
    module: "Rutina y vida social",
    type: "multi",
    title: "¿Qué parece haber influido en esta disminución?",
    applicable: (a) => ["disminuido_poco", "disminuido_considerable"].includes(a.cambio_nivel_participacion as string),
    options: [
      { value: "cambios_memoria", label: "Cambios en memoria/pensamiento" },
      { value: "dificultad_movimiento", label: "Dificultades de movimiento" },
      { value: "problemas_salud", label: "Problemas de salud" },
      { value: "estado_animo", label: "Estado de ánimo" },
      { value: "perdida_persona_cercana", label: "Pérdida de una persona cercana" },
      { value: "cambio_vivienda_rutina", label: "Cambio de vivienda o rutina" },
      { value: "dejo_trabajar", label: "Dejó de trabajar o se pensionó" },
      { value: "menor_contacto", label: "Menor contacto con familiares o amistades" },
      { value: "falta_oportunidades", label: "Falta de oportunidades" },
      { value: "se_cansa_facilidad", label: "Se cansa con mayor facilidad" },
      { value: "otro", label: "Otro motivo" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "transicion_cierre_bloque5",
    type: "info",
    title: "Gracias",
    body: (a) => {
      const nombre = nombreConTratamiento(a);
      const bajaConexion =
        a.percepcion_compania === "solo_aislado" ||
        ["casi_nunca", "acompanado_poco_contacto"].includes(a.frecuencia_contacto_social as string);
      if (bajaConexion) {
        return `Gracias por compartirnos esto. Buscaremos formas realistas de acercar a ${nombre} a un poco más de compañía y contacto, sin forzar cambios grandes de una vez.`;
      }
      const pocoEstructurada =
        ["poco_estructurada", "cambia_mucho", "sin_actividades_definidas", "depende_otro"].includes(a.estructura_rutina_diaria as string);
      if (pocoEstructurada) {
        return `Gracias. Ya conocemos mejor cómo es el día a día de ${nombre}. Propondremos 1 o 2 momentos fijos para incorporar actividades, sin saturar su rutina.`;
      }
      return `Gracias. Ya conocemos mejor la rutina y la vida social de ${nombre}. Para terminar, queremos conocer un poco sobre sus gustos e intereses.`;
    },
    cta: "Continuar",
  },

  // §12 Bloque final — Intereses, pasatiempos e historia significativa.
  // RES-00/RES-01/cierre (§13) viven en una página dedicada
  // (ResumenFinal.tsx), no como preguntas del array: necesitan invocar el
  // generador de resumen y no encajan en el motor genérico de una
  // pregunta por pantalla.
  {
    id: "transicion_intereses",
    type: "info",
    title: "Gustos e intereses",
    body: (a) =>
      participanteEsRespondente(a)
        ? "Para terminar, queremos conocer un poco sobre las cosas que disfrutás y que han sido importantes en tu vida. Esto nos ayudará a preparar actividades que realmente tengan sentido para vos."
        : `Ya casi terminamos. Queremos conocer un poco sobre las cosas que disfruta ${nombreConTratamiento(a)} y que han sido importantes en su vida. Esto nos ayudará a preparar actividades cercanas a sus gustos y experiencias.`,
    cta: "Continuar",
  },
  {
    id: "intereses_actuales",
    module: "Gustos e intereses",
    type: "multi",
    title: (a) => `¿Qué actividades disfruta actualmente ${nombreConTratamiento(a)}?`,
    exclusive: ["poco_interes", "no_se"],
    options: [
      { value: "musica", label: "Escuchar música" },
      { value: "fotos_recuerdos", label: "Ver fotografías o recordar momentos" },
      { value: "conversar", label: "Conversar y compartir" },
      { value: "leer", label: "Leer" },
      { value: "escribir", label: "Escribir" },
      { value: "cocinar", label: "Cocinar" },
      { value: "jardineria", label: "Jardinería" },
      { value: "caminar", label: "Caminar" },
      { value: "bailar", label: "Bailar" },
      { value: "pintar_manualidades", label: "Pintar, dibujar o manualidades" },
      { value: "juegos_mesa", label: "Juegos de mesa, cartas o pasatiempos" },
      { value: "deportes_ver", label: "Ver deportes" },
      { value: "religioso_espiritual", label: "Actividades religiosas o espirituales" },
      { value: "cuidar_animales", label: "Cuidar animales" },
      { value: "television_peliculas", label: "Ver televisión o películas" },
      { value: "otra", label: "Otra actividad" },
      { value: "poco_interes", label: "Actualmente muestra poco interés" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "otro_interes_actual",
    module: "Gustos e intereses",
    type: "text",
    title: "Contanos cuál es esa otra actividad.",
    applicable: (a) => Array.isArray(a.intereses_actuales) && a.intereses_actuales.includes("otra"),
  },
  {
    id: "existen_intereses_previos",
    module: "Gustos e intereses",
    type: "single",
    title: (a) => `¿Hay alguna actividad que ${nombreConTratamiento(a)} disfrutaba mucho antes, aunque actualmente la realice menos o haya dejado de hacer?`,
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "intereses_previos_texto",
    module: "Gustos e intereses",
    type: "text",
    title: "¿Cuál o cuáles?",
    example: "Ej.: trabajar en el jardín, coser, enseñar, cocinar, bailar, viajar, jugar fútbol, cuidar animales.",
    applicable: (a) => a.existen_intereses_previos === "si",
  },
  {
    id: "temas_historia_significativa",
    module: "Gustos e intereses",
    type: "multi",
    title: (a) => `¿Qué ha sido especialmente importante para ${nombreConTratamiento(a)} a lo largo de su vida?`,
    example: "Elegí hasta 3 opciones.",
    maxSelect: 3,
    options: [
      { value: "familia", label: "Su familia" },
      { value: "trabajo", label: "Su trabajo u ocupación" },
      { value: "amistades", label: "Sus amistades" },
      { value: "comunidad", label: "Su comunidad" },
      { value: "campo_naturaleza", label: "La vida en el campo o la naturaleza" },
      { value: "religion_espiritualidad", label: "La religión o espiritualidad" },
      { value: "musica", label: "La música" },
      { value: "cocina", label: "La cocina" },
      { value: "deporte", label: "El deporte" },
      { value: "viajes", label: "Los viajes" },
      { value: "estudio_aprendizaje", label: "El estudio o aprendizaje" },
      { value: "cuidar_ayudar", label: "Cuidar y ayudar a otras personas" },
      { value: "otro", label: "Otro aspecto" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "otro_tema_biografico",
    module: "Gustos e intereses",
    type: "text",
    title: "¿Cuál otro aspecto ha sido importante?",
    applicable: (a) => Array.isArray(a.temas_historia_significativa) && a.temas_historia_significativa.includes("otro"),
  },
  {
    id: "disponibilidad_acompanante",
    module: "Gustos e intereses",
    type: "single",
    title: (a) => `Para algunas actividades, ¿hay alguien que pueda acompañar a ${nombreConTratamiento(a)}?`,
    options: [
      { value: "diario", label: "Sí, todos o casi todos los días" },
      { value: "varias_semana", label: "Sí, varias veces por semana" },
      { value: "ocasional", label: "Sí, pero solo ocasionalmente" },
      { value: "sin_acompanante", label: "No cuenta con una persona disponible" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
];

export function applicableQuestions(a: Answers): Question[] {
  return questions.filter((q) => !q.applicable || q.applicable(a));
}

export function resolveOptions(q: Question, a: Answers): Option[] {
  if (!q.options) return [];
  return typeof q.options === "function" ? q.options(a) : q.options;
}

// Human-readable rendering of whatever was answered — the single place the
// "revisar tu cuestionario" screen (and anything else that needs to show a
// past answer back to a person) turns a raw stored value into a label.
export function describeAnswer(q: Question, a: Answers): string {
  const value = a[q.id];
  if (q.type === "text") {
    return typeof value === "string" && value.trim() ? value.trim() : "Sin responder";
  }
  const opts = resolveOptions(q, a);
  if (Array.isArray(value)) {
    const labels = value.map((v) => opts.find((o) => o.value === v)?.label).filter((x): x is string => !!x);
    return labels.length ? labels.join(" · ") : "Sin responder";
  }
  if (typeof value === "string" && value) {
    return opts.find((o) => o.value === value)?.label ?? value;
  }
  return "Sin responder";
}

// Every answerable (non-"info") question that currently applies, grouped by
// module in the order each module first appears — the read model behind the
// "revisar tu cuestionario" screen.
export function groupAnswerableByModule(a: Answers): { module: string; questions: Question[] }[] {
  const order: string[] = [];
  const map = new Map<string, Question[]>();
  for (const q of applicableQuestions(a)) {
    if (q.type === "info" || !q.module) continue;
    if (!map.has(q.module)) {
      map.set(q.module, []);
      order.push(q.module);
    }
    map.get(q.module)!.push(q);
  }
  return order.map((m) => ({ module: m, questions: map.get(m)! }));
}
