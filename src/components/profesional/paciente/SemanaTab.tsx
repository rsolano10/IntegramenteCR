import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { DIAS, formatHora, weekDays, formatWeekRange } from "../../../lib/planWeek";
import { Button } from "../../ui/Button";

export interface PlanSummary {
  id: string;
  publish_at: string;
  reviewed_at: string | null;
  feedback_mensaje: string | null;
  family_reviewed_at: string | null;
  week_mood: string | null;
  review_favorita: string | null;
  review_preocupacion: string | null;
}

interface TaskRow {
  id: string;
  dia: string;
  hora: string | null;
  titulo: string;
  estado: "pendiente" | "realizado" | "parcial" | "no" | "futuro";
  comentario: string | null;
  sort_order: number;
}

const estadoMeta: Record<TaskRow["estado"], { label: string; chip: string; bar: string }> = {
  realizado: { label: "Realizada", chip: "bg-fila-fria text-semaforo-verde-texto", bar: "bg-verde-serenidad" },
  parcial: { label: "En parte", chip: "bg-aviso text-aviso-texto", bar: "bg-semaforo-amarillo" },
  no: { label: "No se hizo", chip: "bg-alerta text-alerta-texto", bar: "bg-semaforo-rojo" },
  pendiente: { label: "Sin registrar", chip: "bg-campo text-tinta-tenue border border-borde-suave", bar: "bg-borde" },
  futuro: { label: "Próximamente", chip: "bg-campo text-tinta-tenue border border-borde-suave", bar: "bg-borde" },
};

const moodMeta: Record<string, { label: string; icon: string; tone: string }> = {
  better: { label: "Mejor que la semana anterior", icon: "↗", tone: "bg-fila-fria text-semaforo-verde-texto" },
  same: { label: "Igual que la semana anterior", icon: "→", tone: "bg-campo text-tinta-suave" },
  worse: { label: "Peor que la semana anterior", icon: "↘", tone: "bg-alerta text-alerta-texto" },
};

