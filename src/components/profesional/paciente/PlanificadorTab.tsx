import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { callAdminAccounts } from "../../../lib/adminAccounts";
import { moduloLabel } from "../../../lib/mediaResources";
import {
  addDays,
  defaultPublishDate,
  formatHora,
  formatWeekRange,
  fromDateInputValue,
  horaToHour,
  toDateInputValue,
  weekDays,
} from "../../../lib/planWeek";
import { Button } from "../../ui/Button";
import { TaskEditorModal, type DraftTask } from "./TaskEditorModal";
import type { PlanSummary } from "./SemanaTab";

// 7:00–20:00: the same quiet-hours window WhatsApp reminders respect.
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

interface ExistingTask {
  id: string;
  plan_id: string;
  dia: string;
  hora: string | null;
  titulo: string;
}

type EditorState = { mode: "new"; dia: string; hora: string } | { mode: "edit"; task: DraftTask } | null;

// El planificador: un calendario de la semana donde la clínica ve de un
// vistazo qué días y horas ya tienen actividades (ya publicadas o en este
// borrador) y cuáles quedan vacíos. Tocar una celda abre el editor con el
// día y la hora ya puestos. Publicar asigna el plan y avisa a la familia
// por chat, correo y WhatsApp con el mensaje de abajo.
export function PlanificadorTab({
  patientId,
  patientNombre,
  isFirstAssignment,
  hasFamiliar,
  plans,
  onPublished,
}: {
  patientId: string;
  patientNombre: string;
  isFirstAssignment: boolean;
  hasFamiliar: boolean;
  plans: PlanSummary[];
  onPublished: (message: string) => void;
}) {
  const nombre = patientNombre.split(" ")[0];
  const latest = plans[0]?.publish_at ?? null;
  const [publishDate, setPublishDate] = useState(() => defaultPublishDate(isFirstAssignment ? null : latest));
  const days = useMemo(() => weekDays(publishDate), [publishDate]);
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [editor, setEditor] = useState<EditorState>(null);
  const [mensaje, setMensaje] = useState(
    isFirstAssignment
      ? `¡Hola! Ya revisamos con cuidado el perfil de ${nombre} y armamos su programa personalizado. Esta semana empezamos suave, con actividades pensadas para sus gustos. Cualquier duda, escribinos por acá — estamos para acompañarles.`
      : `¡Hola! Ya está lista la próxima semana de ${nombre}. Tomamos en cuenta cómo les fue para ajustar las actividades. ¡Adelante!`,
  );
  const [vistaCompleta, setVistaCompleta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Lo que ya está publicado para esta misma semana (no se puede editar
  // desde acá — se muestra para no encimar actividades).
  const weekStart = days[0].date;
  const weekEnd = addDays(days[days.length - 1].date, 1);
  const { data: existing } = useQuery({
    queryKey: ["planner-existing", patientId, toDateInputValue(weekStart)],
    queryFn: async () => {
      const { data: weekPlans, error: plansError } = await supabase
        .from("plans")
        .select("id")
        .eq("patient_id", patientId)
        .eq("status", "published")
        .gte("publish_at", weekStart.toISOString())
        .lt("publish_at", weekEnd.toISOString());
      if (plansError) throw plansError;
      if (!weekPlans || weekPlans.length === 0) return [];
      const { data, error: tasksError } = await supabase
        .from("plan_tasks")
        .select("id, plan_id, dia, hora, titulo")
        .in(
          "plan_id",
          weekPlans.map((p) => p.id),
        );
      if (tasksError) throw tasksError;
      return data as ExistingTask[];
    },
  });

  const validDias = new Set(days.map((d) => d.dia));
  const draftsInWeek = drafts.filter((d) => validDias.has(d.dia));
  const countByDia = new Map<string, number>();
  for (const t of [...(existing ?? []), ...draftsInWeek]) countByDia.set(t.dia, (countByDia.get(t.dia) ?? 0) + 1);
  const diasVacios = days.filter((d) => !countByDia.get(d.dia));

  const choques = useMemo(() => {
    const seen = new Map<string, number>();
    for (const t of [...(existing ?? []), ...draftsInWeek]) {
      if (!t.hora) continue;
      const k = `${t.dia} ${t.hora}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  }, [existing, draftsInWeek]);

  function cellItems(dia: string, hour: number | null) {
    // Anything outside the visible rows (no hour, legacy free text, or an
    // early/late time) lands in the "sin hora fija" lane rather than vanishing.
    const match = (h: string | null) => {
      const hh = horaToHour(h);
      const visible = hh !== null && HOURS.includes(hh);
      return hour === null ? !visible : hh === hour;
    };
    return {
      existing: (existing ?? []).filter((t) => t.dia === dia && match(t.hora)),
      drafts: draftsInWeek.filter((t) => t.dia === dia && match(t.hora)),
    };
  }

  function upsertDraft(task: DraftTask) {
    setDrafts((prev) => (prev.some((p) => p.key === task.key) ? prev.map((p) => (p.key === task.key ? task : p)) : [...prev, task]));
    setEditor(null);
  }

  function changeWeek(value: string) {
    if (!value) return;
    setPublishDate(fromDateInputValue(value));
  }

  async function publish() {
    setError("");
    if (draftsInWeek.length === 0) {
      setError("Agregá al menos una actividad al calendario.");
      return;
    }
    if (!mensaje.trim()) {
      setError("Escribí el mensaje para la familia — es lo que reciben por chat, correo y WhatsApp.");
      return;
    }
    setSaving(true);
    const payload = draftsInWeek.map((t) => {
      const task: Record<string, unknown> = {
        dia: t.dia,
        is_today: t.dia === days[0].dia,
        hora: t.hora || null,
        titulo: t.titulo,
        tipo: t.tipo,
        duracion: t.duracion || null,
        detalle: t.detalle || null,
        precaucion: t.precaucion || null,
      };
      if (t.pasos.trim()) task.pasos = t.pasos.split("\n").map((p) => p.trim()).filter(Boolean);
      if (t.porQue.trim()) task.por_que = t.porQue.trim();
      if (t.notaClinica.trim()) task.nota_clinica = t.notaClinica.trim();
      if (t.mediaResourceId) task.media_resource_id = t.mediaResourceId;
      return task;
    });
    // First plan: the message doubles as the one-time welcome card
    // (welcome_message_pending). Later weeks: same chat message, without
    // re-triggering the welcome card.
    const { error: rpcError } = await supabase.rpc("assign_initial_plan", {
      p_patient_id: patientId,
      p_tasks: payload,
      p_vista_completa: hasFamiliar ? null : vistaCompleta,
      p_publish_at: publishDate.toISOString(),
      p_mensaje_bienvenida: isFirstAssignment ? mensaje.trim() : null,
    });
    if (rpcError) {
      setSaving(false);
      setError("No pudimos publicar el plan. Probá de nuevo.");
      return;
    }
    if (!isFirstAssignment) {
      const { data: s } = await supabase.auth.getUser();
      await supabase.from("mensajes").insert({ patient_id: patientId, texto: mensaje.trim(), autor_id: s.user?.id ?? null });
    }
    let canales = "el chat de la app";
    try {
      const res = (await callAdminAccounts("notify_plan_assigned", { patientId, mensaje: mensaje.trim(), primeraVez: isFirstAssignment })) as {
        canales?: string[];
        warning?: string;
      };
      if (res.canales?.length) canales = res.canales.join(", ");
    } catch {
      // the plan is already published; the chat message is the fallback channel
    }
    setSaving(false);
    onPublished(
      isFirstAssignment
        ? `${patientNombre} fue aceptado y su plan está publicado. Se le avisó por ${canales}.`
        : `Semana publicada para ${patientNombre}. Se le avisó por ${canales}.`,
    );
  }

  return (
    <div className="grid gap-5">
      {/* Semana */}
      <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 mb-1 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">
            {isFirstAssignment ? "Primera semana" : "Próxima semana"}
          </p>
          <h3 className="font-serif font-normal text-[24px] m-0">{formatWeekRange(days)}</h3>
          {days.length < 7 && (
            <p className="m-0 mt-1 text-[13.5px] text-tinta-tenue">
              Los planes van de domingo a domingo — esta primera semana cubre solo de {days[0].dia.toLowerCase()} a{" "}
              {days[days.length - 1].dia.toLowerCase()}.
            </p>
          )}
        </div>
        <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
          Se publica el
          <input
            type="date"
            value={toDateInputValue(publishDate)}
            min={toDateInputValue(new Date())}
            onChange={(e) => changeWeek(e.target.value)}
            className="min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta"
          />
        </label>
      </section>

      {/* Calendario */}
      <section className="bg-white border border-borde rounded-3xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-borde-suave">
          <p className="m-0 text-[14px] text-tinta-suave">
            <strong className="text-tinta">{draftsInWeek.length}</strong> nuevas ·{" "}
            <strong className="text-tinta">{days.length - diasVacios.length}</strong> de {days.length} días con actividades
          </p>
          <div className="flex items-center gap-4 text-[12.5px] text-tinta-tenue">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-verde-serenidad" /> En este plan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-beige-serenidad border border-borde" /> Ya publicada
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px]"
            style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(112px, 1fr))` }}
            role="grid"
            aria-label="Calendario de la semana"
          >
            {/* Encabezados */}
            <div className="sticky left-0 z-[1] bg-campo border-b border-borde-suave" />
            {days.map((d) => {
              const n = countByDia.get(d.dia) ?? 0;
              const hoy = toDateInputValue(d.date) === toDateInputValue(new Date());
              return (
                <div key={d.dia + d.date.toISOString()} className={`px-2.5 py-3 border-b border-l border-borde-suave text-center ${n === 0 ? "bg-aviso/60" : "bg-campo"}`}>
                  <p className={`m-0 text-[13px] font-semibold ${hoy ? "text-verde-profundo" : "text-tinta"}`}>
                    {d.dia}
                    {hoy && " · hoy"}
                  </p>
                  <p className="m-0 text-[12px] text-tinta-tenue">{d.date.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}</p>
                  <p className={`m-0 mt-1 text-[11.5px] font-semibold ${n === 0 ? "text-aviso-texto" : "text-tinta-tenue"}`}>
                    {n === 0 ? "Sin actividades" : `${n} ${n === 1 ? "actividad" : "actividades"}`}
                  </p>
                </div>
              );
            })}

            {/* Filas por hora, más "sin hora fija" */}
            {[null, ...HOURS].map((hour) => (
              <Row key={hour ?? "sin"} hour={hour}>
                {days.map((d) => {
                  const items = cellItems(d.dia, hour);
                  const empty = items.existing.length + items.drafts.length === 0;
                  return (
                    <div
                      key={d.dia + d.date.toISOString()}
                      className={`group relative border-l border-t border-borde-suave p-1 ${hour === null ? "min-h-[52px] bg-campo/50" : "min-h-[48px]"}`}
                    >
                      <div className="grid gap-1">
                        {items.existing.map((t) => (
                          <div key={t.id} title="Ya publicada" className="rounded-lg bg-beige-serenidad border border-borde px-2 py-1.5 text-[12px] leading-tight text-tinta-suave">
                            {t.hora && <span className="block text-[10.5px] text-tinta-tenue">{formatHora(t.hora)}</span>}
                            {t.titulo}
                          </div>
                        ))}
                        {items.drafts.map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setEditor({ mode: "edit", task: t })}
                            className="text-left rounded-lg bg-verde-serenidad text-white px-2 py-1.5 text-[12px] leading-tight cursor-pointer border-none hover:bg-verde-profundo font-sans"
                          >
                            {t.hora && <span className="block text-[10.5px] opacity-80">{formatHora(t.hora)}</span>}
                            <span className="font-semibold">{t.titulo}</span>
                            {t.modulo && <span className="block text-[10.5px] opacity-80">{moduloLabel[t.modulo]}</span>}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: "new", dia: d.dia, hora: hour === null ? "" : `${String(hour).padStart(2, "0")}:00` })}
                        aria-label={`Agregar actividad el ${d.dia}${hour !== null ? ` a las ${hour}:00` : " sin hora fija"}`}
                        className={`${empty ? "absolute inset-1" : "w-full mt-1 h-6"} rounded-lg border border-dashed border-transparent text-tinta-tenue text-[16px] cursor-pointer bg-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-hover:border-borde-campo hover:bg-verde-tenue transition-opacity`}
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </Row>
            ))}
          </div>
        </div>

        {(diasVacios.length > 0 || choques.length > 0) && (
          <div className="px-5 sm:px-6 py-4 border-t border-borde-suave grid gap-1.5 bg-campo/60">
            {diasVacios.length > 0 && (
              <p className="m-0 text-[13.5px] text-aviso-texto">
                <strong>Faltan actividades:</strong> {diasVacios.map((d) => d.dia).join(", ")}.
              </p>
            )}
            {choques.length > 0 && (
              <p className="m-0 text-[13.5px] text-alerta-texto">
                <strong>Dos actividades a la misma hora:</strong> {choques.join(" · ")}.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Mensaje + publicar */}
      <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="grid gap-2">
          <label htmlFor="mensaje-familia" className="text-[14px] font-semibold text-tinta">
            Mensaje para la familia
          </label>
          <textarea
            id="mensaje-familia"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border-[1.5px] border-verde-serenidad bg-verde-tenue px-4 py-3 font-sans text-[14.5px] leading-relaxed text-tinta resize-y"
          />
          <div className="flex flex-wrap gap-2">
            {["Chat de la app", "Correo", "WhatsApp"].map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-verde-profundo bg-fila-fria rounded-full px-2.5 py-1">
                ✓ {c}
              </span>
            ))}
          </div>
          {!hasFamiliar && (
            <label className="flex items-start gap-2.5 mt-2 bg-fila-fria rounded-2xl p-3.5 cursor-pointer">
              <input type="checkbox" checked={vistaCompleta} onChange={(e) => setVistaCompleta(e.target.checked)} className="mt-1" />
              <span className="text-[13.5px] leading-relaxed text-tinta">
                <strong>{patientNombre} no tiene familiar vinculado.</strong> Darle vista completa (ve todo lo que vería un familiar, no solo
                "Hoy").
              </span>
            </label>
          )}
        </div>
        <div className="grid gap-2.5">
          {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
          <Button variant="ink" fullWidth onClick={publish} disabled={saving}>
            {saving ? "Publicando…" : isFirstAssignment ? "Aceptar y publicar plan" : "Publicar semana"}
          </Button>
          <p className="m-0 text-[12.5px] leading-relaxed text-tinta-tenue text-center">
            La familia lo ve desde el {publishDate.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })}.
          </p>
        </div>
      </section>

      {editor && (
        <TaskEditorModal
          days={days}
          initial={editor.mode === "edit" ? editor.task : { dia: editor.dia, hora: editor.hora }}
          onSave={upsertDraft}
          onDelete={
            editor.mode === "edit"
              ? () => {
                  setDrafts((prev) => prev.filter((p) => p.key !== editor.task.key));
                  setEditor(null);
                }
              : undefined
          }
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

function Row({ hour, children }: { hour: number | null; children: React.ReactNode }) {
  return (
    <>
      <div className={`sticky left-0 z-[1] border-t border-borde-suave px-2 py-1.5 text-right text-[11.5px] text-tinta-tenue ${hour === null ? "bg-campo" : "bg-white"}`}>
        {hour === null ? "Sin hora fija" : `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "a.m." : "p.m."}`}
      </div>
      {children}
    </>
  );
}
