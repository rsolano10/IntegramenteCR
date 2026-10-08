// Panorama del caso para la clínica (pestaña "Seguimiento"): resume con
// Gemini cómo le ha ido al paciente semana a semana — registros de cada
// actividad, la evaluación semanal de la familia, sus mensajes, el
// feedback y las notas internas de la clínica — para que la profesional
// entre en contexto en segundos antes de armar la próxima semana.
//
// Se recalcula solo cuando cambian los datos (huella = hash de la entrada),
// así abrir la pestaña es barato. Lo pueden disparar:
//   - la clínica (al abrir la pestaña, o "Actualizar" con forzar=true) → devuelve el panorama;
//   - la familia/participante al enviar su evaluación semanal → solo lo
//     deja listo, no recibe el contenido.
// Sin GEMINI_API_KEY, o si el modelo falla / devuelve algo inválido, se
// guarda un panorama determinista armado con los mismos datos.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.6-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

type Admin = ReturnType<typeof createClient>;

interface Tendencia {
  tipo: "positivo" | "atencion";
  texto: string;
}
interface Panorama {
  resumen: string;
  tendencias: Tendencia[];
  voz_familia: { semana: string; texto: string }[];
  sugerencias: string[];
  datos_faltantes: string[];
}

const ESTADO: Record<string, string> = { realizado: "hecha", parcial: "en parte", no: "no se hizo", pendiente: "sin registrar", futuro: "sin registrar" };
const ANIMO: Record<string, string> = { better: "mejor", same: "igual", worse: "peor" };
const MODULO: Record<string, string> = { sentidos: "Sentidos", movimiento: "Movimiento", musica: "Música", reminiscencia: "Reminiscencia" };
const ALERTA: Record<string, string> = { ideacion: "posible autolesión", maltrato: "sospecha de maltrato", caida: "caída", cambio: "cambio repentino de salud", extravio: "riesgo de extravío" };

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short", timeZone: "America/Costa_Rica" });
}

