import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  estado: string;
}

type Target = { kind: "plan"; plan: PlanSummary } | { kind: "nueva"; date: Date };

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
  const queryClient = useQueryClient();
  const now = Date.now();

  // Semanas que todavía se pueden tocar: la que está en curso y las ya
  // publicadas a futuro. Agregar a una de ellas suma al MISMO plan (antes
  // se creaba un plan nuevo que tapaba al anterior en la vista familiar).
  const vigentes = useMemo(
    () =>
      plans
        .filter((p) => {
          const d = weekDays(new Date(p.publish_at));
          return addDays(d[d.length - 1].date, 1).getTime() > now;
        })
        .sort((x, y) => new Date(x.publish_at).getTime() - new Date(y.publish_at).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plans],
  );
  const latest = plans[0]?.publish_at ?? null;
  const nuevaDefault = defaultPublishDate(isFirstAssignment ? null : latest);
  const [target, setTarget] = useState<Target>(() => {
    if (isFirstAssignment) return { kind: "nueva", date: nuevaDefault };
    // Lo último que se asignó a futuro — así, al volver, se ve lo publicado.
    const futura = [...vigentes].reverse().find((p) => new Date(p.publish_at).getTime() > now);
    return futura ? { kind: "plan", plan: futura } : { kind: "nueva", date: nuevaDefault };
  });
  const publishDate = target.kind === "plan" ? new Date(target.plan.publish_at) : target.date;
  const days = useMemo(() => weekDays(publishDate), [publishDate.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [editor, setEditor] = useState<EditorState>(null);
  const [mensaje, setMensaje] = useState(
    isFirstAssignment
      ? `¡Hola! Ya revisamos con cuidado el perfil de ${nombre} y armamos su programa personalizado. Esta semana empezamos suave, con actividades pensadas para sus gustos. Cualquier duda, escribinos por acá — estamos para acompañarles.`
      : `¡Hola! Ya está lista la próxima semana de ${nombre}. Tomamos en cuenta cómo les fue para ajustar las actividades. ¡Adelante!`,
  );
  const [avisar, setAvisar] = useState(true);
  const [vistaCompleta, setVistaCompleta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quitando, setQuitando] = useState<string | null>(null);

  const planId = target.kind === "plan" ? target.plan.id : null;
  const { data: existing } = useQuery({
    queryKey: ["planner-plan-tasks", planId],
    queryFn: async () => {
      const { data, error: tasksError } = await supabase.from("plan_tasks").select("id, plan_id, dia, hora, titulo, estado").eq("plan_id", planId!);
      if (tasksError) throw tasksError;
      return data as ExistingTask[];
    },
    enabled: !!planId,
  });
  const existentes = useMemo(() => (planId ? (existing ?? []) : []), [planId, existing]);

  function elegir(t: Target) {
    setTarget(t);
    setDrafts([]);
    setError("");
    setMensaje(
      t.kind === "plan" && new Date(t.plan.publish_at).getTime() <= now
        ? `¡Hola! Agregamos actividades a la semana de ${nombre}. Ya las pueden ver en la app.`
        : isFirstAssignment
          ? mensaje
          : `¡Hola! Ya está lista la próxima semana de ${nombre}. Tomamos en cuenta cómo les fue para ajustar las actividades. ¡Adelante!`,
    );
  }

  async function quitar(taskId: string) {
    setQuitando(taskId);
    const { error: rpcError } = await supabase.rpc("quitar_tarea_plan", { p_task_id: taskId });
    setQuitando(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["planner-plan-tasks", planId] });
    queryClient.invalidateQueries({ queryKey: ["seguimiento-tasks", patientId] });
  }

  const validDias = new Set(days.map((d) => d.dia));
  const draftsInWeek = drafts.filter((d) => validDias.has(d.dia));
  const countByDia = new Map<string, number>();
  for (const t of [...existentes, ...draftsInWeek]) countByDia.set(t.dia, (countByDia.get(t.dia) ?? 0) + 1);
  const diasVacios = days.filter((d) => !countByDia.get(d.dia));

  const choques = useMemo(() => {
    const seen = new Map<string, number>();
    for (const t of [...existentes, ...draftsInWeek]) {
      if (!t.hora) continue;
      const k = `${t.dia} ${t.hora}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  }, [existentes, draftsInWeek]);

  function cellItems(dia: string, hour: number | null) {
    // Anything outside the visible rows (no hour, legacy free text, or an
    // early/late time) lands in the "sin hora fija" lane rather than vanishing.
    const match = (h: string | null) => {
      const hh = horaToHour(h);
      const visible = hh !== null && HOURS.includes(hh);
      return hour === null ? !visible : hh === hour;
    };
    return {
      existing: existentes.filter((t) => t.dia === dia && match(t.hora)),
      drafts: draftsInWeek.filter((t) => t.dia === dia && match(t.hora)),
    };
  }

  function upsertDraft(task: DraftTask) {
    setDrafts((prev) => (prev.some((p) => p.key === task.key) ? prev.map((p) => (p.key === task.key ? task : p)) : [...prev, task]));
    setEditor(null);
  }

  const visibleDesde = publishDate.getTime() > now ? publishDate : null;
  const fechaLarga = (d: Date) => d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });

  async function publish() {
    setError("");
    if (draftsInWeek.length === 0) {
      setError("Agregá al menos una actividad al calendario.");
      return;
    }
    const conMensaje = target.kind === "nueva" || avisar;
    if (conMensaje && !mensaje.trim()) {
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

    // Semana existente → se suma a ese plan. Semana nueva → plan nuevo; en
    // la primera asignación el mensaje también es la tarjeta de bienvenida.
    const { error: rpcError } =
      target.kind === "plan"
        ? await supabase.rpc("agregar_tareas_plan", { p_plan_id: target.plan.id, p_tasks: payload })
        : await supabase.rpc("assign_initial_plan", {
            p_patient_id: patientId,
            p_tasks: payload,
            p_vista_completa: hasFamiliar ? null : vistaCompleta,
            p_publish_at: target.date.toISOString(),
            p_mensaje_bienvenida: isFirstAssignment ? mensaje.trim() : null,
          });
    if (rpcError) {
      setSaving(false);
      setError("No pudimos publicar. Probá de nuevo.");
      return;
    }
    let canales = "";
    if (conMensaje) {
      if (!isFirstAssignment) {
        const { data: s } = await supabase.auth.getUser();
        await supabase.from("mensajes").insert({ patient_id: patientId, texto: mensaje.trim(), autor_id: s.user?.id ?? null });
      }
      canales = "el chat de la app";
      try {
        const res = (await callAdminAccounts("notify_plan_assigned", { patientId, mensaje: mensaje.trim(), primeraVez: isFirstAssignment })) as {
          canales?: string[];
        };
        if (res.canales?.length) canales = res.canales.join(", ");
      } catch {
        // already published; the chat message is the fallback channel
      }
    }
    queryClient.invalidateQueries({ queryKey: ["patient-plans", patientId] });
    queryClient.invalidateQueries({ queryKey: ["planner-plan-tasks", planId] });
    setSaving(false);
    const cuando = visibleDesde ? ` La familia lo verá desde el ${fechaLarga(visibleDesde)}.` : " La familia ya lo puede ver.";
    const aviso = canales ? ` Se le avisó por ${canales}.` : "";
    onPublished(
      isFirstAssignment
        ? `${patientNombre} fue aceptado y su plan está publicado.${cuando}${aviso}`
        : target.kind === "plan"
          ? `Se agregaron ${draftsInWeek.length} ${draftsInWeek.length === 1 ? "actividad" : "actividades"} a la semana de ${patientNombre}.${cuando}${aviso}`
          : `Semana publicada para ${patientNombre}.${cuando}${aviso}`,
    );
  }

  const opciones: { key: string; label: string; detalle: string; target: Target }[] = [
    ...vigentes.map((p) => {
      const enCurso = new Date(p.publish_at).getTime() <= now;
      return { key: p.id, label: enCurso ? "Esta semana" : "Próxima", detalle: formatWeekRange(weekDays(new Date(p.publish_at))), target: { kind: "plan", plan: p } as Target };
    }),
    ...(isFirstAssignment ? [] : [{ key: "nueva", label: "+ Nueva semana", detalle: formatWeekRange(weekDays(nuevaDefault)), target: { kind: "nueva", date: nuevaDefault } as Target }]),
  ];
  const activa = target.kind === "plan" ? target.plan.id : "nueva";

  return (
    <div className="grid gap-5">
      {/* Semana */}
      <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 grid gap-4">
        {opciones.length > 1 && (
          <div role="tablist" aria-label="Semana" className="flex flex-wrap gap-2">
            {opciones.map((o) => (
              <button
                key={o.key}
                type="button"
                role="tab"
                aria-selected={activa === o.key}
                onClick={() => elegir(o.target)}
                className={`text-left rounded-2xl border-[1.5px] px-4 py-2.5 cursor-pointer font-sans ${
                  activa === o.key ? "border-verde-serenidad bg-verde-tenue" : "border-borde bg-white hover:border-verde-serenidad"
                }`}
              >
                <span className="block text-[13.5px] font-semibold text-tinta">{o.label}</span>
                <span className="block text-[12px] text-tinta-tenue">{o.detalle}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="m-0 mb-1 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">
              {isFirstAssignment ? "Primera semana" : target.kind === "plan" ? "Semana publicada — agregá o quitá actividades" : "Semana nueva"}
            </p>
            <h3 className="font-serif font-normal text-[24px] m-0">{formatWeekRange(days)}</h3>
            <p className="m-0 mt-1 text-[13.5px] text-tinta-tenue">
              {visibleDesde ? `La familia la ve desde el ${fechaLarga(visibleDesde)}.` : "La familia ya la está viendo."}
              {days.length < 7 && ` Cubre de ${days[0].dia.toLowerCase()} a ${days[days.length - 1].dia.toLowerCase()} (los planes van de domingo a domingo).`}
            </p>
          </div>
          {target.kind === "nueva" && (
            <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
              Se publica el
              <input
                type="date"
                value={toDateInputValue(target.date)}
                min={toDateInputValue(new Date())}
                onChange={(e) => e.target.value && setTarget({ kind: "nueva", date: fromDateInputValue(e.target.value) })}
                className="min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta"
              />
            </label>
          )}
        </div>
      </section>

      {/* Calendario */}
      <section className="bg-white border border-borde rounded-3xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-borde-suave">
          <p className="m-0 text-[14px] text-tinta-suave">
            {existentes.length > 0 && (
              <>
                <strong className="text-tinta">{existentes.length}</strong> publicadas ·{" "}
              </>
            )}
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
                        {items.existing.map((t) => {
                          const editable = t.estado === "pendiente" || t.estado === "futuro";
                          return (
                            <div key={t.id} className="relative rounded-lg bg-beige-serenidad border border-borde px-2 py-1.5 pr-6 text-[12px] leading-tight text-tinta-suave">
                              {t.hora && <span className="block text-[10.5px] text-tinta-tenue">{formatHora(t.hora)}</span>}
                              {t.titulo}
                              {!editable && <span className="block text-[10.5px] text-[#22663f] mt-0.5">✓ registrada</span>}
                              {editable && (
                                <button
                                  type="button"
                                  onClick={() => quitar(t.id)}
                                  disabled={quitando === t.id}
                                  aria-label={`Quitar ${t.titulo}`}
                                  title="Quitar del plan"
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-tinta-tenue hover:bg-white hover:text-alerta-texto cursor-pointer border-none bg-transparent text-[13px] leading-none disabled:opacity-50"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          );
                        })}
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
          {target.kind === "plan" ? (
            <label className="flex items-center gap-2 text-[14px] font-semibold text-tinta cursor-pointer">
              <input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} />
              Avisar a la familia de los cambios
            </label>
          ) : (
            <label htmlFor="mensaje-familia" className="text-[14px] font-semibold text-tinta">
              Mensaje para la familia
            </label>
          )}
          {(target.kind === "nueva" || avisar) && (
          <textarea
            id="mensaje-familia"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border-[1.5px] border-verde-serenidad bg-verde-tenue px-4 py-3 font-sans text-[14.5px] leading-relaxed text-tinta resize-y"
          />
          )}
          {(target.kind === "nueva" || avisar) && (
          <div className="flex flex-wrap gap-2">
            {["Chat de la app", "Correo", "WhatsApp"].map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-verde-profundo bg-fila-fria rounded-full px-2.5 py-1">
                ✓ {c}
              </span>
            ))}
          </div>
          )}
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
            {saving ? "Publicando…" : isFirstAssignment ? "Aceptar y publicar plan" : target.kind === "plan" ? "Agregar a esta semana" : "Publicar semana"}
          </Button>
          <p className="m-0 text-[12.5px] leading-relaxed text-tinta-tenue text-center">
            {visibleDesde ? `La familia lo ve desde el ${fechaLarga(visibleDesde)}.` : "La familia lo ve de inmediato."}
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
