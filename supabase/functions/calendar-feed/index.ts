// Public, unauthenticated .ics feed of a patient's current weekly plan —
// deployed with --no-verify-jwt (a phone's native Calendar app can't send a
// Supabase Auth JWT, so this can't use the pattern every other function
// uses). Access control is a long random per-patient token in the query
// string instead (same shape as Google Calendar's "secret address in iCal
// format" — unguessable, not tied to a login session).
//
// Only tasks with a real "HH:MM" hora get an event: hora used to be free
// text ("9:00 a.m."), and AssignPlanModal only started writing a real
// <input type="time"> value going forward (see src/lib/usePlan.ts) — older
// plans may still have unparseable/missing values, which are silently
// skipped rather than guessed at.
//
// Costa Rica has no DST (always UTC-6), so times are converted to UTC with
// a fixed offset — no VTIMEZONE block needed for correctness.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DIAS_BY_WEEKDAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CR_OFFSET_HOURS = 6; // America/Costa_Rica, fixed year-round (no DST)

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// RFC 5545: lines over 75 octets must be folded with a CRLF + leading
// space (the leading space itself counts toward the 75-octet limit of the
// continuation line). Folds on Unicode codepoints, not UTF-16 code units,
// so it never splits a multi-byte character (á, é, ñ, etc.) in half.
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  let out = "";
  let current = "";
  let currentBytes = 0;
  let isFirst = true;
  for (const ch of line) {
    const chBytes = encoder.encode(ch).length;
    const limit = isFirst ? 75 : 74;
    if (currentBytes + chBytes > limit) {
      out += (isFirst ? "" : "\r\n ") + current;
      isFirst = false;
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += chBytes;
  }
  out += (isFirst ? "" : "\r\n ") + current;
  return out;
}

function formatUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Parses a free-text "duración" like "15 min" / "20 minutos" — best effort,
// defaults to 30 when nothing recognizable is found. Only affects DTEND
// (how long the event blocks on the calendar), never whether an alert
// fires, so a wrong guess here is low-stakes.
function parseDurationMinutes(duracion: string | null): number {
  if (!duracion) return 30;
  const match = /(\d+)\s*(min|m\b)/i.exec(duracion);
  if (match) return parseInt(match[1], 10);
  const hourMatch = /(\d+)\s*(h|hora)/i.exec(duracion);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  return 30;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response("Enlace inválido.", { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id, nombre")
    .eq("calendar_feed_token", token)
    .maybeSingle();
  if (patientError || !patient) {
    return new Response("Enlace inválido o vencido.", { status: 404 });
  }

  const { data: plan } = await admin
    .from("plans")
    .select("id, publish_at")
    .eq("patient_id", patient.id)
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const events: string[] = [];

  if (plan) {
    const { data: tasks } = await admin
      .from("plan_tasks")
      .select("id, dia, hora, titulo, detalle, duracion")
      .eq("plan_id", plan.id);

    // publish_at is stored as the UTC instant for CR-local midnight on the
    // chosen date (AssignPlanModal builds it as `new Date(\`${date}T00:00:00\`)`
    // in a UTC-6 browser, i.e. 06:00 UTC) — so its UTC calendar date/weekday
    // already matches the CR-intended one. Using the UTC* accessors
    // throughout (rather than the runtime-timezone-dependent local ones)
    // keeps this correct regardless of what timezone the function happens
    // to run in.
    const publishDate = new Date(plan.publish_at);
    const publishWeekday = publishDate.getUTCDay();

    for (const task of tasks ?? []) {
      const horaMatch = /^(\d{2}):(\d{2})$/.exec(task.hora ?? "");
      if (!horaMatch) continue; // no real time set — nothing to schedule
      const targetWeekday = DIAS_BY_WEEKDAY.indexOf(task.dia);
      if (targetWeekday < 0) continue;

      const offsetDays = (targetWeekday - publishWeekday + 7) % 7;
      // Target CR calendar date at the task's wall-clock hour, shifted by
      // the fixed +6h CR→UTC offset (no DST to worry about).
      const eventUtc = new Date(
        Date.UTC(
          publishDate.getUTCFullYear(),
          publishDate.getUTCMonth(),
          publishDate.getUTCDate() + offsetDays,
          parseInt(horaMatch[1], 10) + CR_OFFSET_HOURS,
          parseInt(horaMatch[2], 10),
          0,
          0,
        ),
      );
      const endUtc = new Date(eventUtc.getTime() + parseDurationMinutes(task.duracion) * 60 * 1000);

      events.push(
        [
          "BEGIN:VEVENT",
          foldLine(`UID:${task.id}@integramentecr.com`),
          `DTSTAMP:${formatUtcStamp(new Date())}`,
          `DTSTART:${formatUtcStamp(eventUtc)}`,
          `DTEND:${formatUtcStamp(endUtc)}`,
          foldLine(`SUMMARY:${icsEscape(task.titulo)}`),
          ...(task.detalle ? [foldLine(`DESCRIPTION:${icsEscape(task.detalle)}`)] : []),
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          foldLine(`DESCRIPTION:Es hora de: ${icsEscape(task.titulo)}`),
          "TRIGGER:PT0M",
          "END:VALARM",
          "END:VEVENT",
        ].join("\r\n"),
      );
    }
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IntegraMente en Casa//Plan Semanal//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:Plan de ${icsEscape(patient.nombre)} — IntegraMente en Casa`),
    "X-WR-TIMEZONE:America/Costa_Rica",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="plan-integramente.ics"',
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
