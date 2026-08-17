// Onboarding conversation, as data — "Especificación Funcional del Onboarding (MVP)".
// One question per screen, adaptive: `applicable` skips a question when its
// condition isn't met, `options` can depend on prior answers (objetivo).

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

export interface Question {
  id: string;
  module?: string;
  title: string;
  subtitle?: string;
  example?: string;
  type: "single" | "multi" | "text" | "info";
  options?: Option[] | ((a: Answers) => Option[]);
  exclusive?: string[];
  applicable?: (a: Answers) => boolean;
  warning?: Warning;
  body?: string;
  cta?: string;
}

const freq4: Option[] = [
  { value: "nunca", label: "Nunca" },
  { value: "algunas", label: "Algunas veces" },
  { value: "frecuente", label: "Frecuentemente" },
  { value: "no_seguro", label: "No estoy seguro" },
];

const funcionalScale: Option[] = [
  { value: "si", label: "Sí" },
  { value: "con_ayuda", label: "Con ayuda" },
  { value: "no_puede", label: "No puede" },
];

const conductualScale3: Option[] = [
  { value: "no", label: "No" },
  { value: "ocasional", label: "Ocasional" },
  { value: "frecuente", label: "Frecuente" },
];

const frecuenciaConsumo: Option[] = [
  { value: "casi_nunca", label: "Casi nunca" },
  { value: "1_2_semana", label: "1-2 veces/semana" },
  { value: "3_mas_semana", label: "3 o más veces/semana" },
  { value: "todos_dias", label: "Todos los días" },
];

const dementiaQualifyingTypes = ["alzheimer", "vascular", "mixta", "lewy", "frontotemporal"];

function tieneDiagnostico(a: Answers) {
  return a.diagnostico_tiene === "si";
}

function conductualAplicable(a: Answers) {
  return (
    tieneDiagnostico(a) &&
    dementiaQualifyingTypes.includes(a.diagnostico_tipo as string) &&
    (a.diagnostico_etapa === "moderada" || a.diagnostico_etapa === "avanzada")
  );
}

const objetivoOptions: Record<string, Option[]> = {
  familiar: [
    { value: "entender", label: "Entender mejor lo que está pasando" },
    { value: "cuidar_mejor", label: "Aprender cómo cuidar mejor a mi familiar" },
    { value: "actividades_casa", label: "Tener actividades para hacer en casa" },
    { value: "dudas", label: "Resolver dudas" },
    { value: "acompanado", label: "Sentirme acompañado" },
    { value: "habitos_cerebro", label: "Aprender hábitos para cuidar el cerebro" },
    { value: "otro", label: "Otro" },
  ],
  cuidador: [
    { value: "actividades_faciles", label: "Tener actividades fáciles" },
    { value: "nuevas_estrategias", label: "Aprender nuevas estrategias" },
    { value: "organizar_dia", label: "Organizar mejor el día" },
    { value: "dudas", label: "Resolver dudas" },
    { value: "acompanado", label: "Sentirme acompañado" },
    { value: "otro", label: "Otro" },
  ],
  profesional: [
    { value: "complemento_terapias", label: "Complemento de mis terapias" },
    { value: "enviar_ejercicios", label: "Enviar ejercicios a pacientes" },
    { value: "seguimiento", label: "Hacer seguimiento" },
    { value: "educar_familias", label: "Educar familias" },
    { value: "recursos_clinicos", label: "Obtener recursos clínicos" },
    { value: "otro", label: "Otro" },
  ],
  usuario: [
    { value: "mantener_memoria", label: "Mantener mi memoria" },
    { value: "mantenerme_activo", label: "Mantenerme activo" },
    { value: "organizar_dia", label: "Organizar mejor mi día" },
    { value: "habitos_saludables", label: "Aprender hábitos saludables" },
    { value: "prevenir", label: "Prevenir problemas futuros" },
    { value: "otro", label: "Otro" },
  ],
};

