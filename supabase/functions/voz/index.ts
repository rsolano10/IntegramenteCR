// Voz de lectura (POST { texto } → audio/mpeg).
//
// Lee en voz alta las consignas de las actividades y los mensajes con una
// voz natural de ElevenLabs (la misma de Clara, salvo que se configure otra
// con ELEVENLABS_VOICE_ID). El audio se guarda en el bucket privado «voz»
// por el hash del texto: cada consigna se genera una sola vez.
//
// Secretos: ELEVENLABS_API_KEY (obligatorio para generar audio nuevo; la
// clave nunca llega al navegador). Sin clave responde 503 y la app usa la
// voz del dispositivo.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_KEY = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
const AGENTE = Deno.env.get("CLARA_AGENT_ID") ?? "agent_6101m6vtn05pf4mtqvys2jnavkt4";
const MODELO = "eleven_multilingual_v2";
const MAX = 900;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const audio = (bytes: ArrayBuffer | Uint8Array) =>
  new Response(bytes, { headers: { ...cors, "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=604800" } });

let vozCache: string | null = Deno.env.get("ELEVENLABS_VOICE_ID") ?? null;

// La voz del agente Clara, para que la app suene con una sola voz.
async function vozId(): Promise<string> {
  if (vozCache) return vozCache;
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENTE}`, { headers: { "xi-api-key": API_KEY } });
  if (r.ok) {
    const a = await r.json();
    const id = a?.conversation_config?.tts?.voice_id;
    if (typeof id === "string" && id) return (vozCache = id);
  }
  // Respaldo: una voz multilingüe cálida de la biblioteca de ElevenLabs.
  return (vozCache = "XB0fDUnXU5powFXDhCwa");
}

async function sha256(texto: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "No autenticado." }, 401);
  const {
    data: { user },
  } = await createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } }).auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);

  let texto = "";
  try {
    const b = await req.json();
    texto = typeof b?.texto === "string" ? b.texto.replace(/\s+/g, " ").trim() : "";
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  if (!texto) return json({ error: "Falta el texto." }, 400);
  if (texto.length > MAX) texto = texto.slice(0, MAX);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  if (!API_KEY) return json({ error: "sin_clave" }, 503);

  const voz = await vozId();
  const ruta = `${await sha256(`${voz}|${MODELO}|${texto}`)}.mp3`;

  // ¿Ya está generado?
  const { data: guardado } = await admin.storage.from("voz").download(ruta);
  if (guardado) return audio(await guardado.arrayBuffer());

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: texto,
      model_id: MODELO,
      // Cálida y pareja: estable, sin dramatismo.
      voice_settings: { stability: 0.55, similarity_boost: 0.78, style: 0.12, use_speaker_boost: true, speed: 0.95 },
    }),
  });
  if (!r.ok) return json({ error: "No pudimos generar la voz." }, 502);
  const bytes = new Uint8Array(await r.arrayBuffer());
  await admin.storage.from("voz").upload(ruta, bytes, { contentType: "audio/mpeg", upsert: true });
  return audio(bytes);
});
