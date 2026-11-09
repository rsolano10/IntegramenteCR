// Sesión de Clara (equivalente a GET /api/clara/session).
//
// GET  → { user_id, nombre, resumen_previo } del usuario autenticado. El
//        user_id sale SIEMPRE del token verificado en el servidor, nunca de
//        lo que mande el cliente. Sin memoria: nombre "" y resumen
//        "ninguno" (el prompt del agente usa las dos variables siempre).
// POST { conversation_id } → registra que esa conversación de ElevenLabs es
//        de este usuario. El webhook post-llamada (clara-post-call) busca el
//        usuario acá en lugar de confiar en el user_id que viaja desde el
//        navegador.
import { createClient } from "npm:@supabase/supabase-js@2";
import { SIN_MEMORIA } from "../_shared/claraMemoria.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  if (req.method === "GET") {
    const { data, error } = await admin.from("agent_memory").select("nombre, resumen_previo").eq("user_id", user.id).maybeSingle();
    if (error) return json({ error: "No pudimos leer la memoria." }, 500);
    return json({
      user_id: user.id,
      nombre: data?.nombre ?? "",
      resumen_previo: data?.resumen_previo?.trim() ? data.resumen_previo : SIN_MEMORIA,
    });
  }

  if (req.method === "POST") {
    let body: { conversation_id?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cuerpo inválido." }, 400);
    }
    const id = typeof body.conversation_id === "string" ? body.conversation_id.trim() : "";
    if (!/^[\w-]{6,128}$/.test(id)) return json({ error: "conversation_id inválido." }, 400);
    // Si la conversación ya estaba registrada a nombre de otra persona, no se pisa.
    const { data: existente } = await admin.from("clara_conversaciones").select("user_id").eq("conversation_id", id).maybeSingle();
    if (existente && existente.user_id !== user.id) return json({ error: "Conversación de otro usuario." }, 403);
    if (!existente) {
      const { error } = await admin.from("clara_conversaciones").insert({ conversation_id: id, user_id: user.id });
      if (error) return json({ error: "No pudimos registrar la conversación." }, 500);
    }
    return json({ ok: true });
  }

  return json({ error: "Método no permitido." }, 405);
});
