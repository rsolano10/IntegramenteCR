import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { NivelCognitivo } from "./mediaResources";
import type { NutricionFlags, Ruta, Supervision } from "./reglasRecursos";

export interface PerfilRecursosRpc {
  etapas: NivelCognitivo[];
  // Solo para la clínica (la familia recibe solo la etapa).
  etapaOverride?: NivelCognitivo | null;
  ruta?: Ruta | null;
  rutaOverride?: Ruta | null;
  supervision?: Supervision | null;
  nutricion?: NutricionFlags | null;
}

// Perfil para recursos (RPC perfil_recursos). Sin paciente: el de la cuenta
// que mira (familia o participante), que solo trae la etapa cognitiva.
export function usePerfilRecursos(patientId?: string | null) {
  return useQuery({
    queryKey: ["perfil-recursos", patientId ?? "propio"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("perfil_recursos", patientId ? { p_patient_id: patientId } : {});
      if (error) throw error;
      return (data ?? null) as PerfilRecursosRpc | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
