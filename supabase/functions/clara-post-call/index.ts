// Webhook post-llamada de ElevenLabs para Clara (equivalente a
// POST /api/clara/post-call). Se despliega con --no-verify-jwt: quien llama
// es ElevenLabs, y la autenticidad se comprueba con la firma HMAC
// (encabezado ElevenLabs-Signature) usando ELEVENLABS_WEBHOOK_SECRET.
//
// 1. Verifica la firma; sin secreto configurado no procesa nada.
// 2. Solo atiende post_call_transcription del agente de Clara.
// 3. Busca el usuario por conversation_id en clara_conversaciones (lo
//    registró la app con la sesión verificada). El user_id que viene en el
//    payload solo se usa para comparar: si no coincide, no se escribe.
// 4. Fusiona el resumen nuevo con la memoria (máx. ~1000 caracteres, lo más
//    reciente primero) y lo guarda en agent_memory.
import { createClient } from "npm:@supabase/supabase-js@2";
import { fusionarResumen, verificarFirmaElevenLabs } from "../_shared/claraMemoria.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET") ?? "";
const CLARA_AGENT_ID = "agent_6101m6vtn05pf4mtqvys2jnavkt4";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

interface Payload {
  type?: string;
  data?: {
    agent_id?: string;
    conversation_id?: string;
    user_id?: string | null;
    analysis?: { transcript_summary?: string | null } | null;
    conversation_initiation_client_data?: { user_id?: string | null; dynamic_variables?: Record<string, unknown> } | null;
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!WEBHOOK_SECRET) return json({ error: "Webhook sin configurar." }, 500);

  const cuerpo = await req.text();
  if (!(await verificarFirmaElevenLabs(req.headers.get("ElevenLabs-Signature"), cuerpo, WEBHOOK_SECRET))) {
    return json({ error: "Firma inválida." }, 401);
  }

  let p: Payload;
  try {
    p = JSON.parse(cuerpo);
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  // Otros tipos de evento (audio, fallas de inicio): se confirman sin hacer nada.
  if (p.type !== "post_call_transcription" || !p.data) return json({ ok: true, ignorado: p.type ?? "sin tipo" });
  const d = p.data;
  if (d.agent_id !== CLARA_AGENT_ID) return json({ ok: true, ignorado: "otro agente" });
  const conversationId = d.conversation_id ?? "";
  const resumen = (d.analysis?.transcript_summary ?? "").trim();
  if (!conversationId) return json({ error: "Falta conversation_id." }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: conv } = await admin.from("clara_conversaciones").select("user_id, procesada_en").eq("conversation_id", conversationId).maybeSingle();
  // Sin registro de la app: no se sabe con certeza de quién es; no se escribe.
  if (!conv) return json({ ok: true, ignorado: "conversación no registrada" });
  if (conv.procesada_en) return json({ ok: true, ignorado: "ya procesada" });
  const delPayload = d.user_id ?? d.conversation_initiation_client_data?.user_id ?? null;
  if (delPayload && delPayload !== conv.user_id) return json({ ok: true, ignorado: "user_id no coincide" });

  if (resumen) {
    const [{ data: mem }, { data: perfil }] = await Promise.all([
      admin.from("agent_memory").select("nombre, resumen_previo").eq("user_id", conv.user_id).maybeSingle(),
      admin.from("profiles").select("nombre").eq("id", conv.user_id).maybeSingle(),
    ]);
    const nombre = mem?.nombre || (perfil?.nombre ?? "").split(" ")[0] || "";
    const { error } = await admin.from("agent_memory").upsert({
      user_id: conv.user_id,
      nombre,
      resumen_previo: fusionarResumen(mem?.resumen_previo, resumen, new Date()),
      updated_at: new Date().toISOString(),
    });
    if (error) return json({ error: "No pudimos guardar la memoria." }, 500);
  }
  await admin.from("clara_conversaciones").update({ procesada_en: new Date().toISOString() }).eq("conversation_id", conversationId);
  return json({ ok: true });
});
