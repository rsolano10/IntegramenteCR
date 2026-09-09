// §14 Sistema de alertas — consolidado. Cada alerta se calcula de forma
// independiente a los 4 semáforos (clinicalEngine.ts) y se almacena/expone
// como flags separados — ninguna alerta cambia un semáforo automáticamente,
// y ninguna bloquea el registro completo (§14: "Ninguna bloquea el registro
// completo salvo que se indique" — el propio documento no marca ninguna
// como bloqueante en su tabla ni en su ejemplo).
//
// Calculado puramente a partir de `onboarding_answers.answers` — sin tabla
// nueva ni columna persistida: es barato de recalcular y evita duplicar
// estado que puede desincronizarse. Si más adelante la clínica necesita
// filtrar/ordenar la lista de pacientes por "tiene alerta activa", esto se
// puede persistir entonces (mismo patrón que clinical_profiles).
import type { Answers } from "./onboardingSchema";

export interface AlertaDefinicion {
  codigo: string;
  etiqueta: string;
  origenPantalla: string;
  bloqueaRegistro: boolean;
  acciones: string[];
  activa: (a: Answers) => boolean;
}

function incluye(v: unknown, valor: string): boolean {
  return Array.isArray(v) && v.includes(valor);
}
function incluyeAlguno(v: unknown, valores: string[]): boolean {
  return Array.isArray(v) && v.some((x) => valores.includes(x));
}

// Señales de deglución compartidas entre §10.4 (NUT-06B) y §14 —
// cualquier dificultad más allá de "solo masticar" o "come lento".
const SENALES_DEGLUCION = ["tose", "atraganta", "alimento_no_pasa", "voz_cambia", "guarda_comida"];

