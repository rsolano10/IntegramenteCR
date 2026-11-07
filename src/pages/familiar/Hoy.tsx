import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta } from "../../lib/usePlan";
import { Button } from "../../components/ui/Button";
import { CierreDelDia, DiaLibre, LineaDelDia, ResumenDelDia } from "../../components/hoy/HoyDelDia";
import { siguienteDia } from "../../lib/siguienteDia";

const rutaActividad = (id: string) => `/app/hoy/actividad/${id}`;

export function Hoy() {
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);

  const today = days?.find((d) => d.isToday);
  const tasks = today?.tasks ?? [];
  const allTasks = days?.flatMap((d) => d.tasks) ?? [];
  const weekComplete = allTasks.length > 0 && allTasks.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");
  const quien = myPatient?.nombre?.split(" ")[0] ?? null;

  if (loadingPlan) return <div className="flex-1" />;

  return (
    <div className="grid gap-6">
      {tasks.length === 0 ? (
        <DiaLibre mensaje="No hay actividades programadas para hoy. Podés mirar lo que viene en la pestaña de la semana." />
      ) : (
        <>
          <ResumenDelDia tasks={tasks} quien={quien} rutaActividad={rutaActividad} />
          <LineaDelDia tasks={tasks} rutaActividad={rutaActividad} />
          {!weekComplete && <CierreDelDia pendientes={tasks.filter((t) => t.estado === "pendiente").length} siguiente={siguienteDia(days ?? [])} />}
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && (
        <div className="border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-[22px] p-5">
          <p className="m-0 mb-1 text-[17px] font-bold text-verde-profundo">¡Semana completa!</p>
          <p className="m-0 mb-3 text-[14.5px] text-tinta-suave">Ya registraste todas las actividades de la semana. Contanos cómo estuvo.</p>
          <Button variant="ink" dense to={`/app/revision?plan=${planMeta.id}`}>
            Evaluar la semana
          </Button>
        </div>
      )}

      {weekComplete && planMeta?.family_reviewed_at && (
        <div className="border border-borde bg-white rounded-[22px] p-5">
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
            Tu equipo clínico está revisando la semana. Pronto vas a tener novedades y las actividades de la próxima semana.
          </p>
        </div>
      )}
    </div>
  );
}