async function recolectar(admin: Admin, patientId: string) {
  const ahora = new Date().toISOString();
  const [{ data: patient }, { data: plans }, { data: notas }, { data: alertas }, { data: mensajes }, { data: links }] = await Promise.all([
    admin.from("patients").select("nombre, edad, modalidad, created_at").eq("id", patientId).maybeSingle(),
    admin
      .from("plans")
      .select("id, publish_at, family_reviewed_at, week_mood, review_favorita, review_preocupacion, reviewed_at, feedback_mensaje")
      .eq("patient_id", patientId)
      .eq("status", "published")
      .lte("publish_at", ahora)
      .order("publish_at", { ascending: false })
      .limit(8),
    admin.from("notas_clinicas").select("texto, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(15),
    admin
      .from("alertas_riesgo")
      .select("tipo, created_at, atendida_at")
      .eq("patient_id", patientId)
      .gte("created_at", new Date(Date.now() - 60 * 86400000).toISOString()),
    admin.from("mensajes").select("texto, autor_id, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(40),
    admin.from("patient_links").select("profile_id, relation").eq("patient_id", patientId),
  ]);

  const planIds = (plans ?? []).map((p) => p.id as string);
  const { data: tasks } = planIds.length
    ? await admin
        .from("plan_tasks")
        .select("plan_id, dia, hora, titulo, estado, comentario, media_resources(modulo)")
        .in("plan_id", planIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Record<string, unknown>[] };

  // Solo los mensajes que escribió la familia/participante (no la clínica
  // ni los avisos automáticos), para que la "voz de la familia" sea suya.
  const familia = new Set((links ?? []).filter((l) => l.relation !== "profesional_asignado").map((l) => l.profile_id as string));
  const mensajesFamilia = (mensajes ?? [])
    .filter((m) => m.autor_id && familia.has(m.autor_id as string) && !String(m.texto).startsWith("⚠ Aviso de riesgo"))
    .slice(0, 12)
    .map((m) => ({ fecha: fechaCorta(m.created_at as string), texto: String(m.texto).slice(0, 400) }));

  const semanas = (plans ?? [])
    .slice()
    .reverse()
    .map((p) => {
      const ts = (tasks ?? []).filter((t) => t.plan_id === p.id);
      const cuenta = (e: string[]) => ts.filter((t) => e.includes(t.estado as string)).length;
      return {
        semana: `semana del ${fechaCorta(p.publish_at as string)}`,
        total: ts.length,
        hechas: cuenta(["realizado"]),
        en_parte: cuenta(["parcial"]),
        no_hechas: cuenta(["no"]),
        sin_registrar: cuenta(["pendiente", "futuro"]),
        actividades: ts.map((t) => {
          const mr = Array.isArray(t.media_resources) ? t.media_resources[0] : t.media_resources;
          const modulo = (mr as { modulo?: string } | null)?.modulo;
          return {
            dia: t.dia,
            titulo: t.titulo,
            modulo: modulo ? MODULO[modulo] : null,
            estado: ESTADO[t.estado as string] ?? t.estado,
            ayuda_que_necesito: t.comentario ?? null,
          };
        }),
        evaluacion_familia: p.family_reviewed_at
          ? { animo: ANIMO[p.week_mood as string] ?? null, favorita: p.review_favorita ?? null, preocupacion: p.review_preocupacion ?? null }
          : null,
        feedback_clinica: p.feedback_mensaje ?? null,
      };
    });

  return {
    paciente: { nombre: patient?.nombre ?? "", edad: patient?.edad ?? null, programa: patient?.modalidad ?? null },
    semanas,
    notas_clinica: (notas ?? []).map((n) => ({ fecha: fechaCorta(n.created_at as string), texto: n.texto })),
    mensajes_familia: mensajesFamilia,
    avisos_riesgo: (alertas ?? []).map((a) => ({ tipo: ALERTA[a.tipo as string] ?? a.tipo, fecha: fechaCorta(a.created_at as string), atendido: !!a.atendida_at })),
  };
}

type Datos = Awaited<ReturnType<typeof recolectar>>;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function valido(p: unknown): p is Panorama {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  const banned = /\b(verde|amarillo|rojo|sem[aá]foro|diagn[oó]stico de|demencia (leve|moderada|avanzada) confirmada)\b/i;
  if (typeof o.resumen !== "string" || o.resumen.length < 40 || o.resumen.length > 1400 || banned.test(o.resumen)) return false;
  if (!Array.isArray(o.tendencias) || !Array.isArray(o.sugerencias) || !Array.isArray(o.voz_familia)) return false;
  return true;
}

async function conGemini(d: Datos): Promise<Panorama | null> {
  if (!GEMINI_API_KEY) return null;
  const prompt = `Sos un asistente para el equipo clínico de IntegraMente (estimulación cognitiva y funcional en casa para personas mayores, Costa Rica). Una profesional va a leer esto en 30 segundos antes de armar la próxima semana de actividades del paciente.

A partir ÚNICAMENTE de los datos JSON de abajo, devolvé un objeto JSON con esta forma exacta:
{
  "resumen": "3 a 5 oraciones: cómo le ha ido en general, con cifras concretas (ej. '7 de 9 actividades hechas la última semana'), y lo más importante a tener en cuenta",
  "tendencias": [{"tipo": "positivo" | "atencion", "texto": "una observación concreta, citando semana o módulo"}],
  "voz_familia": [{"semana": "semana del ...", "texto": "cita textual o casi textual de lo que dijo la familia (evaluación, ayuda que necesitó, mensajes)"}],
  "sugerencias": ["ideas concretas para la próxima semana: qué módulos o tipo de actividad priorizar, horarios, ajustes de dificultad"],
  "datos_faltantes": ["qué información falta para evaluar mejor, si aplica"]
}

Reglas:
- No inventes nada que no esté en los datos. Si hay pocas semanas, decilo.
- Entre 2 y 5 tendencias, máximo 4 citas de la familia, entre 2 y 4 sugerencias.
- No des diagnósticos ni cambies tratamientos; son sugerencias para que la profesional decida.
- No menciones colores ni "semáforos".
- Si hay avisos de riesgo, mencionalos en el resumen.
- Español neutro profesional, conciso. Devolvé solo el JSON.

DATOS:
${JSON.stringify(d)}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const parsed = JSON.parse(text);
    if (!valido(parsed)) return null;
    const limpiar = (xs: unknown[], n: number) => xs.filter((x) => typeof x === "string" && x.trim()).slice(0, n) as string[];
    return {
      resumen: parsed.resumen.trim(),
      tendencias: (parsed.tendencias as Tendencia[])
        .filter((t) => t && (t.tipo === "positivo" || t.tipo === "atencion") && typeof t.texto === "string")
        .slice(0, 5),
      voz_familia: (parsed.voz_familia as { semana: string; texto: string }[]).filter((v) => v && typeof v.texto === "string").slice(0, 4),
      sugerencias: limpiar(parsed.sugerencias, 4),
      datos_faltantes: limpiar(parsed.datos_faltantes ?? [], 3),
    };
  } catch {
    return null;
  }
}

// Mismo contenido, armado con reglas — nunca deja la pestaña vacía.
function determinista(d: Datos): Panorama {
  const s = d.semanas;
  const nombre = d.paciente.nombre.split(" ")[0] || "El paciente";
  if (s.length === 0) {
    return {
      resumen: `${nombre} todavía no tiene semanas publicadas, así que no hay registros de actividades para resumir.`,
      tendencias: [],
      voz_familia: [],
      sugerencias: ["Armar la primera semana a partir del perfil inicial."],
      datos_faltantes: ["Registros de actividades"],
    };
  }
  const ult = s[s.length - 1];
  const pct = (w: typeof ult) => (w.total ? Math.round(((w.hechas + w.en_parte) / w.total) * 100) : 0);
  const tendencias: Tendencia[] = [];
  if (s.length >= 2) {
    const prev = s[s.length - 2];
    const diff = pct(ult) - pct(prev);
    if (diff >= 10) tendencias.push({ tipo: "positivo", texto: `Mejoró la participación: ${pct(prev)}% → ${pct(ult)}% de actividades hechas o en parte.` });
    if (diff <= -10) tendencias.push({ tipo: "atencion", texto: `Bajó la participación: ${pct(prev)}% → ${pct(ult)}% de actividades hechas o en parte.` });
  }
  const porModulo = new Map<string, { t: number; h: number }>();
  for (const w of s)
    for (const a of w.actividades) {
      if (!a.modulo) continue;
      const m = porModulo.get(a.modulo) ?? { t: 0, h: 0 };
      m.t++;
      if (a.estado === "hecha" || a.estado === "en parte") m.h++;
      porModulo.set(a.modulo, m);
    }
  const mods = [...porModulo.entries()].filter(([, v]) => v.t >= 2).map(([k, v]) => ({ k, r: v.h / v.t }));
  mods.sort((a, b) => b.r - a.r);
  if (mods[0] && mods[0].r >= 0.7) tendencias.push({ tipo: "positivo", texto: `${mods[0].k} es el módulo con mejor participación (${Math.round(mods[0].r * 100)}%).` });
  const peor = mods[mods.length - 1];
  if (peor && peor.r < 0.5 && mods.length > 1) tendencias.push({ tipo: "atencion", texto: `${peor.k} cuesta más: ${Math.round(peor.r * 100)}% de participación.` });
  const voz = s
    .flatMap((w) => [
      ...(w.evaluacion_familia?.preocupacion ? [{ semana: w.semana, texto: w.evaluacion_familia.preocupacion }] : []),
      ...(w.evaluacion_familia?.favorita ? [{ semana: w.semana, texto: `Le gustó: ${w.evaluacion_familia.favorita}` }] : []),
      ...w.actividades.filter((a) => a.ayuda_que_necesito).map((a) => ({ semana: w.semana, texto: `${a.titulo}: ${a.ayuda_que_necesito}` })),
    ])
    .slice(-4);
  const riesgo = d.avisos_riesgo.length ? ` Hubo ${d.avisos_riesgo.length} aviso(s) de riesgo en los últimos 60 días (${d.avisos_riesgo.map((a) => a.tipo).join(", ")}).` : "";
  return {
    resumen: `${nombre} lleva ${s.length} ${s.length === 1 ? "semana" : "semanas"} en el programa. En la ${ult.semana} hizo ${ult.hechas} de ${ult.total} actividades${ult.en_parte ? ` y ${ult.en_parte} en parte` : ""}${ult.sin_registrar ? `; ${ult.sin_registrar} quedaron sin registrar` : ""}.${ult.evaluacion_familia?.animo ? ` La familia describe el ánimo como ${ult.evaluacion_familia.animo} que la semana anterior.` : ""}${riesgo}`,
    tendencias,
    voz_familia: voz,
    sugerencias: [
      ...(mods[0] ? [`Mantener actividades de ${mods[0].k}, donde hay mejor respuesta.`] : []),
      ...(peor && peor.r < 0.5 && mods.length > 1 ? [`Simplificar o espaciar las actividades de ${peor.k}.`] : []),
    ],
    datos_faltantes: ult.evaluacion_familia ? [] : ["La familia todavía no envió la evaluación de la última semana."],
  };
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
  const patientId = String(payload.patientId ?? "");
  if (!patientId) return json({ error: "Falta el paciente." }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const esClinica = caller?.role === "profesional";
  if (!esClinica) {
    const { data: link } = await admin
      .from("patient_links")
      .select("profile_id")
      .eq("patient_id", patientId)
      .eq("profile_id", user.id)
      .in("relation", ["familiar_admin", "participante"])
      .maybeSingle();
    if (!link) return json({ error: "No autorizado." }, 403);
  }

  const datos = await recolectar(admin, patientId);
  const huella = await sha256(JSON.stringify(datos));
  const { data: previo } = await admin.from("resumenes_seguimiento").select("*").eq("patient_id", patientId).maybeSingle();

  if (previo && previo.huella === huella && !(esClinica && payload.forzar === true)) {
    return json(esClinica ? { ok: true, resumen: previo, actualizado: false } : { ok: true });
  }

  const llm = await conGemini(datos);
  const fila = {
    patient_id: patientId,
    contenido: llm ?? determinista(datos),
    huella,
    semanas_incluidas: datos.semanas.length,
    fuente: llm ? "llm" : "fallback",
    generado_at: new Date().toISOString(),
  };
  await admin.from("resumenes_seguimiento").upsert(fila);
  return json(esClinica ? { ok: true, resumen: fila, actualizado: true } : { ok: true });
});
