import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta } from "../../lib/usePlan";
import { CierreDelDia, DiaLibre, LineaDelDia, ResumenDelDia } from "../../components/hoy/HoyDelDia";
import { siguienteDia } from "../../lib/siguienteDia";
import { AvisoEvaluarSemana, AvisoSemanaEnRevision } from "../../components/familiar/AvisoEvaluarSemana";
import { Cargando } from "../../components/ui/Cargando";
import { estaRegistrada } from "../../lib/estadoActividad";
import { semanaTerminada } from "../../lib/planWeek";

const rutaActividad = (id: string) => `/app/participante/actividad/${id}`;

export function ParticipanteHoy() {
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);
  const today = days?.find((d) => d.isToday);
  const tasks = today?.tasks ?? [];
  const allTasks = days?.flatMap((d) => d.tasks) ?? [];
  const weekComplete = allTasks.length > 0 && allTasks.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");

  if (loadingPlan) return <Cargando />;

  if (planMeta && semanaTerminada(planMeta.publish_at)) {
    return (
      <>
        <DiaLibre size="large" titulo="Estamos preparando la próxima semana" mensaje="El equipo está armando tus actividades. Pronto las vas a ver acá." />
        {!planMeta.family_reviewed_at && <AvisoEvaluarSemana large completa={weekComplete} to={`/app/participante/revision?plan=${planMeta.id}`} />}
      </>
    );
  }

  return (
    <>
      {tasks.length === 0 ? (
        <DiaLibre size="large" mensaje="Todavía no hay actividades para hoy." />
      ) : (
        <>
          <ResumenDelDia tasks={tasks} quien={null} size="large" />
          <LineaDelDia tasks={tasks} size="large" rutaActividad={rutaActividad} />
          {!weekComplete && <CierreDelDia size="large" pendientes={tasks.filter((t) => !estaRegistrada(t)).length} siguiente={siguienteDia(days ?? [])} />}
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && <AvisoEvaluarSemana large to={`/app/participante/revision?plan=${planMeta.id}`} />}
      {weekComplete && planMeta?.family_reviewed_at && <AvisoSemanaEnRevision large />}
    </>
  );
}
