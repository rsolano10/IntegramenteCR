// Envía los 3 recordatorios de WhatsApp por actividad (preparación la noche
// anterior, inicio, cierre) — ver el plan de la sesión. Invocado por
// pg_cron cada 10 minutos vía pg_net (no por un usuario), autenticado con
// un secreto compartido en vez de un JWT.
//
// Si WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID no están configurados
// todavía (falta terminar el alta en Meta Business), esta función sigue
// corriendo y registrando en notifications_log con status
// "skipped_not_configured" — así todo lo demás (horarios, tope diario,
// horas de silencio, contenido del mensaje) es verificable sin esperar el
// token real.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
// El dominio base va en la plantilla de Meta (botón URL con {{1}} de
// sufijo) — acá solo se manda la ruta, ver sendWhatsappTemplate().
const TEMPLATE_PREP = Deno.env.get("WHATSAPP_TEMPLATE_PREP") ?? "im_prep_actividad";
// im_recordatorio_actividad (Utilidad): «hoy a las {{1}} está programada la
// actividad «{{2}}» con {{3}}». Sin la frase de la ciencia: con ella Meta
// clasificó la versión anterior (im_inicio_actividad) como Marketing.
const TEMPLATE_START = Deno.env.get("WHATSAPP_TEMPLATE_START") ?? "im_recordatorio_actividad";
const TEMPLATE_CLOSE = Deno.env.get("WHATSAPP_TEMPLATE_CLOSE") ?? "im_cierre_actividad";
const TEMPLATE_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "es";

const DIAS_BY_WEEKDAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CR_OFFSET_HOURS = 6; // America/Costa_Rica, fijo todo el año (sin horario de verano)
const QUIET_HOUR_START = 7;
// Hasta las 9 p.m. (antes 8): el planificador permite actividades a las
// 8 p.m. y también deben tener su recordatorio.
const QUIET_HOUR_END = 21;
// El recordatorio de inicio solo sale cerca de la hora: si la semana se
// publica tarde o el envío se atrasa, nunca «hoy a las 8:00» a las 5 p.m.
const VENTANA_INICIO_MIN = 60;
// Aviso de semana publicada (sale el día en que empieza la semana).
const TEMPLATE_SEMANA = Deno.env.get("WHATSAPP_TEMPLATE_PROGRAMA_LISTO") ?? "im_semana_publicada";
const DAILY_CAP = 3;
const CLOSE_BUFFER_MINUTES = 30;
// El mensaje de cierre («¿Cómo les fue hoy…?») está apagado desde 2026-11-25
// para bajar costos (cada plantilla entregada se cobra). Se reactiva con el
// secreto WHATSAPP_ENVIAR_CIERRE=1, sin cambiar código.
const ENVIAR_CIERRE = Deno.env.get("WHATSAPP_ENVIAR_CIERRE") === "1";

// Duplicado a propósito de src/lib/respondentVoice.ts / generate-summary —
// este runtime Deno no puede importar del bundle de la app (mismo patrón
// ya usado en supabase/functions/generate-summary/index.ts).
type Answers = Record<string, string | string[]>;
function nombreConTratamiento(a: Answers, fallback: string): string {
  const nombre = typeof a.nombre_participante === "string" ? a.nombre_participante.trim() : "";
  if (!nombre) return fallback;
  if (a.tratamiento_preferido === "don_dona") {
    const genero = a.tratamiento_genero === "dona" ? "doña" : "don";
    return `${genero} ${nombre}`;
  }
  return nombre;
}

// Fecha real (AAAA-MM-DD, Costa Rica) de un día de un plan: inicio del plan
// + días hasta ese nombre de día (igual que src/lib/planWeek.ts).
function fechaDeTarea(publishAt: string, dia: string): string | null {
  const objetivo = DIAS_BY_WEEKDAY.indexOf(dia);
  if (objetivo < 0) return null;
  const inicio = new Date(new Date(publishAt).getTime() - CR_OFFSET_HOURS * 3600 * 1000);
  const offset = (objetivo - inicio.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate() + offset)).toISOString().slice(0, 10);
}

