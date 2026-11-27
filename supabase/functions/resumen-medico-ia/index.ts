// «En pocas palabras» del resumen para el médico: tres a cinco datos para
// entrar en contexto en un minuto, más lo que conviene mirar. Se arma con
// Gemini a partir del mismo resumen que ve el médico (resumen_seguimiento),
// sin el nombre de la persona, y se guarda hasta que los datos cambien.
//
// Acceso: el mismo del resumen (lo pide quien lo puede ver; la consulta se
// hace con la sesión de quien llama). IA solo con el permiso «ia_equipo» y
// con la IA para familias encendida (Administración); si no, uno automático
// con reglas fijas. Nunca diagnósticos ni indicaciones: solo lo registrado.
import { createClient } from "npm:@supabase/supabase-js@2";
import { controlServicios } from "../_shared/control.ts";
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
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface Datos {
  persona: { nombre: string; edad: string | null; programa: string | null; desde: string };
  totales: { semanas: number; actividades: number; hechas: number; en_parte: number; no: number; sin_registrar: number };
  semanas: { inicio: string; total: number; hechas: number; en_parte: number; animo: string | null; lo_que_mas_gusto: string | null; preocupacion: string | null }[];
  por_area: { modulo: string; total: number; hechas: number }[];
  ultimas: { fecha: string; titulo: string; modulo: string | null; estado: string; comentario: string | null; dificultad_percibida: string | null }[];
  avisos: { alertas_90_dias: number; ultima_alerta: string | null; pedidos_ayuda_90_dias: number };
}
interface Pocas {
  titular: string;
  puntos: string[];
  atencion: string[];
}

const AREA: Record<string, string> = {
  cognicion: "atención y memoria",
  gerontogimnasia: "gerontogimnasia",
  nutricion: "nutrición",
  reminiscencia: "reminiscencia",
  movimiento: "movimiento",
  musica: "música",
  sentidos: "sentidos",
  bienvenida: "bienvenida",
};
const area = (m: string) => AREA[m] ?? m;

async function sha256(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}

// Sin IA: lo mismo, con reglas fijas.
function automatico(d: Datos): Pocas {
  const t = d.totales;
  const hechas = t.hechas + t.en_parte;
  const semanas = [...d.semanas].reverse(); // de la más vieja a la más nueva
  const tasa = (s: Datos["semanas"][number]) => (s.total ? (s.hechas + s.en_parte) / s.total : 0);
  const ult = semanas.slice(-2);
  const ant = semanas.slice(0, -2);
  const prom = (xs: typeof semanas) => (xs.length ? xs.reduce((a, s) => a + tasa(s), 0) / xs.length : 0);
  const tendencia = ant.length && ult.length ? prom(ult) - prom(ant) : 0;
  const constancia = t.actividades ? hechas / t.actividades : 0;
  const nivel = constancia >= 0.7 ? "buena" : constancia >= 0.4 ? "intermedia" : "baja";
  const areas = [...d.por_area].filter((a) => a.hechas > 0).sort((a, b) => b.hechas - a.hechas);
  const sinHacer = d.por_area.filter((a) => a.total > 0 && a.hechas === 0);

  const titular = t.actividades
    ? `Constancia ${nivel} en casa: hizo ${hechas} de ${t.actividades} actividades en ${t.semanas} ${t.semanas === 1 ? "semana" : "semanas"}.`
    : "Todavía no hay actividades registradas en casa.";
  const puntos: string[] = [];
  if (ult.length && ant.length)
    puntos.push(tendencia > 0.15 ? "Las últimas semanas hizo más actividades que al principio." : tendencia < -0.15 ? "Las últimas semanas hizo menos actividades que al principio." : "Mantiene un ritmo parecido semana a semana.");
  if (areas.length) puntos.push(`Lo que más hizo: ${areas.slice(0, 2).map((a) => area(a.modulo)).join(" y ")}.`);
  if (sinHacer.length) puntos.push(`Sin actividades hechas en ${sinHacer.slice(0, 2).map((a) => area(a.modulo)).join(" y ")}.`);
  const mejor = d.semanas.find((s) => s.animo === "better");
  if (mejor) puntos.push("La familia notó semanas mejores que la anterior.");
  if (t.sin_registrar > t.actividades / 2) puntos.push("Más de la mitad de las actividades quedaron sin registrar.");
  const atencion: string[] = [];
  if (d.avisos.alertas_90_dias > 0) atencion.push(`${d.avisos.alertas_90_dias} ${d.avisos.alertas_90_dias === 1 ? "aviso de riesgo" : "avisos de riesgo"} en los últimos 90 días.`);
  if (d.semanas.some((s) => s.animo === "worse")) atencion.push("La familia marcó alguna semana peor que la anterior.");
  if (d.avisos.pedidos_ayuda_90_dias > 0) atencion.push("Pidió ayuda al equipo en los últimos 90 días.");
  return { titular, puntos: puntos.slice(0, 5), atencion: atencion.slice(0, 3) };
}

