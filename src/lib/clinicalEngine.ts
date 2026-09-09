// "Motor de Decisiones Clínicas" — internal only, never shown as a combined
// value to the user (business/general_rules.md §5/§8/§9/§10/§15.7: **4
// semáforos siempre independientes, nunca combinados ni promediados**).
// Computes 4 severity profiles from the onboarding answers, used solely to
// personalize content difficulty:
//   - nivelCognitivo   (§8.1, COG-01 a COG-06 — COG-07/fatiga NUNCA cuenta
//     para el color, ver nota en cognitivo() más abajo)
//   - nivelFisico      (§9.11, motor/movimiento)
//   - nivelFuncional   (§8.4, AVDI/AVDB)
//   - nivelNutricional (§10.6)
// Conducta (§8.3) no tiene semáforo propio — solo genera `alerta_conductual`
// (ver alertsEngine.ts), igual que el resto de las alertas del §14.
//
// Cada eje sigue la misma regla programable del documento fuente:
//   SI existe cualquier criterio rojo → rojo
//   SI NO hay rojo Y existe cualquier criterio amarillo → amarillo
//   SI NO hay rojo NI amarillo → verde
// Nunca un score numérico promediado (§15.10 del análisis técnico).

import type { Answers } from "./onboardingSchema";
import type { Semaforo } from "./mockData";

export type Tier = Semaforo; // "verde" | "amarillo" | "rojo"

export interface Profiles {
  cognitivo: Tier;
  fisico: Tier;
  funcional: Tier;
  nutricional: Tier;
}

function has(a: Answers, key: string, values: string[]): boolean {
  const v = a[key];
  return typeof v === "string" && values.includes(v);
}
function includesAny(a: Answers, key: string, values: string[]): boolean {
  const v = a[key];
  return Array.isArray(v) && v.some((x) => values.includes(x));
}
function countLength(a: Answers, key: string): number {
  const v = a[key];
  return Array.isArray(v) ? v.length : 0;
}

// §8.1 — nivel_cognitivo (COG-01 a COG-06).
// COG-07 (respuesta_demanda_cognitiva) queda deliberadamente afuera: el
// documento lo indica dos veces ("modifica duración/pausas pero no el
// color", "No determina el color por sí sola"), en contradicción con su
// propia tabla de clasificación que lo lista una vez como criterio
// amarillo. Se sigue la instrucción más explícita y repetida.
function cognitivo(a: Answers): Tier {
  const rojo =
    a.memoria_reciente_funcional === "recordatorio_constante" ||
    a.atencion_funcional === "periodos_muy_cortos" ||
    a.comprension_consignas === "otra_guia_completa" ||
    a.organizacion_decisiones === "otra_decide" ||
    has(a, "comunicacion_expresiva", ["palabras_gestos", "muchas_dificultades"]);
  if (rojo) return "rojo";

  const amarillo =
    a.memoria_reciente_funcional === "olvida_frecuente" ||
    a.atencion_funcional === "necesita_retomar" ||
    has(a, "comprension_consignas", ["uno_dos_pasos", "una_instruccion_demostracion"]) ||
    a.organizacion_decisiones === "necesita_opciones" ||
    a.comunicacion_expresiva === "frases_cortas";
  if (amarillo) return "amarillo";

  return "verde";
}

// §9.11 — nivel_fisico (Bloque 3, movimiento).
function fisico(a: Answers): Tier {
  const rojo =
    has(a, "levantarse_silla", ["ayuda_fisica", "no_logra"]) ||
    has(a, "equilibrio_de_pie", ["necesita_sostenido", "no_puede_pie"]) ||
    has(a, "movilidad_dentro_casa", ["silla_ruedas", "cama"]) ||
    a.caidas_ultimos_6_meses === "varias_veces" ||
    a.movilidad_extremidades === "muy_limitados";
  if (rojo) return "rojo";

  const amarillo =
    has(a, "movilidad_dentro_casa", ["baston", "andadera"]) ||
    has(a, "levantarse_silla", ["supervision", "apoyandose"]) ||
    has(a, "equilibrio_de_pie", ["estable_apoyo_cerca", "pierde_a_veces"]) ||
    has(a, "caidas_ultimos_6_meses", ["casi_cae", "una_vez"]) ||
    a.intensidad_sintomas_movimiento === "leves_ocasionales" ||
    a.disposicion_movimiento === "temor_caerse" ||
    countLength(a, "movimientos_restringidos") > 0;
  if (amarillo) return "amarillo";

  return "verde";
}

// §8.4 — nivel_funcional (AVDI/AVDB).
const avdiKeysEngine = ["avdi_finanzas", "avdi_compras_organizacion", "avdi_preparacion_alimentos", "avdi_telefono", "avdi_agenda_responsabilidades"];
const avdbKeysEngine = ["avdb_bano_aseo", "avdb_vestido", "avdb_alimentacion", "avdb_uso_bano"];

function funcional(a: Answers): Tier {
  const avdiAyudaDirecta = avdiKeysEngine.filter((k) => has(a, k, ["ayuda_directa", "otra_persona"])).length;
  const avdiRecordatorios = avdiKeysEngine.filter((k) => a[k] === "recordatorios_supervision").length;
  const avdbNecesitaAyuda = avdbKeysEngine.some((k) => has(a, k, ["ayuda_parcial", "otra_persona"]));

  const rojo = avdiAyudaDirecta >= 2 || avdbNecesitaAyuda || a.organizacion_decisiones === "otra_decide";
  if (rojo) return "rojo";

  const amarillo = avdiRecordatorios >= 1 || avdiAyudaDirecta === 1;
  if (amarillo) return "amarillo";

  return "verde";
}

