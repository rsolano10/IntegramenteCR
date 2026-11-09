import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { usePlanMeta } from "../../lib/usePlan";
import { BotonWhatsApp } from "../../components/ui/BotonWhatsApp";
import { ModuloIcon } from "../../components/ui/ModuloIcon";
import { useMyPatient } from "../../lib/useMyPatient";
import { useSession } from "../../lib/useSession";
import { waEquipo } from "../../lib/whatsapp";
import { moduloLabel, moduloTheme, type ResourceModulo } from "../../lib/modulos";
import { calcularResumen, titularSemana, DIAS_SEMANA, type TareaResumen } from "../../lib/resumenSemana";
import { BotonVolver } from "../../components/ui/BotonVolver";

const animo: Record<string, { texto: string; frase: string; fondo: string; tinta: string }> = {
  better: { texto: "Mejor", frase: "El ánimo estuvo mejor esta semana. ¡Qué lindo!", fondo: "#e3efe3", tinta: "#4c7a4c" },
  same: { texto: "Igual", frase: "El ánimo se mantuvo estable.", fondo: "#f2eede", tinta: "#6b5726" },
  worse: { texto: "Más bajo", frase: "Fue una semana más difícil. Gracias por contarnos: lo tenemos en cuenta.", fondo: "#fbefeb", tinta: "#8c3f2a" },
};

interface FilaTarea {
  titulo: string;
  estado: string;
  dia: string;
  media_resources: { modulo: string | null } | { modulo: string | null }[] | null;
}

