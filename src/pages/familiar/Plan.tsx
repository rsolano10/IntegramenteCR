import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { weeklyPlan, type PlanDayStatus, type PlanTask } from "../../lib/mockData";

const tipoLabel: Record<PlanTask["tipo"], string> = {
  video: "Video",
  actividad: "Actividad",
  estrategia: "Estrategia",
  neuroproteccion: "Neuroprotección",
};

const estadoBadge: Record<PlanDayStatus, { text: string; className: string } | null> = {
  realizado: { text: "✓ Realizado", className: "bg-fila-fria text-[#4c7a4c]" },
  parcial: { text: "En parte", className: "bg-fila-calida text-semaforo-amarillo-texto" },
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
      {task.precaucion && (
        <p className="m-0 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3">{task.precaucion}</p>
      )}
    </div>
  );
}

export function Plan() {
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [openTask, setOpenTask] = useState<PlanTask | null>(null);

  const tabClass = (active: boolean) =>
    `min-h-11 rounded-full border-none font-sans text-[15px] font-semibold cursor-pointer ${
      active ? "bg-white text-tinta shadow-[0_2px_8px_-4px_rgba(31,51,56,.6)]" : "bg-transparent text-tinta-tenue"
    }`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4.5 flex-wrap">
        <div>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Semana del 10 al 16</p>
          <h3 className="font-serif font-normal text-[22px] m-0">Objetivo: participar en dos actividades con una sola indicación.</h3>
        </div>
        <div className="grid grid-cols-2 gap-1 bg-[#f2eede] p-1 rounded-full shrink-0">
          <button type="button" onClick={() => setView("lista")} className={tabClass(view === "lista")}>
            Lista
          </button>
          <button type="button" onClick={() => setView("calendario")} className={tabClass(view === "calendario")}>
            Calendario
          </button>
        </div>
      </div>

      {view === "lista" ? (
        <div className="grid gap-5">
          {weeklyPlan.map((day) => (
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
      ) : (
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 gap-2.5 min-w-[820px] lg:min-w-0">
            {weeklyPlan.map((day) => (
              <div
                key={day.dia}
                className={`rounded-2xl p-2.5 min-h-[220px] ${day.isToday ? "bg-[#f5f9f9] border-[1.5px] border-verde-serenidad" : "bg-campo border border-[#efeada]"}`}
              >
                <p className={`m-0 mb-2 text-[13px] font-bold text-center ${day.isToday ? "text-verde-profundo" : "text-tinta-tenue"}`}>
                  {day.dia}
                </p>
                <div className="grid gap-2">
                  {day.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setOpenTask(task)}
                      className="text-left rounded-xl bg-white border border-borde p-2 hover:border-verde-serenidad cursor-pointer"
                    >
                      <span className="block text-[11px] font-bold text-verde-profundo">{task.hora}</span>
                      <span className="block text-[13px] leading-snug text-tinta">{task.titulo}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="m-0 mt-5 text-[15px] leading-relaxed text-tinta-tenue">Neuroprotección: ofrecer agua en cada comida y a media tarde.</p>

      {openTask && (
        <Modal onClose={() => setOpenTask(null)}>
          <TaskDetail task={openTask} />
        </Modal>
      )}
    </div>
  );
}