// «24 al 29 de noviembre»: los días que cubre un plan.
function rangoDeSemana(publishAt: string): string {
  const inicio = new Date(new Date(publishAt).getTime() - CR_OFFSET_HOURS * 3600 * 1000);
  const dow = inicio.getUTCDay();
  const fin = new Date(inicio.getTime() + (dow === 0 ? 6 : 7 - dow) * 86400 * 1000);
  const mes = (d: Date) => d.toLocaleDateString("es-CR", { month: "long", timeZone: "UTC" });
  const a = inicio.getUTCDate();
  const b = fin.getUTCDate();
  return mes(inicio) === mes(fin) ? `${a} al ${b} de ${mes(fin)}` : `${a} de ${mes(inicio)} al ${b} de ${mes(fin)}`;
}

// Materiales para la familia: lo esencial de cada actividad (antes de «:»,
// «(» o el primer punto), como mucho 3 cosas, en una frase.
function materialesSimples(lista: string[]): string {
  const cortos = [
    ...new Set(
      lista
        .map((m) => m.split(/[:(.\n]/)[0].trim().replace(/;$/, ""))
        .flatMap((m) => m.split(/;\s*/))
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => (m.length > 45 ? m.slice(0, 45).replace(/[\s,]+\S*$/, "") : m))
        .map((m) => m.charAt(0).toLowerCase() + m.slice(1)),
    ),
  ].slice(0, 3);
  if (cortos.length <= 1) return cortos[0] ?? "";
  return `${cortos.slice(0, -1).join(", ")} y ${cortos[cortos.length - 1]}`;
}

function parseDurationMinutes(duracion: string | null): number {
  if (!duracion) return 30;
  const match = /(\d+)\s*(min|m\b)/i.exec(duracion);
  if (match) return parseInt(match[1], 10);
  const hourMatch = /(\d+)\s*(h|hora)/i.exec(duracion);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  return 30;
}

