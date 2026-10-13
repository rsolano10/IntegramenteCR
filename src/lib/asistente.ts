import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

// Cliente del Asistente IntegraMente (edge function asistente-ia). El
// historial vive en el servidor (asistente_mensajes, solo lectura propia
// por RLS); acá se lee, se transmite la respuesta y se califica.

export interface MensajeAsistente {
  id: string;
  rol: "usuario" | "asistente";
  texto: string;
  categoria: string | null;
  whatsapp: string | null;
  sugerencias: string[];
  feedback: -1 | 1 | null;
  created_at: string;
}

export function useHistorialAsistente() {
  return useQuery({
    queryKey: ["asistente-historial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistente_mensajes")
        .select("id, rol, texto, categoria, whatsapp, sugerencias, feedback, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []).reverse().map((m) => ({ ...m, sugerencias: Array.isArray(m.sugerencias) ? m.sugerencias : [] })) as MensajeAsistente[];
    },
    staleTime: Infinity,
  });
}

export type EventoAsistente =
  | { t: "delta"; texto: string }
  | {
      t: "fin";
      id: string | null;
      texto: string;
      categoria: string;
      derivar: boolean;
      whatsapp: string | null;
      sugerencias: string[];
      emergencia: boolean;
    }
  | { t: "limite"; texto: string }
  | { t: "sin_ia" };

// Llama a la edge function y entrega cada evento a medida que llega. Si
// algo falla antes de recibir nada, emite "sin_ia" (el cliente usa las
// respuestas fijas).
export async function preguntarAsistente(mensaje: string, riesgoLocal: string | null, onEvento: (e: EventoAsistente) => void) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let recibido = false;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asistente-ia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ mensaje, riesgoLocal }),
    });
    if (!res.ok || !res.body) throw new Error(String(res.status));
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const linea = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!linea) continue;
        try {
          onEvento(JSON.parse(linea) as EventoAsistente);
          recibido = true;
        } catch {
          // línea incompleta
        }
      }
    }
    if (buf.trim()) {
      onEvento(JSON.parse(buf) as EventoAsistente);
      recibido = true;
    }
  } catch {
    if (!recibido) onEvento({ t: "sin_ia" });
  }
}

export async function calificarRespuesta(id: string, valor: -1 | 1 | null) {
  await supabase.rpc("asistente_feedback", { p_mensaje_id: id, p_valor: valor });
}

export async function borrarHistorialAsistente() {
  const { error } = await supabase.rpc("asistente_borrar_historial");
  return !error;
}
