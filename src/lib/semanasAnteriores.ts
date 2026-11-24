import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { contarHechas } from "./estadoActividad";
import { semanaTerminada } from "./planWeek";

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
      const filas = (data ?? []) as Fila[];
      // La primera es la semana en curso, salvo que ya haya terminado (sin
      // otra publicada): entonces también va con las anteriores.
      const saltar = filas.length > 0 && !semanaTerminada(filas[0].publish_at) ? 1 : 0;
      const semanas = filas.slice(saltar, limite !== null ? saltar + limite : undefined).map((p) => {
        const tareas = p.plan_tasks ?? [];
        return {
          id: p.id,
          publish_at: p.publish_at,
          family_reviewed_at: p.family_reviewed_at,
          total: tareas.length,
          hechas: contarHechas(tareas),
        } satisfies SemanaAnterior;
      });
      return { semanas, totalAnteriores: Math.max(0, (count ?? 0) - saltar) };
    },
    enabled: !!patientId,
  });
}
