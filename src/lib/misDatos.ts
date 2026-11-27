import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Answers } from "./onboardingSchema";

// Derechos de la Ley 8968 en autoservicio (sin trabajo manual del equipo):
//   - el informe de mis datos (exportar_mis_datos, deja constancia de acceso);
//   - la eliminación programada a 7 días (función derechos-datos), que se
//     ejecuta sola salvo que se cancele.

export interface InformeDatos {
  generado_el: string;
  cuenta: { nombre: string; rol: string; correo: string | null; telefono_whatsapp: string | null; avisos_whatsapp: boolean; creada: string } | null;
  consentimientos: { tipo: string; otorgado: boolean; created_at: string }[];
  solicitudes: { tipo: string; estado: string; created_at: string; respuesta: string | null }[];
  personas_participantes: {
    nombre: string;
    edad: string | null;
    modalidad: string | null;
    alta: string;
    cuestionario: Answers | null;
    planes: {
      publicado: string;
      animo_semana: string | null;
      favorita: string | null;
      preocupacion: string | null;
      comentario: string | null;
      actividades: { dia: string; hora: string | null; titulo: string; estado: string; comentario: string | null }[];
    }[];
    notas_del_equipo: { texto: string; fecha: string; autor: string | null }[];
    mensajes: { texto: string; fecha: string; propio: boolean }[];
    pedidos_de_ayuda: { nota: string | null; fecha: string }[];
    alertas: { tipo: string; fecha: string }[];
  }[];
  asistente: { mensajes: { rol: string; texto: string; fecha: string }[]; memoria: string | null };
  clara: { memoria: string | null; conversaciones: { id: string; fecha: string }[] };
  avisos_whatsapp: { tipo: string; programado: string; estado: string }[];
}

export function useInformeDatos() {
  return useQuery({
    queryKey: ["informe-mis-datos"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("exportar_mis_datos");
      if (error) throw error;
      return data as InformeDatos;
    },
  });
}

// La copia técnica (JSON), para llevar los datos a otro servicio.
export function descargarJson(datos: InformeDatos) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `integramente-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useEliminacionProgramada(uid: string | null) {
  return useQuery({
    queryKey: ["eliminacion-programada", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_datos")
        .select("ejecutar_el")
        .eq("profile_id", uid!)
        .eq("tipo", "eliminacion")
        .eq("estado", "pendiente")
        .eq("automatica", true)
        .maybeSingle();
      if (error) throw error;
      return (data?.ejecutar_el as string | null) ?? null;
    },
  });
}

export function useAccionEliminacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accion: "programar" | "cancelar") => {
      const { data, error } = await supabase.functions.invoke("derechos-datos", { body: { accion } });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        const msg = ctx ? ((await ctx.json().catch(() => null)) as { error?: string } | null)?.error : null;
        throw new Error(msg ?? "No pudimos hacerlo. Probá de nuevo.");
      }
      return data as { ejecutar_el?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eliminacion-programada"] });
      qc.invalidateQueries({ queryKey: ["mis-solicitudes-datos"] });
    },
  });
}
