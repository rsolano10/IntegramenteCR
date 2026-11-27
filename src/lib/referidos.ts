import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useMyPatient } from "./useMyPatient";

// Profesionales referidores: el enlace con su código y lo que ven.
const CLAVE_REF = "ref-referido";

// Al entrar con ?ref=CODIGO (el enlace del referidor), se guarda para
// aplicarlo cuando la familia termine el registro.
export function guardarReferidoDeUrl() {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[A-Za-z0-9-]{3,40}$/.test(ref)) localStorage.setItem(CLAVE_REF, JSON.stringify({ ref, en: Date.now() }));
  } catch {
    // Sin almacenamiento: no se puede recordar el referido.
  }
}

export function referidoPendiente(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_REF) ?? "null") as { ref: string; en: number } | null;
    // Vale 60 días desde que abrió el enlace.
    if (!v || Date.now() - v.en > 60 * 86_400_000) return null;
    return v.ref;
  } catch {
    return null;
  }
}

export function olvidarReferido() {
  try {
    localStorage.removeItem(CLAVE_REF);
  } catch {
    // nada
  }
}

export const enlaceReferido = (codigo: string) => `${window.location.origin}/ingresar?mode=register&ref=${encodeURIComponent(codigo)}`;

export interface MiReferido {
  patient_id: string;
  nombre: string;
  referido_en: string;
  origen: "enlace" | "manual";
  estado: "en_revision" | "semana_gratis" | "termino_prueba" | "pagando" | "vencido" | "no_continuo" | "activo";
  programa: string | null;
  comparte: boolean;
  ultima_actividad: string | null;
  semana_hechas: number | null;
  semana_total: number | null;
}

export const ESTADO_REFERIDO: Record<MiReferido["estado"], { label: string; tono: string }> = {
  en_revision: { label: "En revisión del equipo", tono: "bg-aviso text-aviso-texto" },
  semana_gratis: { label: "En su semana gratis", tono: "bg-verde-tenue text-verde-profundo" },
  termino_prueba: { label: "Terminó la semana gratis", tono: "bg-campo text-tinta-suave" },
  pagando: { label: "En el programa", tono: "bg-[#e3efe6] text-[#22663f]" },
  activo: { label: "En el programa", tono: "bg-[#e3efe6] text-[#22663f]" },
  vencido: { label: "Pausó el programa", tono: "bg-campo text-tinta-suave" },
  no_continuo: { label: "No continuó", tono: "bg-campo text-tinta-tenue" },
};

export function useMisReferidos() {
  return useQuery({
    queryKey: ["mis-referidos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("mis_referidos");
      if (error) throw error;
      return (data ?? []) as MiReferido[];
    },
  });
}

export function useMiReferidor(enabled = true) {
  const { data: myPatient } = useMyPatient();
  return useQuery({
    queryKey: ["mi-referidor", myPatient?.id ?? null],
    enabled: enabled && !!myPatient,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("mi_referidor", { p_patient: myPatient!.id });
      if (error) throw error;
      return (data ?? null) as { nombre: string; especialidad: string | null; institucion: string | null } | null;
    },
  });
}

// Llegó con el enlace de un profesional: al tener paciente, queda como
// referida por él (una sola vez).
export function useAplicarReferido(patientId: string | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!patientId) return;
    const ref = referidoPendiente();
    if (!ref) return;
    supabase.rpc("aplicar_referido", { p_codigo: ref }).then(({ error }) => {
      if (!error) {
        olvidarReferido();
        qc.invalidateQueries({ queryKey: ["mi-referidor"] });
      }
    });
  }, [patientId, qc]);
}