export const questions: Question[] = [
  {
    id: "bienvenida",
    type: "info",
    title: "Bienvenido a IntegraMente en Casa",
    body: "Nos alegra acompañarte. En los próximos minutos conoceremos un poco mejor a la persona para crear un Plan de Salud Cerebral Personalizado. Tiempo aproximado: 5 minutos.",
    cta: "Comenzar",
  },
  {
    id: "quien_usa",
    module: "Sobre vos",
    type: "single",
    title: "¿Quién utilizará principalmente IntegraMente en Casa?",
    options: [
      { value: "familiar", label: "Soy un familiar" },
      { value: "cuidador", label: "Soy un cuidador" },
      { value: "profesional", label: "Soy un profesional de salud" },
      { value: "usuario", label: "Soy la persona que realizará las actividades" },
    ],
  },
  {
    id: "objetivo",
    module: "Sobre vos",
    type: "single",
    title: "¿Qué esperas encontrar en IntegraMente?",
    options: (a) => objetivoOptions[(a.quien_usa as string) || "familiar"],
  },

  { id: "persona_nombre", module: "Conozcamos a la persona", type: "text", title: "¿Cómo se llama?" },
  { id: "persona_edad", module: "Conozcamos a la persona", type: "text", title: "¿Qué edad tiene?" },
  {
    id: "persona_escolaridad",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Cuál fue el último nivel de estudios que completó?",
    options: [
      { value: "nula", label: "Educación nula" },
      { value: "primaria", label: "Primaria" },
      { value: "secundaria", label: "Secundaria" },
      { value: "tecnico", label: "Técnico" },
      { value: "universidad", label: "Universidad" },
      { value: "posgrado", label: "Posgrado" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "persona_convivencia",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Con quién vive?",
    options: [
      { value: "solo", label: "Solo" },
      { value: "pareja", label: "Con pareja" },
      { value: "familiares", label: "Con familiares" },
      { value: "cuidador", label: "Con cuidador" },
    ],
  },
  {
    id: "persona_tiempo_con",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Quién pasa más tiempo con esta persona?",
    options: [
      { value: "pareja", label: "Pareja" },
      { value: "hijo", label: "Hijo(a)" },
      { value: "cuidador", label: "Cuidador" },
      { value: "otro", label: "Otro" },
    ],
  },

  {
    id: "diagnostico_tiene",
    module: "Diagnóstico",
    type: "single",
    title: "¿Algún profesional les ha explicado el diagnóstico?",
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
      { value: "no_seguro", label: "No estamos seguros" },
    ],
  },
  {
    id: "diagnostico_tipo",
    module: "Diagnóstico",
    type: "single",
    title: "¿Qué diagnóstico les indicaron?",
    applicable: tieneDiagnostico,
    options: [
      { value: "dcl", label: "Deterioro cognitivo leve" },
      { value: "alzheimer", label: "Alzheimer" },
      { value: "vascular", label: "Demencia vascular" },
      { value: "mixta", label: "Demencia mixta" },
      { value: "lewy", label: "Lewy" },
      { value: "frontotemporal", label: "Frontotemporal" },
      { value: "parkinson", label: "Parkinson" },
      { value: "otro", label: "Otro" },
      { value: "no_recuerdo", label: "No recuerdo cuál" },
    ],
  },
  {
    id: "diagnostico_tiempo",
    module: "Diagnóstico",
    type: "single",
    title: "¿Hace cuánto recibió ese diagnóstico?",
    applicable: tieneDiagnostico,
    options: [
      { value: "menos_6m", label: "Menos de 6 meses" },
      { value: "6m_2a", label: "6 meses a 2 años" },
      { value: "mas_2a", label: "Más de 2 años" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "diagnostico_etapa",
    module: "Diagnóstico",
    type: "single",
    title: "¿Recuerdan en qué etapa se encuentra?",
    applicable: tieneDiagnostico,
    options: [
      { value: "leve", label: "Leve" },
      { value: "moderada", label: "Moderada" },
      { value: "avanzada", label: "Avanzada" },
      { value: "no_se", label: "No lo sé" },
    ],
  },

  {
    id: "condiciones",
    module: "Su salud",
    type: "multi",
    title: "¿Algún profesional le ha diagnosticado alguna de estas condiciones?",
    exclusive: ["ninguna", "no_se"],
    options: [
      { value: "diabetes", label: "Diabetes" },
      { value: "hipertension", label: "Hipertensión" },
      { value: "colesterol", label: "Colesterol alto" },
      { value: "cardiaca", label: "Enfermedad cardíaca" },
      { value: "renal", label: "Enfermedad renal" },
      { value: "parkinson", label: "Parkinson" },
      { value: "depresion", label: "Depresión" },
      { value: "ansiedad", label: "Ansiedad" },
      { value: "acv", label: "Accidente cerebrovascular" },
      { value: "vision", label: "Problemas importantes de visión" },
      { value: "audicion", label: "Problemas importantes de audición" },
      { value: "osteoporosis", label: "Osteoporosis" },
      { value: "ninguna", label: "Ninguna" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "medicamentos_toma",
    module: "Su salud",
    type: "single",
    title: "¿Actualmente toma medicamentos todos los días?",
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "medicamentos_administra",
    module: "Su salud",
    type: "single",
    title: "¿Quién se encarga de administrarlos?",
    applicable: (a) => a.medicamentos_toma === "si",
    options: [
      { value: "misma_persona", label: "La misma persona" },
      { value: "familiar_recuerda", label: "Un familiar recuerda" },
      { value: "familiar_prepara", label: "Un familiar prepara" },
      { value: "cuidador_administra", label: "Un cuidador administra" },
    ],
  },

  {
    id: "memoria_repite",
    module: "Su memoria",
    type: "single",
    title: "¿Ha comenzado a repetir varias veces la misma pregunta?",
    example: "Ej.: «¿Qué hora es?», «¿Ya almorzamos?»",
    options: freq4,
  },
  {
    id: "memoria_olvida",
    module: "Su memoria",
    type: "single",
    title: "¿Olvida conversaciones recientes?",
    example: "Ej.: Le cuentan algo y minutos después no lo recuerda.",
    options: freq4,
  },
  {
    id: "memoria_aprender",
    module: "Su memoria",
    type: "single",
    title: "¿Le cuesta aprender cosas nuevas?",
    example: "Ej.: Usar un teléfono o electrodoméstico nuevo.",
    options: freq4,
  },
  {
    id: "memoria_desorientacion",
    module: "Su memoria",
    type: "single",
    title: "¿Se desorienta en lugares conocidos?",
    example: "Ej.: Supermercado o barrio.",
    options: freq4,
    warning: {
      when: (v) => v === "frecuente",
      message: "Vamos a activar las recomendaciones de prevención de extravío.",
      ctaLabel: "Ver las medidas",
      to: "/app/alerta/extravio",
    },
  },
  {
    id: "memoria_lenguaje",
    module: "Su memoria",
    type: "single",
    title: "¿Ha notado cambios en su forma de hablar o encontrar palabras?",
    options: freq4,
  },
  {
    id: "memoria_instrucciones",
    module: "Su memoria",
    type: "single",
    title: "¿Cuántas instrucciones logra seguir?",
    options: [
      { value: "una", label: "Una" },
      { value: "dos", label: "Dos" },
      { value: "varias", label: "Varias" },
    ],
  },

  {
    id: "conductual_irritabilidad",
    module: "Conducta",
    type: "single",
    title: "¿Con qué frecuencia se muestra irritable?",
    applicable: conductualAplicable,
    options: conductualScale3,
  },
  {
    id: "conductual_ideas_falsas",
    module: "Conducta",
    type: "single",
    title: "¿Ha tenido ideas falsas o percepciones que no corresponden a la realidad?",
    applicable: conductualAplicable,
    options: conductualScale3,
  },
  {
    id: "conductual_deambulacion",
    module: "Conducta",
    type: "single",
    title: "¿Camina sin rumbo o intenta salir de la casa sin motivo claro?",
    applicable: conductualAplicable,
    options: conductualScale3,
  },
  {
    id: "conductual_ansiedad",
    module: "Conducta",
    type: "single",
    title: "¿Cómo ha estado su nivel de ansiedad?",
    applicable: conductualAplicable,
    options: [
      { value: "no", label: "No" },
      { value: "leve", label: "Leve" },
      { value: "severa", label: "Severa" },
    ],
  },

  { id: "funcional_medicamentos", module: "Su día a día", type: "single", title: "¿Puede tomar medicamentos?", options: funcionalScale },
  { id: "funcional_desayuno", module: "Su día a día", type: "single", title: "¿Puede preparar un desayuno sencillo?", options: funcionalScale },
  { id: "funcional_ropa", module: "Su día a día", type: "single", title: "¿Puede escoger la ropa adecuada?", options: funcionalScale },
  { id: "funcional_banarse", module: "Su día a día", type: "single", title: "¿Puede bañarse?", options: funcionalScale },
  { id: "funcional_compra", module: "Su día a día", type: "single", title: "¿Puede realizar una compra pequeña?", options: funcionalScale },
  {
    id: "funcional_telefono",
    module: "Su día a día",
    type: "single",
    title: "¿Puede utilizar el teléfono para llamar a otra persona?",
    options: funcionalScale,
  },

  {
    id: "movimiento_desplazamiento",
    module: "Cómo se mueve",
    type: "single",
    title: "¿Cómo se desplaza la mayor parte del tiempo?",
    options: [
      { value: "sin_ayuda", label: "Camina sin ayuda" },
      { value: "baston", label: "Camina con bastón" },
      { value: "andadera", label: "Camina con andadera" },
      { value: "apoyo_persona", label: "Necesita apoyarse en otra persona" },
      { value: "silla_ruedas", label: "Utiliza silla de ruedas" },
      { value: "sentado_cama", label: "Permanece sentado o en cama" },
    ],
  },
  {
    id: "movimiento_seguridad",
    module: "Cómo se mueve",
    type: "single",
    title: "Cuando camina, ¿qué tan seguro se siente?",
    options: [
      { value: "completamente_seguro", label: "Completamente seguro" },
      { value: "a_veces_inseguro", label: "A veces siente inseguridad" },
      { value: "necesita_apoyo", label: "Casi siempre necesita apoyo" },
      { value: "no_puede_caminar", label: "No puede caminar sin ayuda" },
    ],
  },
  {
    id: "movimiento_caidas",
    module: "Cómo se mueve",
    type: "single",
    title: "¿Ha sufrido alguna caída durante el último año?",
    options: [
      { value: "ninguna", label: "No" },
      { value: "una", label: "Sí, una vez" },
      { value: "dos_mas", label: "Sí, dos o más veces" },
      { value: "no_seguro", label: "No estoy seguro" },
    ],
    warning: {
      when: (v) => v === "dos_mas",
      message: "Vamos a suspender las actividades de pie hasta revisar esto con más cuidado.",
      ctaLabel: "Ver qué hacer ante una caída",
      to: "/app/alerta/caida",
    },
  },
  {
    id: "movimiento_salir",
    module: "Cómo se mueve",
    type: "single",
    title: "Cuando sale de casa…",
    options: [
      { value: "solo", label: "Sale solo" },
      { value: "acompanado", label: "Prefiere ir acompañado" },
      { value: "siempre_ayuda", label: "Siempre necesita ayuda" },
      { value: "no_sale", label: "Generalmente no sale" },
    ],
  },
  {
    id: "movimiento_levantarse",
    module: "Cómo se mueve",
    type: "single",
    title: "¿Puede levantarse de una silla sin ayuda?",
    options: [
      { value: "sin_dificultad", label: "Sí, fácilmente" },
      { value: "con_impulso", label: "Sí, impulsándose con las manos" },
      { value: "necesita_ayuda", label: "Necesita ayuda" },
      { value: "no_puede", label: "No puede" },
    ],
  },
  {
    id: "movimiento_depie",
    module: "Cómo se mueve",
    type: "single",
    title: "Cuando permanece de pie…",
    options: [
      { value: "sin_apoyo", label: "Sin apoyo varios minutos" },
      { value: "poco_tiempo", label: "Solo poco tiempo" },
      { value: "necesita_apoyo", label: "Necesita apoyarse" },
      { value: "no_puede", label: "No puede permanecer de pie" },
    ],
  },
  {
    id: "movimiento_sigue_indicaciones",
    module: "Cómo se mueve",
    type: "single",
    title: "Durante los ejercicios, ¿logra seguir las indicaciones?",
    options: [
      { value: "sin_dificultad", label: "Sí, sin dificultad" },
      { value: "repeticion", label: "Necesita repetición" },
      { value: "demostracion", label: "Necesita demostración" },
      { value: "alguien_con_el", label: "Necesita que alguien haga el ejercicio con él" },
      { value: "no_logra", label: "No logra seguirlas" },
    ],
  },
  {
    id: "movimiento_limitacion_medica",
    module: "Cómo se mueve",
    type: "single",
    title: "¿Algún médico le ha indicado limitar el ejercicio físico?",
    options: [
      { value: "no", label: "No" },
      { value: "si", label: "Sí" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "movimiento_motivo_limitacion",
    module: "Cómo se mueve",
    type: "single",
    title: "¿Por qué motivo?",
    applicable: (a) => a.movimiento_limitacion_medica === "si",
    options: [
      { value: "corazon", label: "Problemas del corazón" },
      { value: "respiratorio", label: "Problemas respiratorios" },
      { value: "cirugia", label: "Cirugía reciente" },
      { value: "fractura", label: "Fractura reciente" },
      { value: "dolor", label: "Dolor importante" },
      { value: "otro", label: "Otro" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "movimiento_mejorar",
    module: "Cómo se mueve",
    type: "single",
    title: "¿Qué les gustaría mejorar principalmente con las actividades físicas?",
    options: [
      { value: "caminar_seguro", label: "Caminar con mayor seguridad" },
      { value: "equilibrio", label: "Mejorar equilibrio" },
      { value: "fuerza", label: "Tener más fuerza" },
      { value: "activo", label: "Mantenerse activo" },
      { value: "facilidad", label: "Moverse con mayor facilidad" },
      { value: "independencia", label: "Mantener la independencia" },
    ],
  },

  {
    id: "nutricion_perdida_peso",
    module: "Su alimentación",
    type: "single",
    title: "¿Ha perdido peso sin proponérselo en los últimos meses?",
    options: [
      { value: "no", label: "No" },
      { value: "si", label: "Sí" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "nutricion_come_menos",
    module: "Su alimentación",
    type: "single",
    title: "¿Ha comido menos que antes?",
    options: [
      { value: "no", label: "No" },
      { value: "si", label: "Sí" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "nutricion_masticar_tragar",
    module: "Su alimentación",
    type: "single",
    title: "¿Le cuesta masticar o tragar alimentos o líquidos?",
    example: "Ej.: agua, pan, carne",
    options: [
      { value: "no", label: "No" },
      { value: "a_veces", label: "A veces" },
      { value: "frecuentemente", label: "Frecuentemente" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "nutricion_ultraprocesados",
    module: "Su alimentación",
    type: "single",
    title:
      "¿Con qué frecuencia consume refrescos, comida rápida, galletas empacadas, papas fritas de paquete, jamón, salchichas o mortadela?",
    options: frecuenciaConsumo,
  },
  {
    id: "nutricion_frutas_veg",
    module: "Su alimentación",
    type: "single",
    title: "¿Con qué frecuencia consume frutas, vegetales, frijoles/lentejas, pescado, nueces o semillas?",
    options: frecuenciaConsumo,
  },
  {
    id: "nutricion_agua",
    module: "Su alimentación",
    type: "single",
    title: "Durante un día normal, ¿cuánta agua toma aproximadamente?",
    options: [
      { value: "menos_3", label: "Menos de 3 vasos" },
      { value: "3_5", label: "3-5 vasos" },
      { value: "6_8", label: "6-8 vasos" },
      { value: "mas_8", label: "Más de 8 vasos" },
      { value: "no_se", label: "No lo sé" },
    ],
  },
  {
    id: "nutricion_quien_prepara",
    module: "Su alimentación",
    type: "single",
    title: "¿Quién prepara generalmente las comidas?",
    options: [
      { value: "misma_persona", label: "La misma persona" },
      { value: "familiar", label: "Un familiar" },
      { value: "cuidador", label: "Un cuidador" },
      { value: "otro", label: "Otra persona" },
    ],
  },
  {
    id: "nutricion_meta",
    module: "Su alimentación",
    type: "single",
    title: "¿Qué les gustaría lograr con la alimentación?",
    options: [
      { value: "energia", label: "Más energía" },
      { value: "cerebro", label: "Cuidar el cerebro" },
      { value: "controlar_enfermedad", label: "Controlar una enfermedad" },
      { value: "disfrutar", label: "Disfrutar más las comidas" },
      { value: "no_seguro", label: "No estoy seguro" },
    ],
  },

  {
    id: "persona2_actividades",
    module: "Conozcamos a la persona",
    type: "multi",
    title: "¿Qué actividades disfruta?",
    options: [
      { value: "musica", label: "Música" },
      { value: "caminar", label: "Caminar" },
      { value: "jardineria", label: "Jardinería" },
      { value: "cocinar", label: "Cocinar" },
      { value: "leer", label: "Leer" },
      { value: "pintar", label: "Pintar" },
      { value: "bailar", label: "Bailar" },
      { value: "fotos", label: "Fotografías" },
      { value: "rompecabezas", label: "Rompecabezas" },
      { value: "manualidades", label: "Manualidades" },
      { value: "otro", label: "Otro" },
    ],
  },
  {
    id: "persona2_fortalezas",
    module: "Conozcamos a la persona",
    type: "multi",
    title: "¿Qué cosas hace especialmente bien?",
    options: [
      { value: "conversar", label: "Conversar" },
      { value: "historias", label: "Contar historias" },
      { value: "cocinar", label: "Cocinar" },
      { value: "resolver", label: "Resolver problemas" },
      { value: "activo", label: "Mantenerse activo" },
      { value: "humor", label: "Buen sentido del humor" },
      { value: "sociable", label: "Es muy sociable" },
      { value: "otro", label: "Otro" },
    ],
  },
  {
    id: "persona2_incomoda",
    module: "Conozcamos a la persona",
    type: "multi",
    title: "¿Hay algo que normalmente le incomode?",
    options: [
      { value: "ruido", label: "Mucho ruido" },
      { value: "luces", label: "Luces intensas" },
      { value: "personas", label: "Muchas personas" },
      { value: "rutina", label: "Cambios de rutina" },
      { value: "lugares_nuevos", label: "Lugares nuevos" },
      { value: "otro", label: "Otro" },
    ],
  },
  {
    id: "persona2_momento_dia",
    module: "Conozcamos a la persona",
    type: "single",
    title: "¿Qué momento del día suele disfrutar más?",
    options: [
      { value: "manana", label: "Mañana" },
      { value: "tarde", label: "Tarde" },
      { value: "noche", label: "Noche" },
      { value: "variable", label: "Es muy variable" },
    ],
  },
  {
    id: "persona2_notas",
    module: "Conozcamos a la persona",
    type: "text",
    title: "¿Hay algo más que te gustaría que conociéramos sobre esta persona?",
  },

  {
    id: "preocupacion_principal",
    module: "Última pregunta",
    type: "single",
    title: "¿Cuál es la principal preocupación en este momento?",
    options: [
      { value: "memoria", label: "Que pierda memoria" },
      { value: "caminar", label: "Que deje de caminar" },
      { value: "triste", label: "Que esté triste" },
      { value: "conducta", label: "Que tenga cambios de conducta" },
      { value: "dormir", label: "Que duerma mejor" },
      { value: "aprender_cuidar", label: "Aprender a cuidarlo mejor" },
      { value: "calidad_vida", label: "Mantener su calidad de vida" },
      { value: "otra", label: "Otra" },
    ],
  },

  {
    id: "final",
    type: "info",
    title: "¡Muchas gracias por tomarte este tiempo!",
    body: "Con esta información comenzaremos a crear un Plan de Salud Cerebral Personalizado. A partir de ahora la aplicación adaptará actividades, recomendaciones y recursos según las necesidades, fortalezas e intereses de la persona.",
    cta: "Ver mi plan personalizado",
  },
];

export function applicableQuestions(a: Answers): Question[] {
  return questions.filter((q) => !q.applicable || q.applicable(a));
}

export function resolveOptions(q: Question, a: Answers): Option[] {
  if (!q.options) return [];
  return typeof q.options === "function" ? q.options(a) : q.options;
}
