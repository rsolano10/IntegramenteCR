// Seed data for the prototype. No backend yet — this stands in for the
// Participant / Caregiver / Professional / Content / Plan model described
// in the Handoff (data model minimo).

export type Semaforo = "verde" | "amarillo" | "rojo";

export interface PlanTier {
  id: "autoguiado" | "orientado" | "clinico";
  nombre: string;
  tagline: string;
  precio: string;
  periodo: string;
  cta: string;
  recomendado?: boolean;
  features: string[];
}

export const planTiers: PlanTier[] = [
  {
    id: "autoguiado",
    nombre: "Autoguiado",
    tagline: "Para familias que empiezan hoy.",
    precio: "₡19,900",
    periodo: "por mes",
    cta: "Empezar",
    features: [
      "Perfil funcional y filtro de seguridad",
      "Plan semanal generado automáticamente",
      "Biblioteca de actividades filtrada por perfil",
      "Asistente guiado para dudas frecuentes",
    ],
  },
  {
    id: "orientado",
    nombre: "Orientado",
    tagline: "Para quienes necesitan mayor personalización.",
    precio: "₡34,900",
    periodo: "por mes",
    cta: "Solicitar",
    recomendado: true,
    features: [
      "Todo lo de Autoguiado",
      "Consulta inicial con un profesional",
      "Ajustes periódicos hechos por el equipo clínico",
      "Notas y mensajes directos de la profesional asignada",
    ],
  },
  {
    id: "clinico",
    nombre: "Clínico",
    tagline: "Para pacientes actuales de IntegraMente.",
    precio: "Incluido",
    periodo: "en tu programa",
    cta: "Ingresar",
    features: [
      "Continuidad entre sesiones presenciales",
      "El plan lo define el equipo tratante",
      "Panel clínico con historial completo",
      "Prioridad en la bandeja de alertas",
    ],
  },
];

// Rosa's name/edad/intereses/modalidad now live in the store (onboarding2 +
// modalidad), so every view reads the same record — see src/lib/patient.ts.
// "Marcela" (the familiar administrador account holder) stays a fixed literal
// across the app; only the participant's own identity is data-driven.

export const professional = {
  nombre: "Dra. Guiselle Solano",
  especialidad: "Neuropsicología",
};

// The single source for every hard number shown on a safety screen. Ideacion
// and Maltrato each keep their own contextual framing text (the "why" for
// that situation genuinely differs), but both read the actual phone
// numbers/lines from here via `id` — so a number never has to be updated
// in two places to stay correct everywhere it's shown.
export const emergencyContacts = [
  { id: "emergencia", label: "Emergencia inmediata", value: "9-1-1" },
  {
    id: "apoyo",
    label: "Línea de apoyo emocional · Costa Rica",
    value: "1322 · Aquí Estoy",
    note: "Atención gratuita en crisis, 24 horas.",
  },
  {
    id: "conapam",
    label: "CONAPAM · Consejo Nacional de la Persona Adulta Mayor",
    value: "Línea de denuncia y orientación",
    note: "Para personas adultas mayores en Costa Rica.",
  },
];

// "no" is distinct from "pendiente": a task that was registered as not done
// today, versus one that simply hasn't come up yet. Never styled as a
// failure (Handoff rule: nadie tiene que justificar un día difícil).
export type PlanDayStatus = "realizado" | "parcial" | "no" | "pendiente" | "futuro";

// Handoff §2 · PlanItem — dia, contenidoId, duracionMin, consignas[], precauciones[], estado.
// A day can carry more than one task, at the same or different hours.
export interface PlanTask {
  id: string;
  hora: string;
  titulo: string;
  tipo: "video" | "actividad" | "estrategia" | "neuroproteccion";
  estado: PlanDayStatus;
  duracion?: string;
  detalle?: string;
  precaucion?: string;
  pasos?: string[];
  porQue?: string;
}

export interface PlanDay {
  dia: string;
  isToday?: boolean;
  tasks: PlanTask[];
}

