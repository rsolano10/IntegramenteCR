import { useNavigate } from "react-router-dom";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta } from "../../lib/usePlan";
import type { PlanTask } from "../../lib/mockData";

const estadoBadge: Record<PlanTask["estado"], { text: string; className: string } | null> = {
  realizado: { text: "✓ Hecho", className: "bg-fila-fria text-[#4c7a4c]" },
  parcial: { text: "Con ayuda", className: "bg-fila-calida text-semaforo-amarillo-texto" },
  no: { text: "No se pudo", className: "bg-campo text-tinta-tenue" },
  pendiente: null,
  futuro: null,
};

function TaskRow({ task, onOpen }: { task: PlanTask; onOpen: () => void }) {
  const badge = estadoBadge[task.estado];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left flex gap-4 items-center rounded-2xl border-2 border-borde bg-white p-4 cursor-pointer hover:border-verde-serenidad"
    >
      <div className="shrink-0 w-[76px]">
        <ImagePlaceholder label={task.tipo} height={76} rounded="rounded-xl" />
      </div>
      <div className="flex-1 min-w-0">
        {task.hora && <p className="m-0 mb-0.5 text-[15px] font-bold text-verde-profundo">{task.hora}</p>}
        <p className="m-0 text-[20px] font-bold text-tinta leading-snug">{task.titulo}</p>
        {task.detalle && <p className="m-0 mt-1 text-[16px] text-tinta-suave leading-snug">{task.detalle}</p>}
        {badge && <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[13px] font-bold ${badge.className}`}>{badge.text}</span>}
      </div>
    </button>
  );
}

export function ParticipanteHoy() {
  const navigate = useNavigate();
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);
  const today = days?.find((d) => d.isToday);
  // Registered tasks (any outcome) drop to a separate "Realizado" section so
  // the top of the page only ever shows what's still left to do today.
  const pendingTasks = today?.tasks.filter((t) => t.estado !== "realizado" && t.estado !== "parcial" && t.estado !== "no") ?? [];
  const doneTasks = today?.tasks.filter((t) => t.estado === "realizado" || t.estado === "parcial" || t.estado === "no") ?? [];

  const allTasks = days?.flatMap((d) => d.tasks) ?? [];
  const weekComplete = allTasks.length > 0 && allTasks.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");

  if (loadingPlan) return <div className="flex-1" />;

  return (
    <>
      <p className="m-0 text-xl text-tinta-suave">Hoy toca:</p>

      {!today || today.tasks.length === 0 ? (
        <div className="bg-fila-fria rounded-2xl p-5">
          <p className="m-0 text-[20px] leading-relaxed text-verde-profundo">Todavía no hay actividades para hoy.</p>
        </div>
      ) : (
        <>
          {pendingTasks.length === 0 ? (
            <div className="bg-fila-fria rounded-2xl p-5">
              <p className="m-0 text-[20px] leading-relaxed text-verde-profundo">¡Ya hiciste todo lo de hoy!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingTasks.map((task) => (
                <TaskRow key={task.id} task={task} onOpen={() => navigate(`/app/participante/actividad/${task.id}`)} />
              ))}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div>
              <p className="m-0 mb-3 text-xl text-tinta-suave">Realizado</p>
              <div className="grid gap-3 opacity-80">
                {doneTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onOpen={() => navigate(`/app/participante/actividad/${task.id}`)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && (
        <div className="border-2 border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-5">
          <p className="m-0 mb-1 text-[22px] font-bold text-verde-profundo">¡Semana completa!</p>
          <p className="m-0 mb-4 text-[17px] text-tinta-suave">Ya hiciste todas las actividades de la semana. Contanos cómo estuvo.</p>
          <button
            type="button"
            onClick={() => navigate(`/app/participante/revision?plan=${planMeta.id}`)}
            className="w-full min-h-17 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-[20px] font-bold cursor-pointer hover:bg-verde-profundo"
          >
            Evaluar la semana
          </button>
        </div>
      )}

      {weekComplete && planMeta?.family_reviewed_at && (
        <div className="border-2 border-borde bg-white rounded-2xl p-5">
          <p className="m-0 text-[17px] leading-relaxed text-tinta-suave">
            Tu equipo clínico está revisando la semana. Pronto vas a tener novedades.
          </p>
        </div>
      )}
    </>
  );
}
