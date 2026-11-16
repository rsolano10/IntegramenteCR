import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface PedidoAyuda {
  id: string;
  created_at: string;
  nota: string | null;
  visto_at: string | null;
}

// Pedidos de «Necesito ayuda» del participante. `soloSinVer`: los que el
// familiar todavía no marcó (para el aviso de Hoy); si no, los de las
// últimas dos semanas (para la ficha de la clínica).
export function usePedidosAyuda(patientId: string | undefined, soloSinVer: boolean) {
  return useQuery({
    queryKey: ["pedidos-ayuda", patientId, soloSinVer],
    queryFn: async () => {
      let q = supabase
        .from("pedidos_ayuda")
        .select("id, created_at, nota, visto_at")
        .eq("patient_id", patientId!)
        .gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString())
        .order("created_at", { ascending: false });
      if (soloSinVer) q = q.is("visto_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PedidoAyuda[];
    },
    enabled: !!patientId,
    refetchInterval: 60_000,
  });
}

export function useMarcarPedidoVisto() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await supabase.rpc("marcar_pedido_ayuda_visto", { p_id: id });
    await queryClient.invalidateQueries({ queryKey: ["pedidos-ayuda"] });
  };
}