// Resumen de la semana: una celebración de lo que hicieron juntos. Arriba,
// el logro (anillo que se llena, titular que festeja y pétalos del isotipo
// cayendo); después, los números de la semana, las áreas trabajadas, lo que
// más disfrutó, el mensaje del equipo y la lista de actividades.
export function Resumen() {
  const location = useLocation();
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") ?? undefined;
  // Recién enviada la evaluación, el estado del router trae lo último; la
  // consulta de la semana lo reemplaza apenas se actualiza.
  const routerState = (location.state as { favorita?: string; preocupacion?: string } | null) ?? {};

  const { data: planMeta } = usePlanMeta(planId);
  const { data: tareas, isLoading } = useQuery({
    queryKey: ["plan-tasks-resumen", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_tasks").select("titulo, estado, dia, media_resources(modulo)").eq("plan_id", planId!);
      if (error) throw error;
      return ((data ?? []) as FilaTarea[]).map((t) => {
        const r = Array.isArray(t.media_resources) ? t.media_resources[0] : t.media_resources;
        return { titulo: t.titulo, estado: t.estado, dia: t.dia, modulo: r?.modulo ?? null } satisfies TareaResumen;
      });
    },
    enabled: !!planId,
  });

  if (isLoading) return <div className="flex-1" />;

  const r = calcularResumen(tareas ?? []);
  const { titulo, frase } = titularSemana(r.pct);
  const favorita = planMeta?.review_favorita ?? routerState.favorita;
  const preocupacion = planMeta?.review_preocupacion ?? routerState.preocupacion;
  const mood = planMeta?.week_mood ? animo[planMeta.week_mood] : null;
  const nombre = myPatient?.nombre?.split(" ")[0];
  const esPropia = session.status === "authed" && session.profile.role === "paciente";
  const semana = planMeta?.publish_at ? new Date(planMeta.publish_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" }) : null;
  const hechasLista = (tareas ?? []).filter((t) => t.estado === "realizado" || t.estado === "parcial");
  const pendientesLista = (tareas ?? []).filter((t) => t.estado === "no");

  return (
    <div className="grid gap-4">
      <BotonVolver respaldo={esPropia ? "/app/participante/hoy" : "/app/plan"} className="justify-self-start -mb-2" />

      {/* ─── El logro de la semana ─── */}
      <section
        className="relative overflow-hidden rounded-[30px] px-6 pt-7 pb-8 sm:px-9 text-white text-center"
        style={{ backgroundImage: "linear-gradient(150deg, #4f7d83 0%, #3f6a70 50%, #2a4c51 100%)" }}
        aria-label="Resumen de la semana"
      >
        <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="absolute -right-10 -top-8 w-44 opacity-[0.12] rotate-12 select-none" />
        <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="absolute -left-12 -bottom-12 w-40 opacity-[0.08] -rotate-12 select-none" />
        {r.pct >= 0.3 && <Petalos />}
        <p className="relative m-0 text-[12.5px] tracking-[0.16em] uppercase font-semibold text-[#c4dbdb]">
          Tu semana{semana ? ` del ${semana}` : ""}
        </p>
        <AnilloLogro logradas={r.logradas} total={r.total} />
        <h1 className="relative m-0 mt-5 font-serif font-normal text-[32px] sm:text-[38px] leading-tight text-white">{titulo}</h1>
        <p className="relative m-0 mt-2 mx-auto max-w-[24em] text-[16px] leading-relaxed text-white/85">
          {r.total
            ? `${esPropia ? "Hiciste" : nombre ? `${nombre} hizo` : "Hicieron"} ${r.logradas} de ${r.total} actividades. ${frase}`
            : "Esta semana no tuvo actividades registradas."}
        </p>
      </section>

      {/* ─── Los números de la semana ─── */}
      {r.total > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          <Dato valor={`${r.diasActivos}`} etiqueta={r.diasActivos === 1 ? "día activo" : "días activos"} fondo="#e3efe3" tinta="#4c7a4c">
            <span className="mt-2 flex justify-center gap-[3px]" aria-hidden="true">
              {r.activosPorDia.map((a, i) => (
                <span key={DIAS_SEMANA[i]} title={DIAS_SEMANA[i]} className={`w-[7px] h-[7px] rounded-full ${a ? "bg-semaforo-verde-texto" : "bg-[#4c7a4c]/20"}`} />
              ))}
            </span>
          </Dato>
          <Dato valor={`${r.racha}`} etiqueta={r.racha === 1 ? "día de racha" : "días seguidos"} fondo="#fbf1dc" tinta="#8a6a2a">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="mx-auto mt-1.5">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
            </svg>
          </Dato>
          <Dato valor={`${r.conAyuda}`} etiqueta={r.conAyuda === 1 ? "con ayuda" : "con ayuda"} fondo="#f5f9f9" tinta="#3f6a70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto mt-1.5">
              <path d="M7 11.5l3.2-3.2a2 2 0 0 1 2.8 0l4 4M4 14l5 5h6l5-5" />
            </svg>
          </Dato>
        </div>
      )}

      {/* ─── Lo que más disfrutó ─── */}
      {favorita && (
        <section className="relative overflow-hidden rounded-[26px] px-5 py-5 sm:px-6" style={{ backgroundImage: "linear-gradient(140deg, #fbe6bb, #f4d096)" }}>
          <svg aria-hidden="true" width="80" height="80" viewBox="0 0 24 24" className="absolute -right-3 -top-3 text-white/35" fill="currentColor">
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
          </svg>
          <p className="relative m-0 text-[12.5px] tracking-[0.14em] uppercase font-bold text-[#7a5a1f]">{esPropia ? "Lo que más disfrutaste" : "Lo que más disfrutó"}</p>
          <p className="relative m-0 mt-1.5 font-serif text-[24px] sm:text-[26px] leading-snug text-tinta">«{favorita}»</p>
        </section>
      )}

      {/* ─── Ánimo de la semana ─── */}
      {mood && (
        <p className="m-0 flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-[15px] leading-relaxed" style={{ background: mood.fondo, color: mood.tinta }}>
          <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-[13px] font-bold">Ánimo: {mood.texto}</span>
          <span className="text-tinta">{mood.frase}</span>
        </p>
      )}

      {/* ─── Áreas trabajadas ─── */}
      {r.porArea.length > 0 && (
        <section className="rounded-[26px] bg-white border border-borde px-5 py-5 sm:px-6">
          <h2 className="m-0 mb-4 font-serif font-normal text-[22px] text-tinta">Lo que trabajaron</h2>
          <ul className="list-none m-0 p-0 grid gap-3.5">
            {r.porArea.map((a) => {
              const tema = moduloTheme[a.modulo as ResourceModulo];
              const pct = a.total ? a.hechas / a.total : 0;
              return (
                <li key={a.modulo} className="flex items-center gap-3.5">
                  <span aria-hidden="true" className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ backgroundImage: tema ? `linear-gradient(140deg, ${tema.from}, ${tema.to})` : undefined }}>
                    <ModuloIcon modulo={a.modulo as ResourceModulo} className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 flex items-baseline justify-between gap-2 text-[15px]">
                      <span className="font-semibold text-tinta">{moduloLabel[a.modulo as ResourceModulo] ?? a.modulo}</span>
                      <span className="text-[13.5px] text-tinta-suave">
                        {a.hechas} de {a.total}
                      </span>
                    </p>
                    <div className="mt-1.5 h-2.5 rounded-full bg-campo overflow-hidden" role="presentation">
                      <BarraAnimada pct={pct} color={tema?.to ?? "#6a969c"} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ─── Mensaje del equipo ─── */}
      {planMeta?.feedback_mensaje ? (
        <section className="relative rounded-[26px] bg-white border border-borde px-5 py-5 sm:px-6 shadow-[0_18px_40px_-34px_rgba(31,51,56,0.7)]">
          <p className="m-0 text-[12.5px] tracking-[0.14em] uppercase font-bold text-verde-profundo">Un mensaje de tu equipo</p>
          <p className="m-0 mt-2.5 font-serif text-[20px] leading-relaxed text-tinta whitespace-pre-line">{planMeta.feedback_mensaje}</p>
          <p className="m-0 mt-4 flex items-center gap-2.5 text-[14px] font-semibold text-tinta-suave">
            <img src="/marca/isotipo.png" alt="" className="w-7 h-auto" />
            Equipo IntegraMente
          </p>
        </section>
      ) : (
        <p className="m-0 flex items-center gap-3 rounded-[20px] bg-verde-tenue border border-borde-suave px-4 py-3.5 text-[15px] leading-relaxed text-tinta-suave">
          <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="w-7 h-auto shrink-0" />
          {planMeta?.reviewed_at ? "Tu equipo ya revisó esta semana." : "Tu equipo está mirando esta semana para preparar la próxima. Pronto vas a tener su mensaje acá."}
        </p>
      )}

      {/* ─── Actividades ─── */}
      {hechasLista.length > 0 && (
        <section className="rounded-[26px] bg-white border border-borde px-5 py-5 sm:px-6">
          <h2 className="m-0 mb-3 font-serif font-normal text-[22px] text-tinta">Lo que hicieron</h2>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
            {hechasLista.map((t, i) => (
              <li key={`${t.titulo}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-fila-fria px-3 py-1.5 text-[14px] text-tinta">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="text-semaforo-verde-texto">
                  <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.titulo}
                {t.estado === "parcial" && <span className="text-[12px] text-semaforo-amarillo-texto font-semibold">· con ayuda</span>}
              </li>
            ))}
          </ul>
          {pendientesLista.length > 0 && (
            <p className="m-0 mt-4 text-[14px] leading-relaxed text-tinta-suave">
              <strong className="text-tinta">Quedaron para otra vez:</strong> {pendientesLista.map((t) => t.titulo).join(", ")}.
            </p>
          )}
        </section>
      )}

      {preocupacion && (
        <section className="rounded-[20px] bg-campo border border-borde-suave px-4 py-3.5">
          <p className="m-0 text-[13px] font-bold text-tinta-suave">Lo que nos contaste</p>
          <p className="m-0 mt-1 text-[15px] leading-relaxed text-tinta">{preocupacion}</p>
        </section>
      )}

      <BotonWhatsApp variant="outline" fullWidth href={waEquipo("Tengo una consulta sobre la semana.", myPatient?.nombre)}>
        Escribile al equipo por WhatsApp
      </BotonWhatsApp>
    </div>
  );
}

// Anillo grande que se llena al abrir y el número que sube con él.
function AnilloLogro({ logradas, total }: { logradas: number; total: number }) {
  const progreso = useProgreso();
  const pct = total ? logradas / total : 0;
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto mt-5 w-[150px] h-[150px]" role="img" aria-label={`${logradas} de ${total} actividades hechas`}>
      <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="12" />
        <circle cx="66" cy="66" r={R} fill="none" stroke="#f4d096" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${pct * progreso * C} ${C}`} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="font-serif text-[44px] leading-none">{Math.round(logradas * progreso)}</span>
        <span className="mt-1 text-[13px] font-semibold text-white/75">de {total}</span>
      </span>
    </div>
  );
}

function BarraAnimada({ pct, color }: { pct: number; color: string }) {
  const progreso = useProgreso(1100);
  return <div className="h-full rounded-full" style={{ width: `${Math.max(pct > 0 ? 4 : 0, pct * progreso * 100)}%`, background: color }} />;
}

// 0 → 1 con una curva suave al abrir la pantalla (instantáneo si el sistema
// pide menos movimiento).
function useProgreso(ms = 1400) {
  const reducido = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [p, setP] = useState(reducido ? 1 : 0);
  useEffect(() => {
    if (reducido) return;
    let raf = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / ms);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [ms, reducido]);
  return p;
}

function Dato({ valor, etiqueta, fondo, tinta, children }: { valor: string; etiqueta: string; fondo: string; tinta: string; children?: ReactNode }) {
  return (
    <div className="rounded-[20px] px-2 py-3.5 text-center" style={{ background: fondo, color: tinta }}>
      <p className="m-0 font-serif text-[30px] leading-none">{valor}</p>
      <p className="m-0 mt-1 text-[12.5px] font-semibold leading-tight">{etiqueta}</p>
      {children}
    </div>
  );
}

// Pétalos del isotipo cayendo, una sola vez (decorativo).
const PETALOS = Array.from({ length: 16 }, (_, i) => ({
  izq: (i * 37) % 100,
  color: ["#f4d096", "#ebe6ce", "#a9c7ca", "#e8b5a1"][i % 4],
  tam: 9 + ((i * 7) % 8),
  retraso: (i % 8) * 0.12,
  dur: 2.2 + ((i * 3) % 7) * 0.15,
  deriva: ((i % 2 ? 1 : -1) * (10 + ((i * 11) % 40))),
  giro: 120 + ((i * 47) % 260),
}));
function Petalos() {
  return (
    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-full pointer-events-none">
      {PETALOS.map((p, i) => (
        <span
          key={i}
          className="resumen-petalo absolute top-0"
          style={
            {
              left: `${p.izq}%`,
              width: p.tam,
              height: p.tam,
              background: p.color,
              borderRadius: "50% 50% 50% 12%",
              "--retraso": `${p.retraso}s`,
              "--dur": `${p.dur}s`,
              "--deriva": `${p.deriva}px`,
              "--giro": `${p.giro}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
