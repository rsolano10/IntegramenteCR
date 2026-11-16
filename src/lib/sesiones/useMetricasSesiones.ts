import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";

// Cómo les va a las familias con cada sesión guiada (solo la clínica).
export interface MetricaSesion {
  codigo: string;
  sesiones: number;
  terminadas: number;
  claras: number;
  con_clara: number;
  con_ayuda: number;
  paradas: number;
  mediana_segundos: number | null;
}

export function useMetricasSesiones() {
  return useQuery({
    queryKey: ["metricas-sesiones"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("metricas_sesiones");
      if (error) throw error;
      return new Map(((data ?? []) as MetricaSesion[]).map((m) => [m.codigo, m]));
    },
    staleTime: 5 * 60 * 1000,
  });
}

const pct = (n: number, d: number) => `${Math.round((100 * n) / d)}%`;

// «12 veces · 10 completas · 9 de 11 la encontraron fácil · mediana 8 min».
export function resumenMetrica(m: MetricaSesion): string[] {
  const out = [`${m.sesiones} ${m.sesiones === 1 ? "vez" : "veces"}`, `${pct(m.terminadas, m.sesiones)} la terminó`];
  if (m.con_clara) out.push(`${pct(m.claras, m.con_clara)} la encontró fácil de seguir`);
  if (m.con_ayuda) out.push(`${pct(m.con_ayuda, m.sesiones)} abrió «Ayuda»`);
  if (m.paradas) out.push(`${m.paradas} ${m.paradas === 1 ? "paró" : "pararon"}`);
  if (m.mediana_segundos) out.push(`unos ${Math.max(1, Math.round(m.mediana_segundos / 60))} min`);
  return out;
}
