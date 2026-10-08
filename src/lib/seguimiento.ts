// Shared shapes and labels for the clinic's week follow-up (Seguimiento tab).

export interface PlanSummary {
  id: string;
  publish_at: string;
  reviewed_at: string | null;
  feedback_mensaje: string | null;
  family_reviewed_at: string | null;
  week_mood: string | null;
  review_favorita: string | null;
  review_preocupacion: string | null;
}

export interface TaskRow {
  id: string;
  plan_id: string;
  dia: string;
  hora: string | null;
  titulo: string;
  estado: "pendiente" | "realizado" | "parcial" | "no" | "futuro";
  comentario: string | null;
  sort_order: number;
  modulo: string | null;
}

// Status colors validated with the dataviz palette checker (CVD + normal
// vision) — always shown with a text label, never color alone.
export const estadoMeta: Record<TaskRow["estado"], { label: string; chip: string; color: string }> = {
  realizado: { label: "Hecha", chip: "bg-[#e3efe6] text-[#22663f]", color: "#2f8f5b" },
  parcial: { label: "En parte", chip: "bg-aviso text-aviso-texto", color: "#e0a12a" },
  no: { label: "No se hizo", chip: "bg-alerta text-alerta-texto", color: "#b4483a" },
  pendiente: { label: "Sin registrar", chip: "bg-campo text-tinta-tenue border border-borde-suave", color: "#e4dfc7" },
  futuro: { label: "Próximamente", chip: "bg-campo text-tinta-tenue border border-borde-suave", color: "#e4dfc7" },
};

export const moodMeta: Record<string, { label: string; short: string; icon: string; tone: string }> = {
  better: { label: "Mejor que la semana anterior", short: "Mejor", icon: "↗", tone: "bg-[#e3efe6] text-[#22663f]" },
  same: { label: "Igual que la semana anterior", short: "Igual", icon: "→", tone: "bg-campo text-tinta-suave" },
  worse: { label: "Peor que la semana anterior", short: "Peor", icon: "↘", tone: "bg-alerta text-alerta-texto" },
};

export function weekStats(tasks: TaskRow[]) {
  const by = (e: TaskRow["estado"]) => tasks.filter((t) => t.estado === e).length;
  const realizado = by("realizado");
  const parcial = by("parcial");
  const no = by("no");
  return { total: tasks.length, realizado, parcial, no, abiertas: tasks.length - realizado - parcial - no };
}

