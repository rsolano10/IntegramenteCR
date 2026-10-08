import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../lib/useSession";
import { addDays, formatHora, weekDays } from "../../../lib/planWeek";
import { Button } from "../../ui/Button";
import { SemanaDetalle } from "./SemanaTab";
import { estadoMeta, moodMeta, weekStats, type PlanSummary, type TaskRow } from "../../../lib/seguimiento";

interface Panorama {
  resumen: string;
  tendencias: { tipo: "positivo" | "atencion"; texto: string }[];
  voz_familia: { semana: string; texto: string }[];
  sugerencias: string[];
  datos_faltantes: string[];
}
interface ResumenRow {
  contenido: Panorama;
  semanas_incluidas: number;
  fuente: "llm" | "fallback";
  generado_at: string;
}
interface Nota {
  id: string;
  texto: string;
  autor_id: string | null;
  created_at: string;
  plan_id: string | null;
}

type Fase = "proxima" | "en_curso" | "completada";

function faseDe(plan: PlanSummary, tasks: TaskRow[], now: number): Fase {
  const start = new Date(plan.publish_at);
  if (start.getTime() > now) return "proxima";
  const days = weekDays(start);
  const end = addDays(days[days.length - 1].date, 1).getTime();
  const s = weekStats(tasks);
  if (now < end && !(s.total > 0 && s.abiertas === 0)) return "en_curso";
  return "completada";
}

function rango(plan: PlanSummary) {
  const days = weekDays(new Date(plan.publish_at));
  const f = (d: Date) => d.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
  return `${f(days[0].date)} – ${f(days[days.length - 1].date)}`;
}

function haceCuanto(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `el ${new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" })}`;
}

// Seguimiento: todo lo que la profesional necesita para entrar en contexto
// antes de asignar — el panorama con IA arriba, las dos semanas que
// importan ahora (la última terminada y la que está en curso), la
// evolución semana a semana, el historial completo y sus propias notas.
export function SeguimientoTab({
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
  const planIds = plans.map((p) => p.id);
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["seguimiento-tasks", patientId, planIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_tasks")
        .select("id, plan_id, dia, hora, titulo, estado, comentario, sort_order, media_resources(modulo)")
        .in("plan_id", planIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t) => {
        const mr = (Array.isArray(t.media_resources) ? t.media_resources[0] : t.media_resources) as { modulo?: string } | null;
        return { ...t, modulo: mr?.modulo ?? null } as TaskRow;
      });
    },
    enabled: planIds.length > 0,
  });

  const now = Date.now();
  const semanas = useMemo(
    () =>
      plans
        .map((p) => {
          const ts = (tasks ?? []).filter((t) => t.plan_id === p.id);
          return { plan: p, tasks: ts, fase: faseDe(p, ts, now), stats: weekStats(ts) };
        })
        .sort((a, b) => new Date(b.plan.publish_at).getTime() - new Date(a.plan.publish_at).getTime()),
    [plans, tasks, now],
  );
  const enCurso = semanas.find((s) => s.fase === "en_curso");
  const proxima = [...semanas].reverse().find((s) => s.fase === "proxima");
  const ultimaCompleta = semanas.find((s) => s.fase === "completada");
  const completadas = semanas.filter((s) => s.fase !== "proxima");

  if (loadingPlans || (planIds.length > 0 && loadingTasks)) {
    return <div className="bg-white border border-borde rounded-3xl p-8 text-center text-tinta-tenue">Cargando…</div>;
  }
  if (plans.length === 0) {
    return (
      <div className="bg-white border border-borde rounded-3xl p-8 text-center">
        <p className="m-0 mb-4 text-[15px] text-tinta-suave">Todavía no hay semanas publicadas para este paciente.</p>
        <Button variant="ink" dense onClick={onPlanNext}>
          Armar la primera semana
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div className="grid gap-6 min-w-0">
        <PanoramaIA patientId={patientId} />

        <div className="grid gap-4 md:grid-cols-2">
          <TarjetaSemanaActual semana={enCurso} proxima={proxima} onPlanNext={onPlanNext} />
          <TarjetaUltimaCompleta semana={ultimaCompleta} />
        </div>

        {completadas.length >= 2 && <Evolucion semanas={[...completadas].reverse()} />}

        <Historial semanas={semanas} patientId={patientId} patientNombre={patientNombre} destacadaId={ultimaCompleta?.plan.id} />
      </div>

      <aside className="xl:sticky xl:top-24 grid gap-4">
        <NotasClinicas patientId={patientId} planActualId={(enCurso ?? ultimaCompleta)?.plan.id ?? null} semanas={semanas.map((s) => s.plan)} />
      </aside>
    </div>
  );
}

