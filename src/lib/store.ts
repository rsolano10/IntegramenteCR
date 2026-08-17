import { create } from "zustand";
import { makeAuditEntry, type AuditEntry } from "./rules";
import { classifyMessage } from "./chatbot";
import type { Answers } from "./onboardingSchema";

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

export type Role = "familiar" | "paciente" | "profesional" | null;
export type RegistroEstado = "done" | "partial" | "no" | null;

interface AppState {
  role: Role;
  email: string;
  loginHint: string;

  c1: boolean;
  c2: boolean;
  notify: "si" | "no";

  onboarding2: Answers;

  reg: RegistroEstado;
  noCount: number;

  notifySent: boolean;

  paso: number; // participant step-by-step activity (1-3)
  weekMood: "better" | "same" | "worse";

  chatMessages: ChatMessage[];

  auditLog: AuditEntry[];

  setEmail: (v: string) => void;
  setLoginHint: (v: string) => void;
  loginAs: (role: Role) => void;
  logout: () => void;

  toggleConsent1: () => void;
  toggleConsent2: () => void;
  setNotify: (v: "si" | "no") => void;

  answerQuestion: (id: string, value: string) => void;
  toggleMultiAnswer: (id: string, value: string, exclusive?: string[]) => void;

  markRegistro: (v: Exclude<RegistroEstado, null>) => void;
  setWeekMood: (v: "better" | "same" | "worse") => void;

  pasoNext: () => void;
  resetPasos: () => void;

  notifyNow: () => void;
  notifySkip: () => void;

  sendChatMessage: (text: string) => void;

  pushAudit: (entidad: string, accion: string, autor: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  email: "",
  loginHint: "",

  c1: true,
  c2: true,
  notify: "si",

  onboarding2: {},

  reg: null,
  noCount: 0,

  notifySent: false,

  paso: 1,
  weekMood: "same",

  chatMessages: [welcomeMessage],

  auditLog: [],

  setEmail: (v) => set({ email: v }),
  setLoginHint: (v) => set({ loginHint: v }),
  loginAs: (role) => set({ role, loginHint: "" }),
  logout: () =>
    set({
      role: null,
      email: "",
      loginHint: "",
      c1: true,
      c2: true,
      notify: "si",
      onboarding2: {},
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

  markRegistro: (v) => {
    set((s) => ({ reg: v, noCount: v === "done" ? 0 : v === "no" ? s.noCount + 1 : s.noCount }));
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
}));
