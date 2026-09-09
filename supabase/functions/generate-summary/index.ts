// §13 RES-01 — genera el resumen personalizado de cierre del cuestionario
// vía Gemini, restringido a los 5 elementos permitidos y validado antes de
// devolverse (el usuario eligió "LLM con validación estricta posterior").
//
// El modelo NUNCA recibe las respuestas crudas del cuestionario: solo
// recibe los 5 hechos ya extraídos por las mismas reglas deterministas de
// src/lib/finalSummary.ts (duplicadas aquí, mismo patrón que
// clinicalEngine.ts/su espejo SQL — este runtime Deno no puede importar
// directamente del bundle de la app). Así, aunque el modelo alucine, no
// puede filtrar un color, un diagnóstico ni un dato clínico que nunca vio.
// Si Gemini falla, no responde, o el validador rechaza la salida, se
// devuelve `source: "fallback"` y el cliente usa el generador local.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

type Answers = Record<string, string | string[]>;

function nombreParticipante(a: Answers): string {
  return typeof a.nombre_participante === "string" ? a.nombre_participante.trim() : "";
}
const SIN_NOMBRE_GENERICO = "la persona que realizará las actividades";
function nombreConTratamiento(a: Answers): string {
  const nombre = nombreParticipante(a);
  if (!nombre) return SIN_NOMBRE_GENERICO;
  if (a.tratamiento_preferido === "don_dona") {
    const genero = a.tratamiento_genero === "dona" ? "doña" : "don";
    return `${genero} ${nombre}`;
  }
  return nombre;
}
function participanteEsRespondente(a: Answers): boolean {
  return a.rol_respondente === "propia_persona";
}

const interesLabels: Record<string, string> = {
  musica: "la música",
  fotos_recuerdos: "ver fotografías y recordar momentos",
  conversar: "conversar y compartir",
  leer: "la lectura",
  escribir: "escribir",
  cocinar: "la cocina",
  jardineria: "la jardinería",
  caminar: "caminar",
  bailar: "bailar",
  pintar_manualidades: "las manualidades",
  juegos_mesa: "los juegos de mesa",
  deportes_ver: "ver deportes",
  religioso_espiritual: "las actividades espirituales",
  cuidar_animales: "cuidar animales",
  television_peliculas: "ver televisión",
};
function pickIntereses(a: Answers): string {
  const raw = Array.isArray(a.intereses_actuales) ? a.intereses_actuales : [];
  const picked = raw.map((v) => interesLabels[v]).filter((x): x is string => !!x).slice(0, 2);
  if (picked.length === 0) return "";
  return picked.length === 1 ? picked[0] : `${picked[0]} y ${picked[1]}`;
}
function pickFortaleza(a: Answers): string {
  if (a.interes_iniciativa === "conserva_inicia") return "conserva iniciativa propia para participar en actividades";
  if (a.participacion_actividades_cotidianas === "iniciativa_propia") return "participa por iniciativa propia en tareas cotidianas";
  if (a.estructura_rutina_diaria === "estable") return "mantiene una rutina diaria bastante estable";
  if (a.percepcion_compania === "satisfecho") return "disfruta del contacto y la compañía de quienes le rodean";
  if (a.comprension_consignas === "varios_pasos") return "comprende bien instrucciones con varios pasos";
  if (a.disposicion_movimiento === "le_gusta_participa") return "le gusta participar en actividades de movimiento";
  return "muestra disposición para participar en las actividades que se le proponen";
}
function pickNecesidadApoyo(a: Answers): string {
  if (a.comprension_consignas === "otra_guia_completa") return "necesita que otra persona le guíe durante toda la actividad";
  if (a.comprension_consignas === "una_instruccion_demostracion") return "se beneficia de una instrucción a la vez y una demostración";
  if (a.comprension_consignas === "uno_dos_pasos") return "se beneficia de instrucciones breves, de uno o dos pasos";
  if (["ayuda_directa", "otra_persona"].includes(a.avdi_preparacion_alimentos as string)) return "necesita apoyo para preparar alimentos";
  if (["necesita_sostenido", "no_puede_pie"].includes(a.equilibrio_de_pie as string)) return "necesita acompañamiento para mantenerse de pie con seguridad";
  if (typeof a.origen_cambio_funcional === "string" && a.origen_cambio_funcional) return "se beneficia de recordatorios para organizar algunas tareas cotidianas";
  return "se beneficia de recordatorios y acompañamiento para organizar algunas actividades";
}
function pickSeguridad(a: Answers): string | null {
  if (a.movilidad_dentro_casa === "baston") return "utiliza bastón para caminar";
  if (a.movilidad_dentro_casa === "andadera") return "utiliza andadera para caminar";
  const caidaRelevante = Array.isArray(a.consecuencias_caida) && a.consecuencias_caida.some((v) => v !== "no" && v !== "no_se");
  if (caidaRelevante) return "conviene tomar precauciones adicionales al caminar, dado un episodio reciente";
  if (a.respuesta_demanda_cognitiva === "cansa_despues" || a.respuesta_demanda_cognitiva === "frustra_sobrecarga") {
    return "suele cansarse después de varios minutos de actividad";
  }
  return null;
}
function pickAcompanamiento(a: Answers): string {
  switch (a.disponibilidad_acompanante) {
    case "diario":
      return "cuenta con acompañamiento familiar todos o casi todos los días";
    case "varias_semana":
      return "cuenta con acompañamiento familiar varias veces por semana";
    case "ocasional":
      return "cuenta con acompañamiento familiar de forma ocasional";
    case "sin_acompanante":
      return "por ahora no cuenta con una persona disponible para acompañarle en algunas actividades";
    default:
      return "todavía no tenemos claridad sobre la disponibilidad de acompañamiento";
  }
}

