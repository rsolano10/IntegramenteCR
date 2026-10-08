// "Respuestas rápidas" de la familia (pestaña Ayuda) con IA.
//
// Capas de seguridad, en orden:
//   1. En el cliente, ANTES de llamar acá: las reglas de riesgo fijas de
//      src/lib/chatbot.ts (caída, ideación, maltrato, extravío, cambio
//      agudo) mandan directo a la guía de emergencia. Una urgencia nunca
//      depende del modelo.
//   2. El modelo clasifica cada mensaje en una de cuatro categorías:
//        responder        → consejo práctico de cuidado, sin riesgo para la salud
//        profesional      → necesita criterio profesional: se deriva a su profesional
//        emergencia       → señales de urgencia que se escaparon de las reglas
//        fuera_de_alcance → nada que ver con el cuidado ni con la app
//   3. Validación del lado del servidor: una "respuesta" que hable de dosis
//      o medicamentos se convierte en "profesional"; fuera_de_alcance y
//      emergencia usan textos fijos, no los del modelo.
// Límite de uso por persona (tabla asistente_uso) para costo y abuso.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";
const LIMITE_POR_HORA = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

type Categoria = "responder" | "profesional" | "emergencia" | "fuera_de_alcance";

const TEXTO_FUERA =
  "Este chat es solo para dudas sobre el cuidado de su familiar y el uso de IntegraMente (actividades, rutinas, ánimo, sueño, alimentación diaria, comunicación). Con eso no le puedo ayudar.";
const TEXTO_EMERGENCIA =
  "Esto puede ser una urgencia. Si hay peligro inmediato, llame al 9-1-1. Le muestro qué hacer paso a paso y cómo avisar a su profesional.";
const TEXTO_PROFESIONAL_SEGURO =
  "Esta pregunta necesita el criterio de un profesional de la salud que conozca el caso de su familiar. Le recomiendo escribirle a su profesional.";

const INSTRUCCIONES = `Usted es el asistente de "Respuestas rápidas" de IntegraMente en Casa, una aplicación de Costa Rica que acompaña a familias que cuidan a personas adultas mayores con cambios cognitivos (o que quieren cuidar su memoria), con un plan semanal de actividades de estimulación (movimiento, música, reminiscencia, sentidos) preparado por un equipo de salud (neuropsicología, nutrición, fisioterapia).

Su trabajo: clasificar el mensaje del usuario y, cuando corresponda, responder.

Categorías:
- "responder": dudas prácticas del día a día que se pueden orientar sin riesgo para la salud. Ejemplos: cómo manejar que repita preguntas, cómo motivarle a hacer una actividad, ideas para una rutina, cómo comunicarse con calma, cómo cuidar el propio cansancio de quien cuida, ideas de actividades adaptadas, sugerencias generales de sueño o hidratación, cómo usar la aplicación.
- "profesional": cualquier cosa que requiera criterio clínico o conocer el caso: medicamentos o dosis, síntomas nuevos o que empeoran, dudas sobre un diagnóstico o la evolución, dieta para una enfermedad específica, problemas para tragar, pérdida de peso, cambios fuertes de conducta (agresividad, alucinaciones), dolor, decisiones de tratamiento, si una actividad es segura para su condición particular.
- "emergencia": señales de urgencia: caída con golpe, desmayo, dificultad para respirar, dolor de pecho, confusión repentina, fiebre alta, ideas de hacerse daño, maltrato, se perdió o no aparece.
- "fuera_de_alcance": nada que ver con el cuidado ni con la aplicación (programación, matemáticas, tareas escolares, política, recetas generales sin relación con el cuidado, traducciones, etc.).

Reglas para "responder":
- Español de Costa Rica, trato de usted, cálido y práctico.
- Máximo 110 palabras. Puede usar hasta 4 puntos que empiecen con "•". Sin guiones largos.
- Nunca diagnostique, nunca mencione medicamentos ni dosis, nunca contradiga indicaciones médicas.
- Si es útil, cierre con una línea breve de cuándo conviene consultar a su profesional.

Para "profesional": escriba 1 o 2 frases empáticas que validen la duda y expliquen por qué conviene preguntarle a su profesional. No dé la respuesta clínica.
Para "emergencia" y "fuera_de_alcance": la respuesta puede quedar vacía.

Devuelva solo JSON con "categoria" y "respuesta".`;

const RIESGO_EN_RESPUESTA = /\b(\d+\s?(mg|ml|mcg|gotas|pastillas|tabletas|c[aá]psulas)|dosis|medicamento|f[aá]rmaco|pastilla|ibuprofeno|paracetamol|acetaminof[eé]n|antibi[oó]tico|tranquilizante|diagn[oó]stico de)\b/i;

interface Turno {
  rol: "usuario" | "asistente";
  texto: string;
}

async function preguntarGemini(mensaje: string, historial: Turno[]): Promise<{ categoria: Categoria; respuesta: string } | null> {
  if (!GEMINI_API_KEY) return null;
  const contents = [
    ...historial.map((t) => ({ role: t.rol === "usuario" ? "user" : "model", parts: [{ text: t.texto }] })),
    { role: "user", parts: [{ text: mensaje }] },
  ];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCCIONES }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              categoria: { type: "STRING", enum: ["responder", "profesional", "emergencia", "fuera_de_alcance"] },
              respuesta: { type: "STRING" },
            },
            required: ["categoria", "respuesta"],
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const parsed = JSON.parse(text);
    const categoria = parsed?.categoria as Categoria;
    if (!["responder", "profesional", "emergencia", "fuera_de_alcance"].includes(categoria)) return null;
    return { categoria, respuesta: String(parsed?.respuesta ?? "").trim() };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  const mensaje = String(payload.mensaje ?? "").trim().slice(0, 600);
  if (!mensaje) return json({ error: "Mensaje vacío." }, 400);
  const historial: Turno[] = (Array.isArray(payload.historial) ? payload.historial : [])
    .filter((t: Turno) => t && (t.rol === "usuario" || t.rol === "asistente") && typeof t.texto === "string")
    .slice(-8)
    .map((t: Turno) => ({ rol: t.rol, texto: t.texto.slice(0, 600) }));

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { count } = await admin
    .from("asistente_uso")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .gte("created_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((count ?? 0) >= LIMITE_POR_HORA) {
    return json({ categoria: "limite", respuesta: "Hizo muchas consultas en la última hora. Intente de nuevo en un rato, o escríbale a su profesional." });
  }

  const r = await preguntarGemini(mensaje, historial);
  if (!r) return json({ categoria: "sin_ia" }); // el cliente usa las respuestas fijas

  let { categoria, respuesta } = r;
  if (categoria === "responder" && (RIESGO_EN_RESPUESTA.test(respuesta) || respuesta.length < 10)) {
    categoria = "profesional";
    respuesta = TEXTO_PROFESIONAL_SEGURO;
  }
  if (categoria === "fuera_de_alcance") respuesta = TEXTO_FUERA;
  if (categoria === "emergencia") respuesta = TEXTO_EMERGENCIA;
  if (categoria === "profesional" && (!respuesta || RIESGO_EN_RESPUESTA.test(respuesta))) respuesta = TEXTO_PROFESIONAL_SEGURO;
  respuesta = respuesta.replace(/[—–]/g, ",").slice(0, 1200);

  await admin.from("asistente_uso").insert({ profile_id: user.id, categoria });
  return json({ categoria, respuesta });
});
