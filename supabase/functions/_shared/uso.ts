// Registro del consumo de servicios de pago (Gemini, ElevenLabs) para el
// panel de Gastos de Administración. Se guardan unidades crudas (tokens,
// caracteres, créditos, segundos); el costo se calcula al leer con las
// tarifas que edita la administración, así un cambio de tarifa recalcula
// todo. Nunca hace fallar a quien llama.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

let cliente: SupabaseClient | null = null;
function admin(): SupabaseClient {
  cliente ??= createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  return cliente;
}

export interface Uso {
  servicio: "gemini" | "elevenlabs" | "whatsapp"; // whatsapp: solo los envíos que no quedan en notifications_log
  funcion: string;
  entrada?: number; // tokens de entrada (Gemini) o caracteres (voz)
  salida?: number; // tokens de salida, razonamiento incluido (Gemini)
  creditos?: number; // créditos de ElevenLabs
  segundos?: number; // duración de una conversación con Clara
  referencia?: string | null; // p. ej. conversation_id, para no contar dos veces
  patient_id?: string | null;
}

export async function registrarUso(u: Uso): Promise<void> {
  try {
    await admin()
      .from("uso_servicios")
      .insert({
        servicio: u.servicio,
        funcion: u.funcion,
        entrada: Math.max(0, Math.round(u.entrada ?? 0)),
        salida: Math.max(0, Math.round(u.salida ?? 0)),
        creditos: Math.max(0, Math.round(u.creditos ?? 0)),
        segundos: Math.max(0, Math.round(u.segundos ?? 0)),
        referencia: u.referencia ?? null,
        patient_id: u.patient_id ?? null,
      });
  } catch {
    // El registro de consumo nunca interrumpe la función.
  }
}

// Tokens facturables de una respuesta de Gemini: la entrada, y la salida
// con el razonamiento interno (se cobra como salida).
export function tokensGemini(data: unknown): { entrada: number; salida: number } {
  const u = (data as { usageMetadata?: Record<string, number> } | null)?.usageMetadata ?? {};
  return {
    entrada: u.promptTokenCount ?? 0,
    salida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
  };
}
