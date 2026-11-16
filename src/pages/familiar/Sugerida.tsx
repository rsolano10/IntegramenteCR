import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { RUTA_EXTRAS, tareaDeRecurso, useActividadesSugeridas } from "../../lib/usePlan";
import { moduloLabel, moduloTheme, type ResourceModulo } from "../../lib/modulos";
import type { MediaResource } from "../../lib/mediaResources";
import { duracionCorta } from "../../lib/duracion";
import { BotonVolver } from "../../components/ui/BotonVolver";
import { PanelActividad } from "../../components/actividad/PanelActividad";
import { IconoActividad } from "../../components/actividad/IconoActividad";
import { Cargando } from "../../components/ui/Cargando";
import { StepByStepActivity } from "../../components/ui/StepByStepActivity";
import { ClaraElige } from "../../components/clara/ClaraElige";

// Actividades extra: las sugeridas según el perfil, fuera del plan. Se
// llega desde el final de Hoy («¿Con ganas de más?»); «Volver» regresa a
// Hoy. Pensada para no abrumar: arriba, una sola idea para hoy; después,
// los temas como tarjetas grandes (con su ilustración) en vez de filtros;
// al tocar un tema, sus actividades (?tema=…, así «atrás» vuelve a los
// temas). Cada actividad se abre con el mismo tablero y la misma sesión
// guiada que las del plan, en modo práctica (sin registro).

const ORDEN_TEMAS: ResourceModulo[] = ["cognicion", "movimiento", "gerontogimnasia", "musica", "reminiscencia", "sentidos", "nutricion", "bienvenida"];
const POR_PAGINA = 10;

// Una idea distinta cada día, igual para toda la jornada.
function ideaDelDia<T>(xs: T[]): T | null {
  if (!xs.length) return null;
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  const n = Math.floor(hoy.getTime() / 864e5);
  return xs[n % xs.length];
}

