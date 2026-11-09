import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface SemanaAnterior {
  id: string;
  publish_at: string;
  family_reviewed_at: string | null;
  hechas: number;
  total: number;
}

interface Fila {
  id: string;
  publish_at: string;
  family_reviewed_at: string | null;
  plan_tasks: { estado: string }[] | null;
}

// Semanas ya publicadas, de la más reciente a la más vieja, sin la semana en
// curso (la primera). `limite` = cuántas anteriores traer (null = todas);
// `totalAnteriores` dice cuántas hay en total, para ofrecer el historial.
export function useSemanasAnteriores(patientId: string | undefined, limite: number | null) {
  return useQuery({
    queryKey: ["semanas-anteriores", patientId, limite],
    queryFn: async () => {
      let q = supabase
        .from("plans")
        .select("id, publish_at, family_reviewed_at, plan_tasks(estado)", { count: "exact" })
        .eq("patient_id", patientId!)
        .eq("status", "published")
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false });
      if (limite !== null) q = q.range(0, limite); // la en curso + `limite` anteriores
      const { data, error, count } = await q;
      if (error) throw error;
      const semanas = ((data ?? []) as Fila[]).slice(1).map((p) => {
        const tareas = p.plan_tasks ?? [];
        return {
          id: p.id,
          publish_at: p.publish_at,
          family_reviewed_at: p.family_reviewed_at,
          total: tareas.length,
          hechas: tareas.filter((t) => t.estado === "realizado" || t.estado === "parcial").length,
        } satisfies SemanaAnterior;
      });
      return { semanas, totalAnteriores: Math.max(0, (count ?? 0) - 1) };
    },
    enabled: !!patientId,
  });
}
