import { useLocation, useParams } from "react-router-dom";
import { StepByStepActivity } from "../../components/ui/StepByStepActivity";
import { origenDeActividad } from "../../lib/useVolver";

// Se abre desde Hoy (/app/hoy/actividad/:id/pasos) o desde Mi semana
// (/app/plan/actividad/:id/pasos): al terminar, vuelve a esa lista.
export function ActividadPasos() {
  const { taskId } = useParams();
  const { pathname } = useLocation();
  return <StepByStepActivity taskId={taskId} backTo={origenDeActividad(pathname).ruta} size="compact" />;
}
