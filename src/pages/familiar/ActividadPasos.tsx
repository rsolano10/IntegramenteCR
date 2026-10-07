import { useParams } from "react-router-dom";
import { StepByStepActivity } from "../../components/ui/StepByStepActivity";

export function ActividadPasos() {
  const { taskId } = useParams();
  return <StepByStepActivity taskId={taskId} backTo="/app/hoy" size="compact" />;
}
