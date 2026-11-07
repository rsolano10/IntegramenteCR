// Estado de cuenta de cada familia/paciente (panel_cuentas). Lo usan las
// tarjetas de Usuarios para el seguimiento de cuentas.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { FilaCuenta } from "./cuentas";
import type { EstadoCuenta } from "./useMyPatient";

export const ORDEN_ESTADOS: EstadoCuenta[] = ["registrado", "cuestionario_pendiente", "pendiente_aprobacion", "en_demo", "demo_finalizada", "activa", "inactiva", "rechazada"];

const DIA = 86_400_000;
export const diasHasta = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DIA) : null);
export const diasDesde = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DIA) : null);

export function usePanelCuentas() {
  return useQuery({
    queryKey: ["panel-cuentas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("panel_cuentas");
      if (error) throw error;
      return (data ?? []) as FilaCuenta[];
    },
  });
}

// Una fila por paciente: si tiene varias cuentas (familiar y participante),
// la más avanzada en el recorrido, que es la que describe a la familia.
export function useCuentaPorPaciente() {
  const q = usePanelCuentas();
  const porPaciente = useMemo(() => {
    const m = new Map<string, FilaCuenta>();
    for (const f of q.data ?? []) {
      if (!f.patient_id || !f.estado) continue;
      const actual = m.get(f.patient_id);
      if (!actual || ORDEN_ESTADOS.indexOf(f.estado) > ORDEN_ESTADOS.indexOf(actual.estado!)) m.set(f.patient_id, f);
    }
    return m;
  }, [q.data]);
  const porCuenta = useMemo(() => new Map((q.data ?? []).map((f) => [f.profile_id, f])), [q.data]);
  return { ...q, porPaciente, porCuenta };
}

// Demo que termina en 2 días o menos (incluye la que termina hoy).
export const demoPorTerminar = (f: FilaCuenta | undefined) => !!f && f.estado === "en_demo" && (diasHasta(f.demo_fin) ?? 99) <= 2;