// Una actividad dentro de un tema: la imagen ya está en el encabezado.
function FilaActividad({ r }: { r: MediaResource }) {
  const dur = duracionCorta(r.duracion);
  return (
    <Link to={`${RUTA_EXTRAS}/${r.id}`} className="group flex items-center gap-3 px-4 py-3.5 no-underline hover:bg-campo/60 transition-colors">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-[17px] text-tinta">{r.titulo}</span>
        {dur && <span className="block mt-0.5 text-[14px] text-tinta-suave">{dur}</span>}
      </span>
      <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-tinta-suave group-hover:text-verde-profundo group-hover:bg-verde-tenue">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}

export function Extras() {
  const { data, isLoading } = useActividadesSugeridas();
  const [params, setParams] = useSearchParams();
  const [cuantas, setCuantas] = useState(POR_PAGINA);
  const recursos = data ?? [];
  const temaParam = params.get("tema") as ResourceModulo | null;
  const tema = temaParam && moduloLabel[temaParam] ? temaParam : null;
  const temas = ORDEN_TEMAS.map((m) => ({ m, n: recursos.filter((r) => r.modulo === m).length })).filter((t) => t.n > 0);
  const idea = ideaDelDia(recursos);

  if (isLoading) return <Cargando />;

  // ─── Un tema: sus actividades ───
  if (tema) {
    const lista = recursos.filter((r) => r.modulo === tema);
    const t = moduloTheme[tema];
    return (
      <div className="grid gap-5">
        <BotonVolver respaldo={RUTA_EXTRAS} texto="Volver a los temas" className="mb-1" />
        <section className="flex items-center gap-4 rounded-[26px] px-5 py-4" style={{ background: `linear-gradient(140deg, #fff 0%, ${t.from} 120%)` }}>
          <IconoActividad modulo={tema} lado={76} />
          <div className="min-w-0">
            <h1 className="m-0 font-serif font-normal text-[26px] leading-tight text-tinta">{moduloLabel[tema]}</h1>
            <p className="m-0 mt-1 text-[15px] text-tinta-suave">
              {lista.length} {lista.length === 1 ? "actividad" : "actividades"} para practicar
            </p>
          </div>
        </section>
        <ul className="m-0 p-0 list-none rounded-[22px] border border-borde bg-white overflow-hidden divide-y divide-borde">
          {lista.slice(0, cuantas).map((r) => (
            <li key={r.id}>
              <FilaActividad r={r} />
            </li>
          ))}
        </ul>
        {lista.length > cuantas && (
          <button
            type="button"
            onClick={() => setCuantas((c) => c + POR_PAGINA)}
            className="justify-self-center min-h-12 px-6 rounded-full border-[1.5px] border-borde bg-white text-[16px] font-semibold text-verde-profundo cursor-pointer hover:border-verde-serenidad"
          >
            Ver más ({lista.length - cuantas})
          </button>
        )}
      </div>
    );
  }

  // ─── Inicio: la idea de hoy y los temas ───
  return (
    <div className="grid gap-6">
      <BotonVolver respaldo="/app/hoy" texto="Volver a Hoy" className="mb-1" />
      <header>
        <p className="m-0 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">¿Con ganas de más?</p>
        <h1 className="m-0 mt-1 font-serif font-normal text-[30px] leading-tight text-tinta">Actividades extra</h1>
        <p className="m-0 mt-1.5 text-[16px] leading-relaxed text-tinta-suave">Ideas para hacer juntos cuando quieran. Son para practicar: no se registran.</p>
      </header>

      {recursos.length === 0 && <p className="m-0 text-[16px] text-tinta-suave">Por ahora no hay actividades extra para sugerir.</p>}

      {idea && (
        <section aria-label="Una idea para hoy">
          <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">Una idea para hoy</p>
          <Link
            to={`${RUTA_EXTRAS}/${idea.id}`}
            className="group relative overflow-hidden flex items-center gap-4 rounded-[26px] px-5 py-5 no-underline text-white shadow-[0_18px_40px_-30px_rgba(31,51,56,0.7)]"
            style={{ backgroundImage: "linear-gradient(140deg, #4f7d83 0%, #3f6a70 55%, #2f5459 100%)" }}
          >
            <span aria-hidden="true" className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/[0.07]" />
            <IconoActividad modulo={idea.modulo} lado={84} />
            <span className="relative min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#c4dbdb]">{[moduloLabel[idea.modulo], duracionCorta(idea.duracion)].filter(Boolean).join(" · ")}</span>
              <span className="block mt-0.5 font-serif text-[22px] leading-snug">{idea.titulo}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 min-h-11 px-5 rounded-full bg-white text-verde-profundo text-[16px] font-semibold group-hover:bg-beige-serenidad transition-colors">
                Ver actividad <span aria-hidden="true">›</span>
              </span>
            </span>
          </Link>
        </section>
      )}

      {/* Clara ayuda a elegir según lo que buscan. */}
      <ClaraElige recursos={recursos} />

      {temas.length > 0 && (
        <section aria-label="Elegí un tema">
          <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">O elegí un tema</p>
          <ul className="m-0 p-0 list-none grid grid-cols-2 sm:grid-cols-3 gap-3">
            {temas.map(({ m, n }, i) => {
              // Si el último queda solo en su fila, ocupa todo el ancho.
              const ultimo = i === temas.length - 1;
              const solo2 = ultimo && temas.length % 2 === 1;
              const solo3 = ultimo && temas.length % 3 === 1;
              const ancho = `${solo2 ? "col-span-2" : ""} ${solo3 ? "sm:col-span-3" : solo2 ? "sm:col-span-1" : ""}`;
              const horizontal = `${solo2 ? "flex-row items-center" : "flex-col"} ${solo3 ? "sm:flex-row sm:items-center" : solo2 ? "sm:flex-col sm:items-stretch" : ""}`;
              return (
              <li key={m} className={ancho}>
                <button
                  type="button"
                  onClick={() => {
                    setCuantas(POR_PAGINA);
                    setParams({ tema: m });
                    window.scrollTo(0, 0);
                  }}
                  className={`w-full h-full text-left flex ${horizontal} gap-3 rounded-[22px] border border-borde p-3.5 cursor-pointer font-sans transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-verde-serenidad/60 hover:shadow-[0_14px_30px_-24px_rgba(31,51,56,0.6)]`}
                  style={{ background: `linear-gradient(160deg, #fff 40%, ${moduloTheme[m].from}66 140%)` }}
                >
                  <IconoActividad modulo={m} lado={60} />
                  <span>
                    <span className="block font-semibold text-[17px] leading-snug text-tinta">{moduloLabel[m]}</span>
                    <span className="block mt-0.5 text-[14px] text-tinta-suave">
                      {n} {n === 1 ? "actividad" : "actividades"}
                    </span>
                  </span>
                </button>
              </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function Sugerida() {
  const { resourceId } = useParams();
  const { data, isLoading } = useActividadesSugeridas();
  const recurso = data?.find((r) => r.id === resourceId) ?? null;
  const volver = <BotonVolver respaldo={RUTA_EXTRAS} texto="Volver a las actividades extra" className="mb-1" />;

  if (isLoading) return <Cargando />;
  if (!recurso) {
    return (
      <div>
        {volver}
        <p className="m-0 text-[16px] text-tinta-suave">No encontramos esa actividad.</p>
      </div>
    );
  }
  const task = tareaDeRecurso(recurso);
  return (
    <div>
      {volver}
      <div className="mt-2">
        <PanelActividad task={task} dia={{ dia: "", isToday: false, tasks: [task] }} rutaPasos={`${RUTA_EXTRAS}/${recurso.id}/pasos`} publishAt={null} practica />
      </div>
    </div>
  );
}

export function SugeridaPasos() {
  const { resourceId } = useParams();
  const { data, isLoading } = useActividadesSugeridas();
  const recurso = data?.find((r) => r.id === resourceId) ?? null;
  if (isLoading) return <div className="min-h-screen bg-fondo-papel" />;
  return <StepByStepActivity taskId={undefined} tarea={recurso ? tareaDeRecurso(recurso) : null} backTo={RUTA_EXTRAS} size="compact" />;
}
