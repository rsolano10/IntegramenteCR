import { useParams } from "react-router-dom";
import { tareaDeRecurso, useActividadesSugeridas } from "../../lib/usePlan";
import { BotonVolver } from "../../components/ui/BotonVolver";
import { PanelActividad } from "../../components/actividad/PanelActividad";
import { Cargando } from "../../components/ui/Cargando";
import { StepByStepActivity } from "../../components/ui/StepByStepActivity";

// Una actividad sugerida (fuera del plan), con el mismo tablero que las del
// plan y «Empezar» a la misma sesión guiada, en modo práctica.
export function Sugerida() {
  const { resourceId } = useParams();
  const { data, isLoading } = useActividadesSugeridas();
  const recurso = data?.find((r) => r.id === resourceId) ?? null;
  const volver = <BotonVolver respaldo="/app/plan" texto="Volver a Mi semana" className="mb-1" />;

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
        <PanelActividad task={task} dia={{ dia: "", isToday: false, tasks: [task] }} rutaPasos={`/app/plan/sugerida/${recurso.id}/pasos`} publishAt={null} practica />
      </div>
    </div>
  );
}

export function SugeridaPasos() {
  const { resourceId } = useParams();
  const { data, isLoading } = useActividadesSugeridas();
  const recurso = data?.find((r) => r.id === resourceId) ?? null;
  if (isLoading) return <div className="min-h-screen bg-fondo-papel" />;
  return <StepByStepActivity taskId={undefined} tarea={recurso ? tareaDeRecurso(recurso) : null} backTo="/app/plan" size="compact" />;
}