export const alertDefinitions: AlertaDefinicion[] = [
  {
    codigo: "alerta_cambio_agudo",
    etiqueta: "Cambio cognitivo agudo reciente",
    origenPantalla: "SG-05A / SG-05B",
    bloqueaRegistro: false,
    acciones: ["No generar actividades exigentes", "Destacar en el resumen final", "Recomendar consulta antes de esfuerzo físico o cognitivo"],
    activa: (a) => a.inicio_cambio_agudo === "si" || a.indicadores_cambio_agudo === "si",
  },
  {
    codigo: "alerta_medicacion",
    etiqueta: "Errores repetidos al tomar medicamentos",
    origenPantalla: "SG-04A",
    bloqueaRegistro: false,
    acciones: ["Recomendar revisión del sistema de administración de medicamentos"],
    activa: (a) => a.errores_medicacion === "varias_veces",
  },
  {
    codigo: "alerta_caida",
    etiqueta: "Caída con consecuencias relevantes",
    origenPantalla: "MOV-05A",
    bloqueaRegistro: false,
    acciones: ["Requiere valoración posterior (MOV-05B)", "Acompañamiento obligatorio en ejercicios de pie"],
    activa: (a) => incluyeAlguno(a.consecuencias_caida, ["fractura", "golpe_cabeza", "dolor_continua", "mayor_dificultad_caminar"]),
  },
  {
    codigo: "alerta_sintomas_movimiento",
    etiqueta: "Molestias frecuentes o presentes durante el movimiento",
    origenPantalla: "MOV-06A",
    bloqueaRegistro: false,
    acciones: ["Bloquear ejercicio de pie o exigente según intensidad", "Mostrar mensaje de prudencia obligatorio"],
    activa: (a) => ["esfuerzo_pequeno", "presentes_ahora"].includes(a.intensidad_sintomas_movimiento as string),
  },
  {
    codigo: "alerta_conductual",
    etiqueta: "Riesgo conductual actual",
    origenPantalla: "COND-03",
    bloqueaRegistro: false,
    acciones: ["Bloquear actividades sin acompañamiento", "Evitar sobreestimulación", "Priorizar regulación emocional y estrategias para el cuidador"],
    activa: (a) => a.riesgo_conductual === "riesgo_actual",
  },
  {
    codigo: "alerta_nutricional",
    etiqueta: "Pérdida de peso evidente con ingesta muy baja",
    origenPantalla: "NUT-03A",
    bloqueaRegistro: false,
    acciones: ["Orientación prioritaria de consulta nutricional o médica"],
    activa: (a) =>
      a.perdida_peso_no_intencional === "si_evidente" &&
      (a.regularidad_alimentacion === "come_poco_rechaza" || a.cambio_apetito === "disminuido_importante"),
  },
  {
    codigo: "alerta_deglucion",
    etiqueta: "Señales de dificultad para tragar",
    origenPantalla: "NUT-06B",
    bloqueaRegistro: false,
    acciones: [
      "Bloquear recomendaciones automáticas de cambio de textura, pajillas o espesantes",
      "Bloquear recetas con texturas incompatibles",
      "Recomendar valoración profesional",
    ],
    activa: (a) => incluyeAlguno(a.dificultades_alimentacion, SENALES_DEGLUCION),
  },

  // §9.12 — Alertas físicas separadas del nivel motor.
  {
    codigo: "alerta_dolor_pecho",
    etiqueta: "Dolor o presión en el pecho durante el esfuerzo",
    origenPantalla: "MOV-06",
    bloqueaRegistro: false,
    acciones: ["No asignar ejercicio", "Orientar consulta"],
    activa: (a) => incluye(a.sintomas_durante_movimiento, "dolor_pecho"),
  },
  {
    codigo: "alerta_falta_aire",
    etiqueta: "Falta de aire con esfuerzo mínimo",
    origenPantalla: "MOV-06 / MOV-06A",
    bloqueaRegistro: false,
    acciones: ["No asignar ejercicio exigente"],
    activa: (a) => incluye(a.sintomas_durante_movimiento, "falta_aire") && a.intensidad_sintomas_movimiento === "esfuerzo_pequeno",
  },
  {
    codigo: "alerta_mareo_actual",
    etiqueta: "Mareo presente en este momento",
    origenPantalla: "MOV-06 / MOV-06A",
    bloqueaRegistro: false,
    acciones: ["Pausar movimiento"],
    activa: (a) => incluye(a.sintomas_durante_movimiento, "mareo") && a.intensidad_sintomas_movimiento === "presentes_ahora",
  },
  {
    codigo: "alerta_debilidad_nueva",
    etiqueta: "Debilidad reportada durante el movimiento",
    origenPantalla: "MOV-06",
    bloqueaRegistro: false,
    acciones: ["Recomendar atención profesional"],
    activa: (a) => incluye(a.sintomas_durante_movimiento, "debilidad"),
  },
  {
    codigo: "alerta_golpe_cabeza",
    etiqueta: "Golpe reciente en la cabeza",
    origenPantalla: "MOV-05A",
    bloqueaRegistro: false,
    acciones: ["Pausar actividad física", "Orientar valoración"],
    activa: (a) => incluye(a.consecuencias_caida, "golpe_cabeza"),
  },
  {
    codigo: "alerta_fractura_recuperacion",
    etiqueta: "Fractura o lesión aún en recuperación",
    origenPantalla: "MOV-05B",
    bloqueaRegistro: false,
    acciones: ["Respetar las restricciones indicadas"],
    activa: (a) => incluye(a.consecuencias_caida, "fractura") && ["en_valoracion", "si_restricciones"].includes(a.valoracion_posterior_caida as string),
  },
  {
    codigo: "alerta_dificultad_nueva_caminar",
    etiqueta: "Dificultad nueva para caminar",
    origenPantalla: "MOV-05A",
    bloqueaRegistro: false,
    acciones: ["Recomendar valoración"],
    activa: (a) => incluye(a.consecuencias_caida, "mayor_dificultad_caminar"),
  },
  {
    codigo: "alerta_dolor_persistente",
    etiqueta: "Dolor intenso o persistente durante el movimiento",
    origenPantalla: "MOV-06 / MOV-06A",
    bloqueaRegistro: false,
    acciones: ["Evitar movimientos relacionados con la zona de dolor"],
    activa: (a) => incluye(a.sintomas_durante_movimiento, "dolor") && ["esfuerzo_pequeno", "presentes_ahora"].includes(a.intensidad_sintomas_movimiento as string),
  },

  // §10.7 — Alertas nutricionales adicionales.
  {
    codigo: "alerta_apetito_disminuido",
    etiqueta: "Disminución importante del apetito",
    origenPantalla: "NUT-02",
    bloqueaRegistro: false,
    acciones: ["Observar y consultar"],
    activa: (a) => a.cambio_apetito === "disminuido_importante",
  },
  {
    codigo: "alerta_ingesta_muy_baja",
    etiqueta: "Ingesta casi nula",
    origenPantalla: "NUT-01",
    bloqueaRegistro: false,
    acciones: ["Orientación prioritaria"],
    activa: (a) => a.regularidad_alimentacion === "come_poco_rechaza",
  },
  {
    codigo: "alerta_rechazo_liquidos",
    etiqueta: "Rechazo frecuente de líquidos",
    origenPantalla: "NUT-04",
    bloqueaRegistro: false,
    acciones: ["Recomendación profesional"],
    activa: (a) => a.patron_hidratacion === "rechaza_frecuente",
  },
  {
    codigo: "alerta_confusion_baja_ingesta",
    etiqueta: "Confusión nueva junto con baja ingesta de líquidos",
    origenPantalla: "NUT-04A",
    bloqueaRegistro: false,
    acciones: ["Activar alerta de salud"],
    activa: (a) =>
      incluye(a.posibles_signos_baja_hidratacion, "confusion") && ["toma_poco", "rechaza_frecuente"].includes(a.patron_hidratacion as string),
  },
  {
    codigo: "alerta_restriccion_liquidos",
    etiqueta: "Restricción de líquidos indicada por un profesional",
    origenPantalla: "NUT-05",
    bloqueaRegistro: false,
    acciones: ["No sugerir cantidades específicas"],
    activa: (a) => incluye(a.indicaciones_alimentarias, "restriccion_liquidos"),
  },
  {
    codigo: "alerta_enfermedad_renal",
    etiqueta: "Enfermedad renal",
    origenPantalla: "NUT-05",
    bloqueaRegistro: false,
    acciones: ["No recomendar proteína, potasio, sodio o líquidos sin individualización"],
    activa: (a) => incluye(a.indicaciones_alimentarias, "renal"),
  },
  {
    codigo: "alerta_alergia_alimentaria",
    etiqueta: "Alergia o intolerancia alimentaria",
    origenPantalla: "NUT-05",
    bloqueaRegistro: false,
    acciones: ["Excluir recursos con el alimento señalado"],
    activa: (a) => incluye(a.indicaciones_alimentarias, "alergia"),
  },
];

export function computeActiveAlerts(a: Answers): AlertaDefinicion[] {
  return alertDefinitions.filter((def) => def.activa(a));
}
