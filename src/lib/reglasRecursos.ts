// Reglas de seguridad para asignar recursos (business/integramente-recursos-spec.md
// §2.3 y §3.3). Funciones puras: las usa el planificador de la clínica
// (TaskEditorModal) y las prueba reglasRecursos.test.ts. La sugerencia de
// actividades para la familia aplica las mismas reglas en SQL
// (actividades_sugeridas, migración 20261031010000_recursos_modelo.sql),
// leyendo los mismos campos del recurso.

export type Etapa = "preventivo" | "dcl" | "leve" | "moderada" | "avanzada";
export type Ruta = "verde" | "amarillo" | "rojo";
export type Supervision = "autonomia_comprobada" | "guia_verbal" | "acompanamiento_presencial_continuo" | "ayuda_fisica_entrenada";
export type Alergeno = "pescado" | "frutos_secos" | "huevo" | "leche";
export type EstadoClinico = "aprobado" | "en_revision" | "bloqueado";

// Flags de nutrición del perfil. Un dato ausente significa "sin dato", no
// "sin restricción": el recurso se asigna y su "Tené en cuenta" advierte.
export interface NutricionFlags {
  alergias?: Partial<Record<Alergeno, boolean>>;
  disfagia?: boolean;
  textura_prescrita?: string | null;
  restriccion_liquidos?: boolean;
  potasio?: boolean;
  sodio?: boolean;
  renal?: boolean;
  diabetes?: boolean;
  anticoagulantes?: boolean;
  celiaquia?: boolean;
  desnutricion?: boolean;
  gota?: boolean;
}

export interface PerfilRecursos {
  etapas: Etapa[];
  ruta?: Ruta | null;
  supervision?: Supervision | null;
  nutricion?: NutricionFlags | null;
}

// Los campos del recurso que deciden la asignación.
export interface RecursoAsignable {
  codigo: string | null;
  modulo: string;
  niveles_cognitivos: string[] | null;
  niveles_motores: string[] | null;
  permite_doble_tarea?: boolean | null;
  requiere_supervision?: Supervision | null;
  alergenos?: string[] | null;
  exclusiones?: string[] | null;
  grupo_rotacion?: string | null;
  estado_clinico?: EstadoClinico | null;
}

export interface ContextoAsignacion {
  // Grupos de rotación ya presentes en la semana de la persona.
  gruposSemana?: string[];
  // La clínica cargó una dosis o porción individual para esta tarea.
  conIndicacionIndividual?: boolean;
  // Se pide combinar con una tarea cognitiva simultánea.
  dobleTarea?: boolean;
}

export type Resultado = { permitido: true } | { permitido: false; motivo: string };

const OK: Resultado = { permitido: true };
const no = (motivo: string): Resultado => ({ permitido: false, motivo });

// Sin ruta cargada se asume amarillo, igual que la sugerencia en SQL.
const RUTA_POR_DEFECTO: Ruta = "amarillo";
export const CODIGO_INTRO_GER = "GER-010";

const soloAvanzada = (etapas: Etapa[]) => etapas.length > 0 && etapas.every((e) => e === "avanzada");

export function evaluarAsignacion(r: RecursoAsignable, perfil: PerfilRecursos, ctx: ContextoAsignacion = {}): Resultado {
  if (r.estado_clinico === "bloqueado") return no("Recurso bloqueado por el equipo clínico.");

  if (r.niveles_cognitivos?.length && perfil.etapas.length && !r.niveles_cognitivos.some((n) => perfil.etapas.includes(n as Etapa))) {
    return no("No está indicado para su etapa.");
  }

  const esGer = r.modulo === "gerontogimnasia";
  const ruta = perfil.ruta ?? RUTA_POR_DEFECTO;
  if (r.niveles_motores?.length && !r.niveles_motores.includes(ruta)) {
    return no(`No corresponde a la ruta física ${ruta}.`);
  }

  if (esGer && r.codigo !== CODIGO_INTRO_GER && soloAvanzada(perfil.etapas) && !ctx.conIndicacionIndividual) {
    return no("En demencia avanzada requiere una pauta individual del equipo.");
  }

  if (r.requiere_supervision && perfil.supervision !== r.requiere_supervision) {
    return no("Requiere ayuda física entrenada registrada en el perfil.");
  }

  if (ctx.dobleTarea) {
    if (!r.permite_doble_tarea) return no("Este ejercicio no lleva doble tarea.");
    if (soloAvanzada(perfil.etapas)) return no("En demencia avanzada no se asigna doble tarea.");
  }

  const nut = perfil.nutricion ?? {};
  const alergia = (r.alergenos ?? []).find((a) => nut.alergias?.[a as Alergeno] === true);
  if (alergia) return no(`Alergia registrada (${alergia.replace("_", " ")}).`);

  const excl = r.exclusiones ?? [];
  if (excl.includes("disfagia_sin_textura") && nut.disfagia === true && !nut.textura_prescrita) {
    return no("Disfagia registrada sin textura prescrita.");
  }
  if (excl.includes("desnutricion") && nut.desnutricion === true && !ctx.conIndicacionIndividual) {
    return no("Riesgo de desnutrición registrado: no se asigna automáticamente.");
  }

  if (r.grupo_rotacion && ctx.gruposSemana?.includes(r.grupo_rotacion)) {
    return no("Ya tiene esta semana otro recurso del mismo tema.");
  }

  return OK;
}

// Rotación semanal: grupos que ya ocupan las tareas de la semana.
export function gruposDeLaSemana(recursosSemana: Pick<RecursoAsignable, "grupo_rotacion">[]): string[] {
  return [...new Set(recursosSemana.map((r) => r.grupo_rotacion).filter((g): g is string => !!g))];
}
