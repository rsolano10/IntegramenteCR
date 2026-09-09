import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeAuditEntry, type AuditEntry } from "./rules";
import { classifyMessage } from "./chatbot";
import type { Answers } from "./onboardingSchema";
import { weeklyPlan, type PlanDay, type PlanDayStatus, type PlanTask } from "./mockData";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  escalate?: { label: string; to: string };
}

let chatSeq = 0;
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Hola, Marcela. Contame qué está pasando y te ayudo, o elegí una de las dudas frecuentes de abajo.",
};

export interface MensajeClinico {
  id: string;
  texto: string;
  autor: string;
  fecha: string;
}

let mensajeSeq = 0;
function makeMensaje(texto: string, autor: string): MensajeClinico {
  mensajeSeq += 1;
  return { id: `msg-${mensajeSeq}`, texto, autor, fecha: new Date().toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" }) };
}
const seedMensajes: MensajeClinico[] = [
  makeMensaje("Marcela: mantengamos las actividades de la mañana. Bajé la merienda a una sola consigna.", "Dra. Guiselle Solano"),
];

export type RegistroEstado = "done" | "partial" | "no" | null;
export type Modalidad = "autoguiado" | "orientado" | "clinico";
// "pendiente" right after finishing onboarding — the family/participant see
// only the review-pending screen until the clinic assigns a program.
export type PlanStatus = "pendiente" | "asignado";

// Seeded so every view looks complete and consistent even if a tester jumps
// straight to clinica@test.com or paciente@test.com without running the
// familiar's onboarding first. Tuned to land on "amarillo" overall — no
// alert-trigger thresholds (2+ caídas, desorientación frecuente) are crossed
// by default. Running onboarding as familiar simply overwrites these, and
// that override is what then propagates to every other view.
const defaultOnboarding: Answers = {
  rol_respondente: "familiar",
  nombre_participante: "Rosa Jiménez",
  tratamiento_preferido: "nombre_simple",
  edad: "79",
  escolaridad: "primaria_completa",
  situacion_ocupacional_actual: "pensionado",
  ocupacion_principal: "ama de casa",
  convivencia_actual: ["familiares"],
  mejor_momento_dia: "manana",

  // Bloque 1 — Salud general y diagnóstico (§7).
  salud_general_percibida: "buena",
  antecedentes_medicos: ["presion_alta"],
  eventos_salud_ultimo_anio: ["ninguna"],
  manejo_medicamentos: "recordatorios",
  errores_medicacion: "una_vez",
  cambio_agudo_reportado: "no",
  estado_diagnostico_cognitivo: "si",
  diagnostico_cognitivo_informado: "demencia",
  etapa_demencia_informada: "leve",
  tiempo_desde_diagnostico: "2a_5a",
  conciencia_diagnostico: "conoce_habla",
  areas_apoyo_demencia: ["recordar_reciente"],
  tiempo_evolucion_cognitiva: "2a_5a",
  patron_evolucion_cognitiva: "avance_lento",
  preocupacion_principal: "memoria",

  // Bloque 2 — Cognición, emocional/conductual, AVDI (§8).
  memoria_reciente_funcional: "olvidos_con_recordatorios",
  repeticion_perdida_hilo: "algunas_veces",
  atencion_funcional: "distrae_continua",
  comprension_consignas: "uno_dos_pasos",
  organizacion_decisiones: "con_tiempo_lista",
  comunicacion_expresiva: "tarda_palabras",
  respuesta_demanda_cognitiva: "cansa_despues",
  estado_emocional_actual: ["tranquilo"],
  interes_iniciativa: "participa_si_invitan",
  patron_sueno: ["duerme_bien"],
  avdi_finanzas: "recordatorios_supervision",
  avdi_compras_organizacion: "recordatorios_supervision",
  avdi_preparacion_alimentos: "recordatorios_supervision",
  avdi_telefono: "independiente",
  avdi_agenda_responsabilidades: "recordatorios_supervision",
  origen_cambio_funcional: "antes_mas_independiente",

  // Bloque 3 — Movimiento y seguridad física (§9).
  movilidad_dentro_casa: "baston",
  movilidad_fuera_casa: "sale_baston_andadera",
  levantarse_silla: "apoyandose",
  equilibrio_de_pie: "estable_apoyo_cerca",
  caidas_ultimos_6_meses: "una_vez",
  consecuencias_caida: ["dolor_moretones_mejoraron"],
  sintomas_durante_movimiento: ["ninguna"],
  restriccion_profesional_ejercicio: "no",
  frecuencia_actividad_fisica: "tres_cuatro",
  duracion_actividad_fisica: "10_20",
  preferencias_actividad_fisica: ["caminar", "jardineria"],
  disposicion_movimiento: "le_gusta_participa",

  // Bloque 4 — Alimentación, hidratación y nutrición (§10).
  regularidad_alimentacion: "regular_horarios",
  cambio_apetito: "como_costumbre",
  patron_hidratacion: "si_le_ofrecen",
  indicaciones_alimentarias: ["baja_sal"],
  dificultades_alimentacion: ["sin_dificultades"],
  apoyo_durante_alimentacion: "otra_prepara",
  responsable_preparacion_alimentos: "otro_familiar",
  variedad_alimentaria: "variedad_limitada",
  preferencias_alimentarias: ["frutas", "sopas", "cafe_bebidas"],

  // Bloque 5 — Vida social, estimulación y rutina (§11).
  frecuencia_contacto_social: "varias_semana",
  percepcion_compania: "satisfecho",
  frecuencia_estimulacion_cognitiva: "varias_semana",
  forma_participacion_cognitiva: "si_se_propone",
  estructura_rutina_diaria: "estable",
  actividades_predominantes: ["tareas_hogar", "television", "conversando"],
  participacion_actividades_cotidianas: "si_se_propone",
  frecuencia_salidas: "varias_semana",
  cambio_nivel_participacion: "disminuido_poco",
  motivos_disminucion_participacion: ["cambios_memoria"],

  // Bloque final — Intereses e historia significativa (§12).
  intereses_actuales: ["musica", "jardineria", "conversar"],
  existen_intereses_previos: "si",
  intereses_previos_texto: "Coser y cocinar para la familia",
  temas_historia_significativa: ["familia", "cocina", "religion_espiritualidad"],
  disponibilidad_acompanante: "varias_semana",
};

function clonePlan(plan: PlanDay[]): PlanDay[] {
  return plan.map((day) => ({ ...day, tasks: day.tasks.map((t) => ({ ...t })) }));
}

function mapTask(plan: PlanDay[], dia: string, taskId: string, fn: (t: PlanTask) => PlanTask): PlanDay[] {
  return plan.map((day) => (day.dia !== dia ? day : { ...day, tasks: day.tasks.map((t) => (t.id === taskId ? fn(t) : t)) }));
}

interface AppState {
  // UI-only convenience: prefills the email field across Landing/Login, and
  // surfaces a failed-login message. Who's actually signed in comes from
  // useSession() (src/lib/useSession.ts), backed by real Supabase auth.
  email: string;
  authError: string;

  c1: boolean;
  c2: boolean;
  notify: "si" | "no";

  onboarding2: Answers;
  modalidad: Modalidad;
  // Persisted to localStorage (see `persist` wrapper below) — once someone
  // finishes the questionnaire, they shouldn't have to redo it on every
  // login. Only cleared by deleting the browser's local storage by hand.
  // NOTE: no longer the source of truth for routing (RouteGuard reads the
  // real patient_links row via useMyPatient()) — kept so in-progress local
  // edits aren't lost, and reset per-account below.
  onboardingComplete: boolean;
  // Last Supabase user id seen in this browser. RouteGuard compares this to
  // the current session on every login and, on a mismatch, wipes
  // onboarding2/modalidad/onboardingComplete — otherwise a second real
  // account signing in on the same browser would inherit whatever the
  // first account's demo/onboarding state was (this was the actual bug:
  // Marcela/Rosa's local state leaking into a brand new signup).
  lastUserId: string | null;
  // Also persisted. "pendiente" blocks the familiar/participante shells down
  // to a single waiting screen; the clinic flips it to "asignado" and that
  // takes effect on the family's next read of the store, same login or not.
  planStatus: PlanStatus;
  // True right after the clinic assigns, until the family has seen the
  // combined welcome + clinic-message banner once on Hoy.
  welcomeMessagePending: boolean;
  perfilEditModule: string | null;
  // Editing exactly one question from PerfilResumen (not the whole module)
  // — mutually exclusive with perfilEditModule.
  perfilEditQuestionId: string | null;

  plan: PlanDay[];
  planDraft: PlanDay[] | null;

  notaInterna: string;
  mensajeBorrador: string;
  mensajes: MensajeClinico[];
  perfilValidado: boolean;

  reg: RegistroEstado;
  noCount: number;

  notifySent: boolean;

  weekMood: "better" | "same" | "worse";

  chatMessages: ChatMessage[];

  auditLog: AuditEntry[];

  setEmail: (v: string) => void;
  setAuthError: (v: string) => void;
  // Resets session-only demo state after a real supabase.auth.signOut().
  // Deliberately leaves onboarding2/modalidad/onboardingComplete/planStatus
  // /welcomeMessagePending/mensajes alone — they're the persisted profile
  // and its correspondence, not session state.
  resetSessionState: () => void;

  toggleConsent1: () => void;
  toggleConsent2: () => void;
  setNotify: (v: "si" | "no") => void;

  answerQuestion: (id: string, value: string) => void;
  toggleMultiAnswer: (id: string, value: string, exclusive?: string[], maxSelect?: number) => void;
  setAnswerList: (id: string, list: string[]) => void;
  setModalidad: (v: Modalidad) => void;
  updateBasicInfo: (patch: { nombre: string; edad: string; modalidad: Modalidad; intereses: string[] }) => void;
  startModuleEdit: (module: string) => void;
  endModuleEdit: () => void;
  startQuestionEdit: (questionId: string) => void;
  endQuestionEdit: () => void;
  completeOnboarding: () => void;
  asignarPrograma: (mensaje: string) => void;
  dismissWelcomeMessage: () => void;
  // Called by RouteGuard when the signed-in user id changes — clears the
  // demo/onboarding fields that used to leak across accounts.
  resetOnboardingForNewAccount: (userId: string | null) => void;
  // Pulls a real account's saved onboarding_answers row into the local
  // store, so PerfilResumen/"editar módulo" (which still only read/write
  // onboarding2 locally) show and edit real data instead of staying blank.
  hydrateOnboarding: (answers: Answers) => void;

  updateTaskEstado: (dia: string, taskId: string, estado: PlanDayStatus) => void;
  startPlanDraft: () => void;
  updateDraftTask: (dia: string, taskId: string, patch: Partial<Pick<PlanTask, "titulo" | "hora">>) => void;
  publishPlan: () => void;
  saveDraftOnly: () => void;

  setNotaInterna: (v: string) => void;
  setMensajeBorrador: (v: string) => void;
  sendMensajeFamilia: () => void;
  validarPerfil: () => void;

  markRegistro: (taskId: string, v: Exclude<RegistroEstado, null>, comentario?: string) => void;
  setWeekMood: (v: "better" | "same" | "worse") => void;

  notifyNow: () => void;
  notifySkip: () => void;

  sendChatMessage: (text: string) => void;

  pushAudit: (entidad: string, accion: string, autor: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  email: "",
  authError: "",

  c1: true,
  c2: true,
  notify: "si",

  onboarding2: { ...defaultOnboarding },
  modalidad: "orientado",
  onboardingComplete: false,
  lastUserId: null,
  // Defaults to "asignado" so paciente@test.com/clinica@test.com keep
  // looking fully set up when a tester jumps straight there — only a fresh
  // walk through the real familiar flow (completeOnboarding) sets it to
  // "pendiente" and demonstrates the review/assign story.
  planStatus: "asignado",
  welcomeMessagePending: false,
  perfilEditModule: null,
  perfilEditQuestionId: null,

  plan: clonePlan(weeklyPlan),
  planDraft: null,

  notaInterna:
    "Perfil consistente con lo observado en consulta. Vigilar carga de la cuidadora: Marcela reporta agotamiento sin nombrarlo.",
  mensajeBorrador: "",
  mensajes: seedMensajes,
  perfilValidado: false,

  reg: null,
  noCount: 0,

  notifySent: false,

  weekMood: "same",

  chatMessages: [welcomeMessage],

  auditLog: [],

  setEmail: (v) => set({ email: v }),
  setAuthError: (v) => set({ authError: v }),
  resetSessionState: () =>
    set({
      email: "",
      authError: "",
      c1: true,
      c2: true,
      notify: "si",
      // onboarding2/modalidad/onboardingComplete/planStatus/welcomeMessagePending
      // /mensajes deliberately survive logout — they're the persisted
      // profile and its correspondence, not session state. A message the
      // clinic writes has to still be there the next time the family logs
      // in, even in a different session.
      perfilEditModule: null,
      perfilEditQuestionId: null,
      plan: clonePlan(weeklyPlan),
      planDraft: null,
      notaInterna:
        "Perfil consistente con lo observado en consulta. Vigilar carga de la cuidadora: Marcela reporta agotamiento sin nombrarlo.",
      mensajeBorrador: "",
      perfilValidado: false,
      reg: null,
      noCount: 0,
      notifySent: false,
      weekMood: "same",
      chatMessages: [welcomeMessage],
    }),

  toggleConsent1: () => set((s) => ({ c1: !s.c1 })),
  toggleConsent2: () => set((s) => ({ c2: !s.c2 })),
  setNotify: (v) => set({ notify: v }),

  answerQuestion: (id, value) => {
    set((s) => ({ onboarding2: { ...s.onboarding2, [id]: value } }));
    get().pushAudit("Perfil funcional", `responde "${id}"`, "Marcela");
  },
  toggleMultiAnswer: (id, value, exclusive, maxSelect) =>
    set((s) => {
      const current = s.onboarding2[id];
      const list = Array.isArray(current) ? current.slice() : [];
      const at = list.indexOf(value);
      let next: string[];
      if (at >= 0) {
        next = list.filter((v) => v !== value);
      } else if (exclusive?.includes(value)) {
        next = [value];
      } else {
        const rest = list.filter((v) => !exclusive?.includes(v));
        // Selection caps (EMO-01 "máx. 2", RUT-06/INT-03 "hasta 3", etc.) —
        // once at the limit, picking a new (non-exclusive) option is a
        // no-op instead of bumping the oldest choice out; the person has to
        // deselect one first, which matches how the UI disables the rest.
        if (maxSelect && rest.length >= maxSelect) return {};
        next = [...rest, value];
      }
      return { onboarding2: { ...s.onboarding2, [id]: next } };
    }),
  setAnswerList: (id, list) => set((s) => ({ onboarding2: { ...s.onboarding2, [id]: list } })),
  setModalidad: (v) => set({ modalidad: v }),
  updateBasicInfo: (patch) => {
    set((s) => ({
      onboarding2: { ...s.onboarding2, nombre_participante: patch.nombre, edad: patch.edad, persona2_actividades: patch.intereses },
      modalidad: patch.modalidad,
    }));
    get().pushAudit("Perfil", "actualiza datos básicos del perfil", "Marcela");
  },
  // Mutually exclusive — starting one clears any stale other-mode flag left
  // over from an abandoned edit (e.g. browser back button bypassing goBack()).
  startModuleEdit: (module) => set({ perfilEditModule: module, perfilEditQuestionId: null }),
  endModuleEdit: () => set({ perfilEditModule: null }),
  startQuestionEdit: (questionId) => set({ perfilEditQuestionId: questionId, perfilEditModule: null }),
  endQuestionEdit: () => set({ perfilEditQuestionId: null }),
  completeOnboarding: () => {
    set({ onboardingComplete: true, planStatus: "pendiente" });
    get().pushAudit("Perfil funcional", "completa el cuestionario — enviado a la clínica", "Marcela");
  },
  asignarPrograma: (mensaje) => {
    const texto = mensaje.trim();
    set((s) => ({
      planStatus: "asignado",
      welcomeMessagePending: true,
      mensajes: texto ? [makeMensaje(texto, "Dra. Guiselle Solano"), ...s.mensajes] : s.mensajes,
    }));
    get().pushAudit("Plan", "asigna el programa y notifica a la familia", "Dra. Guiselle Solano");
  },
  dismissWelcomeMessage: () => set({ welcomeMessagePending: false }),
  resetOnboardingForNewAccount: (userId) =>
    set({
      onboarding2: {},
      modalidad: "orientado",
      onboardingComplete: false,
      welcomeMessagePending: false,
      lastUserId: userId,
    }),
  hydrateOnboarding: (answers) => set({ onboarding2: answers }),

  updateTaskEstado: (dia, taskId, estado) => {
    set((s) => ({ plan: mapTask(s.plan, dia, taskId, (t) => ({ ...t, estado })) }));
    get().pushAudit("Registro", `marca "${taskId}" como "${estado}"`, "Marcela");
  },
  startPlanDraft: () =>
    set((s) => (s.planDraft ? s : { planDraft: clonePlan(s.plan) })),
  updateDraftTask: (dia, taskId, patch) =>
    set((s) => (s.planDraft ? { planDraft: mapTask(s.planDraft, dia, taskId, (t) => ({ ...t, ...patch })) } : s)),
  publishPlan: () => {
    set((s) => (s.planDraft ? { plan: s.planDraft, planDraft: null } : s));
    get().pushAudit("Plan", "publica el plan ajustado a la familia", "Dra. Guiselle Solano");
  },
  saveDraftOnly: () => get().pushAudit("Plan", "guarda un borrador del plan", "Dra. Guiselle Solano"),

  setNotaInterna: (v) => set({ notaInterna: v }),
  setMensajeBorrador: (v) => set({ mensajeBorrador: v }),
  sendMensajeFamilia: () => {
    const texto = get().mensajeBorrador.trim();
    if (!texto) return;
    set((s) => ({ mensajes: [makeMensaje(texto, "Dra. Guiselle Solano"), ...s.mensajes], mensajeBorrador: "" }));
    get().pushAudit("Mensaje", "envía mensaje a la familia", "Dra. Guiselle Solano");
  },
  validarPerfil: () => {
    set({ perfilValidado: true });
    get().pushAudit("Perfil", "valida el perfil funcional", "Dra. Guiselle Solano");
  },

  markRegistro: (taskId, v, comentario) => {
    const featuredEstado: PlanDayStatus = v === "done" ? "realizado" : v === "partial" ? "parcial" : "no";
    set((s) => {
      const today = s.plan.find((d) => d.isToday);
      if (!today) return { reg: v, noCount: v === "done" ? 0 : v === "no" ? s.noCount + 1 : s.noCount };
      return {
        reg: v,
        noCount: v === "done" ? 0 : v === "no" ? s.noCount + 1 : s.noCount,
        plan: mapTask(s.plan, today.dia, taskId, (t) => ({ ...t, estado: featuredEstado, comentario: comentario?.trim() || t.comentario })),
      };
    });
    get().pushAudit("Registro", `marca actividad como "${v}"`, "Marcela");
  },
  setWeekMood: (v) => set({ weekMood: v }),

  notifyNow: () => {
    set({ notifySent: true });
    get().pushAudit("Alerta", "notifica a la profesional asignada", "Marcela");
  },
  notifySkip: () => set({ notifySent: false }),

  sendChatMessage: (text) => {
    if (!text.trim()) return;
    chatSeq += 1;
    const userMsg: ChatMessage = { id: `chat-${chatSeq}`, role: "user", text };
    const reply = classifyMessage(text);
    chatSeq += 1;
    const botMsg: ChatMessage = { id: `chat-${chatSeq}`, role: "bot", text: reply.text, escalate: reply.escalate };
    set((s) => ({ chatMessages: [...s.chatMessages, userMsg, botMsg] }));
    if (reply.escalate) {
      get().pushAudit("Asistente", `escala consulta: "${text}"`, "Marcela");
    }
  },

  pushAudit: (entidad, accion, autor) =>
    set((s) => ({ auditLog: [makeAuditEntry(entidad, accion, autor), ...s.auditLog].slice(0, 20) })),
    }),
    {
      name: "integramente-storage",
      // The profile, its assignment status, and the clinic's correspondence
      // persist — chat history, plan registro marks, drafts, and audit log
      // stay session-only so each login still starts on a clean "today",
      // just without redoing the questionnaire or losing what the clinic
      // wrote while the family was logged out.
      partialize: (s) => ({
        onboarding2: s.onboarding2,
        modalidad: s.modalidad,
        onboardingComplete: s.onboardingComplete,
        lastUserId: s.lastUserId,
        planStatus: s.planStatus,
        welcomeMessagePending: s.welcomeMessagePending,
        mensajes: s.mensajes,
      }),
    },
  ),
);
