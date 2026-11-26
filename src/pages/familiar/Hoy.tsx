import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta, useActividadesSugeridas, RUTA_EXTRAS } from "../../lib/usePlan";
import { CierreDelDia, DiaLibre, EnlaceExtras, LineaDelDia, ResumenDelDia } from "../../components/hoy/HoyDelDia";
import { siguienteDia } from "../../lib/siguienteDia";
import { AvisoPedidoAyuda } from "../../components/familiar/AvisoPedidoAyuda";
import { AvisoEvaluarSemana, AvisoSemanaEnRevision } from "../../components/familiar/AvisoEvaluarSemana";
import { Cargando } from "../../components/ui/Cargando";
import { estaRegistrada } from "../../lib/estadoActividad";
import { semanaTerminada } from "../../lib/planWeek";

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
  // Actividades extra (fuera del plan): el enlace aparece solo si hay alguna.
  const { data: sugeridas } = useActividadesSugeridas();
  const extras = sugeridas && sugeridas.length > 0 ? RUTA_EXTRAS : undefined;

  if (loadingPlan) return <Cargando />;

  // La semana del último plan ya terminó y la clínica no publicó la
  // siguiente: nada de «hoy» con actividades de la semana pasada.
  if (planMeta && semanaTerminada(planMeta.publish_at)) {
    return (
      <div className="grid gap-6">
        <AvisoPedidoAyuda patientId={myPatient?.id} nombre={quien ?? "Tu familiar"} />
        <DiaLibre
          titulo="Estamos preparando la próxima semana"
          mensaje={`El equipo está armando las actividades${quien ? ` de ${quien}` : ""}. Te avisamos cuando estén listas.`}
          extras={extras}
        />
        {!planMeta.family_reviewed_at && <AvisoEvaluarSemana completa={weekComplete} publishAt={planMeta.publish_at} to={`/app/revision?plan=${planMeta.id}`} />}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AvisoPedidoAyuda patientId={myPatient?.id} nombre={quien ?? "Tu familiar"} />
      {tasks.length === 0 ? (
        <DiaLibre mensaje="No hay actividades programadas para hoy. Podés mirar lo que viene en la pestaña de la semana." extras={extras} />
      ) : (
        <>
          <ResumenDelDia tasks={tasks} quien={quien} />
          <LineaDelDia tasks={tasks} rutaActividad={rutaActividad} />
          {!weekComplete && <CierreDelDia pendientes={tasks.filter((t) => !estaRegistrada(t)).length} siguiente={siguienteDia(days ?? [])} extras={extras} />}
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && <AvisoEvaluarSemana to={`/app/revision?plan=${planMeta.id}`} />}
      {weekComplete && planMeta?.family_reviewed_at && <AvisoSemanaEnRevision />}
      {weekComplete && tasks.length > 0 && extras && (
        <div className="text-center">
          <EnlaceExtras to={extras} />
        </div>
      )}
    </div>
  );
}
