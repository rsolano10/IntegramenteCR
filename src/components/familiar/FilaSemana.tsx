import { useNavigate } from "react-router-dom";
import type { SemanaAnterior } from "../../lib/semanasAnteriores";

const fecha = (iso: string, conAnio = false) =>
  new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}) });

// Una semana anterior: cuándo fue, cuántas actividades se hicieron y si ya
// la evaluaron (lleva al resumen) o falta evaluarla.
export function FilaSemana({ semana, conAnio = false }: { semana: SemanaAnterior; conAnio?: boolean }) {
  const navigate = useNavigate();
  const evaluada = !!semana.family_reviewed_at;
  const pct = semana.total ? semana.hechas / semana.total : 0;
  return (
    <button
      type="button"
      onClick={() => navigate(evaluada ? `/app/resumen?plan=${semana.id}` : `/app/revision?plan=${semana.id}`)}
      className="w-full flex items-center gap-3.5 text-left bg-white border border-borde rounded-2xl px-4 py-3 cursor-pointer hover:border-verde-serenidad font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
    >
      {/* Avance de la semana: un anillo chico. */}
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" className="shrink-0 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#ebe6ce" strokeWidth="4.5" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="#6a969c" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={`${pct * 2 * Math.PI * 14} ${2 * Math.PI * 14}`} />
      </svg>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-tinta">Semana del {fecha(semana.publish_at, conAnio)}</span>
        <span className="block text-[13px] text-tinta-suave">
          {semana.total ? `${semana.hechas} de ${semana.total} actividades hechas` : "Sin actividades"}
        </span>
      </span>
      <span className={`shrink-0 text-[13px] font-semibold ${evaluada ? "text-tinta-suave" : "text-verde-profundo"}`}>{evaluada ? "Ver resumen ›" : "Evaluar ›"}</span>
    </button>
  );
}
