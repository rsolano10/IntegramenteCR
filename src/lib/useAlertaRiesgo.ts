import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useMyPatient } from "./useMyPatient";
import { callAdminAccounts } from "./adminAccounts";

export type TipoAlerta = "ideacion" | "maltrato" | "caida" | "cambio" | "extravio";

export interface AlertaEstado {
  id: string;
  created_at: string;
  vista_at: string | null;
  atendida_at: string | null;
}

// El aviso de riesgo más reciente de este tipo (últimas 24 h) — lo que la
// pantalla de alerta muestra como estado: enviado, visto, atendido.
export function useAlertaRiesgo(tipo: TipoAlerta) {
  const { data: myPatient } = useMyPatient();
  const queryClient = useQueryClient();
  const queryKey = ["alerta-riesgo", myPatient?.id, tipo];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas_riesgo")
        .select("id, created_at, vista_at, atendida_at")
        .eq("patient_id", myPatient!.id)
        .eq("tipo", tipo)
        .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AlertaEstado | null;
    },
    enabled: !!myPatient,
    // So "tu profesional ya lo vio" shows up without a reload.
    refetchInterval: (q) => (q.state.data && !q.state.data.atendida_at ? 30_000 : false),
  });

  async function enviar(automatica = false): Promise<boolean> {
    const { data, error } = await supabase.rpc("enviar_alerta_riesgo", { p_tipo: tipo, p_automatica: automatica });
    if (error) return false;
    const row = (Array.isArray(data) ? data[0] : data) as { id: string; nueva: boolean } | undefined;
    if (row?.nueva) {
      // Best-effort: the alert is already recorded and visible on the
      // clinic's panel even if the email fails.
      callAdminAccounts("notify_risk_alert", { alertaId: row.id }).catch(() => {});
    }
    await queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["mensajes", myPatient?.id] });
    return true;
  }

  return { alerta: query.data ?? null, loading: query.isPending && !!myPatient, enviar, hasPatient: !!myPatient };
}
