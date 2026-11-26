// Mensaje para la familia al publicar una semana, redactado con IA.
//
// La clínica arma la semana en el planificador; esta función propone el
// mensaje que la familia recibe por correo y WhatsApp, personalizado con:
// las actividades de la semana, cómo les fue la anterior (avance y lo que
// contó la familia) y los intereses de la persona. La clínica lo revisa y
// lo puede editar: nada se envía desde acá.
//
// Privacidad (Ley 8968): solo con la autorización «ia_equipo»; el modelo no
// recibe nombres (escribe {persona}) y el servidor pone el nombre después.
// Sin autorización, sin clave o si la respuesta no pasa el validador,
// responde { mensaje: null } y el planificador deja el texto de siempre.
import { createClient } from "npm:@supabase/supabase-js@2";
import { registrarUso, tokensGemini } from "../_shared/uso.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface Entrada {
  patientId: string;
  primeraVez?: boolean;
  semana?: string; // «24 al 29 de noviembre»
  actividades: { titulo: string; dia: string; area: string | null }[];
}

type Answers = Record<string, string | string[]>;

// Mismo criterio que whatsapp-notify-tick / generate-summary: «doña Rosa»
// solo si la familia lo eligió; si no, el nombre.
function nombreConTratamiento(a: Answers | null, fallback: string): string {
  const nombre = typeof a?.nombre_participante === "string" ? a.nombre_participante.trim().split(/\s+/)[0] : "";
  const base = nombre || fallback;
  if (a?.tratamiento_preferido === "don_dona" && base) return `${a.tratamiento_genero === "dona" ? "doña" : "don"} ${base}`;
  return base;
}

// Lo que nunca puede decir un mensaje a la familia.
const PROHIBIDO = /(—|–|sem[aá]foro|\bverde\b|\bamarillo\b|\brojo\b|diagn[oó]stic|demencia|deterioro|alzheimer|puntaje|\d+\s*%|medicamento|dosis)/i;

function validar(m: unknown): string | null {
  if (typeof m !== "string") return null;
  const t = m.replace(/\s+/g, " ").trim();
  if (t.length < 60 || t.length > 480) return null;
  if (PROHIBIDO.test(t)) return null;
  if (/\busted\b|\btú\b|\btienes\b|\bpuedes\b/i.test(t)) return null; // voseo
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  const {
    data: { user },
  } = await createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } }).auth.getUser();
  if (!user) return json({ error: "No autenticado." }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (caller?.role !== "profesional") return json({ error: "Solo el equipo clínico." }, 403);

  let e: Entrada;
  try {
    e = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  if (!e?.patientId || !Array.isArray(e.actividades) || e.actividades.length === 0) return json({ mensaje: null, motivo: "sin_actividades" });

  const { data: conIA } = await admin.rpc("consentimiento_paciente", { p_patient: e.patientId, p_tipo: "ia_equipo" });
  if (conIA !== true) return json({ mensaje: null, motivo: "sin_consentimiento" });
  if (!GEMINI_API_KEY) return json({ mensaje: null, motivo: "sin_clave" });

  const [{ data: patient }, { data: onb }, { data: links }, { data: ultimo }] = await Promise.all([
    admin.from("patients").select("nombre").eq("id", e.patientId).maybeSingle(),
    admin.from("onboarding_answers").select("answers").eq("patient_id", e.patientId).maybeSingle(),
    admin.from("patient_links").select("relation").eq("patient_id", e.patientId),
    admin
      .from("plans")
      .select("id, week_mood, review_favorita, review_preocupacion, plan_tasks(estado)")
      .eq("patient_id", e.patientId)
      .eq("status", "published")
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const answers = (onb?.answers ?? null) as Answers | null;
  const persona = nombreConTratamiento(answers, (patient?.nombre ?? "").trim().split(/\s+/)[0]);
  // ¿Le escribimos a la familia o a la persona? (sin familiar vinculado, a ella).
  const aFamilia = (links ?? []).some((l) => l.relation === "familiar_admin");
  const tareas = (ultimo?.plan_tasks ?? []) as { estado: string }[];
  const anterior =
    e.primeraVez || !ultimo
      ? null
      : {
          hechas: tareas.filter((t) => t.estado === "realizado" || t.estado === "parcial").length,
          total: tareas.length,
          sin_registrar: tareas.filter((t) => t.estado === "pendiente" || t.estado === "futuro").length,
          animo: ultimo.week_mood,
          lo_que_mas_gusto: ultimo.review_favorita,
          lo_que_preocupo: ultimo.review_preocupacion,
        };
  const intereses = Array.isArray(answers?.intereses_actuales) ? answers!.intereses_actuales.slice(0, 6) : [];

  const prompt = `Sos parte del equipo de IntegraMente en Casa (estimulación cognitiva y funcional en casa para personas mayores, Costa Rica). Redactá el mensaje corto que ${aFamilia ? "la familia" : "la persona"} recibe por WhatsApp y correo cuando publicamos ${e.primeraVez ? "su primera semana" : "la semana nueva"}.

Reglas:
- Español de Costa Rica con voseo (vos, tenés, podés, escribinos). Nunca usted ni tú.
- Para nombrar a la persona del programa escribí exactamente {persona}. No uses su género: nada de «contento/contenta», «él/ella», «solo/sola».
- ${aFamilia ? "Le hablás a la familia (podés usar «les» o «ustedes»)." : "Le hablás directamente a la persona, de vos."}
- Entre 2 y 4 oraciones, máximo 420 caracteres. Cálido, concreto, sin exagerar, sin signos de exclamación seguidos.
- Mencioná 1 o 2 actividades o áreas de esta semana por su nombre, y si sirve, conectalas con un interés.
- Si hay datos de la semana anterior: reconocé lo que hicieron sin dar cifras ni porcentajes. Si casi no hubo registros, animá sin culpar y ofrecé ayuda por WhatsApp. Si contaron una preocupación, mostrá que la tuvimos en cuenta, sin repetirla literal.
- Prohibido: diagnósticos, nombres de enfermedades, colores o «semáforos», puntajes, medicamentos, promesas de mejoría, rayas largas (—).
- Devolvé solo el JSON pedido.

DATOS:
${JSON.stringify({ semana: e.semana ?? null, actividades: e.actividades.slice(0, 20), intereses, semana_anterior: anterior })}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // El razonamiento interno de Gemini 3.x cuenta dentro del límite.
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties: { mensaje: { type: "STRING" } }, required: ["mensaje"] },
        },
      }),
    });
    if (!res.ok) return json({ mensaje: null, motivo: `gemini_${res.status}` });
    const data = await res.json();
    await registrarUso({ servicio: "gemini", funcion: "mensaje_semana", ...tokensGemini(data), patient_id: e.patientId });
    if (data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== "STOP") return json({ mensaje: null, motivo: "incompleta" });
    const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const parsed = JSON.parse(raw) as { mensaje?: unknown };
    const ok = validar(parsed.mensaje);
    if (!ok) return json({ mensaje: null, motivo: "no_valida" });
    const mensaje = ok.replace(/\{persona\}/g, persona || "tu familiar");
    return json({ mensaje, motivo: null });
  } catch {
    return json({ mensaje: null, motivo: "error" });
  }
});
