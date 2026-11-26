// Saldo real de los proveedores con API de consumo, para Gastos
// (Administración). Hoy: ElevenLabs (créditos usados del plan y cuándo se
// renuevan). Gemini y WhatsApp no tienen una API simple de consumo: su gasto
// se estima con uso_servicios y las tarifas.
//
// Solo la administración (profiles.es_admin). La clave de ElevenLabs nunca
// sale del servidor.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  const {
    data: { user },
  } = await createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } }).auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: perfil } = await admin.from("profiles").select("es_admin").eq("id", user.id).maybeSingle();
  if (perfil?.es_admin !== true) return json({ error: "Solo la administración." }, 403);

  let elevenlabs: Record<string, unknown> | null = null;
  if (ELEVENLABS_API_KEY) {
    try {
      const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": ELEVENLABS_API_KEY } });
      if (r.ok) {
        const s = await r.json();
        elevenlabs = {
          plan: s?.tier ?? null,
          usados: s?.character_count ?? null,
          limite: s?.character_limit ?? null,
          renueva: s?.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000).toISOString() : null,
        };
      } else {
        elevenlabs = { error: r.status === 401 ? "La clave no tiene permiso para leer la suscripción." : `ElevenLabs respondió ${r.status}.` };
      }
    } catch {
      elevenlabs = { error: "No pudimos consultar ElevenLabs." };
    }
  }
  return json({ elevenlabs });
});
