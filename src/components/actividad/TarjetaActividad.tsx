import { Link } from "react-router-dom";
import type { PlanTask } from "../../lib/mockData";
import { CHIP_ESTADO, ETIQUETA_ESTADO, estaRegistrada } from "../../lib/estadoActividad";
import { duracionCorta } from "../../lib/duracion";
import { moduloLabel, temaDeTarea } from "../../lib/modulos";
import { IconoActividad } from "./IconoActividad";

// La tarjeta de una actividad, la misma en Hoy y en Mi semana (familia y
// participante): el dibujo de la actividad (el mismo que adentro), la hora,
// el título, el módulo y la duración siempre a la vista y, si ya contaron
// cómo les fue, el estado con las mismas palabras que en todas partes.
// La próxima del día va destacada, en su lugar, con «Ver actividad».

export function TarjetaActividad({
  task,
  to,
  large = false,
  proxima = false,
}: {
  task: PlanTask;
  to: string;
  large?: boolean;
  proxima?: boolean;
}) {
  const registrada = estaRegistrada(task);
  const etiqueta = ETIQUETA_ESTADO[task.estado];
  const tema = temaDeTarea(task);
  const datos = [task.modulo ? moduloLabel[task.modulo] : null, duracionCorta(task.duracion)].filter(Boolean).join(" · ");

  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3.5 sm:gap-4 rounded-[20px] border bg-white no-underline transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[0_14px_30px_-24px_rgba(31,51,56,0.6)] motion-reduce:hover:translate-y-0 ${
        large ? "p-4" : "p-3.5"
      } ${proxima ? "border-verde-serenidad ring-2 ring-verde-serenidad/15 shadow-[0_18px_40px_-30px_rgba(31,51,56,0.55)]" : "border-borde hover:border-verde-serenidad/60"}`}
    >
      <IconoActividad task={task} lado={large ? 68 : 58} apagado={registrada} />
      <span className="min-w-0 flex-1">
        {proxima && (
          <span className={`block font-bold uppercase tracking-[0.12em] text-verde-profundo ${large ? "text-[15px]" : "text-[13px]"}`}>Próxima</span>
        )}
        {task.hora && (
          <span className={`block font-semibold leading-snug whitespace-nowrap ${large ? "text-[17px]" : "text-[14.5px]"}`} style={{ color: registrada ? undefined : tema.ink }}>
            {task.hora}
          </span>
        )}
        <span className={`block font-semibold leading-snug ${large ? "text-[21px]" : "text-[17px]"} ${registrada ? "text-tinta-suave" : "text-tinta"}`}>{task.titulo}</span>
        {datos && <span className={`block mt-0.5 leading-snug text-tinta-suave ${large ? "text-[17px]" : "text-[14px]"}`}>{datos}</span>}
        {etiqueta && (
          <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full font-semibold ${large ? "px-3.5 py-1 text-[16px]" : "px-3 py-0.5 text-[14px]"} ${CHIP_ESTADO[task.estado]}`}>
            {task.estado === "realizado" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {etiqueta}
          </span>
        )}
        {task.notaClinica && !registrada && (
          <span className={`mt-1.5 flex items-center gap-1.5 font-semibold text-verde-profundo ${large ? "text-[16px]" : "text-[14px]"}`}>
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-verde-serenidad" />
            Nota del equipo
          </span>
        )}
        {proxima && (
          <span
            className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-verde-profundo text-white font-semibold group-hover:bg-tinta transition-colors ${
              large ? "min-h-14 px-7 text-[19px]" : "min-h-11 px-5 text-[16px]"
            }`}
          >
            Ver actividad
          </span>
        )}
      </span>
      {!proxima && (
        <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-tinta-suave group-hover:text-verde-profundo group-hover:bg-verde-tenue transition-colors">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </Link>
  );
}
