import { useNavigate } from "react-router-dom";
import type { SemanaAnterior } from "../../lib/semanasAnteriores";
import { AnilloAvance } from "../ui/CajaAvance";

const fecha = (iso: string, conAnio = false) =>
  new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}) });

// Una semana anterior: cuándo fue, cuántas actividades se hicieron y si ya
// la evaluaron (lleva al resumen) o falta evaluarla.
export function FilaSemana({ semana, conAnio = false }: { semana: SemanaAnterior; conAnio?: boolean }) {
  const navigate = useNavigate();
  const evaluada = !!semana.family_reviewed_at;
    return (
    <button
      type="button"
      onClick={() => navigate(evaluada ? `/app/resumen?plan=${semana.id}` : `/app/revision?plan=${semana.id}`)}
      className="w-full flex items-center gap-3.5 text-left bg-white border border-borde rounded-2xl px-4 py-3 cursor-pointer hover:border-verde-serenidad font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
    >
      {/* Avance de la semana: el mismo anillo que en Hoy y Mi semana, en chico. */}
      <AnilloAvance hechas={semana.hechas} total={semana.total} lado={40} claro={false} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-tinta">Semana del {fecha(semana.publish_at, conAnio)}</span>
        <span className="block text-[14px] text-tinta-suave">
          {semana.total ? `${semana.hechas} de ${semana.total} actividades hechas` : "Sin actividades"}
        </span>
      </span>
      <span className={`shrink-0 text-[14px] font-semibold ${evaluada ? "text-tinta-suave" : "text-verde-profundo"}`}>{evaluada ? "Ver resumen ›" : "Evaluar ›"}</span>
    </button>
  );
}
