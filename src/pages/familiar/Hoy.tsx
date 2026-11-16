import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta } from "../../lib/usePlan";
import { CierreDelDia, DiaLibre, LineaDelDia, ResumenDelDia } from "../../components/hoy/HoyDelDia";
import { siguienteDia } from "../../lib/siguienteDia";
import { AvisoPedidoAyuda } from "../../components/familiar/AvisoPedidoAyuda";
import { AvisoEvaluarSemana, AvisoSemanaEnRevision } from "../../components/familiar/AvisoEvaluarSemana";
import { Cargando } from "../../components/ui/Cargando";

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

  if (loadingPlan) return <Cargando />;

  return (
    <div className="grid gap-6">
      <AvisoPedidoAyuda patientId={myPatient?.id} nombre={quien ?? "Tu familiar"} />
      {tasks.length === 0 ? (
        <DiaLibre mensaje="No hay actividades programadas para hoy. Podés mirar lo que viene en la pestaña de la semana." />
      ) : (
        <>
          <ResumenDelDia tasks={tasks} quien={quien} />
          <LineaDelDia tasks={tasks} rutaActividad={rutaActividad} />
          {!weekComplete && <CierreDelDia pendientes={tasks.filter((t) => t.estado === "pendiente").length} siguiente={siguienteDia(days ?? [])} />}
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && <AvisoEvaluarSemana to={`/app/revision?plan=${planMeta.id}`} />}
      {weekComplete && planMeta?.family_reviewed_at && <AvisoSemanaEnRevision />}
    </div>
  );
}