// Meta rechaza parámetros con saltos de línea, tabulaciones, más de 4
// espacios seguidos o vacíos ("(#100) Invalid parameter"). Se limpian y
// se acortan antes de enviar.
function limpiarParam(texto: string, max: number): string {
  const limpio = texto.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  if (!limpio) return "-";
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

interface TemplateParam {
  type: "text";
  text: string;
}

async function sendWhatsappTemplate(
  to: string,
  templateName: string,
  headerParam: string | null,
  bodyParams: string[],
  buttonUrlSuffix: string | null,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: false, error: "not_configured" };
  }
  const components: Record<string, unknown>[] = [];
  if (headerParam !== null) {
    components.push({ type: "header", parameters: [{ type: "text", text: limpiarParam(headerParam, 55) } satisfies TemplateParam] });
  }
  if (bodyParams.length > 0) {
    components.push({ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text: limpiarParam(text, 700) } satisfies TemplateParam)) });
  }
  if (buttonUrlSuffix !== null) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: buttonUrlSuffix } satisfies TemplateParam],
    });
  }

  const res = await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: templateName, language: { code: TEMPLATE_LANG }, components },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
  return { ok: true, messageId: data?.messages?.[0]?.id };
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("No autorizado.", { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const nowUtc = new Date();
  // Trueco de offset fijo (igual que calendar-feed): restar 6h a "ahora UTC"
  // y leer los getters UTC da directamente la hora/fecha de pared de CR.
  const crWallClock = new Date(nowUtc.getTime() - CR_OFFSET_HOURS * 3600 * 1000);
  const crHour = crWallClock.getUTCHours();

  const summary = { evaluated: 0, sent: 0, skipped: 0, errors: 0 };

  if (crHour < QUIET_HOUR_START || crHour >= QUIET_HOUR_END) {
    return new Response(JSON.stringify({ ...summary, note: "fuera de horas de silencio" }), { status: 200 });
  }

  const crToday = new Date(Date.UTC(crWallClock.getUTCFullYear(), crWallClock.getUTCMonth(), crWallClock.getUTCDate()));
  const hoyStr = crToday.toISOString().slice(0, 10);
  const mananaStr = new Date(crToday.getTime() + 86400 * 1000).toISOString().slice(0, 10);
  const prepScheduledUtc = new Date(crToday.getTime() + (19 + CR_OFFSET_HOURS) * 3600 * 1000);

  // Candidatos: el familiar administrador y, si la persona hizo la cuenta
  // para sí misma (sin familiar), la propia persona participante. Con
  // WhatsApp habilitado y teléfono guardado.
  const { data: links, error: linksError } = await admin
    .from("patient_links")
    .select("patient_id, profile_id, relation, profiles!inner(nombre, whatsapp_phone, whatsapp_notifications_enabled)")
    .in("relation", ["familiar_admin", "participante"])
    .eq("profiles.whatsapp_notifications_enabled", true)
    .not("profiles.whatsapp_phone", "is", null);
  if (linksError) {
    return new Response(JSON.stringify({ error: linksError.message }), { status: 500 });
  }
  const conFamiliar = new Set(
    (await admin.from("patient_links").select("patient_id").eq("relation", "familiar_admin")).data?.map((l) => l.patient_id as string) ?? [],
  );

  for (const link of links ?? []) {
    // Participante solo si no hay familiar: si no, le escribimos al familiar.
    if (link.relation === "participante" && conFamiliar.has(link.patient_id as string)) continue;
    summary.evaluated++;
    const esPropia = link.relation === "participante";
    const profile = Array.isArray(link.profiles) ? link.profiles[0] : link.profiles;
    if (!profile?.whatsapp_phone) continue;
    const patientId = link.patient_id as string;
    const profileId = link.profile_id as string;
    const phone = profile.whatsapp_phone as string;
    // Solo con el permiso «whatsapp» vigente (Ley 8968; ver consentimientos).
    const { data: conWhatsapp } = await admin.rpc("consentimiento_vigente", { p_profile: profileId, p_tipo: "whatsapp" });
    if (conWhatsapp !== true) {
      summary.skipped++;
      continue;
    }

    // Los planes que pueden tener días hoy o mañana: publicados hasta mañana
    // y que empezaron hace menos de 9 días. Cada tarea se ubica por su
    // FECHA real, no por el nombre del día (así el sábado en la noche se
    // prepara el domingo de la semana nueva, no el de la semana pasada).
    const { data: plans } = await admin
      .from("plans")
      .select("id, publish_at, patients(nombre)")
      .eq("patient_id", patientId)
      .eq("status", "published")
      .lte("publish_at", new Date(nowUtc.getTime() + 2 * 86400 * 1000).toISOString())
      .gte("publish_at", new Date(nowUtc.getTime() - 9 * 86400 * 1000).toISOString())
      .order("publish_at", { ascending: true });
    if (!plans || plans.length === 0) continue;
    const patientRow = Array.isArray(plans[0].patients) ? plans[0].patients[0] : plans[0].patients;
    const patientNombre = patientRow?.nombre ?? "la persona";

    const { data: answersRow } = await admin.from("onboarding_answers").select("answers").eq("patient_id", patientId).maybeSingle();
    const answers = (answersRow?.answers ?? {}) as Answers;
    // Con quién es la actividad: «doña Rosa»; si la cuenta es de la propia persona, «vos».
    const tratamiento = esPropia ? "vos" : nombreConTratamiento(answers, patientNombre);
    const persona = nombreConTratamiento(answers, patientNombre);

    const publishPorPlan = new Map(plans.map((pl) => [pl.id as string, pl.publish_at as string]));
    const { data: tasksRaw } = await admin
      .from("plan_tasks")
      .select("id, plan_id, dia, hora, titulo, duracion, media_resources(modulo, materiales)")
      .in("plan_id", [...publishPorPlan.keys()])
      .order("sort_order", { ascending: true });
    const tasks = (tasksRaw ?? []).map((t) => ({ ...t, fecha: fechaDeTarea(publishPorPlan.get(t.plan_id as string)!, t.dia as string) }));

    // Diaria: cuánto se le ha enviado ya hoy a este destinatario.
    const { count: sentToday } = await admin
      .from("notifications_log")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("status", "sent")
      .gte("created_at", crToday.toISOString());
    let remainingCap = DAILY_CAP - (sentToday ?? 0);

    async function alreadyLogged(tipo: string, planTaskId: string | null, scheduledFor: Date): Promise<boolean> {
      let query = admin.from("notifications_log").select("id").eq("patient_id", patientId).eq("tipo", tipo).limit(1);
      query = planTaskId ? query.eq("plan_task_id", planTaskId) : query.eq("scheduled_for", scheduledFor.toISOString());
      const { data } = await query;
      return !!data && data.length > 0;
    }

    async function logResult(
      tipo: "prep" | "start" | "close" | "programa_listo",
      planTaskId: string | null,
      scheduledFor: Date,
      result: { ok: boolean; messageId?: string; error?: string },
    ) {
      const status = result.ok ? "sent" : result.error === "not_configured" ? "skipped_not_configured" : "failed";
      await admin.from("notifications_log").insert({
        patient_id: patientId,
        plan_task_id: planTaskId,
        profile_id: profileId,
        tipo,
        scheduled_for: scheduledFor.toISOString(),
        sent_at: result.ok ? new Date().toISOString() : null,
        whatsapp_message_id: result.messageId ?? null,
        status,
        error: result.error ?? null,
      });
      if (result.ok) {
        summary.sent++;
        remainingCap--;
      } else if (status === "failed") summary.errors++;
      else summary.skipped++;
    }

    // --- SEMANA PUBLICADA: el día en que empieza la semana (no al publicar,
    // que puede ser días antes y la familia todavía no la vería) ---
    for (const pl of plans) {
      const inicio = new Date(pl.publish_at as string);
      const primerDia = new Date(inicio.getTime() - CR_OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);
      if (primerDia !== hoyStr) continue;
      if (inicio > nowUtc || remainingCap <= 0 || (await alreadyLogged("programa_listo", null, inicio))) continue;
      const nombreDest = ((profile.nombre as string) ?? "").trim().split(/\s+/)[0] || "familia";
      const result = await sendWhatsappTemplate(phone, TEMPLATE_SEMANA, null, [nombreDest, persona, rangoDeSemana(pl.publish_at as string)], null);
      await logResult("programa_listo", null, inicio, result);
    }

    // --- PREP: agrupado, materiales de las actividades de mañana ---
    if (nowUtc >= prepScheduledUtc && remainingCap > 0 && !(await alreadyLogged("prep", null, crToday))) {
      const materiales = tasks
        .filter((t) => t.fecha === mananaStr)
        .map((t) => {
          const res = Array.isArray(t.media_resources) ? t.media_resources[0] : t.media_resources;
          return (res?.materiales as string | null | undefined)?.trim();
        })
        .filter((m): m is string => !!m);
      const texto = materialesSimples(materiales);
      if (texto) {
        const result = await sendWhatsappTemplate(phone, TEMPLATE_PREP, null, [tratamiento, texto], null);
        await logResult("prep", null, crToday, result);
      }
    }

    // --- INICIO (y CIERRE, si está activo): cada actividad de hoy con hora,
    // dentro del tope diario, solo en la hora siguiente a su inicio ---
    const deHoy = tasks.filter((t) => t.fecha === hoyStr && /^\d{2}:\d{2}$/.test((t.hora as string) ?? "")).sort((x, y) => ((x.hora as string) < (y.hora as string) ? -1 : 1));
    for (const t of deHoy) {
      const [hh, mm] = (t.hora as string).split(":").map(Number);
      const eventUtc = new Date(Date.UTC(crToday.getUTCFullYear(), crToday.getUTCMonth(), crToday.getUTCDate(), hh + CR_OFFSET_HOURS, mm));
      const horaLegible = `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "a.m." : "p.m."}`;
      const enVentana = nowUtc >= eventUtc && nowUtc.getTime() < eventUtc.getTime() + VENTANA_INICIO_MIN * 60 * 1000;
      if (enVentana && remainingCap > 0 && !(await alreadyLogged("start", t.id as string, eventUtc))) {
        // Sufijo del botón: la plantilla tiene "https://<dominio>/{{1}}".
        const ruta = esPropia ? `app/participante/actividad/${t.id}/pasos` : `app/hoy/actividad/${t.id}/pasos`;
        const result = await sendWhatsappTemplate(phone, TEMPLATE_START, null, [horaLegible, t.titulo as string, tratamiento], ruta);
        await logResult("start", t.id as string, eventUtc, result);
      }
      const closeUtc = new Date(eventUtc.getTime() + (parseDurationMinutes(t.duracion as string | null) + CLOSE_BUFFER_MINUTES) * 60 * 1000);
      const cierreEnVentana = nowUtc >= closeUtc && nowUtc.getTime() < closeUtc.getTime() + VENTANA_INICIO_MIN * 60 * 1000;
      if (ENVIAR_CIERRE && cierreEnVentana && remainingCap > 0 && !(await alreadyLogged("close", t.id as string, closeUtc))) {
        const result = await sendWhatsappTemplate(phone, TEMPLATE_CLOSE, null, [tratamiento], esPropia ? `app/participante/actividad/${t.id}` : `app/hoy/actividad/${t.id}`);
        await logResult("close", t.id as string, closeUtc, result);
      }
    }
  }

  return new Response(JSON.stringify(summary), { status: 200, headers: { "Content-Type": "application/json" } });
});
