import { useNavigate } from "react-router-dom";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta } from "../../lib/usePlan";
import { DiaLibre, LineaDelDia, ResumenDelDia } from "../../components/hoy/HoyDelDia";

const rutaActividad = (id: string) => `/app/participante/actividad/${id}`;

export function ParticipanteHoy() {
  const navigate = useNavigate();
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);
  const today = days?.find((d) => d.isToday);
  const tasks = today?.tasks ?? [];
  const allTasks = days?.flatMap((d) => d.tasks) ?? [];
  const weekComplete = allTasks.length > 0 && allTasks.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");

  if (loadingPlan) return <div className="flex-1" />;

  return (
    <>
      {tasks.length === 0 ? (
        <DiaLibre size="large" mensaje="Todavía no hay actividades para hoy." />
      ) : (
        <>
          <ResumenDelDia tasks={tasks} quien={null} size="large" rutaActividad={rutaActividad} />
          <LineaDelDia tasks={tasks} size="large" rutaActividad={rutaActividad} />
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && (
        <div className="border-2 border-verde-serenidad bg-verde-tenue rounded-[22px] p-5">
          <p className="m-0 mb-1 text-[22px] font-bold text-verde-profundo">¡Semana completa!</p>
          <p className="m-0 mb-4 text-[17px] text-tinta-suave">Ya hiciste todas las actividades de la semana. Contanos cómo estuvo.</p>
          <button
            type="button"
            onClick={() => navigate(`/app/participante/revision?plan=${planMeta.id}`)}
            className="w-full min-h-17 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-[20px] font-bold cursor-pointer hover:bg-verde-profundo"
          >
            Evaluar la semana
          </button>
        </div>
      )}

      {weekComplete && planMeta?.family_reviewed_at && (
        <div className="border-2 border-borde bg-white rounded-[22px] p-5">
          <p className="m-0 text-[17px] leading-relaxed text-tinta-suave">Tu equipo clínico está revisando la semana. Pronto vas a tener novedades.</p>
        </div>
      )}
    </>
  );
}
