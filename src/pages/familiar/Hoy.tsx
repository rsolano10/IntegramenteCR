import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { rechazoTriggered } from "../../lib/rules";
import { todayFeaturedTask, getPatientName } from "../../lib/patient";
import { Link } from "react-router-dom";
import { ActivityCard } from "../../components/ui/ActivityCard";
import { OptionGroup } from "../../components/ui/OptionGroup";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";

const regMessages: Record<string, string> = {
  done: "Registrado. Mañana se repite para consolidar la rutina.",
  partial: "Registrado. Se acortará la próxima consigna.",
  no: "Registrado sin penalizar. Nadie tiene que justificar un día difícil.",
};

const estadoToReg: Record<string, "done" | "partial" | "no"> = {
  realizado: "done",
  parcial: "partial",
  no: "no",
};

export function Hoy() {
  const plan = useAppStore((s) => s.plan);
  const reg = useAppStore((s) => s.reg);
  const noCount = useAppStore((s) => s.noCount);
  const markRegistro = useAppStore((s) => s.markRegistro);
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const welcomeMessagePending = useAppStore((s) => s.welcomeMessagePending);
  const dismissWelcomeMessage = useAppStore((s) => s.dismissWelcomeMessage);

  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const { data: myPatient } = useMyPatient();
  const { data: recentMensajes } = useQuery({
    queryKey: ["mensajes-preview", myPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("id, texto, autor_id, created_at")
        .eq("patient_id", myPatient!.id)
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data as { id: string; texto: string; autor_id: string | null; created_at: string }[];
    },
    enabled: !!myPatient,
  });
  // Only surface the preview when the clinic spoke last — if the family sent
  // the last message, there's nothing new for them to see here.
  const ultimoMensaje = recentMensajes?.[0]?.autor_id !== myUserId ? recentMensajes?.[0] : undefined;
  const hasMoreMensajes = (recentMensajes?.length ?? 0) > 1;

  const today = plan.find((d) => d.isToday);

  // Pinned to a single task id so marking "Sí"/"En parte"/"No" doesn't
  // silently swap the visible card out from under the confirmation message
  // — the plan re-derives "next up" live, but what the family is looking
  // at right now shouldn't move until they choose to advance.
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  useEffect(() => {
    if (!today) return;
    if (activeTaskId && today.tasks.some((t) => t.id === activeTaskId)) return;
    setActiveTaskId(todayFeaturedTask(plan)?.task.id ?? today.tasks[0]?.id ?? null);
    // Only re-anchor when the day identity changes, not on every plan edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today?.dia]);

  const rechazo = rechazoTriggered(reg, noCount);
  const activeTask = today?.tasks.find((t) => t.id === activeTaskId) ?? null;
  const otherPending = today?.tasks.filter((t) => t.id !== activeTaskId && t.estado !== "realizado") ?? [];
  const showReg = activeTask ? estadoToReg[activeTask.estado] ?? null : null;

  return (
    <div>
      {welcomeMessagePending && (
        <Modal onClose={dismissWelcomeMessage}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">¡Ya tenés tu programa!</h2>
          <p className="m-0 mb-4 text-[16px] leading-relaxed text-tinta-suave">
            El equipo de IntegraMente revisó el perfil de {getPatientName(onboarding2)} y armó su primer programa personalizado. Ya
            podés ver la actividad de hoy y el resto de la semana.
          </p>
          {ultimoMensaje && (
            <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4.5 mb-5">
              <p className="m-0 mb-1 text-[13px] tracking-[0.12em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
              <p className="m-0 text-[16px] leading-relaxed text-tinta">{ultimoMensaje.texto}</p>
            </div>
          )}
          <Button variant="ink" fullWidth onClick={dismissWelcomeMessage}>
            Empezar
          </Button>
        </Modal>
      )}

      {ultimoMensaje && (
        <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4.5 mb-4.5">
          <p className="m-0 mb-1 text-[13px] tracking-[0.12em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[16px] leading-relaxed text-tinta">{ultimoMensaje.texto}</p>
          {hasMoreMensajes && (
            <Link to="/app/mensajes" className="inline-block mt-2 text-[13px] font-semibold text-verde-profundo">
              Ver mensajes anteriores ›
            </Link>
          )}
        </div>
      )}

      <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Lo único de hoy</p>

      {!activeTask ? (
        <div className="bg-fila-fria rounded-2xl p-5 mb-4.5">
          <p className="m-0 text-[16px] leading-relaxed text-verde-profundo">
            No hay más actividades pendientes para hoy. ¡Buen trabajo!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4.5">
            <ActivityCard
              placeholderLabel={`${activeTask.tipo} · ${activeTask.titulo.toLowerCase()}`}
              title={activeTask.titulo}
              meta={[activeTask.duracion, activeTask.hora].filter(Boolean).join(" · ")}
            >
              {activeTask.precaucion && (
                <p className="m-0 mb-4 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-3.5 py-3">
                  {activeTask.precaucion}
                </p>
              )}
              <Button fullWidth to="/app/hoy/actividad">
                Abrir actividad
              </Button>
            </ActivityCard>
          </div>

          <p className="m-0 mb-2.5 text-[15px] font-semibold">¿Se realizó?</p>
          <div className="mb-4.5">
            <OptionGroup
              value={showReg ?? ""}
              onChange={(v) => markRegistro(activeTask.id, v as "done" | "partial" | "no")}
              options={[
                { value: "done", label: "Sí" },
                { value: "partial", label: "En parte" },
                { value: "no", label: "No" },
              ]}
            />
          </div>

          {showReg && (
            <div className="bg-fila-fria rounded-2xl p-4 mb-4.5">
              <p className="m-0 text-[16px] leading-relaxed text-verde-profundo">{regMessages[showReg]}</p>
              {otherPending.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTaskId(otherPending[0].id)}
                  className="mt-2.5 border-none bg-transparent p-0 font-sans text-[14px] font-semibold text-verde-profundo cursor-pointer underline"
                >
                  Siguiente: {otherPending[0].titulo} ›
                </button>
              )}
            </div>
          )}

          {rechazo && (
            <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl p-4.5 mb-4.5">
              <p className="m-0 mb-3 text-[16px] leading-relaxed text-riesgo-texto">
                Es la tercera vez que esta actividad no se hace. Podemos cambiarla.
              </p>
              <Button variant="caution" dense to="/app/alerta/rechazo">
                Revisar el ajuste
              </Button>
            </div>
          )}
        </>
      )}

      <div className="bg-mostaza-vital rounded-2xl p-4.5 mb-4.5">
        <p className="m-0 mb-1.5 text-[13px] tracking-[0.12em] uppercase text-[#7a5c1c]">Estrategia de la semana</p>
        <p className="m-0 text-[16px] leading-snug text-[#4a3a1b]">Dar una instrucción por vez y evitar corregir innecesariamente.</p>
      </div>

      {reg && (
        <div className="border border-borde bg-white rounded-2xl p-4.5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="m-0 mb-0.5 text-[15px] font-bold">Revisión semanal disponible</p>
            <p className="m-0 text-[14px] text-tinta-tenue">Tres preguntas cortas sobre cómo fue la semana.</p>
          </div>
          <Button variant="secondary" dense to="/app/revision">
            Revisar la semana
          </Button>
        </div>
      )}
    </div>
  );
}
