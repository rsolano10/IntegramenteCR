import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { ResumenDatos } from "../components/resumen/ResumenSeguimiento";

// Resumen de seguimiento (RPC resumen_seguimiento). Sin paciente: el de la
// cuenta que mira (familia o participante).
export function useResumen(patientId?: string | null, enabled = true) {
  return useQuery({
    queryKey: ["resumen-seguimiento", patientId ?? "propio"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resumen_seguimiento", patientId ? { p_patient: patientId } : {});
      if (error) throw error;
      return data as ResumenDatos;
    },
  });
}

export interface EnlaceResumen {
  token: string;
  created_at: string;
  expira: string;
  revocado_en: string | null;
  vistas: number;
  ultima_vista: string | null;
}

export function useEnlacesResumen(patientId?: string | null) {
  return useQuery({
    queryKey: ["enlaces-resumen", patientId ?? "propio"],
    queryFn: async () => {
      let q = supabase.from("resumenes_compartidos").select("token, created_at, expira, revocado_en, vistas, ultima_vista").order("created_at", { ascending: false }).limit(10);
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EnlaceResumen[];
    },
  });
}

export function useCrearEnlace(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dias: number) => {
      const { data, error } = await supabase.rpc("crear_resumen_compartido", { p_patient: patientId ?? null, p_dias: dias });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enlaces-resumen"] }),
  });
}

export function useRevocarEnlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase.rpc("revocar_resumen_compartido", { p_token: token });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enlaces-resumen"] }),
  });
}

export const urlResumen = (token: string) => `${window.location.origin}/resumen/${token}`;
