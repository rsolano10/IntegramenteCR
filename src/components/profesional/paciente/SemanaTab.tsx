import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { DIAS, formatHora, weekDays } from "../../../lib/planWeek";
import { Button } from "../../ui/Button";
import { estadoMeta, moodMeta, weekStats, type PlanSummary, type TaskRow } from "../../../lib/seguimiento";

export type { PlanSummary, TaskRow };

// Una semana en detalle: actividad por actividad, la evaluación de la
// familia y la revisión de la clínica. Se usa para la semana destacada y
// dentro de cada fila del historial.
export function SemanaDetalle({
  plan,
  tasks,
  patientId,
  patientNombre,
  compact = false,
}: {
  plan: PlanSummary;
  tasks: TaskRow[];
  patientId: string;
  patientNombre: string;
  compact?: boolean;
}) {
  const days = weekDays(new Date(plan.publish_at));
  const byDia = new Map<string, TaskRow[]>();
  for (const t of tasks) byDia.set(t.dia, [...(byDia.get(t.dia) ?? []), t]);
  const orden = [...new Set(days.map((d) => d.dia))];
  const extra = [...byDia.keys()].filter((d) => !orden.includes(d)).sort((a, b) => DIAS.indexOf(a) - DIAS.indexOf(b));

  return (
    <div className={`grid gap-5 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_320px] items-start"}`}>
      <div className="grid gap-3 min-w-0">
        {[...orden, ...extra].map((dia) => {
          const list = byDia.get(dia);
          if (!list) return null;
          const fecha = days.find((d) => d.dia === dia)?.date;
          return (
            <div key={dia}>
              <p className="m-0 mb-1.5 text-[12.5px] font-semibold text-tinta-suave">
                {dia}
                {fecha && <span className="font-normal text-tinta-tenue"> · {fecha.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}</span>}
              </p>
              <div className="grid gap-1.5">
                {list.map((t) => (
                  <div key={t.id} className="rounded-xl bg-campo border border-borde-suave px-3.5 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="m-0 text-[14.5px] text-tinta">
                        {t.titulo}
                        {t.hora && <span className="text-[12.5px] text-tinta-tenue"> · {formatHora(t.hora)}</span>}
                      </p>
                      <span className={`shrink-0 text-[11.5px] font-semibold rounded-full px-2 py-0.5 ${estadoMeta[t.estado].chip}`}>{estadoMeta[t.estado].label}</span>
                    </div>
                    {t.comentario && (
                      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-aviso-texto">
                        <strong>Ayuda que necesitó:</strong> {t.comentario}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && <p className="m-0 text-[14px] text-tinta-tenue">Sin actividades.</p>}
      </div>
      <div className="grid gap-3">
        <EvaluacionFamilia plan={plan} stats={weekStats(tasks)} />
        <RevisionClinica plan={plan} stats={weekStats(tasks)} patientId={patientId} patientNombre={patientNombre} />
      </div>
    </div>
  );
}

export function EvaluacionFamilia({ plan, stats }: { plan: PlanSummary; stats: ReturnType<typeof weekStats> }) {
  const mood = plan.week_mood ? moodMeta[plan.week_mood] : null;
  return (
    <section className="rounded-2xl bg-white border-[1.5px] border-verde-serenidad p-4">
      <p className="m-0 mb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-verde-profundo font-semibold">Evaluación de la familia</p>
      {plan.family_reviewed_at ? (
        <div className="grid gap-2">
          {mood && (
            <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${mood.tone}`}>
              <span aria-hidden="true" className="text-[18px] leading-none">{mood.icon}</span>
              <span className="text-[13.5px] font-semibold">Ánimo: {mood.label.toLowerCase()}</span>
            </div>
          )}
          <Quote label="Lo que más le gustó" text={plan.review_favorita} empty="No lo indicaron." />
          <Quote label="Algo que les preocupó" text={plan.review_preocupacion} empty="Nada en particular." highlight={!!plan.review_preocupacion} />
        </div>
      ) : (
        <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
          {stats.total > 0 && stats.abiertas === 0
            ? "Ya registraron todo; tienen la evaluación disponible pero todavía no la enviaron."
            : `Se habilita cuando registren ${stats.abiertas === 1 ? "la actividad que falta" : `las ${stats.abiertas} actividades que faltan`}.`}
        </p>
      )}
    </section>
  );
}

function Quote({ label, text, empty, highlight = false }: { label: string; text: string | null; empty: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 border ${highlight ? "bg-riesgo border-riesgo-borde" : "bg-campo border-borde-suave"}`}>
      <p className={`m-0 text-[11px] uppercase tracking-[0.08em] ${highlight ? "text-riesgo-texto" : "text-tinta-tenue"}`}>{label}</p>
      <p className={`m-0 mt-0.5 text-[14px] leading-relaxed ${text ? (highlight ? "text-riesgo-texto font-semibold" : "text-tinta") : "text-tinta-tenue italic"}`}>
        {text ? `“${text}”` : empty}
      </p>
    </div>
  );
}

function RevisionClinica({
  plan,
  stats,
  patientId,
  patientNombre,
}: {
  plan: PlanSummary;
  stats: ReturnType<typeof weekStats>;
  patientId: string;
  patientNombre: string;
}) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sugerido = useMemo(() => {
    const nombre = patientNombre.split(" ")[0];
    const base =
      stats.total > 0 && stats.realizado + stats.parcial >= Math.ceil(stats.total * 0.7)
        ? `¡Qué buena semana! ${nombre} hizo ${stats.realizado + stats.parcial} de ${stats.total} actividades.`
        : `Gracias por registrar la semana de ${nombre}.`;
    return `${base}${plan.review_preocupacion ? " Leímos lo que nos contaste y lo tomamos en cuenta para la próxima semana." : ""} `;
  }, [stats, plan.review_preocupacion, patientNombre]);

  useEffect(() => {
    if (!plan.reviewed_at) setFeedback(sugerido);
  }, [plan.id, plan.reviewed_at, sugerido]);

  async function markReviewed() {
    setError("");
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("review_week", { p_plan_id: plan.id, p_feedback: feedback.trim() || null });
    setSaving(false);
    if (rpcError) {
      setError("No pudimos guardar la revisión. Probá de nuevo.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["patient-plans", patientId] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["mensajes", patientId] });
  }

  return (
    <section className="rounded-2xl bg-white border border-borde p-4">
      <p className="m-0 mb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Tu revisión</p>
      {plan.reviewed_at ? (
        <div className="grid gap-2">
          <p className="m-0 text-[14px] font-semibold text-[#22663f]">
            ✓ Revisada el {new Date(plan.reviewed_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}
          </p>
          {plan.feedback_mensaje && <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave bg-campo rounded-xl p-3">{plan.feedback_mensaje}</p>}
        </div>
      ) : (
        <div className="grid gap-2.5">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            aria-label="Mensaje para la familia"
            className="w-full rounded-xl border-[1.5px] border-borde-campo bg-campo px-3 py-2.5 font-sans text-[13.5px] leading-relaxed text-tinta resize-y focus:border-verde-serenidad"
          />
          <p className="m-0 -mt-1 text-[12px] text-tinta-tenue">Le llega a la familia por el chat. Podés dejarlo vacío.</p>
          {error && <p className="m-0 text-[13px] text-alerta-texto">{error}</p>}
          <Button variant="ink" dense onClick={markReviewed} disabled={saving}>
            {saving ? "Guardando…" : "Marcar como revisada"}
          </Button>
        </div>
      )}
    </section>
  );
}