// §10.6 — nivel_nutricional.
function nutricional(a: Answers): Tier {
  const senalesDeglucion = includesAny(a, "dificultades_alimentacion", ["tose", "atraganta", "alimento_no_pasa", "voz_cambia", "guarda_comida"]);
  const disfagiaSinIndicaciones = senalesDeglucion && a.valoracion_deglucion !== "si_indicaciones";

  const rojo =
    disfagiaSinIndicaciones ||
    a.perdida_peso_no_intencional === "si_evidente" ||
    a.cambio_apetito === "disminuido_importante" ||
    a.regularidad_alimentacion === "come_poco_rechaza" ||
    has(a, "apoyo_durante_alimentacion", ["ayuda_fisica_parcial", "otra_alimenta"]) ||
    includesAny(a, "indicaciones_alimentarias", ["renal", "restriccion_liquidos"]);
  if (rojo) return "rojo";

  const indicacionEstable = includesAny(a, "indicaciones_alimentarias", ["diabetes", "baja_sal", "colesterol", "sin_gluten", "textura_modificada", "otra"]);
  const amarillo =
    a.regularidad_alimentacion === "salta_comidas" ||
    a.apoyo_durante_alimentacion === "recordatorios" ||
    a.apoyo_durante_alimentacion === "otra_prepara" ||
    a.patron_hidratacion === "toma_poco" ||
    indicacionEstable ||
    includesAny(a, "dificultades_alimentacion", ["masticar"]) ||
    has(a, "variedad_alimentaria", ["variedad_limitada", "siempre_lo_mismo"]);
  if (amarillo) return "amarillo";

  return "verde";
}

export function computeProfiles(a: Answers): Profiles {
  return {
    cognitivo: cognitivo(a),
    fisico: fisico(a),
    funcional: funcional(a),
    nutricional: nutricional(a),
  };
}

// §11.1 — dos variables internas, deliberadamente SIN semáforo (nunca se
// muestran como chip de color): alimentan el futuro motor de
// personalización de contenido, no la vista de la clínica. No confundir
// con los 4 semáforos de computeProfiles — esto vive fuera de esa regla.
export type NivelActivacionCotidiana = "alta" | "intermedia" | "baja";
export type NivelConexionSocial = "suficiente" | "riesgo_aislamiento";

export interface ActivationProfile {
  nivelActivacionCotidiana: NivelActivacionCotidiana;
  nivelConexionSocial: NivelConexionSocial;
}

export function computeActivationProfile(a: Answers): ActivationProfile {
  const iniciativaPreservada = a.interes_iniciativa === "conserva_inicia" || a.forma_participacion_cognitiva === "inicia_por_si_mismo";
  const estimulacionFrecuente = has(a, "frecuencia_estimulacion_cognitiva", ["casi_todos_dias", "varias_semana"]);
  const participacionDomestica = has(a, "participacion_actividades_cotidianas", ["iniciativa_propia", "si_se_propone"]);
  const rutinaEstructurada = a.estructura_rutina_diaria === "estable";

  const granPartePasiva = a.estructura_rutina_diaria === "sin_actividades_definidas" || a.estructura_rutina_diaria === "depende_otro";
  const pocaEstimulacion = has(a, "frecuencia_estimulacion_cognitiva", ["casi_nunca"]);
  const participacionMinima = has(a, "participacion_actividades_cotidianas", ["muy_poco", "no_participa"]);

  let nivelActivacionCotidiana: NivelActivacionCotidiana;
  if (granPartePasiva || pocaEstimulacion || participacionMinima) {
    nivelActivacionCotidiana = "baja";
  } else if (rutinaEstructurada && estimulacionFrecuente && participacionDomestica && iniciativaPreservada) {
    nivelActivacionCotidiana = "alta";
  } else {
    nivelActivacionCotidiana = "intermedia";
  }

  const riesgoAislamiento =
    has(a, "frecuencia_contacto_social", ["algunas_mes", "casi_nunca", "acompanado_poco_contacto"]) ||
    a.percepcion_compania === "solo_aislado" ||
    a.cambio_nivel_participacion === "disminuido_considerable" ||
    a.disponibilidad_acompanante === "sin_acompanante";

  return { nivelActivacionCotidiana, nivelConexionSocial: riesgoAislamiento ? "riesgo_aislamiento" : "suficiente" };
}

// §9.13 — cruce cognitivo × físico (doble tarea): tabla de asignación de
// CONTENIDO, no una fusión de semáforos (§15.7) — el catálogo de
// actividades que consumiría esto todavía no existe en la app (motor de
// personalización de contenido, fuera del alcance de este cuestionario);
// se deja codificada como tabla explícita, lista para ese motor futuro.
const DUAL_TASK_TABLE: Record<Tier, Record<Tier, string>> = {
  verde: {
    verde: "Dual task de pie y progresivo",
    amarillo: "Tarea cognitiva sencilla con apoyo físico",
    rojo: "Actividad cognitiva durante movimiento sentado",
  },
  amarillo: {
    verde: "Movimiento sencillo y una tarea cognitiva",
    amarillo: "Dual task simplificado, con apoyo y supervisión",
    rojo: "Actividad sentada con demanda cognitiva sencilla",
  },
  rojo: {
    verde: "Movimiento sencillo; evitar doble demanda autónoma",
    amarillo: "Movimiento con apoyo y cuidador; cognición mínima",
    rojo: "Movimiento sentado, conexión y seguimiento de una instrucción",
  },
};

export function dualTaskAssignment(cognitivo: Tier, fisico: Tier): string {
  return DUAL_TASK_TABLE[cognitivo][fisico];
}
