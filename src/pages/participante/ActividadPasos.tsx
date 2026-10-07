import { useParams } from "react-router-dom";
import { StepByStepActivity } from "../../components/ui/StepByStepActivity";

export function ParticipanteActividadPasos() {
  const { taskId } = useParams();
  return <StepByStepActivity taskId={taskId} backTo="/app/participante/hoy" size="large" />;
}
