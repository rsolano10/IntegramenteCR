import { Link } from "react-router-dom";
import type { PlanTask } from "../../lib/mockData";
import { estaRegistrada, minutosDe, ordenarDelDia } from "../../lib/hoyDelDia";
import { moduloLabel, moduloTheme } from "../../lib/modulos";
import { ModuloIcon } from "../ui/ModuloIcon";
import { ClockIcon } from "../ui/Icons";
import type { SiguienteDia } from "../../lib/siguienteDia";

// Pantalla "Hoy" (familia y participante). Pocas actividades por día (no más
// de 8): en vez de una lista plana, el día se cuenta como una línea de
// tiempo por momento del día, con el progreso y la próxima actividad arriba.
// `size="large"` es la escala de la vista del participante (letra y toques
// más grandes, menos texto).

export type HoySize = "compact" | "large";


const TEMA_SIN_MODULO = { from: "#a9c5c8", to: "#3f6a70", chip: "bg-verde-profundo/85", ink: "#3f6a70" };
const temaDe = (t: PlanTask) => (t.modulo ? moduloTheme[t.modulo] : TEMA_SIN_MODULO);


export type Momento = "manana" | "tarde" | "noche" | "sin_hora";
const MOMENTOS: { id: Momento; label: string }[] = [
  { id: "manana", label: "Mañana" },
  { id: "tarde", label: "Tarde" },
  { id: "noche", label: "Noche" },
  { id: "sin_hora", label: "En cualquier momento" },
];

function momentoDe(t: PlanTask): Momento {
  const min = t.hora ? minutosDe(t.hora) : null;
  if (min === null) return "sin_hora";
  if (min < 12 * 60) return "manana";
  if (min < 18 * 60) return "tarde";
  return "noche";
}


const estadoTexto: Record<HoySize, Partial<Record<PlanTask["estado"], string>>> = {
  compact: { realizado: "Realizada", parcial: "En parte", no: "No se realizó" },
  large: { realizado: "Hecho", parcial: "Con ayuda", no: "No pude" },
};

// ─── Progreso del día ───

function Anillo({ hechas, total, size }: { hechas: number; total: number; size: HoySize }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total ? hechas / total : 0;
  const lado = size === "large" ? 104 : 88;
  return (
    <div className="relative shrink-0" style={{ width: lado, height: lado }} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#f4d096"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className={`absolute inset-0 flex flex-col items-center justify-center text-white font-serif leading-none ${size === "large" ? "text-[30px]" : "text-[26px]"}`}>
        {hechas}
        <span className={`font-sans font-semibold text-white/75 mt-0.5 ${size === "large" ? "text-[14px]" : "text-[12px]"}`}>de {total}</span>
      </span>
    </div>
  );
}

function mensajeProgreso(hechas: number, total: number, quien: string | null, size: HoySize): { titulo: string; detalle: string } {
  if (total === 0) return { titulo: "Hoy es un día libre", detalle: "No hay actividades programadas." };
  if (hechas === total) return { titulo: "¡Día completo!", detalle: size === "large" ? "Hiciste todo lo de hoy." : "Registraste todas las actividades de hoy." };
  const faltan = total - hechas;
  const con = quien ? ` con ${quien}` : "";
  if (hechas === 0) {
    return {
      titulo: size === "large" ? `Hoy ${total === 1 ? "toca 1 actividad" : `tocan ${total} actividades`}` : `${total === 1 ? "1 actividad" : `${total} actividades`} para hoy${con}`,
      detalle: "Un paso a la vez, sin apuro.",
    };
  }
  return { titulo: faltan === 1 ? "Falta solo una" : `Van ${hechas}, faltan ${faltan}`, detalle: "¡Vas muy bien! Seguí a tu ritmo." };
}

// ─── Encabezado: progreso + próxima actividad ───