export const weeklyPlan: PlanDay[] = [
  {
    dia: "Lunes",
    tasks: [
      {
        id: "lun-1",
        hora: "9:00 a.m.",
        titulo: "Movilidad sentada",
        tipo: "video",
        estado: "realizado",
        duracion: "12 min",
        detalle: "Serie de movimientos de brazos y piernas sentada, con apoyo firme.",
      },
    ],
  },
  {
    dia: "Martes",
    tasks: [
      {
        id: "mar-1",
        hora: "10:30 a.m.",
        titulo: "Ordenar fotos de familia",
        tipo: "actividad",
        estado: "parcial",
        duracion: "15 min",
        detalle: "Organizar cinco fotografías y conversar sobre cada una.",
        precaucion: "Se cansó a la mitad — está bien dejarla para otro momento.",
      },
    ],
  },
  {
    dia: "Miércoles",
    isToday: true,
    tasks: [
      {
        id: "mie-1",
        hora: "9:30 a.m.",
        titulo: "Movilidad sentada",
        tipo: "video",
        estado: "pendiente",
        duracion: "12 min",
        detalle: "Serie de movimientos de brazos y piernas sentada, con apoyo firme.",
      },
      {
        id: "mie-2",
        hora: "3:00 p.m.",
        titulo: "Preparar una merienda",
        tipo: "actividad",
        estado: "pendiente",
        duracion: "15 min",
        detalle: "Cocina · una instrucción por vez.",
        precaucion: "Nada caliente sin supervisión. Si se frustra, terminá la actividad sin corregir.",
        pasos: [
          "Poné sobre la mesa solo lo que se va a usar.",
          "Pedí una acción por vez y esperá sin apurar.",
          "Dejá que elija el pan o la fruta: la decisión es parte del ejercicio.",
        ],
        porQue:
          "Cocinar aparece entre sus intereses, mantiene secuencia de pasos y se hace de pie con apoyo en la mesa, compatible con su movilidad.",
      },
    ],
  },
  {
    dia: "Jueves",
    tasks: [
      {
        id: "jue-1",
        hora: "9:00 a.m.",
        titulo: "Repetir movilidad sentada",
        tipo: "video",
        estado: "futuro",
        duracion: "12 min",
      },
      {
        id: "jue-2",
        hora: "4:30 p.m.",
        titulo: "Ofrecer agua y merienda ligera",
        tipo: "neuroproteccion",
        estado: "futuro",
        detalle: "Cuidado neuroprotector: hidratación en cada comida y a media tarde.",
      },
    ],
  },
  {
    dia: "Viernes",
    tasks: [
      {
        id: "vie-1",
        hora: "10:00 a.m.",
        titulo: "Regar las plantas juntas",
        tipo: "actividad",
        estado: "futuro",
        duracion: "10 min",
      },
    ],
  },
  { dia: "Sábado", tasks: [] },
  {
    dia: "Domingo",
    tasks: [
      {
        id: "dom-1",
        hora: "5:00 p.m.",
        titulo: "Dar una instrucción por vez y evitar corregir innecesariamente",
        tipo: "estrategia",
        estado: "futuro",
        detalle: "Estrategia de la semana para toda la familia, no solo para una actividad puntual.",
      },
    ],
  },
];

export type ActivityCategory = "Movimiento" | "Cognitiva" | "Social" | "Relajación" | "Música";

export interface LibraryItem {
  titulo: string;
  detalle: string;
  categoria: ActivityCategory;
  tipo: "video" | "actividad" | "estrategia";
  disponible: boolean;
  motivoBloqueo?: string;
}

