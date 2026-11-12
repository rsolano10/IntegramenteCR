import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { nivelDe, type Nivel } from "./actividades/contrato";
import { nivelPorDefecto, sugerenciasNivel, type SesionJuego } from "./actividades/nivelSugerido";
import { usePerfilRecursos } from "./usePerfilRecursos";

interface Fila {
  nivel_interactivo: Nivel | null;
  dificultad_percibida: SesionJuego["dificultad"];
  media_resource_id: string;
  sort_order: number | null;
  plans: { publish_at: string } | { publish_at: string }[] | null;
  media_resources: { extras: { modo?: string; nivel?: Nivel } | null } | { extras: { modo?: string; nivel?: Nivel } | null }[] | null;
}
const uno = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);

// Los juegos que se le asignaron a una persona, en orden, con el nivel y
// cómo le resultaron. De acá salen el nivel por defecto al asignar y las
// sugerencias de subir o bajar.
export function useHistorialJuegos(patientId: string) {
  const { data: perfil } = usePerfilRecursos(patientId);
  const { data: historial } = useQuery({
    queryKey: ["historial-juegos", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_tasks")
        .select("nivel_interactivo, dificultad_percibida, media_resource_id, sort_order, plans!inner(patient_id, publish_at), media_resources(extras)")
        .eq("plans.patient_id", patientId)
        .not("media_resource_id", "is", null);
      if (error) throw error;
      return ((data ?? []) as unknown as Fila[])
        .map((f) => {
          const ex = uno(f.media_resources)?.extras;
          if (ex?.modo !== "interactiva") return null;
          const plan = uno(f.plans);
          return {
            resourceId: f.media_resource_id,
            nivel: f.nivel_interactivo ?? nivelDe(ex),
            dificultad: f.dificultad_percibida ?? null,
            orden: (plan ? new Date(plan.publish_at).getTime() : 0) + (f.sort_order ?? 0),
          } satisfies SesionJuego;
        })
        .filter((x): x is SesionJuego => x !== null);
    },
  });
  const sesiones = useMemo(() => historial ?? [], [historial]);
  const sugerencias = useMemo(() => sugerenciasNivel(sesiones), [sesiones]);
  const etapas = perfil?.etapas ?? null;
  const nivelPara = (resourceId: string, delRecurso: Nivel) => nivelPorDefecto({ resourceId, historial: sesiones, etapas, delRecurso });
  return { sesiones, sugerencias, nivelPara, cargado: historial !== undefined };
}