const PROHIBIDO = /(diagn[oó]stic|demencia|alzheimer|deterioro cognitivo|medicamento|dosis|tratamiento farmacol|sem[aá]foro|\busted\b|\btú\b|—)/i;
function valido(p: unknown): p is Pocas {
  if (!p || typeof p !== "object") return false;
  const x = p as Pocas;
  if (typeof x.titular !== "string" || x.titular.length < 20 || x.titular.length > 220) return false;
  if (!Array.isArray(x.puntos) || x.puntos.length < 2 || x.puntos.length > 5) return false;
  if (!Array.isArray(x.atencion) || x.atencion.length > 3) return false;
  const todos = [x.titular, ...x.puntos, ...x.atencion];
  return todos.every((s) => typeof s === "string" && s.length <= 220 && !PROHIBIDO.test(s));
}

async function conGemini(d: Datos): Promise<Pocas | null> {
  if (!GEMINI_API_KEY) return null;
  // Sin el nombre: «la persona». Solo lo registrado.
  const paraModelo = { ...d, persona: { edad: d.persona.edad, programa: d.persona.programa, desde: d.persona.desde } };
  const prompt = `Sos parte del equipo de IntegraMente en Casa (programa de actividades en casa para personas mayores, Costa Rica). Escribí el «En pocas palabras» de un resumen que la familia le comparte al médico: lo que el médico lee primero para entrar en contexto en un minuto.

Reglas:
- Solo con los DATOS de abajo: no inventes, no supongas causas, no des diagnósticos, no nombres enfermedades, no recomiendes tratamientos ni medicamentos.
- Español de Costa Rica, tercera persona impersonal y profesional («la persona», «la familia»). Nada de «usted» ni «tú». Sin rayas largas.
- titular: una oración (máximo 30 palabras) con lo más importante: qué tan constante fue en casa y la tendencia.
- puntos: de 3 a 5 datos concretos y breves (máximo 22 palabras cada uno): tendencia por semanas, áreas más y menos trabajadas, lo que contó la familia que sea útil para el médico.
- atencion: de 0 a 3 cosas que conviene mirar en consulta (avisos de riesgo, semanas peores, preocupaciones de la familia), dichas de forma neutral. Vacío si no hay.
- Números exactos cuando ayuden («8 de 35 actividades»). Devolvé solo el JSON.

DATOS:
${JSON.stringify(paraModelo)}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { titular: { type: "STRING" }, puntos: { type: "ARRAY", items: { type: "STRING" } }, atencion: { type: "ARRAY", items: { type: "STRING" } } },
            required: ["titular", "puntos", "atencion"],
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await registrarUso({ servicio: "gemini", funcion: "resumen_medico", ...tokensGemini(data) });
    if (data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== "STOP") return null;
    const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const parsed = JSON.parse(raw);
    return valido(parsed) ? { titular: parsed.titular.trim(), puntos: parsed.puntos.map((s: string) => s.trim()), atencion: parsed.atencion.map((s: string) => s.trim()) } : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "No autenticado." }, 401);
  let patientId = "";
  try {
    patientId = String((await req.json())?.patientId ?? "");
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  if (!patientId) return json({ error: "Falta el paciente." }, 400);

  // El resumen, con la sesión de quien llama: si no lo puede ver, error.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: resumen, error } = await userClient.rpc("resumen_seguimiento", { p_patient: patientId });
  if (error || !resumen) return json({ error: "Sin acceso." }, 403);
  const { generado_en: _g, ia: _ia, ...datos } = resumen as Datos & { generado_en: string; ia: unknown };
  const huella = await sha256(JSON.stringify(datos));

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: previo } = await admin.from("resumen_medico_ia").select("huella, contenido, fuente, generado_en").eq("patient_id", patientId).maybeSingle();
  if (previo && previo.huella === huella) return json({ ok: true, actualizado: false });

  const { data: conIA } = await admin.rpc("consentimiento_paciente", { p_patient: patientId, p_tipo: "ia_equipo" });
  const llm = conIA === true && (await controlServicios()).ia_familia ? await conGemini(datos as Datos) : null;
  await admin.from("resumen_medico_ia").upsert({
    patient_id: patientId,
    huella,
    contenido: llm ?? automatico(datos as Datos),
    fuente: llm ? "llm" : "automatico",
    generado_en: new Date().toISOString(),
  });
  return json({ ok: true, actualizado: true });
});
