import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useSession } from "./useSession";
import type { PlanDay, PlanTask, PlanDayStatus } from "./mockData";

const DIAS_BY_WEEKDAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// The plan_tasks.is_today column is set once by the clinic at assignment time
// and never advances on its own, so "today" is derived from the real weekday
// instead — otherwise a plan only shows the right day on the day it was assigned.
function currentDia(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  return DIAS_BY_WEEKDAY[now.getDay()];
}

interface PlanTaskRow {
  id: string;
  dia: string;
  hora: string | null;
  titulo: string;
  tipo: PlanTask["tipo"];
  estado: PlanDayStatus;
  duracion: string | null;
  detalle: string | null;
  precaucion: string | null;
  pasos: string[] | null;
  por_que: string | null;
  comentario: string | null;
  nota_clinica: string | null;
}

function toPlanTask(row: PlanTaskRow): PlanTask {
  return {
    id: row.id,
    hora: row.hora ?? "",
    titulo: row.titulo,
    tipo: row.tipo,
    estado: row.estado,
    duracion: row.duracion ?? undefined,
    detalle: row.detalle ?? undefined,
    precaucion: row.precaucion ?? undefined,
    pasos: row.pasos ?? undefined,
    porQue: row.por_que ?? undefined,
    comentario: row.comentario ?? undefined,
    notaClinica: row.nota_clinica ?? undefined,
  };
}

function groupIntoDays(rows: PlanTaskRow[]): PlanDay[] {
  const today = currentDia();
  const byDia = new Map<string, PlanTask[]>();
  for (const row of rows) {
    if (!byDia.has(row.dia)) byDia.set(row.dia, []);
    byDia.get(row.dia)!.push(toPlanTask(row));
  }
  return DIAS_ORDER.filter((dia) => byDia.has(dia)).map((dia) => ({ dia, isToday: dia === today, tasks: byDia.get(dia)! }));
}

// Real Supabase-backed replacement for the local Zustand demo plan — reads
// the patient's published plan/plan_tasks so familiar/participante Hoy,
// Actividad, and Plan pages (and the clinic's review of what help was
// needed) all see the same real data.
export function usePlan(patientId: string | undefined) {
  return useQuery({
    queryKey: ["plan", patientId],
    queryFn: async () => {
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("id")
        .eq("patient_id", patientId!)
        .eq("status", "published")
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (planError) throw planError;
      if (!plan) return [] as PlanDay[];

      const { data: tasks, error: tasksError } = await supabase
        .from("plan_tasks")
        .select("id, dia, hora, titulo, tipo, estado, duracion, detalle, precaucion, pasos, por_que, comentario, nota_clinica, sort_order")
        .eq("plan_id", plan.id)
        .order("sort_order", { ascending: true });
      if (tasksError) throw tasksError;

      return groupIntoDays((tasks ?? []) as PlanTaskRow[]);
    },
    enabled: !!patientId,
  });
}

export interface PlanMeta {
  id: string;
  publish_at: string;
  family_reviewed_at: string | null;
  week_mood: string | null;
  review_favorita: string | null;
  review_preocupacion: string | null;
  reviewed_at: string | null;
  feedback_mensaje: string | null;
}

const PLAN_META_COLUMNS = "id, publish_at, family_reviewed_at, week_mood, review_favorita, review_preocupacion, reviewed_at, feedback_mensaje";

// Same "current plan" selection as usePlan (latest published & already-
// published-by-date) — kept as a separate query instead of folded into
// usePlan's return shape so every existing `usePlan(...).data` caller (an
// array of PlanDay) doesn't need to change.
export function useCurrentPlanMeta(patientId: string | undefined) {
  return useQuery({
    queryKey: ["plan-meta", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(PLAN_META_COLUMNS)
        .eq("patient_id", patientId!)
        .eq("status", "published")
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PlanMeta | null;
    },
    enabled: !!patientId,
  });
}

export function usePlanMeta(planId: string | undefined) {
  return useQuery({
    queryKey: ["plan-meta-by-id", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select(PLAN_META_COLUMNS).eq("id", planId!).single();
      if (error) throw error;
      return data as PlanMeta;
    },
    enabled: !!planId,
  });
}

// Weeks where every task is registered (nothing pendiente/futuro left) but
// the family hasn't submitted their 3-question check-in yet — normally 0 or
// 1, but not assumed to be at most 1 (the clinic could fall behind on
// reassigning), so this is a real list, not just a boolean.
export function usePendingReviews(patientId: string | undefined) {
  return useQuery({
    queryKey: ["pending-reviews", patientId],
    queryFn: async () => {
      const { data: plans, error } = await supabase
        .from("plans")
        .select("id, publish_at")
        .eq("patient_id", patientId!)
        .eq("status", "published")
        .is("family_reviewed_at", null)
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false });
      if (error) throw error;
      if (!plans || plans.length === 0) return [];

      const results: { id: string; publishAt: string }[] = [];
      for (const p of plans) {
        const { data: tasks, error: tasksError } = await supabase.from("plan_tasks").select("estado").eq("plan_id", p.id);
        if (tasksError) throw tasksError;
        const allDone = (tasks ?? []).length > 0 && tasks!.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");
        if (allDone) results.push({ id: p.id, publishAt: p.publish_at });
      }
      return results;
    },
    enabled: !!patientId,
  });
}

const estadoByReg: Record<"done" | "partial" | "no", Exclude<PlanDayStatus, "pendiente" | "futuro">> = {
  done: "realizado",
  partial: "parcial",
  no: "no",
};

// Same call shape as the old local `markRegistro` action (taskId, v, comentario?)
// so Hoy/Actividad pages only need to swap the data source, not their logic.
// Omitting comentario preserves whatever was stored before, matching the old
// local behavior — re-marking "done" after a "parcial" doesn't erase the help note.
export function useMarkRegistro(patientId: string | undefined) {
  const queryClient = useQueryClient();
  const session = useSession();
  const userId = session.status === "authed" ? session.session.user.id : null;

  return async function markRegistro(taskId: string, v: "done" | "partial" | "no", comentario?: string) {
    const update: Record<string, unknown> = { estado: estadoByReg[v] };
    if (comentario && comentario.trim()) update.comentario = comentario.trim();
    const { error } = await supabase.from("plan_tasks").update(update).eq("id", taskId);
    if (error) throw error;
    if (patientId && userId) {
      await supabase.from("audit_log").insert({
        patient_id: patientId,
        entidad: "Registro",
        accion: `marca actividad como "${v}"${comentario?.trim() ? ` — ${comentario.trim()}` : ""}`,
        autor_id: userId,
      });
    }
    await queryClient.invalidateQueries({ queryKey: ["plan", patientId] });
  };
}

export function useSubmitWeekReview(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return async function submitWeekReview(planId: string, mood: string, favorita: string, preocupacion: string) {
    const { error } = await supabase.rpc("submit_week_review", {
      p_plan_id: planId,
      p_mood: mood,
      p_favorita: favorita,
      p_preocupacion: preocupacion,
    });
    if (error) throw error;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["plan-meta", patientId] }),
      queryClient.invalidateQueries({ queryKey: ["plan-meta-by-id", planId] }),
      queryClient.invalidateQueries({ queryKey: ["pending-reviews", patientId] }),
    ]);
  };
}