// ─── Panorama con IA ────────────────────────────────────────────────────
function PanoramaIA({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Lo guardado se muestra al instante; en paralelo se le pide a la
  // función que lo actualice si los datos cambiaron (no llama al modelo si
  // nada cambió).
  const { data: guardado, isPending } = useQuery({
    queryKey: ["panorama", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("resumenes_seguimiento")
        .select("contenido, semanas_incluidas, fuente, generado_at")
        .eq("patient_id", patientId)
        .maybeSingle();
      return (data ?? null) as ResumenRow | null;
    },
  });

  async function actualizar(forzar: boolean) {
    setError(false);
    setRefreshing(true);
    const { data, error: fnError } = await supabase.functions.invoke<{ resumen?: ResumenRow }>("seguimiento-ia", { body: { patientId, forzar } });
    setRefreshing(false);
    if (fnError || !data?.resumen) {
      setError(true);
      return;
    }
    queryClient.setQueryData(["panorama", patientId], data.resumen);
  }

  useEffect(() => {
    actualizar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const p = guardado?.contenido;
  const positivos = p?.tendencias.filter((t) => t.tipo === "positivo") ?? [];
  const atencion = p?.tendencias.filter((t) => t.tipo === "atencion") ?? [];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-verde-profundo text-white">
      <div aria-hidden="true" className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-verde-serenidad/35" />
      <div aria-hidden="true" className="absolute right-20 -bottom-28 w-56 h-56 rounded-full bg-mostaza-vital/15" />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold tracking-wide">
              <span aria-hidden="true">✦</span> Panorama del caso · IA
            </span>
            {guardado && (
              <span className="text-[12.5px] text-[#c4dbdb]">
                {guardado.semanas_incluidas} {guardado.semanas_incluidas === 1 ? "semana analizada" : "semanas analizadas"} · actualizado{" "}
                {haceCuanto(guardado.generado_at)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => actualizar(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 cursor-pointer border-none disabled:opacity-60"
          >
            <span aria-hidden="true" className={refreshing ? "inline-block animate-spin" : ""}>↻</span>
            {refreshing ? "Analizando…" : "Actualizar"}
          </button>
        </div>

        {!p && (isPending || refreshing) && (
          <div className="grid gap-2.5 py-2" aria-label="Generando el panorama">
            {[92, 80, 65].map((w) => (
              <span key={w} className="h-3.5 rounded-full bg-white/15 animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {!p && !isPending && !refreshing && (
          <p className="m-0 text-[15px] text-[#c4dbdb]">{error ? "No pudimos generar el panorama ahora. Probá con Actualizar." : "Todavía no hay panorama."}</p>
        )}

        {p && (
          <>
            <p className="m-0 font-serif text-[19px] sm:text-[21px] leading-[1.45] text-white">{p.resumen}</p>

            {(positivos.length > 0 || atencion.length > 0 || p.sugerencias.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-3 mt-5">
                <Columna titulo="Va bien" icono="↗" items={positivos.map((t) => t.texto)} />
                <Columna titulo="Para observar" icono="!" items={atencion.map((t) => t.texto)} tono="atencion" />
                <Columna titulo="Antes de asignar" icono="→" items={p.sugerencias} />
              </div>
            )}

            {p.voz_familia.length > 0 && (
              <div className="mt-5">
                <p className="m-0 mb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-[#c4dbdb] font-semibold">Lo que dice la familia</p>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                  {p.voz_familia.map((v, i) => (
                    <figure key={i} className="m-0 snap-start shrink-0 w-[260px] rounded-2xl bg-white text-tinta p-4">
                      <blockquote className="m-0 text-[14px] leading-relaxed">“{v.texto}”</blockquote>
                      <figcaption className="mt-2 text-[11.5px] text-tinta-tenue">{v.semana}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {p.datos_faltantes.length > 0 && (
              <p className="m-0 mt-4 text-[13px] text-[#c4dbdb]">
                <strong className="text-white/90">Falta información:</strong> {p.datos_faltantes.join(" · ")}
              </p>
            )}
            <p className="m-0 mt-4 text-[11.5px] text-white/55">
              {guardado?.fuente === "llm" ? "Generado con IA" : "Resumen automático"} a partir de los registros, evaluaciones, mensajes de la familia y tus notas. Es
              un apoyo: verificá antes de decidir.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Columna({ titulo, icono, items, tono }: { titulo: string; icono: string; items: string[]; tono?: "atencion" }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3.5">
      <p className="m-0 mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em]">
        <span aria-hidden="true" className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] ${tono === "atencion" ? "bg-mostaza-vital text-tinta" : "bg-white/20"}`}>
          {icono}
        </span>
        {titulo}
      </p>
      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-white/50">—</p>
      ) : (
        <ul className="m-0 pl-0 list-none grid gap-1.5">
          {items.map((t, i) => (
            <li key={i} className="text-[13.5px] leading-snug text-white/90">
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Las dos semanas que importan ahora ─────────────────────────────────
type SemanaInfo = { plan: PlanSummary; tasks: TaskRow[]; fase: Fase; stats: ReturnType<typeof weekStats> };

function BarraEstados({ stats, alto = "h-2.5" }: { stats: ReturnType<typeof weekStats>; alto?: string }) {
  const segs = [
    { k: "realizado" as const, n: stats.realizado },
    { k: "parcial" as const, n: stats.parcial },
    { k: "no" as const, n: stats.no },
    { k: "pendiente" as const, n: stats.abiertas },
  ].filter((s) => s.n > 0);
  return (
    <div className={`flex gap-[2px] ${alto} rounded-full overflow-hidden bg-beige-serenidad`} role="img" aria-label={`${stats.realizado} hechas, ${stats.parcial} en parte, ${stats.no} no se hicieron, ${stats.abiertas} sin registrar`}>
      {segs.map((s) => (
        <span key={s.k} style={{ flexGrow: s.n, background: estadoMeta[s.k].color }} />
      ))}
    </div>
  );
}

function TarjetaSemanaActual({ semana, proxima, onPlanNext }: { semana?: SemanaInfo; proxima?: SemanaInfo; onPlanNext: () => void }) {
  if (!semana) {
    return (
      <section className="rounded-3xl border-[1.5px] border-dashed border-borde-campo bg-campo/60 p-5 flex flex-col justify-between gap-4">
        <div>
          <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Semana en curso</p>
          <p className="m-0 mt-1.5 font-serif text-[20px] text-tinta">{proxima ? `Próxima: ${rango(proxima.plan)}` : "Sin semana en curso"}</p>
          <p className="m-0 mt-1 text-[13.5px] text-tinta-suave">
            {proxima ? `${proxima.stats.total} actividades ya publicadas para la familia.` : "La familia no tiene actividades asignadas en este momento."}
          </p>
        </div>
        {!proxima && (
          <Button variant="ink" dense onClick={onPlanNext} className="self-start">
            Armar la próxima semana
          </Button>
        )}
      </section>
    );
  }
  const s = semana.stats;
  const registradas = s.realizado + s.parcial + s.no;
  const siguientes = semana.tasks.filter((t) => t.estado === "pendiente" || t.estado === "futuro").slice(0, 3);
  return (
    <section className="rounded-3xl border-[1.5px] border-verde-serenidad bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 flex items-center gap-2 text-[11.5px] tracking-[0.14em] uppercase text-verde-profundo font-semibold">
            <span className="w-2 h-2 rounded-full bg-verde-serenidad animate-pulse" aria-hidden="true" /> En curso
          </p>
          <p className="m-0 mt-1.5 font-serif text-[20px] text-tinta">{rango(semana.plan)}</p>
        </div>
        <p className="m-0 text-right">
          <span className="font-serif text-[26px] text-tinta">{registradas}</span>
          <span className="text-[14px] text-tinta-tenue">/{s.total}</span>
          <span className="block text-[11.5px] text-tinta-tenue">registradas</span>
        </p>
      </div>
      <div className="mt-3">
        <BarraEstados stats={s} />
      </div>
      {siguientes.length > 0 && (
        <div className="mt-4">
          <p className="m-0 mb-1.5 text-[12px] font-semibold text-tinta-suave">Lo que viene</p>
          <ul className="m-0 p-0 list-none grid gap-1">
            {siguientes.map((t) => (
              <li key={t.id} className="text-[13.5px] text-tinta flex gap-2">
                <span className="text-tinta-tenue w-[104px] shrink-0 whitespace-nowrap">
                  {t.dia.slice(0, 3)}
                  {t.hora ? ` · ${formatHora(t.hora)}` : ""}
                </span>
                <span className="truncate">{t.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {proxima ? (
        <p className="m-0 mt-4 text-[12.5px] text-tinta-tenue">✓ Próxima semana ya publicada ({rango(proxima.plan)}).</p>
      ) : (
        <button type="button" onClick={onPlanNext} className="mt-4 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none p-0">
          Armar la próxima semana →
        </button>
      )}
    </section>
  );
}

function TarjetaUltimaCompleta({ semana }: { semana?: SemanaInfo }) {
  if (!semana) {
    return (
      <section className="rounded-3xl border border-borde bg-white p-5">
        <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Última semana completada</p>
        <p className="m-0 mt-2 text-[14px] text-tinta-suave">Todavía no terminó ninguna semana.</p>
      </section>
    );
  }
  const s = semana.stats;
  const pct = s.total ? Math.round(((s.realizado + s.parcial) / s.total) * 100) : 0;
  const mood = semana.plan.week_mood ? moodMeta[semana.plan.week_mood] : null;
  return (
    <section className="rounded-3xl border border-borde bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Última semana completada</p>
          <p className="m-0 mt-1.5 font-serif text-[20px] text-tinta">{rango(semana.plan)}</p>
        </div>
        <p className="m-0 text-right">
          <span className="font-serif text-[26px] text-tinta">{pct}%</span>
          <span className="block text-[11.5px] text-tinta-tenue">hechas o en parte</span>
        </p>
      </div>
      <div className="mt-3">
        <BarraEstados stats={s} />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3.5">
        {mood && <span className={`text-[12px] font-semibold rounded-full px-2.5 py-1 ${mood.tone}`}>{mood.icon} Ánimo {mood.short.toLowerCase()}</span>}
        <span className={`text-[12px] font-semibold rounded-full px-2.5 py-1 ${semana.plan.family_reviewed_at ? "bg-fila-fria text-verde-profundo" : "bg-campo text-tinta-tenue"}`}>
          {semana.plan.family_reviewed_at ? "✓ Evaluada por la familia" : "Sin evaluación de la familia"}
        </span>
        <span className={`text-[12px] font-semibold rounded-full px-2.5 py-1 ${semana.plan.reviewed_at ? "bg-fila-fria text-verde-profundo" : "bg-aviso text-aviso-texto"}`}>
          {semana.plan.reviewed_at ? "✓ Revisada" : "Falta tu revisión"}
        </span>
      </div>
      {semana.plan.review_preocupacion && (
        <p className="m-0 mt-3 text-[13.5px] leading-relaxed text-riesgo-texto bg-riesgo border border-riesgo-borde rounded-xl px-3 py-2">
          <strong>Les preocupó:</strong> “{semana.plan.review_preocupacion}”
        </p>
      )}
    </section>
  );
}

// ─── Evolución semana a semana ──────────────────────────────────────────
function Evolucion({ semanas }: { semanas: SemanaInfo[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ultimas = semanas.slice(-12);
  const max = Math.max(...ultimas.map((s) => s.stats.total), 1);
  return (
    <section className="rounded-3xl border border-borde bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Evolución</p>
          <p className="m-0 mt-1 font-serif text-[20px] text-tinta">Actividades por semana</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] text-tinta-suave" aria-hidden="true">
          {(["realizado", "parcial", "no", "pendiente"] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: estadoMeta[k].color }} />
              {estadoMeta[k].label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="flex items-end gap-2 sm:gap-3 h-[150px] border-b border-borde-suave" role="list" aria-label="Actividades por semana">
          {ultimas.map((s, i) => {
            const segs = [
              { k: "pendiente" as const, n: s.stats.abiertas },
              { k: "no" as const, n: s.stats.no },
              { k: "parcial" as const, n: s.stats.parcial },
              { k: "realizado" as const, n: s.stats.realizado },
            ];
            return (
              <div
                key={s.plan.id}
                role="listitem"
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="relative flex-1 h-full flex flex-col justify-end items-center cursor-default outline-none"
                aria-label={`Semana del ${rango(s.plan)}: ${s.stats.realizado} hechas, ${s.stats.parcial} en parte, ${s.stats.no} no se hicieron, ${s.stats.abiertas} sin registrar`}
              >
                <div className={`w-full max-w-[34px] flex flex-col gap-[2px] transition-opacity ${hover !== null && hover !== i ? "opacity-45" : ""}`} style={{ height: `${(s.stats.total / max) * 100}%` }}>
                  {segs
                    .filter((g) => g.n > 0)
                    .map((g, gi, arr) => (
                      <span
                        key={g.k}
                        style={{ flexGrow: g.n, background: estadoMeta[g.k].color }}
                        className={`${gi === 0 ? "rounded-t-[4px]" : ""} ${gi === arr.length - 1 ? "" : ""}`}
                      />
                    ))}
                </div>
                {s.plan.week_mood && (
                  <span className="absolute -top-5 text-[12px] text-tinta-suave" aria-hidden="true" title={moodMeta[s.plan.week_mood]?.label}>
                    {moodMeta[s.plan.week_mood]?.icon}
                  </span>
                )}
                {hover === i && (
                  <div className="absolute bottom-full mb-6 z-10 w-48 rounded-xl bg-tinta text-white p-3 text-[12px] leading-relaxed shadow-elevada pointer-events-none">
                    <p className="m-0 font-semibold mb-1">{rango(s.plan)}</p>
                    <p className="m-0">Hechas: {s.stats.realizado}</p>
                    <p className="m-0">En parte: {s.stats.parcial}</p>
                    <p className="m-0">No se hicieron: {s.stats.no}</p>
                    <p className="m-0">Sin registrar: {s.stats.abiertas}</p>
                    {s.plan.week_mood && <p className="m-0 mt-1">Ánimo: {moodMeta[s.plan.week_mood]?.short.toLowerCase()}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 sm:gap-3 mt-1.5">
          {ultimas.map((s) => (
            <span key={s.plan.id} className="flex-1 text-center text-[11px] text-tinta-tenue truncate">
              {new Date(s.plan.publish_at).toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
            </span>
          ))}
        </div>
      </div>
      <p className="m-0 mt-3 text-[12px] text-tinta-tenue">↗ → ↘ = ánimo según la familia. Pasá el cursor por una semana para ver el detalle.</p>
    </section>
  );
}

// ─── Historial ──────────────────────────────────────────────────────────
function Historial({ semanas, patientId, patientNombre, destacadaId }: { semanas: SemanaInfo[]; patientId: string; patientNombre: string; destacadaId?: string }) {
  const [abierta, setAbierta] = useState<string | null>(destacadaId ?? null);
  const faseLabel: Record<Fase, { t: string; c: string }> = {
    proxima: { t: "Próxima", c: "bg-verde-tenue text-verde-profundo border border-borde-suave" },
    en_curso: { t: "En curso", c: "bg-fila-fria text-verde-profundo" },
    completada: { t: "Completada", c: "bg-campo text-tinta-tenue" },
  };
  return (
    <section className="rounded-3xl border border-borde bg-white overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-3">
        <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Historial</p>
        <p className="m-0 mt-1 font-serif text-[20px] text-tinta">Todas las semanas</p>
      </div>
      {semanas.map((s) => {
        const open = abierta === s.plan.id;
        const pct = s.stats.total ? Math.round(((s.stats.realizado + s.stats.parcial) / s.stats.total) * 100) : 0;
        const mood = s.plan.week_mood ? moodMeta[s.plan.week_mood] : null;
        return (
          <div key={s.plan.id} className="border-t border-borde-suave">
            <button
              type="button"
              onClick={() => setAbierta(open ? null : s.plan.id)}
              aria-expanded={open}
              className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[150px_1fr_auto] items-center gap-3 sm:gap-5 px-5 sm:px-6 py-3.5 text-left bg-transparent border-none cursor-pointer font-sans hover:bg-campo"
            >
              <span>
                <span className="block text-[14.5px] font-semibold text-tinta">{rango(s.plan)}</span>
                <span className={`inline-block mt-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${faseLabel[s.fase].c}`}>{faseLabel[s.fase].t}</span>
              </span>
              <span className="hidden sm:flex items-center gap-3 min-w-0">
                <span className="flex-1 max-w-[220px]">
                  <BarraEstados stats={s.stats} alto="h-2" />
                </span>
                <span className="text-[12.5px] text-tinta-suave w-10">{s.fase === "proxima" ? "—" : `${pct}%`}</span>
                <span className="flex gap-1.5 text-[12px]">
                  {mood && <span title={mood.label}>{mood.icon}</span>}
                  {s.plan.review_preocupacion && <span title="La familia reportó una preocupación" className="text-riesgo-texto font-bold">!</span>}
                  {s.plan.reviewed_at && <span title="Revisada" className="text-[#22663f]">✓</span>}
                </span>
              </span>
              <span aria-hidden="true" className={`text-tinta-tenue transition-transform ${open ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>
            {open && (
              <div className="px-5 sm:px-6 pb-5">
                {s.fase === "proxima" ? (
                  <div className="grid gap-1.5">
                    {s.tasks.map((t) => (
                      <p key={t.id} className="m-0 text-[14px] text-tinta">
                        <span className="text-tinta-tenue">{t.dia}{t.hora ? ` · ${formatHora(t.hora)}` : ""} — </span>
                        {t.titulo}
                      </p>
                    ))}
                  </div>
                ) : (
                  <SemanaDetalle plan={s.plan} tasks={s.tasks} patientId={patientId} patientNombre={patientNombre} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ─── Notas de la clínica ────────────────────────────────────────────────
function NotasClinicas({ patientId, planActualId, semanas }: { patientId: string; planActualId: string | null; semanas: PlanSummary[] }) {
  const session = useSession();
  const myId = session.status === "authed" ? session.session.user.id : null;
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [asociar, setAsociar] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: notas } = useQuery({
    queryKey: ["notas-clinicas", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas_clinicas")
        .select("id, texto, autor_id, created_at, plan_id")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Nota[];
    },
  });
  const semanaDe = new Map(semanas.map((p) => [p.id, rango(p)]));

  async function guardar() {
    if (!texto.trim() || !myId) return;
    setSaving(true);
    const { error } = await supabase
      .from("notas_clinicas")
      .insert({ patient_id: patientId, texto: texto.trim(), autor_id: myId, plan_id: asociar ? planActualId : null });
    setSaving(false);
    if (error) return;
    setTexto("");
    queryClient.invalidateQueries({ queryKey: ["notas-clinicas", patientId] });
  }

  async function borrar(id: string) {
    await supabase.from("notas_clinicas").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notas-clinicas", patientId] });
  }

  return (
    <section className="rounded-3xl border border-borde bg-white p-5">
      <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Notas de la clínica</p>
      <p className="m-0 mt-1 mb-3 text-[13px] text-tinta-tenue">Solo las ve el equipo. También alimentan el panorama con IA.</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Ej.: Llamé a la familia, el cansancio del jueves coincidió con una mala noche…"
        className="w-full rounded-xl border-[1.5px] border-borde-campo bg-campo px-3 py-2.5 font-sans text-[13.5px] leading-relaxed text-tinta resize-y focus:border-verde-serenidad"
      />
      <div className="flex items-center justify-between gap-2 mt-2">
        {planActualId ? (
          <label className="flex items-center gap-1.5 text-[12.5px] text-tinta-suave cursor-pointer">
            <input type="checkbox" checked={asociar} onChange={(e) => setAsociar(e.target.checked)} />
            Sobre esta semana
          </label>
        ) : (
          <span />
        )}
        <Button variant="ink" size="sm" onClick={guardar} disabled={saving || !texto.trim()}>
          {saving ? "Guardando…" : "Guardar nota"}
        </Button>
      </div>
      <div className="grid gap-2.5 mt-4 max-h-[60vh] overflow-y-auto pr-1">
        {(notas ?? []).length === 0 && <p className="m-0 text-[13px] text-tinta-tenue">Todavía no hay notas.</p>}
        {(notas ?? []).map((n) => (
          <div key={n.id} className="rounded-xl bg-campo border border-borde-suave px-3.5 py-2.5">
            <p className="m-0 text-[13.5px] leading-relaxed text-tinta whitespace-pre-wrap">{n.texto}</p>
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <span className="text-[11.5px] text-tinta-tenue">
                {new Date(n.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
                {n.plan_id && semanaDe.get(n.plan_id) ? ` · semana ${semanaDe.get(n.plan_id)}` : ""}
              </span>
              {n.autor_id === myId && (
                <button type="button" onClick={() => borrar(n.id)} className="text-[11.5px] text-tinta-tenue underline decoration-dotted cursor-pointer bg-transparent border-none">
                  Borrar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
