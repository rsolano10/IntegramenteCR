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
const TEMPLATE_START = Deno.env.get("WHATSAPP_TEMPLATE_START") ?? "im_inicio_actividad";
const TEMPLATE_CLOSE = Deno.env.get("WHATSAPP_TEMPLATE_CLOSE") ?? "im_cierre_actividad";
const TEMPLATE_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "es";

const DIAS_BY_WEEKDAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CR_OFFSET_HOURS = 6; // America/Costa_Rica, fijo todo el año (sin horario de verano)
const QUIET_HOUR_START = 7;
const QUIET_HOUR_END = 20;
const DAILY_CAP = 3;
const CLOSE_BUFFER_MINUTES = 30;

const MODULO_EMOJI: Record<string, string> = {
  sentidos: "👃",
  movimiento: "🚶",
  musica: "🎵",
  reminiscencia: "📷",
};

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

function parseDurationMinutes(duracion: string | null): number {
  if (!duracion) return 30;
  const match = /(\d+)\s*(min|m\b)/i.exec(duracion);
  if (match) return parseInt(match[1], 10);
  const hourMatch = /(\d+)\s*(h|hora)/i.exec(duracion);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  return 30;
}

// Mismo cálculo que supabase/functions/calendar-feed/index.ts: a qué
// instante UTC corresponde `hora` de `dia` dentro de la semana de `plan`.
function taskEventUtc(publishDate: Date, dia: string, hora: string): Date | null {
  const horaMatch = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!horaMatch) return null;
  const targetWeekday = DIAS_BY_WEEKDAY.indexOf(dia);
  if (targetWeekday < 0) return null;
  const publishWeekday = publishDate.getUTCDay();
  const offsetDays = (targetWeekday - publishWeekday + 7) % 7;
  return new Date(
    Date.UTC(
      publishDate.getUTCFullYear(),
      publishDate.getUTCMonth(),
      publishDate.getUTCDate() + offsetDays,
      parseInt(horaMatch[1], 10) + CR_OFFSET_HOURS,
      parseInt(horaMatch[2], 10),
    ),
  );
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
    components.push({ type: "header", parameters: [{ type: "text", text: headerParam } satisfies TemplateParam] });
  }
  if (bodyParams.length > 0) {
    components.push({ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text } satisfies TemplateParam)) });
  }
  if (buttonUrlSuffix !== null) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: buttonUrlSuffix } satisfies TemplateParam],
    });
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
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

  const todayName = DIAS_BY_WEEKDAY[crWallClock.getUTCDay()];
  const tomorrowName = DIAS_BY_WEEKDAY[(crWallClock.getUTCDay() + 1) % 7];
  const crToday = new Date(Date.UTC(crWallClock.getUTCFullYear(), crWallClock.getUTCMonth(), crWallClock.getUTCDate()));
  const prepScheduledUtc = new Date(crToday.getTime() + (19 + CR_OFFSET_HOURS) * 3600 * 1000);

  // Candidatos: cuidadores (familiar_admin) con WhatsApp habilitado y
  // teléfono guardado — filtrado acá evita iterar cuentas que nunca podrían
  // recibir nada.
  const { data: links, error: linksError } = await admin
    .from("patient_links")
    .select("patient_id, profile_id, profiles!inner(nombre, whatsapp_phone, whatsapp_notifications_enabled)")
    .eq("relation", "familiar_admin")
    .eq("profiles.whatsapp_notifications_enabled", true)
    .not("profiles.whatsapp_phone", "is", null);
  if (linksError) {
    return new Response(JSON.stringify({ error: linksError.message }), { status: 500 });
  }

  for (const link of links ?? []) {
    summary.evaluated++;
    const profile = Array.isArray(link.profiles) ? link.profiles[0] : link.profiles;
    if (!profile?.whatsapp_phone) continue;
    const patientId = link.patient_id as string;
    const profileId = link.profile_id as string;
    const phone = profile.whatsapp_phone as string;

    const { data: plan } = await admin
      .from("plans")
      .select("id, publish_at, patients(nombre)")
      .eq("patient_id", patientId)
      .eq("status", "published")
      .lte("publish_at", nowUtc.toISOString())
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!plan) continue;
    const patientRow = Array.isArray(plan.patients) ? plan.patients[0] : plan.patients;
    const patientNombre = patientRow?.nombre ?? "la persona";

    const { data: answersRow } = await admin.from("onboarding_answers").select("answers").eq("patient_id", patientId).maybeSingle();
    const answers = (answersRow?.answers ?? {}) as Answers;
    const tratamiento = nombreConTratamiento(answers, patientNombre);

    const { data: tasks } = await admin
      .from("plan_tasks")
      .select("id, dia, hora, titulo, duracion, precaucion, detalle, media_resources(modulo, materiales, ciencia)")
      .eq("plan_id", plan.id)
      .order("sort_order", { ascending: true });
    if (!tasks || tasks.length === 0) continue;

    const publishDate = new Date(plan.publish_at);

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
      tipo: "prep" | "start" | "close",
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

    // --- PREP: agrupado, materiales de TODAS las tareas de mañana ---
    if (nowUtc >= prepScheduledUtc && remainingCap > 0 && !(await alreadyLogged("prep", null, crToday))) {
      const tomorrowTasks = tasks.filter((t) => t.dia === tomorrowName);
      if (tomorrowTasks.length > 0) {
        const materiales = [
          ...new Set(
            tomorrowTasks
              .map((t) => {
                const res = Array.isArray(t.media_resources) ? t.media_resources[0] : t.media_resources;
                return res?.materiales?.trim();
              })
              .filter((m): m is string => !!m),
          ),
        ];
        if (materiales.length > 0) {
          const result = await sendWhatsappTemplate(phone, TEMPLATE_PREP, null, [tratamiento, materiales.join("; ")], null);
          await logResult("prep", null, crToday, result);
        }
      }
    }

    // --- INICIO / CIERRE: solo la actividad primaria de hoy (menor hora) ---
    const todayTasks = tasks
      .filter((t) => t.dia === todayName && /^\d{2}:\d{2}$/.test(t.hora ?? ""))
      .sort((a, b) => (a.hora! < b.hora! ? -1 : 1));
    const primary = todayTasks[0];
    if (primary) {
      const eventUtc = taskEventUtc(publishDate, primary.dia, primary.hora!);
      if (eventUtc) {
        const res = Array.isArray(primary.media_resources) ? primary.media_resources[0] : primary.media_resources;
        const modulo = res?.modulo as string | undefined;
        const emoji = modulo ? MODULO_EMOJI[modulo] ?? "✨" : "✨";
        const ciencia = res?.ciencia as { gancho?: string } | null;
        const gancho = ciencia?.gancho ?? `Hoy toca "${primary.titulo}" — un paso a la vez, sin apuro.`;

        if (nowUtc >= eventUtc && remainingCap > 0 && !(await alreadyLogged("start", primary.id, eventUtc))) {
          const header = `${emoji} ${primary.titulo} con ${tratamiento}`;
          const startUrl = `/app/hoy/actividad/${primary.id}/pasos`;
          const result = await sendWhatsappTemplate(phone, TEMPLATE_START, header, [gancho], startUrl);
          await logResult("start", primary.id, eventUtc, result);
        }

        const closeUtc = new Date(eventUtc.getTime() + (parseDurationMinutes(primary.duracion) + CLOSE_BUFFER_MINUTES) * 60 * 1000);
        if (nowUtc >= closeUtc && remainingCap > 0 && !(await alreadyLogged("close", primary.id, closeUtc))) {
          const closeUrl = `/app/hoy/actividad/${primary.id}`;
          const result = await sendWhatsappTemplate(phone, TEMPLATE_CLOSE, null, [tratamiento], closeUrl);
          await logResult("close", primary.id, closeUtc, result);
        }
      }
    }
  }

  return new Response(JSON.stringify(summary), { status: 200, headers: { "Content-Type": "application/json" } });
});