export const libraryItems: LibraryItem[] = [
  { titulo: "Movilidad sentada", detalle: "12 min · sin riesgo de caída", categoria: "Movimiento", tipo: "video", disponible: true },
  { titulo: "Cocinar con una consigna", detalle: "15 min · supervisión", categoria: "Social", tipo: "actividad", disponible: true },
  { titulo: "Canciones de su época", detalle: "10 min · reminiscencia", categoria: "Música", tipo: "video", disponible: true },
  { titulo: "Ordenar fotografías por año", detalle: "15 min · sentada", categoria: "Cognitiva", tipo: "actividad", disponible: true },
  { titulo: "Respiración guiada", detalle: "8 min · para momentos de angustia", categoria: "Relajación", tipo: "video", disponible: true },
  { titulo: "Llamada semanal con un nieto o nieta", detalle: "10 min · por teléfono o video", categoria: "Social", tipo: "actividad", disponible: true },
  { titulo: "Regar y podar las plantas", detalle: "10 min · de pie con apoyo", categoria: "Movimiento", tipo: "actividad", disponible: true },
  { titulo: "Una instrucción por vez", detalle: "Estrategia para toda la familia", categoria: "Cognitiva", tipo: "estrategia", disponible: true },
  {
    titulo: "Ejercicio de pie con desplazamiento",
    detalle: "No disponible · antecedente de caídas",
    categoria: "Movimiento",
    tipo: "video",
    disponible: false,
    motivoBloqueo: "antecedente de caídas",
  },
  {
    titulo: "Juego de cálculo mental",
    detalle: "No disponible · rechazo declarado en el perfil",
    categoria: "Cognitiva",
    tipo: "actividad",
    disponible: false,
    motivoBloqueo: "rechazo declarado",
  },
];

export const assistantAnswers: Record<string, { titulo: string; cuerpo: string; pie: string }> = {
  repite: {
    titulo: "Repite la misma pregunta",
    cuerpo:
      "No es para molestar: olvidó que ya preguntó y la incertidumbre le genera ansiedad. Respondé la misma respuesta corta, con calma.",
    pie: "Evitá «ya te lo dije». Si pregunta por la hora o por alguien, una pizarra a la vista reduce la repetición.",
  },
  bano: {
    titulo: "Se resiste al baño",
    cuerpo:
      "Casi siempre hay frío, vergüenza o miedo a resbalar. Preparalo antes: agua tibia lista, toalla a mano, puerta cerrada.",
    pie: "Ofrecé elegir algo pequeño (la toalla, la hora). Si hay negativa firme, no insistas: probá más tarde.",
  },
  comer: {
    titulo: "No quiere comer",
    cuerpo:
      "Puede ser saciedad temprana, un sabor que ya no le gusta, o dificultad para masticar. Ofrecé porciones pequeñas y comidas que ya conoce.",
    pie: "Si el rechazo de comida dura más de dos días, o hay pérdida de peso notoria, corresponde consultar con la profesional.",
  },
  dormir: {
    titulo: "No duerme bien",
    cuerpo:
      "Mantené horarios fijos para acostarse y despertar, y luz natural durante el día. Evitá siestas largas por la tarde.",
    pie: "Si hay cambios bruscos en el sueño (insomnio o somnolencia excesiva) que aparecieron de golpe, revisá si coincide con un cambio agudo.",
  },
};

export interface ClinicPatient {
  nombre: string;
  edad: number;
  familiar: string;
  modalidad: string;
  semaforo: Semaforo;
  adherencia: string;
  // "ficha"/"alerta" open a real dedicated screen for that patient.
  // "resumen" is for patients that don't have one built (only Rosa's ficha
  // and Marta's alert exist) — it opens an inline summary instead of
  // linking to a page that would silently show someone else's data.
  destino: "ficha" | "alerta" | "rechazo" | "resumen";
}

export const clinicPatients: ClinicPatient[] = [
  { nombre: "Elena Vargas", edad: 83, familiar: "Jorge", modalidad: "Orientado", semaforo: "amarillo", adherencia: "2 de 5", destino: "rechazo" },
  { nombre: "Marta Solís", edad: 88, familiar: "Laura", modalidad: "Clínico", semaforo: "rojo", adherencia: "1 de 5", destino: "alerta" },
  { nombre: "Óscar Brenes", edad: 76, familiar: "Sofía", modalidad: "Autoguiado", semaforo: "verde", adherencia: "5 de 5", destino: "resumen" },
];

export const planHistory = [
  { quien: "12 ago · sistema", que: "reduce dificultad tras dos «en parte»." },
  { quien: "10 ago · G. Solano", que: "sustituye juego numérico por fotos." },
  { quien: "03 ago · sistema", que: "genera el plan inicial desde el perfil." },
];
