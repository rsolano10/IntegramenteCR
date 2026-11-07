// Personalización de una semana con IA (Fase 4.5).
//
// La clínica elige una plantilla para un paciente; el planificador calcula
// en el navegador, con las mismas reglas de seguridad que usa al asignar a
// mano (src/lib/reglasRecursos.ts), qué recursos del catálogo podrían
// reemplazar a cada tarea (misma área, nivel compatible, permitido para
// este paciente). Esta función:
//   1. verifica que quien llama es de la clínica,
//   2. re-verifica en la base que cada candidato exista, esté activo, no
//      esté bloqueado y sea de la misma área que la tarea,
//   3. le pide a Gemini ajustes leves en JSON con esquema (nunca texto
//      libre, nunca actividades ni texto clínico nuevo),
//   4. valida la respuesta (_shared/validarCambiosIA.ts): si algo no cumple,
//      no se aplica nada y se avisa,
//   5. registra la ejecución completa en ia_personalizaciones.
// No publica nada: el resultado vuelve al planificador como borrador y la
// clínica decide.
import { createClient } from "npm:@supabase/supabase-js@2";
import { validarCambiosIA, maxCambiosPermitidos, type TareaIA } from "../_shared/validarCambiosIA.ts";

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

interface Entrada {
  patientId: string;
  plantillaId: string | null;
  paciente: {
    intereses: string[];
    etapas: string[];
    ruta: string | null;
    supervision: string | null;
    niveles: Record<string, string>;
    restricciones: string[];
  };
  tareas: TareaIA[];
}

const ESQUEMA = {
  type: "OBJECT",
  properties: {
    cambios: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tarea_id: { type: "STRING" },
          accion: { type: "STRING", enum: ["reemplazar", "mover"] },
          recurso_id: { type: "STRING" },
          dia_idx: { type: "INTEGER" },
          justificacion: { type: "STRING" },
        },
        required: ["tarea_id", "accion", "justificacion"],
      },
    },
  },
  required: ["cambios"],
};

function prompt(e: Entrada, max: number): string {
  return `Sos el asistente del equipo clínico de IntegraMente en Casa (estimulación cognitiva, gerontogimnasia y nutrición para personas mayores).
Tenés una semana armada desde una plantilla y el perfil de la persona. Proponé AJUSTES LEVES para que la semana se adapte a sus gustos e intereses.

Reglas obligatorias:
- Solo podés "reemplazar" una tarea por un recurso de SU lista "candidatos" (usá el id exacto), o "mover" una tarea a otro día (dia_idx: 0 = domingo, 1 = lunes … 6 = sábado).
- No inventes actividades, recursos ni texto clínico.
- Las tareas con "permitido": false NO son seguras para esta persona: reemplazalas siempre por un candidato (si no tiene candidatos, dejala y no la menciones).
- Además de esas, como máximo ${max} cambios.
- Si la semana ya se adapta bien, devolvé "cambios": [].
- Cada cambio lleva una "justificacion" corta (máximo 20 palabras), concreta y sin diagnósticos.
- Respondé solo el JSON.

PERFIL:
${JSON.stringify(e.paciente)}

SEMANA (tareas con sus candidatos):
${JSON.stringify(e.tareas.map((t) => ({ id: t.id, dia_idx: t.dia_idx, titulo: t.titulo, area: t.modulo, permitido: t.permitido, motivo: t.motivo ?? null, candidatos: t.candidatos })))}`;
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
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (caller?.role !== "profesional") return json({ error: "Solo el equipo clínico." }, 403);

  let entrada: Entrada;
  try {
    entrada = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido." }, 400);
  }
  if (!entrada?.patientId || !Array.isArray(entrada.tareas) || entrada.tareas.length === 0) return json({ error: "Faltan datos." }, 400);

  const { data: cfg } = await admin.from("config_clinica").select("max_cambios_ia_pct").eq("id", 1).single();
  const pct = cfg?.max_cambios_ia_pct ?? 30;
  const max = maxCambiosPermitidos(entrada.tareas.length, pct);

  // Re-verificar candidatos contra el catálogo real.
  const ids = [...new Set(entrada.tareas.flatMap((t) => t.candidatos.map((c) => c.id)))];
  const { data: catalogo } = ids.length
    ? await admin.from("media_resources").select("id, modulo, activo, estado_clinico").in("id", ids)
    : { data: [] as { id: string; modulo: string; activo: boolean; estado_clinico: string }[] };
  const ok = new Map((catalogo ?? []).map((r) => [r.id, r]));
  const tareas: TareaIA[] = entrada.tareas.map((t) => ({
    ...t,
    candidatos: t.candidatos
      .filter((c) => {
        const r = ok.get(c.id);
        return r && r.activo && r.estado_clinico !== "bloqueado" && r.modulo === t.modulo;
      })
      .slice(0, 15),
  }));
  const entradaLimpia = { ...entrada, tareas };

  async function registrar(estado: "ok" | "invalida" | "error", salidaRaw: string | null, resultado: unknown, error: string | null) {
    const { data } = await admin
      .from("ia_personalizaciones")
      .insert({ patient_id: entrada.patientId, plantilla_id: entrada.plantillaId, modelo: GEMINI_MODEL, entrada: { ...entradaLimpia, max_cambios: max, pct }, salida_raw: salidaRaw, resultado, estado, error, created_by: user!.id })
      .select("id")
      .single();
    return data?.id ?? null;
  }

  if (!GEMINI_API_KEY) {
    const iaId = await registrar("error", null, null, "Falta GEMINI_API_KEY.");
    return json({ estado: "error", cambios: [], aviso: "La IA no está configurada. La semana quedó igual a la plantilla.", ia_id: iaId, max, pct });
  }

  let raw = "";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(entradaLimpia, max) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000, responseMimeType: "application/json", responseSchema: ESQUEMA },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  } catch (e) {
    const iaId = await registrar("error", raw || null, null, String(e));
    return json({ estado: "error", cambios: [], aviso: "La IA no respondió. La semana quedó igual a la plantilla.", ia_id: iaId, max, pct });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const iaId = await registrar("invalida", raw, null, "No es JSON.");
    return json({ estado: "invalida", cambios: [], aviso: "La respuesta de la IA no era válida. La semana quedó igual a la plantilla.", ia_id: iaId, max, pct });
  }
  const v = validarCambiosIA(parsed, tareas, pct);
  if (!v.ok) {
    const iaId = await registrar("invalida", raw, parsed, v.error);
    return json({ estado: "invalida", cambios: [], aviso: `La propuesta de la IA no cumplió las reglas (${v.error}). La semana quedó igual a la plantilla.`, ia_id: iaId, max, pct });
  }
  const iaId = await registrar("ok", raw, { cambios: v.cambios }, null);
  return json({ estado: "ok", cambios: v.cambios, aviso: null, ia_id: iaId, max, pct });
});
