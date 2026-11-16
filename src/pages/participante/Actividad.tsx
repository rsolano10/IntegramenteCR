import { Link, useNavigate, useParams } from "react-router-dom";
import { BigActionButton } from "../../components/ui/BigActionButton";
import { PlayIcon } from "../../components/ui/Icons";
import { speak } from "../../lib/speech";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useGuardarProgreso, useCurrentPlanMeta } from "../../lib/usePlan";
import { guionDe } from "../../lib/sesiones";
import { PanelActividad } from "../../components/actividad/PanelActividad";
import { Cargando } from "../../components/ui/Cargando";

// La actividad, vista por la persona: el mismo tablero que la familia, en
// letra grande, con «Escuchar» y «Necesito ayuda». Se registra al terminar
// la actividad, no desde acá.
export function ParticipanteActividad() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const guardarProgreso = useGuardarProgreso(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);

  const today = days?.find((d) => d.isToday);
  const task = today?.tasks.find((t) => t.id === taskId) ?? null;

  const volver = (
    <Link to="/app/participante/hoy" className="inline-block border-none bg-transparent font-sans text-[17px] text-verde-profundo pb-3.5">
      ‹ Volver a Hoy
    </Link>
  );

  if (loadingPlan) return <Cargando />;

  if (!task || !today) {
    return (
      <>
        {volver}
        <p className="m-0 text-[20px] text-tinta-suave">No encontramos esa actividad.</p>
      </>
    );
  }

  const frase = guionDe(task.codigo)?.frase ?? task.intro ?? task.detalle ?? "";

  return (
    <>
      {volver}
      <PanelActividad
        task={task}
        dia={today}
        rutaPasos={`/app/participante/actividad/${task.id}/pasos`}
        publishAt={planMeta?.publish_at ?? null}
        onGuardarProgreso={(p) => guardarProgreso(task.id, p)}
        large
      />
      <div className="grid gap-3 mt-4">
        <BigActionButton variant="tertiary" size="md" onClick={() => speak([task.titulo, frase].filter(Boolean).join(". "))} className="inline-flex items-center justify-center gap-2.5">
          <PlayIcon /> Escuchar de qué se trata
        </BigActionButton>
        <BigActionButton variant="caution" size="md" onClick={() => navigate("/app/participante/ayuda")}>
          Necesito ayuda
        </BigActionButton>
      </div>
    </>
  );
}