const FORBIDDEN_PATTERNS = [
  /\bverde\b/i,
  /\bamarillo\b/i,
  /\brojo\b/i,
  /alucinaci/i,
  /delirio/i,
  /desinhibici/i,
  /diagn[oó]stic/i,
  /garantiz/i,
  /promet/i,
  /sustituye la atenci[oó]n profesional|reemplaza (la|una) (atenci[oó]n|valoraci[oó]n)/i,
];
function validateFinalSummary(text: string): boolean {
  if (!text.trim() || text.length > 1200) return false;
  return !FORBIDDEN_PATTERNS.some((re) => re.test(text));
}

interface Facts {
  nombre: string;
  intereses: string;
  fortaleza: string;
  necesidad: string;
  seguridad: string | null;
  acompanamiento: string;
}

async function callGemini(facts: Facts, esPropia: boolean): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `Redactá un resumen cálido y breve (entre 4 y 6 oraciones, un solo párrafo, sin encabezados ni comillas) para el cierre de un cuestionario de una app de acompañamiento cognitivo, en español de Costa Rica.

Datos permitidos — usalos todos, no agregues ningún dato que no esté aquí:
- Nombre/tratamiento de la persona: ${facts.nombre}
- Intereses: ${facts.intereses || "todavía no identificados con claridad"}
- Una fortaleza: ${facts.fortaleza}
- Su principal necesidad de apoyo: ${facts.necesidad}
- Consideración de seguridad relevante: ${facts.seguridad ?? "ninguna en particular"}
- Disponibilidad de acompañamiento: ${facts.acompanamiento}

Reglas estrictas, no negociables:
- Nunca menciones un color (verde, amarillo, rojo) ni la palabra "nivel" o "semáforo".
- Nunca menciones ni insinúes un diagnóstico.
- Nunca uses tono alarmista.
- Nunca prometas resultados, mejoras o curas.
- Nunca digas que la app sustituye o reemplaza la atención profesional.
- No inventes ni agregues ningún dato fuera de la lista de arriba.
- Tono cálido y cercano, dirigido en ${esPropia ? "segunda persona (voseo costarricense: vos, tenés, disfrutás)" : "tercera persona"}.
- Devolvé únicamente el párrafo final.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
    return text.trim() || null;
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
  const answers = (payload.answers && typeof payload.answers === "object" ? payload.answers : {}) as Answers;

  const esPropia = participanteEsRespondente(answers);
  const facts: Facts = {
    nombre: nombreConTratamiento(answers),
    intereses: pickIntereses(answers),
    fortaleza: pickFortaleza(answers),
    necesidad: pickNecesidadApoyo(answers),
    seguridad: pickSeguridad(answers),
    acompanamiento: pickAcompanamiento(answers),
  };

  const llmText = await callGemini(facts, esPropia);
  if (llmText && validateFinalSummary(llmText)) {
    return json({ summary: llmText, source: "llm" });
  }
  return json({ summary: null, source: "fallback" });
});
