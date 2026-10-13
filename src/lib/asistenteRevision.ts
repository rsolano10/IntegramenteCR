import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

// Revisión de las conversaciones del asistente por parte de la clínica.

export interface PendienteRevision {
  patient_id: string;
  patient_nombre: string;
  pendientes: number;
  ultimo_at: string;
  motivos: string[];
}

export const motivoLabel: Record<string, string> = {
  emergencia: "Emergencia",
  derivado: "Derivado al equipo",
  filtro_seguridad: "Bloqueado por seguridad",
  riesgo: "Señal de riesgo",
  no_sirvio: "No le sirvió",
};

export function usePendientesAsistente() {
  return useQuery({
    queryKey: ["asistente-pendientes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("asistente_pendientes_revision");
      if (error) throw error;
      return data as PendienteRevision[];
    },
  });
}
