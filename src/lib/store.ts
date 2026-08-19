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
  persona_nombre: "Rosa Jiménez",
  persona_edad: "79",
  persona_escolaridad: "primaria",
  persona_convivencia: "familiares",
  persona_tiempo_con: "hijo",
  diagnostico_tiene: "si",
  diagnostico_tipo: "alzheimer",
  diagnostico_tiempo: "mas_2a",
  diagnostico_etapa: "leve",
  condiciones: ["hipertension"],
  medicamentos_toma: "si",
  medicamentos_administra: "familiar_prepara",
  memoria_repite: "algunas",
  memoria_olvida: "algunas",
  memoria_aprender: "algunas",
  memoria_desorientacion: "nunca",
  memoria_lenguaje: "nunca",
  memoria_instrucciones: "dos",
  funcional_medicamentos: "con_ayuda",
  funcional_desayuno: "si",
  funcional_ropa: "si",
  funcional_banarse: "con_ayuda",
  funcional_compra: "no_puede",
  funcional_telefono: "si",
  movimiento_desplazamiento: "baston",
  movimiento_seguridad: "a_veces_inseguro",
  movimiento_caidas: "una",
  movimiento_salir: "acompanado",
  movimiento_levantarse: "con_impulso",
  movimiento_depie: "poco_tiempo",
  movimiento_sigue_indicaciones: "sin_dificultad",
  movimiento_limitacion_medica: "no",
  movimiento_mejorar: "equilibrio",
  nutricion_perdida_peso: "no",
  nutricion_come_menos: "no",
  nutricion_masticar_tragar: "no",
  nutricion_ultraprocesados: "1_2_semana",
  nutricion_frutas_veg: "3_mas_semana",
  nutricion_agua: "3_5",
  nutricion_quien_prepara: "familiar",
  nutricion_meta: "cerebro",
  persona2_actividades: ["cocinar", "musica", "jardineria", "fotos"],
  persona2_fortalezas: ["conversar", "cocinar"],
  persona2_incomoda: ["ruido"],
  persona2_momento_dia: "manana",
  preocupacion_principal: "memoria",
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

  plan: PlanDay[];
  planDraft: PlanDay[] | null;

  notaInterna: string;
  mensajeBorrador: string;
  mensajes: MensajeClinico[];
  perfilValidado: boolean;

  reg: RegistroEstado;
  noCount: number;

  notifySent: boolean;

  paso: number; // participant step-by-step activity (1-3)
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
  toggleMultiAnswer: (id: string, value: string, exclusive?: string[]) => void;
  setAnswerList: (id: string, list: string[]) => void;
  setModalidad: (v: Modalidad) => void;
  updateBasicInfo: (patch: { nombre: string; edad: string; modalidad: Modalidad; intereses: string[] }) => void;
  startModuleEdit: (module: string) => void;
  endModuleEdit: () => void;
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

  markRegistro: (taskId: string, v: Exclude<RegistroEstado, null>) => void;
  setWeekMood: (v: "better" | "same" | "worse") => void;

  pasoNext: () => void;
  resetPasos: () => void;

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

  paso: 1,
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
      plan: clonePlan(weeklyPlan),
      planDraft: null,
      notaInterna:
        "Perfil consistente con lo observado en consulta. Vigilar carga de la cuidadora: Marcela reporta agotamiento sin nombrarlo.",
      mensajeBorrador: "",
      perfilValidado: false,
      reg: null,
      noCount: 0,
      notifySent: false,
      paso: 1,
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
  toggleMultiAnswer: (id, value, exclusive) =>
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
        next = [...list.filter((v) => !exclusive?.includes(v)), value];
      }
      return { onboarding2: { ...s.onboarding2, [id]: next } };
    }),
  setAnswerList: (id, list) => set((s) => ({ onboarding2: { ...s.onboarding2, [id]: list } })),
  setModalidad: (v) => set({ modalidad: v }),
  updateBasicInfo: (patch) => {
    set((s) => ({
      onboarding2: { ...s.onboarding2, persona_nombre: patch.nombre, persona_edad: patch.edad, persona2_actividades: patch.intereses },
      modalidad: patch.modalidad,
    }));
    get().pushAudit("Perfil", "actualiza datos básicos del perfil", "Marcela");
  },
  startModuleEdit: (module) => set({ perfilEditModule: module }),
  endModuleEdit: () => set({ perfilEditModule: null }),
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

  markRegistro: (taskId, v) => {
    const featuredEstado: PlanDayStatus = v === "done" ? "realizado" : v === "partial" ? "parcial" : "no";
    set((s) => {
      const today = s.plan.find((d) => d.isToday);
      if (!today) return { reg: v, noCount: v === "done" ? 0 : v === "no" ? s.noCount + 1 : s.noCount };
      return {
        reg: v,
        noCount: v === "done" ? 0 : v === "no" ? s.noCount + 1 : s.noCount,
        plan: mapTask(s.plan, today.dia, taskId, (t) => ({ ...t, estado: featuredEstado })),
      };
    });
    get().pushAudit("Registro", `marca actividad como "${v}"`, "Marcela");
  },
  setWeekMood: (v) => set({ weekMood: v }),

  pasoNext: () => set((s) => ({ paso: Math.min(3, s.paso + 1) })),
  resetPasos: () => set({ paso: 1 }),

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