// Revisión de la semana: lo que la familia registró actividad por actividad
// más su evaluación semanal (ánimo, favorita, preocupación) — exactamente
// lo que la clínica necesita leer antes de dar feedback y armar la próxima.
export function SemanaTab({
  patientId,
  patientNombre,
  plans,
  loadingPlans,
  onPlanNext,
}: {
  patientId: string;
  patientNombre: string;
  plans: PlanSummary[];
  loadingPlans: boolean;
  onPlanNext: () => void;
}) {
  const queryClient = useQueryClient();
  const now = Date.now();
  const visibles = useMemo(() => plans.filter((p) => new Date(p.publish_at).getTime() <= now), [plans, now]);
  const [planId, setPlanId] = useState<string | null>(null);
  const plan = visibles.find((p) => p.id === planId) ?? visibles[0] ?? null;

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["plan-tasks-review", plan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_tasks")
        .select("id, dia, hora, titulo, estado, comentario, sort_order")
        .eq("plan_id", plan!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TaskRow[];
    },
    enabled: !!plan,
  });

  const stats = useMemo(() => {
    const list = tasks ?? [];
    const by = (e: TaskRow["estado"]) => list.filter((t) => t.estado === e).length;
    const registradas = by("realizado") + by("parcial") + by("no");
    return { total: list.length, realizado: by("realizado"), parcial: by("parcial"), no: by("no"), abiertas: list.length - registradas };
  }, [tasks]);

  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Borrador sugerido a partir de lo que pasó en la semana — editable, y
  // solo como punto de partida.
  useEffect(() => {
    if (!plan || plan.reviewed_at || !tasks) return;
    const nombre = patientNombre.split(" ")[0];
    const base =
      stats.total > 0 && stats.realizado + stats.parcial >= Math.ceil(stats.total * 0.7)
        ? `¡Qué buena semana! ${nombre} completó ${stats.realizado + stats.parcial} de ${stats.total} actividades.`
        : `Gracias por registrar la semana de ${nombre}.`;
    const extra = plan.review_preocupacion ? " Leímos lo que nos contaste y lo tomamos en cuenta para la próxima semana." : "";
    setFeedback(`${base}${extra} `);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, tasks]);

  async function markReviewed() {
    if (!plan) return;
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

  if (loadingPlans) return <div className="bg-white border border-borde rounded-3xl p-8 text-center text-tinta-tenue">Cargando…</div>;
  if (!plan) {
    return (
      <div className="bg-white border border-borde rounded-3xl p-8 text-center">
        <p className="m-0 mb-4 text-[15px] text-tinta-suave">Todavía no hay una semana publicada para revisar.</p>
        <Button variant="ink" dense onClick={onPlanNext}>
          Armar una semana
        </Button>
      </div>
    );
  }

  const days = weekDays(new Date(plan.publish_at));
  const tasksByDia = new Map<string, TaskRow[]>();
  for (const t of tasks ?? []) tasksByDia.set(t.dia, [...(tasksByDia.get(t.dia) ?? []), t]);
  const ordenDias = days.map((d) => d.dia).filter((d, i, arr) => arr.indexOf(d) === i);
  const otrosDias = [...tasksByDia.keys()].filter((d) => !ordenDias.includes(d)).sort((a, b) => DIAS.indexOf(a) - DIAS.indexOf(b));
  const semanaCompleta = stats.total > 0 && stats.abiertas === 0;
  const mood = plan.week_mood ? moodMeta[plan.week_mood] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
      <div className="grid gap-5 min-w-0">
        {visibles.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {visibles.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold border cursor-pointer ${
                  p.id === plan.id ? "bg-tinta text-white border-tinta" : "bg-white text-tinta-suave border-borde hover:border-verde-serenidad"
                }`}
              >
                Semana del {new Date(p.publish_at).toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
                {!p.reviewed_at && p.id !== plan.id && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-semaforo-amarillo align-middle" />}
              </button>
            ))}
          </div>
        )}

        {/* Cómo les fue: números de la semana */}
        <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h3 className="font-serif font-normal text-[22px] m-0">Semana del {formatWeekRange(days)}</h3>
            <span className="text-[13px] text-tinta-tenue">{stats.total} actividades</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-beige-serenidad mb-4" aria-hidden="true">
            {(["realizado", "parcial", "no"] as const).map((e) =>
              stats[e] > 0 ? <span key={e} className={estadoMeta[e].bar} style={{ width: `${(stats[e] / Math.max(1, stats.total)) * 100}%` }} /> : null,
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat value={stats.realizado} label="realizadas" tone="text-semaforo-verde-texto" />
            <Stat value={stats.parcial} label="en parte" tone="text-aviso-texto" />
            <Stat value={stats.no} label="no se hicieron" tone="text-alerta-texto" />
            <Stat value={stats.abiertas} label="sin registrar" tone="text-tinta-tenue" />
          </div>
        </section>

        {/* Actividad por actividad */}
        <section className="bg-white border border-borde rounded-3xl overflow-hidden">
          <p className="m-0 px-5 sm:px-6 pt-5 pb-3 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Actividad por actividad</p>
          {loadingTasks && <p className="m-0 px-6 pb-6 text-[14px] text-tinta-tenue">Cargando…</p>}
          {[...ordenDias, ...otrosDias].map((dia) => {
            const list = tasksByDia.get(dia);
            if (!list) return null;
            const fecha = days.find((d) => d.dia === dia)?.date;
            return (
              <div key={dia} className="border-t border-borde-suave px-5 sm:px-6 py-4">
                <p className="m-0 mb-2.5 text-[13px] font-semibold text-tinta-suave">
                  {dia}
                  {fecha && <span className="font-normal text-tinta-tenue"> · {fecha.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}</span>}
                </p>
                <div className="grid gap-2">
                  {list.map((t) => (
                    <div key={t.id} className="rounded-2xl bg-campo border border-borde-suave px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="m-0 text-[15px] font-medium text-tinta">
                          {t.titulo}
                          {t.hora && <span className="text-[13px] font-normal text-tinta-tenue"> · {formatHora(t.hora)}</span>}
                        </p>
                        <span className={`shrink-0 text-[12px] font-semibold rounded-full px-2.5 py-0.5 ${estadoMeta[t.estado].chip}`}>
                          {estadoMeta[t.estado].label}
                        </span>
                      </div>
                      {t.comentario && (
                        <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-aviso-texto">
                          <strong>Ayuda que necesitó:</strong> {t.comentario}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 grid gap-4">
        {/* La evaluación de la familia — lo más importante de esta pestaña */}
        <section className="bg-white border-[1.5px] border-verde-serenidad rounded-3xl p-5 sm:p-6 shadow-elevada">
          <p className="m-0 mb-3 text-[12px] tracking-[0.14em] uppercase text-verde-profundo font-semibold">Evaluación de la familia</p>
          {plan.family_reviewed_at ? (
            <div className="grid gap-3.5">
              {mood && (
                <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${mood.tone}`}>
                  <span aria-hidden="true" className="text-[22px] leading-none">{mood.icon}</span>
                  <div>
                    <p className="m-0 text-[12px] uppercase tracking-[0.08em] opacity-80">Ánimo</p>
                    <p className="m-0 text-[15px] font-semibold">{mood.label}</p>
                  </div>
                </div>
              )}
              <ReviewQuote label="La actividad que más le gustó" text={plan.review_favorita} empty="No lo indicaron." />
              <ReviewQuote label="Algo que les preocupó" text={plan.review_preocupacion} empty="Nada en particular." highlight={!!plan.review_preocupacion} />
              <p className="m-0 text-[12.5px] text-tinta-tenue">
                Enviada el {new Date(plan.family_reviewed_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-campo border border-borde-suave p-4">
              <p className="m-0 mb-1 text-[15px] font-semibold text-tinta">Todavía no la completaron</p>
              <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
                {semanaCompleta
                  ? "Ya registraron todas las actividades, así que la familia tiene la evaluación disponible en la pestaña Semana de su app."
                  : `A la familia se le habilita cuando registre las ${stats.abiertas} actividades que faltan.`}
              </p>
            </div>
          )}
        </section>

        <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6">
          <p className="m-0 mb-3 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Tu revisión</p>
          {plan.reviewed_at ? (
            <div className="grid gap-3">
              <p className="m-0 text-[15px] font-semibold text-semaforo-verde-texto">
                ✓ Revisada el {new Date(plan.reviewed_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}
              </p>
              {plan.feedback_mensaje && (
                <p className="m-0 text-[14px] leading-relaxed text-tinta-suave bg-campo rounded-2xl p-3.5">{plan.feedback_mensaje}</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
                Mensaje para la familia
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border-[1.5px] border-borde-campo bg-campo px-3.5 py-3 font-sans text-[14px] font-normal leading-relaxed text-tinta resize-y focus:border-verde-serenidad"
                />
                <span className="text-[12.5px] font-normal text-tinta-tenue">Le llega al chat de la app. Podés dejarlo vacío.</span>
              </label>
              {error && <p className="m-0 text-[13.5px] text-alerta-texto">{error}</p>}
              <Button variant="ink" fullWidth onClick={markReviewed} disabled={saving}>
                {saving ? "Guardando…" : "Marcar semana como revisada"}
              </Button>
            </div>
          )}
          <Button variant="secondary" fullWidth onClick={onPlanNext} className="mt-2.5">
            Armar la próxima semana →
          </Button>
        </section>
      </aside>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-campo border border-borde-suave px-3.5 py-3">
      <p className={`m-0 font-serif text-[26px] leading-none ${tone}`}>{value}</p>
      <p className="m-0 mt-1 text-[12.5px] text-tinta-tenue">{label}</p>
    </div>
  );
}

function ReviewQuote({ label, text, empty, highlight = false }: { label: string; text: string | null; empty: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 border ${highlight ? "bg-riesgo border-riesgo-borde" : "bg-campo border-borde-suave"}`}>
      <p className={`m-0 text-[12px] uppercase tracking-[0.08em] ${highlight ? "text-riesgo-texto" : "text-tinta-tenue"}`}>{label}</p>
      <p className={`m-0 mt-0.5 text-[15px] leading-relaxed ${text ? (highlight ? "text-riesgo-texto font-semibold" : "text-tinta") : "text-tinta-tenue italic"}`}>
        {text ? `“${text}”` : empty}
      </p>
    </div>
  );
}