export function ResumenDelDia({
  tasks,
  quien,
  size = "compact",
  rutaActividad,
}: {
  tasks: PlanTask[];
  quien: string | null;
  size?: HoySize;
  rutaActividad: (id: string) => string;
}) {
  const large = size === "large";
  const hechas = tasks.filter(estaRegistrada).length;
  const proxima = ordenarDelDia(tasks).find((t) => !estaRegistrada(t)) ?? null;
  const { titulo, detalle } = mensajeProgreso(hechas, tasks.length, quien, size);

  return (
    <section className={`grid gap-3 ${proxima ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`} aria-label="Resumen de hoy">
      <div
        className="relative overflow-hidden rounded-[26px] px-5 py-5 sm:px-6 text-white flex items-center gap-4.5"
        style={{ backgroundImage: "linear-gradient(140deg, #4f7d83 0%, #3f6a70 55%, #2f5459 100%)" }}
      >
        <span aria-hidden="true" className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/[0.07]" />
        <span aria-hidden="true" className="absolute right-10 -bottom-14 w-28 h-28 rounded-full bg-mostaza-vital/15" />
        <Anillo hechas={hechas} total={tasks.length} size={size} />
        <div className="relative min-w-0">
          <p className={`m-0 font-serif leading-tight ${large ? "text-[26px]" : "text-[22px]"}`}>{titulo}</p>
          <p className={`m-0 mt-1 text-white/80 ${large ? "text-[18px]" : "text-[15px]"}`}>{detalle}</p>
        </div>
      </div>

      {proxima && <ProximaActividad task={proxima} size={size} rutaActividad={rutaActividad} />}
    </section>
  );
}

