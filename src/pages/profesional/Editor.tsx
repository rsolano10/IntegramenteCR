import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { getPlanRestrictions } from "../../lib/patient";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { planHistory } from "../../lib/mockData";

const restrictionDot: Record<"verde" | "amarillo" | "rojo", string> = {
  verde: "bg-semaforo-verde",
  amarillo: "bg-semaforo-amarillo",
  rojo: "bg-semaforo-rojo",
};

export function Editor() {
  const navigate = useNavigate();
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const plan = useAppStore((s) => s.plan);
  const planDraft = useAppStore((s) => s.planDraft);
  const startPlanDraft = useAppStore((s) => s.startPlanDraft);
  const updateDraftTask = useAppStore((s) => s.updateDraftTask);
  const publishPlan = useAppStore((s) => s.publishPlan);
  const saveDraftOnly = useAppStore((s) => s.saveDraftOnly);
  const auditLog = useAppStore((s) => s.auditLog);
  const pushAudit = useAppStore((s) => s.pushAudit);
  const [editing, setEditing] = useState<{ dia: string; taskId: string; titulo: string; hora: string } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!planDraft) startPlanDraft();
  }, [planDraft, startPlanDraft]);

  const displayPlan = planDraft ?? plan;
  const restrictions = getPlanRestrictions(onboarding2);
  const recentPlanHistory = auditLog
    .filter((a) => a.entidad === "Plan")
    .slice(0, 5)
    .map((a) => ({ quien: `${a.creadoEn} · ${a.autor}`, que: a.accion }));

  function publish() {
    publishPlan();
    navigate("/app/profesional/panel");
  }

  function saveDraft() {
    saveDraftOnly();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  }

  function saveEdit() {
    if (!editing) return;
    updateDraftTask(editing.dia, editing.taskId, { titulo: editing.titulo, hora: editing.hora });
    pushAudit("Plan", `cambia ítem de ${editing.dia}`, "Dra. Guiselle Solano");
    setEditing(null);
  }

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      <Link to="/app/profesional/panel" className="inline-block border-none bg-transparent font-sans text-[15px] text-verde-profundo pb-4">
        ‹ Volver al panel
      </Link>
      <h1 className="font-serif font-normal text-[26px] sm:text-[34px] m-0 mb-1.5">Plan de Rosa · esta semana</h1>
      <p className="m-0 mb-6.5 text-base sm:text-[17px] text-tinta-tenue">
        Propuesta generada por reglas. Cada cambio se registra y la familia ve el motivo.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <div className="bg-white border border-borde rounded-3xl p-4 sm:p-7 grid gap-3">
          {displayPlan
            .filter((day) => day.tasks.length > 0)
            .map((day) => (
              <div key={day.dia} className="grid gap-2">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:grid sm:grid-cols-[90px_1fr_auto] gap-2.5 sm:gap-3.5 sm:items-center p-3.5 sm:p-4 rounded-2xl bg-fila-fria"
                  >
                    <span className="text-sm font-bold text-verde-profundo">
                      {day.dia}
                      {day.isToday && " · hoy"}
                    </span>
                    <span className="text-[16px]">
                      {task.titulo}
                      <br />
                      <span className="text-sm text-tinta-tenue">{task.hora}</span>
                      {task.precaucion && (
                        <>
                          <br />
                          <span className="text-sm text-semaforo-amarillo-texto">{task.precaucion}</span>
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditing({ dia: day.dia, taskId: task.id, titulo: task.titulo, hora: task.hora })}
                      className="self-start min-h-10 px-3.5 rounded-full border-[1.5px] border-borde bg-white font-sans text-sm font-semibold cursor-pointer hover:border-verde-serenidad"
                    >
                      Cambiar
                    </button>
                  </div>
                ))}
              </div>
            ))}
          <div className="border-t border-[#efeada] pt-4.5 mt-1.5 flex items-center gap-3 flex-wrap">
            <Button variant="ink" dense onClick={publish}>
              Publicar a la familia
            </Button>
            <Button variant="secondary" dense onClick={saveDraft}>
              Guardar borrador
            </Button>
            {savedNotice && <span className="text-sm text-verde-profundo">Borrador guardado.</span>}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="bg-white border border-borde rounded-2xl p-6">
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Restricciones activas</p>
            <div className="grid gap-2.5 text-[16px] leading-relaxed text-tinta-suave">
              {restrictions.map((r) => (
                <span key={r.texto} className="grid grid-cols-[12px_1fr] gap-3 items-start">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${restrictionDot[r.color]}`} />
                  {r.texto}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-campo border border-[#efeada] rounded-2xl p-6">
            <p className="m-0 mb-2.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Historial</p>
            <div className="grid gap-2.5 text-[15px] leading-relaxed text-tinta-tenue">
              {recentPlanHistory.map((h, i) => (
                <span key={`recent-${i}`}>
                  <strong className="text-tinta">{h.quien}</strong> {h.que}
                </span>
              ))}
              {planHistory.map((h) => (
                <span key={h.quien}>
                  <strong className="text-tinta">{h.quien}</strong> {h.que}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Cambiar actividad</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">{editing.dia}</p>
          <div className="grid gap-4">
            <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
              Título
              <input
                type="text"
                value={editing.titulo}
                onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
                className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
              />
            </label>
            <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
              Hora
              <input
                type="text"
                value={editing.hora}
                onChange={(e) => setEditing({ ...editing, hora: e.target.value })}
                className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta max-w-[160px]"
              />
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button variant="ink" onClick={saveEdit}>
              Guardar en el borrador
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
