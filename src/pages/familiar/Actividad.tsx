import { useLocation, useParams } from "react-router-dom";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useGuardarProgreso, useCurrentPlanMeta } from "../../lib/usePlan";
import { origenDeActividad } from "../../lib/useVolver";
import { BotonVolver } from "../../components/ui/BotonVolver";
import { PanelActividad } from "../../components/actividad/PanelActividad";
import { Cargando } from "../../components/ui/Cargando";

// La pantalla de una actividad, igual desde Hoy (/app/hoy/actividad/:id) y
// desde Mi semana (/app/plan/actividad/:id). Es un tablero de la actividad
// con «Empezar» al final; el registro se hace solo dentro de la actividad
// (StepByStepActivity), nunca desde acá.
export function Actividad() {
  const { pathname } = useLocation();
  const { taskId } = useParams();
  const origen = origenDeActividad(pathname);
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const guardarProgreso = useGuardarProgreso(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);

  const dia = days?.find((d) => d.tasks.some((t) => t.id === taskId)) ?? null;
  const task = dia?.tasks.find((t) => t.id === taskId) ?? null;
  const botonVolver = <BotonVolver respaldo={origen.ruta} texto={`Volver a ${origen.nombre}`} className="mb-1" />;

  if (loadingPlan) return <Cargando />;

  if (!task || !dia) {
    return (
      <div>
        {botonVolver}
        <p className="m-0 text-[16px] text-tinta-suave">No encontramos esa actividad.</p>
      </div>
    );
  }

  return (
    <div>
      {botonVolver}
      <div className="mt-2">
        <PanelActividad
          task={task}
          dia={dia}
          rutaPasos={`${pathname}/pasos`}
          publishAt={planMeta?.publish_at ?? null}
          onGuardarProgreso={(p) => guardarProgreso(task.id, p)}
        />
      </div>
    </div>
  );
}
