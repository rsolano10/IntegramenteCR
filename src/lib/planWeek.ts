// Week math for the clinic's planner. Plans run Sunday-to-Sunday and each
// plan_task stores only a weekday NAME (plan_tasks.dia), so a task's real
// date is always "the plan's publish date + its position in the week".
// Mirrors what the old AssignPlanModal/usePlan assumed — kept identical so
// the family side keeps reading plans exactly as before.

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function atMidnight(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// Days a plan published on `start` covers: a full Domingo→Sábado week when
// it starts on Sunday; otherwise the partial week from `start` through the
// coming Sunday (first plans, assigned mid-week).
export function weekDays(start: Date): { dia: string; date: Date }[] {
  const s = atMidnight(start);
  const startIdx = s.getDay();
  const count = startIdx === 0 ? 7 : 7 - startIdx + 1;
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(s, i);
    return { dia: DIAS[date.getDay()], date };
  });
}

export function nextSundayAfter(d: Date): Date {
  const s = atMidnight(d);
  return addDays(s, (7 - s.getDay()) % 7 || 7);
}

// First plan → today. Otherwise the Sunday after whichever is later: the
// newest published plan (could already be next week) or today.
export function defaultPublishDate(latestPublishAt: string | null): Date {
  const today = atMidnight(new Date());
  if (!latestPublishAt) return today;
  const latest = atMidnight(new Date(latestPublishAt));
  return nextSundayAfter(latest > today ? latest : today);
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromDateInputValue(v: string): Date {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

export function formatWeekRange(days: { date: Date }[]): string {
  if (days.length === 0) return "";
  const first = days[0].date;
  const last = days[days.length - 1].date;
  return `${first.toLocaleDateString("es-CR", { day: "numeric", month: "long" })} – ${last.toLocaleDateString("es-CR", { day: "numeric", month: "long" })}`;
}

// "HH:MM" → hour number; anything else (legacy free text like "9:00 a.m.")
// → null, shown in the "sin hora fija" lane.
export function horaToHour(hora: string | null | undefined): number | null {
  if (!hora) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  return m ? parseInt(m[1], 10) : null;
}

export function formatHora(hora: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!m) return hora;
  const h = parseInt(m[1], 10);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "a.m." : "p.m."}`;
}
