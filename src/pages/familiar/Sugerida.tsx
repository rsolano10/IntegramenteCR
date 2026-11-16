import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RUTA_EXTRAS, tareaDeRecurso, useActividadesSugeridas } from "../../lib/usePlan";
import { moduloLabel, type ResourceModulo } from "../../lib/modulos";
import { duracionCorta } from "../../lib/duracion";
import { BotonVolver } from "../../components/ui/BotonVolver";
import { ChipToggle } from "../../components/ui/ChipToggle";
import { PanelActividad } from "../../components/actividad/PanelActividad";
import { IconoActividad } from "../../components/actividad/IconoActividad";
import { Cargando } from "../../components/ui/Cargando";
import { StepByStepActivity } from "../../components/ui/StepByStepActivity";

// Actividades extra: las sugeridas según el perfil, fuera del plan. Se
// llega desde el final de Hoy («¿Con ganas de más?») y «Volver» regresa a
// Hoy. Cada una se abre con el mismo tablero y la misma sesión guiada que
// las del plan, en modo práctica (sin registro).

export function Extras() {
  const { data, isLoading } = useActividadesSugeridas();
  const [modulo, setModulo] = useState<ResourceModulo | null>(null);
  const recursos = data ?? [];
  const modulos = (Object.keys(moduloLabel) as ResourceModulo[]).filter((m) => recursos.some((r) => r.modulo === m));
  const lista = recursos.filter((r) => !modulo || r.modulo === modulo);

  return (
    <div className="grid gap-5">
      <BotonVolver respaldo="/app/hoy" texto="Volver a Hoy" className="mb-1" />
      <div>
        <p className="m-0 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">¿Con ganas de más?</p>
        <h1 className="m-0 mt-1 font-serif font-normal text-[28px] leading-tight text-tinta">Actividades extra</h1>
        <p className="m-0 mt-1.5 text-[16px] leading-relaxed text-tinta-suave">Elegidas según el perfil, para hacer cuando quieran. Son para practicar: no se registran.</p>
      </div>

      {modulos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <ChipToggle active={modulo === null} onToggle={() => setModulo(null)}>
            Todas
          </ChipToggle>
          {modulos.map((m) => (
            <ChipToggle key={m} active={modulo === m} onToggle={() => setModulo(modulo === m ? null : m)}>
              {moduloLabel[m]}
            </ChipToggle>
          ))}
        </div>
      )}

      {isLoading && <Cargando />}
      {!isLoading && lista.length === 0 && <p className="m-0 text-[16px] text-tinta-suave">Por ahora no hay actividades extra para sugerir.</p>}

      <ul className="m-0 p-0 list-none grid gap-2.5">
        {lista.map((r) => (
          <li key={r.id}>
            <Link
              to={`${RUTA_EXTRAS}/${r.id}`}
              className="group flex items-center gap-3.5 rounded-[20px] border border-borde bg-white p-3.5 no-underline transition-[border-color,box-shadow] hover:border-verde-serenidad/60 hover:shadow-[0_14px_30px_-24px_rgba(31,51,56,0.6)]"
            >
              <IconoActividad modulo={r.modulo} lado={58} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug text-[17px] text-tinta">{r.titulo}</span>
                <span className="block mt-0.5 text-[14px] text-tinta-suave">{[moduloLabel[r.modulo], duracionCorta(r.duracion)].filter(Boolean).join(" · ")}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-tinta-suave group-hover:text-verde-profundo group-hover:bg-verde-tenue">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
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