function ProximaActividad({ task, size, rutaActividad }: { task: PlanTask; size: HoySize; rutaActividad: (id: string) => string }) {
  const large = size === "large";
  const tema = temaDe(task);
  return (
    <div className="relative rounded-[26px] bg-white border border-borde shadow-[0_18px_40px_-30px_rgba(31,51,56,0.55)] overflow-hidden flex flex-col">
      <div className="h-1.5" style={{ backgroundImage: `linear-gradient(90deg, ${tema.from}, ${tema.to})` }} aria-hidden="true" />
      <div className="px-5 py-4 sm:px-6 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3.5">
          <span
            className={`shrink-0 rounded-2xl flex items-center justify-center text-white ${large ? "w-14 h-14" : "w-12 h-12"}`}
            style={{ backgroundImage: `linear-gradient(140deg, ${tema.from}, ${tema.to})` }}
            aria-hidden="true"
          >
            {task.modulo ? <ModuloIcon modulo={task.modulo} className={large ? "w-7 h-7" : "w-6 h-6"} /> : <ClockIcon className="w-6 h-6" />}
          </span>
          <div className="min-w-0">
            <p className={`m-0 font-bold uppercase tracking-[0.12em] text-verde-profundo ${large ? "text-[13px]" : "text-[11.5px]"}`}>
              Próxima{task.hora ? ` · ${task.hora}` : ""}
            </p>
            <p className={`m-0 mt-0.5 font-serif text-tinta leading-snug ${large ? "text-[24px]" : "text-[20px]"}`}>{task.titulo}</p>
            {!large && (task.duracion || task.modulo) && (
              <p className="m-0 mt-0.5 text-[13.5px] text-tinta-tenue">{[task.modulo && moduloLabel[task.modulo], task.duracion].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-2.5">
          <Link
            to={`${rutaActividad(task.id)}/pasos`}
            className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-verde-serenidad text-white font-semibold no-underline hover:bg-verde-profundo transition-colors ${
              large ? "min-h-16 px-8 text-[20px]" : "min-h-12 px-6 text-[16px]"
            }`}
          >
            <svg width={large ? 20 : 16} height={large ? 20 : 16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M5 3.2v9.6a.6.6 0 0 0 .92.5l7.4-4.8a.6.6 0 0 0 0-1L5.92 2.7A.6.6 0 0 0 5 3.2Z" />
            </svg>
            Empezar
          </Link>
          {!large && (
            <Link to={rutaActividad(task.id)} className="inline-flex items-center justify-center min-h-12 px-5 rounded-full border-[1.5px] border-borde text-tinta font-semibold text-[15px] no-underline hover:border-verde-serenidad">
              Ver detalle
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Línea de tiempo del día ───

function TarjetaTarea({ task, size, destacada, to }: { task: PlanTask; size: HoySize; destacada: boolean; to: string }) {
  const large = size === "large";
  const tema = temaDe(task);
  const hecha = estaRegistrada(task);
  const estado = estadoTexto[size][task.estado];
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3.5 sm:gap-4 rounded-[20px] border bg-white no-underline transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[0_14px_30px_-24px_rgba(31,51,56,0.6)] motion-reduce:hover:translate-y-0 ${
        large ? "p-4" : "p-3.5"
      } ${destacada ? "border-verde-serenidad ring-2 ring-verde-serenidad/15" : "border-borde hover:border-verde-serenidad/60"} ${hecha ? "bg-white/70" : ""}`}
    >
      <span
        className={`relative shrink-0 rounded-2xl flex items-center justify-center text-white overflow-hidden ${large ? "w-16 h-16" : "w-13 h-13 sm:w-14 sm:h-14"} ${hecha ? "saturate-[0.55] opacity-80" : ""}`}
        style={{ backgroundImage: `linear-gradient(140deg, ${tema.from}, ${tema.to})` }}
        aria-hidden="true"
      >
        {task.modulo ? <ModuloIcon modulo={task.modulo} className={large ? "w-8 h-8" : "w-6 h-6 sm:w-7 sm:h-7"} /> : <ClockIcon className="w-6 h-6" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`flex items-center gap-2 font-semibold ${large ? "text-[16px]" : "text-[13px]"}`} style={{ color: hecha ? undefined : tema.ink }}>
          {task.hora && <span className={hecha ? "text-tinta-tenue" : ""}>{task.hora}</span>}
          {!large && task.duracion && <span className="font-normal text-tinta-tenue">· {task.duracion}</span>}
          {!large && task.modulo && <span className="hidden sm:inline font-normal text-tinta-tenue">· {moduloLabel[task.modulo]}</span>}
        </span>
        <span className={`block font-semibold leading-snug ${large ? "text-[21px]" : "text-[16.5px]"} ${hecha ? "text-tinta-suave" : "text-tinta"}`}>{task.titulo}</span>
        {!large && !hecha && task.detalle && <span className="block mt-0.5 text-[14px] text-tinta-suave leading-snug line-clamp-1">{task.detalle}</span>}
      </span>
      {hecha ? (
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full font-semibold ${large ? "px-3.5 py-1.5 text-[15px]" : "px-3 py-1 text-[12.5px]"} ${
            task.estado === "realizado" ? "bg-fila-fria text-semaforo-verde-texto" : task.estado === "parcial" ? "bg-fila-calida text-semaforo-amarillo-texto" : "bg-campo text-tinta-tenue"
          }`}
        >
          {task.estado === "realizado" && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {estado}
        </span>
      ) : (
        <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-tinta-tenue group-hover:text-verde-profundo group-hover:bg-verde-tenue transition-colors">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </Link>
  );
}

export function LineaDelDia({ tasks, size = "compact", rutaActividad }: { tasks: PlanTask[]; size?: HoySize; rutaActividad: (id: string) => string }) {
  const large = size === "large";
  const ordenadas = ordenarDelDia(tasks);
  const proximaId = ordenadas.find((t) => !estaRegistrada(t))?.id;
  const grupos = MOMENTOS.map((m) => ({ ...m, tareas: ordenadas.filter((t) => momentoDe(t) === m.id) })).filter((g) => g.tareas.length > 0);
  // Con todo en un solo momento del día, el rótulo no aporta.
  const conRotulos = grupos.length > 1 || grupos[0]?.id === "sin_hora";

  return (
    <div className="grid gap-5">
      {grupos.map((g) => (
        <section key={g.id} aria-label={g.label}>
          {conRotulos && (
            <p className={`m-0 mb-2.5 flex items-center gap-2.5 font-semibold text-tinta-tenue ${large ? "text-[17px]" : "text-[12.5px] tracking-[0.14em] uppercase"}`}>
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-mostaza-vital" />
              {g.label}
            </p>
          )}
          <ol className={`list-none m-0 p-0 relative grid ${large ? "gap-3" : "gap-2.5"} ${conRotulos ? "pl-5 sm:pl-6" : ""}`}>
            {/* Línea que une las actividades del momento del día. */}
            {conRotulos && <span aria-hidden="true" className="absolute left-[3px] top-1 bottom-1 w-[2px] rounded-full bg-borde" />}
            {g.tareas.map((t) => (
              <li key={t.id} className="relative">
                {conRotulos && (
                  <span
                    aria-hidden="true"
                    className={`absolute -left-5 sm:-left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-4 ring-fondo-papel ${
                      estaRegistrada(t) ? "bg-verde-serenidad" : t.id === proximaId ? "bg-mostaza-vital" : "bg-borde-campo"
                    }`}
                  />
                )}
                <TarjetaTarea task={t} size={size} destacada={t.id === proximaId} to={rutaActividad(t.id)} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

// ─── Cierre del día ───

// Cierre de la línea del día: un final tranquilo después de la última
// actividad, que dice qué sigue (mañana o el cierre de la semana).
export function CierreDelDia({ pendientes, siguiente, size = "compact" }: { pendientes: number; siguiente: SiguienteDia | null; size?: HoySize }) {
  const large = size === "large";
  const n = siguiente?.cantidad ?? 0;
  const actividades = `${n} ${n === 1 ? "actividad" : "actividades"}`;
  const cuando = siguiente ? (siguiente.esManana ? "Mañana" : `El ${siguiente.dia.toLowerCase()}`) : "";
  const { titulo, detalle, icono } = !siguiente
    ? pendientes > 0
      ? { titulo: "Último día de la semana", detalle: "Con estas actividades termina la semana. Después, contanos cómo les fue.", icono: "bandera" as const }
      : { titulo: "¡Terminaron la semana!", detalle: "Tu equipo está preparando la próxima. Te avisamos cuando esté lista.", icono: "bandera" as const }
    : pendientes > 0
      ? { titulo: "Eso es todo por hoy", detalle: `${cuando} les esperan ${actividades} nuevas.`, icono: "sol" as const }
      : { titulo: "¡Listo por hoy!", detalle: `A descansar. ${cuando} hay ${actividades} nuevas.`, icono: "luna" as const };

  return (
    <div className="flex flex-col items-center text-center pt-1" role="status">
      <span aria-hidden="true" className="h-6 w-[2px] rounded-full bg-[repeating-linear-gradient(to_bottom,#ddd7be_0_4px,transparent_4px_8px)]" />
      <span aria-hidden="true" className={`mt-2 rounded-full bg-white border border-borde flex items-center justify-center text-verde-profundo ${large ? "w-14 h-14" : "w-12 h-12"}`}>
        {icono === "luna" ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.5 14.2A7.5 7.5 0 1 1 9.8 4.5a6 6 0 0 0 9.7 9.7z" />
          </svg>
        ) : icono === "sol" ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 21V4M6 4h11l-2 4 2 4H6" />
          </svg>
        )}
      </span>
      <p className={`m-0 mt-2.5 font-serif text-tinta ${large ? "text-[24px]" : "text-[20px]"}`}>{titulo}</p>
      <p className={`m-0 mt-1 max-w-[26em] text-tinta-suave ${large ? "text-[18px]" : "text-[15px]"}`}>{detalle}</p>
    </div>
  );
}

// ─── Estado vacío ───

export function DiaLibre({ size = "compact", mensaje }: { size?: HoySize; mensaje: string }) {
  const large = size === "large";
  return (
    <div className="rounded-[26px] bg-white border border-borde px-6 py-8 text-center grid justify-items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#f5f9f9" />
        <circle cx="32" cy="28" r="9" fill="#f4d096" />
        <path d="M14 44c5-6 11-9 18-9s13 3 18 9" stroke="#6a969c" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className={`m-0 font-serif text-tinta ${large ? "text-[24px]" : "text-[20px]"}`}>Hoy es un día libre</p>
      <p className={`m-0 text-tinta-suave max-w-[28em] ${large ? "text-[18px]" : "text-[15px]"}`}>{mensaje}</p>
    </div>
  );
}
