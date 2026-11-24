import { Link } from "react-router-dom";
import type { PlanTask } from "../../lib/mockData";
import { minutosDe, ordenarDelDia } from "../../lib/hoyDelDia";
import { contarHechas, estaRegistrada } from "../../lib/estadoActividad";
import { cierreDelDia, mensajeDelDia } from "../../lib/textosDelDia";
import type { SiguienteDia } from "../../lib/siguienteDia";
import { CajaAvance } from "../ui/CajaAvance";
import { TarjetaActividad } from "../actividad/TarjetaActividad";

// Pantalla "Hoy" (familia y participante). Pocas actividades por día (no más
// de 8): en vez de una lista plana, el día se cuenta como una línea de
// tiempo por momento del día, con el avance arriba y la próxima destacada.
// `size="large"` es la escala de la vista del participante (letra y toques
// más grandes, menos texto).

export type HoySize = "compact" | "large";


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


// ─── Avance del día ───

// La caja de avance de Hoy: la misma que en Mi semana. La próxima
// actividad ya no va aparte: queda destacada en su lugar en la lista.
export function ResumenDelDia({ tasks, quien, size = "compact" }: { tasks: PlanTask[]; quien: string | null; size?: HoySize }) {
  const hechas = contarHechas(tasks);
  const pendientes = tasks.filter((t) => !estaRegistrada(t)).length;
  const cuenta = (e: PlanTask["estado"]) => tasks.filter((t) => t.estado === e).length;
  const { titulo, detalle } = mensajeDelDia(
    { hechas, pendientes, total: tasks.length, enteras: cuenta("realizado"), enParte: cuenta("parcial"), no: cuenta("no") },
    size === "large" ? "participante" : "familia",
    quien,
  );
  return <CajaAvance hechas={hechas} total={tasks.length} titulo={titulo} detalle={detalle} large={size === "large"} />;
}

// ─── Línea de tiempo del día ───

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
            <p className={`m-0 mb-2.5 flex items-center gap-2.5 font-semibold text-tinta-suave ${large ? "text-[18px]" : "text-[13px] tracking-[0.14em] uppercase"}`}>
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
                <TarjetaActividad task={t} large={large} proxima={t.id === proximaId} to={rutaActividad(t.id)} />
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
// «¿Con ganas de más?»: un enlace discreto a las actividades extra.
export function EnlaceExtras({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 min-h-11 text-[15px] font-semibold text-verde-profundo underline decoration-verde-serenidad/50 underline-offset-4 hover:decoration-verde-profundo">
      ¿Con ganas de más? Ver actividades extra
      <span aria-hidden="true">›</span>
    </Link>
  );
}

export function CierreDelDia({ pendientes, siguiente, size = "compact", extras }: { pendientes: number; siguiente: SiguienteDia | null; size?: HoySize; extras?: string }) {
  const large = size === "large";
  const { titulo, detalle, icono } = cierreDelDia(pendientes, siguiente, large ? "participante" : "familia");

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
      {/* El texto (lo de mañana y las actividades extra) aparece recién
          cuando no queda nada pendiente hoy; antes, solo el ícono. */}
      {pendientes === 0 && (
        <>
          <p className={`m-0 mt-2.5 font-serif text-tinta ${large ? "text-[24px]" : "text-[20px]"}`}>{titulo}</p>
          <p className={`m-0 mt-1 max-w-[26em] text-tinta-suave ${large ? "text-[18px]" : "text-[15px]"}`}>{detalle}</p>
          {extras && (
            <div className="mt-2">
              <EnlaceExtras to={extras} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Estado vacío ───

export function DiaLibre({ size = "compact", titulo = "Hoy es un día libre", mensaje, extras }: { size?: HoySize; titulo?: string; mensaje: string; extras?: string }) {
  const large = size === "large";
  return (
    <div className="rounded-[26px] bg-white border border-borde px-6 py-8 text-center grid justify-items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#f5f9f9" />
        <circle cx="32" cy="28" r="9" fill="#f4d096" />
        <path d="M14 44c5-6 11-9 18-9s13 3 18 9" stroke="#6a969c" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className={`m-0 font-serif text-tinta ${large ? "text-[24px]" : "text-[20px]"}`}>{titulo}</p>
      <p className={`m-0 text-tinta-suave max-w-[28em] ${large ? "text-[18px]" : "text-[15px]"}`}>{mensaje}</p>
      {extras && <EnlaceExtras to={extras} />}
    </div>
  );
}
