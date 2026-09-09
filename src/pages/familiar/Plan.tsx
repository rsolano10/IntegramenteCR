import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { CalendarSyncCard } from "../../components/ui/CalendarSyncCard";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan } from "../../lib/usePlan";
import type { PlanDayStatus, PlanTask } from "../../lib/mockData";

const tipoLabel: Record<PlanTask["tipo"], string> = {
  video: "Video",
  actividad: "Actividad",
  estrategia: "Estrategia",
  neuroproteccion: "Neuroprotección",
};

const estadoBadge: Record<PlanDayStatus, { text: string; className: string } | null> = {
  realizado: { text: "✓ Realizado", className: "bg-fila-fria text-[#4c7a4c]" },
  parcial: { text: "En parte", className: "bg-fila-calida text-semaforo-amarillo-texto" },
  no: { text: "No se realizó", className: "bg-campo text-tinta-tenue" },
  pendiente: { text: "Pendiente", className: "bg-[#edf4f4] text-verde-profundo" },
  futuro: null,
};

function TaskChip({ task, onOpen }: { task: PlanTask; onOpen: () => void }) {
  const badge = estadoBadge[task.estado];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl border border-borde bg-white p-3.5 hover:border-verde-serenidad cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[13px] font-bold text-verde-profundo">{task.hora}</span>
        <span className="text-[11px] uppercase tracking-[0.08em] text-tinta-tenue">{tipoLabel[task.tipo]}</span>
      </div>
      <p className="m-0 text-[15px] leading-snug text-tinta">{task.titulo}</p>
      {badge && <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[12px] font-semibold ${badge.className}`}>{badge.text}</span>}
    </button>
  );
}

function TaskDetail({ task }: { task: PlanTask }) {
  const badge = estadoBadge[task.estado];
  return (
    <div>
      <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">
        {task.hora} · {tipoLabel[task.tipo]}
        {task.duracion ? ` · ${task.duracion}` : ""}
      </p>
      <h3 className="font-serif font-normal text-2xl m-0 mb-3">{task.titulo}</h3>
      {badge && <span className={`inline-block mb-3 px-3 py-1.5 rounded-full text-[13px] font-semibold ${badge.className}`}>{badge.text}</span>}
      {task.detalle && <p className="m-0 mb-3 text-base leading-relaxed text-tinta-suave">{task.detalle}</p>}
      {task.notaClinica && (
        <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-3.5 mb-3">
          <p className="m-0 mb-1 text-[12px] tracking-[0.1em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[14px] leading-relaxed text-tinta">{task.notaClinica}</p>
        </div>
      )}
      {task.precaucion && (
        <p className="m-0 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3">{task.precaucion}</p>
      )}
      {task.comentario && (
        <div className="bg-fila-calida rounded-2xl p-3.5 mt-3">
          <p className="m-0 mb-1 text-[13px] font-bold text-semaforo-amarillo-texto">Ayuda que necesitó</p>
          <p className="m-0 text-[14px] leading-relaxed text-tinta-suave">{task.comentario}</p>
        </div>
      )}
    </div>
  );
}

export function Plan() {
  const { data: myPatient } = useMyPatient();
  const { data: plan, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const [openTask, setOpenTask] = useState<PlanTask | null>(null);

  if (loadingPlan) return <div className="flex-1" />;

  return (
    <div>
      <div className="mb-4.5">
        <p className="m-0 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Tu plan de la semana</p>
      </div>

      {myPatient?.id && (
        <div className="mb-5">
          <CalendarSyncCard patientId={myPatient.id} />
        </div>
      )}

      {!plan || plan.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Todavía no hay un plan asignado.</p>
      ) : (
        <div className="grid gap-5">
          {plan.map((day) => (
            <div key={day.dia}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className={`text-[14px] font-bold ${day.isToday ? "text-verde-profundo" : "text-tinta-tenue"}`}>{day.dia}</span>
                {day.isToday && <span className="text-[11px] uppercase tracking-[0.08em] bg-[#edf4f4] text-verde-profundo px-2 py-0.5 rounded-full font-semibold">Hoy</span>}
              </div>
              {day.tasks.length === 0 ? (
                <p className="m-0 text-[14px] text-tinta-tenue">Sin actividades programadas.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {day.tasks.map((task) => (
                    <TaskChip key={task.id} task={task} onOpen={() => setOpenTask(task)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {openTask && (
        <Modal onClose={() => setOpenTask(null)}>
          <TaskDetail task={openTask} />
        </Modal>
      )}
    </div>
  );
}
