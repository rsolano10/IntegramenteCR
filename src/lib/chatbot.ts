import { assistantAnswers } from "./mockData";
import { waEquipo } from "./whatsapp";

// The assistant never improvises clinical content (Handoff §7 · CLAUDE.md rules).
// It is a fixed lookup/decision tree presented as chat: risk keywords escalate to
// the matching alert screen, known topics return the pre-approved canned answer,
// anything else offers to write to the health team on WhatsApp (the only
// channel with the clinic; the app has no family ↔ clinic chat).

export interface ChatReply {
  text: string;
  // `to`: ruta interna de la app, o un link https (WhatsApp) que se abre afuera.
  escalate?: { label: string; to: string };
}

interface RiskRule {
  keywords: string[];
  reply: string;
  to: string;
  label: string;
}

const riskRules: RiskRule[] = [
  {
    keywords: ["no quiere vivir", "no quiero vivir", "no quiere seguir viviendo", "suicid", "quitarse la vida", "matarse"],
    reply: "Esto no puede esperar. Te llevo a la ruta de atención inmediata.",
    to: "/app/alerta/ideacion",
    label: "Ver a quién acudir ahora",
  },
  {
    keywords: ["maltrato", "la golpe", "le pegan", "le pega", "abandono", "encierran", "encierro", "le gritan"],
    reply: "Lo que describís corresponde a una situación de protección. Te muestro los recursos.",
    to: "/app/alerta/maltrato",
    label: "Ver recursos de protección",
  },
  {
    keywords: ["se cayó", "se cayo", "cayó", "cayo", "resbaló", "resbalo", "caída", "caida"],
    reply: "Ante una caída, primero hay que revisar señales de alarma. Te muestro qué hacer.",
    to: "/app/alerta/caida",
    label: "Ver qué hacer ante una caída",
  },
  {
    keywords: ["se perdió", "se perdio", "no aparece", "salió sola", "salio sola", "se desorienta", "quiere salir de la casa", "se fue de la casa"],
    reply: "Esto corresponde a la guía de prevención de extravío. Te la muestro.",
    to: "/app/alerta/extravio",
    label: "Ver las medidas",
  },
  {
    keywords: ["fiebre", "no me reconoce", "no reconoce", "muy dormida", "no despierta", "de un día para otro", "cambio repentino", "confundida de golpe"],
    reply: "Un cambio así de rápido casi siempre tiene una causa médica tratable. Te muestro qué revisar.",
    to: "/app/alerta/cambio",
    label: "Ver qué revisar",
  },
];

const topicKeywords: Record<string, string[]> = {
  repite: ["repite", "pregunta lo mismo", "misma pregunta", "repetir"],
  bano: ["baño", "bañar", "ducha", "bañarse"],
  comer: ["comer", "comida", "no come", "apetito"],
  dormir: ["dormir", "duerme", "insomnio", "sueño"],
};

// Solo las reglas de riesgo: se evalúan ANTES de consultar a la IA, para
// que una urgencia nunca dependa del modelo.
export function detectarRiesgo(raw: string): ChatReply | null {
  const text = raw.trim().toLowerCase();
  for (const rule of riskRules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return { text: rule.reply, escalate: { label: rule.label, to: rule.to } };
    }
  }
  return null;
}

export function classifyMessage(raw: string): ChatReply {
  const text = raw.trim().toLowerCase();

  for (const rule of riskRules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return { text: rule.reply, escalate: { label: rule.label, to: rule.to } };
    }
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((k) => text.includes(k))) {
      const answer = assistantAnswers[topic];
      return { text: `${answer.cuerpo} ${answer.pie}` };
    }
  }

  return {
    text: "No tengo una respuesta protocolizada para eso. Escribile a nuestro equipo de salud por WhatsApp y te responde directamente.",
    escalate: { label: "Escribir por WhatsApp", to: waEquipo(`Tengo una consulta: ${raw.trim()}`) },
  };
}
