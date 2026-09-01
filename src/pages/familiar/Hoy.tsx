import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import type { PlanTask } from "../../lib/mockData";
import { ImagePlaceholder } from "../../components/ui/ImagePlaceholder";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePlan, useCurrentPlanMeta } from "../../lib/usePlan";
import { Button } from "../../components/ui/Button";

const estadoBadge: Record<PlanTask["estado"], { text: string; className: string } | null> = {
  realizado: { text: "✓ Realizado", className: "bg-fila-fria text-[#4c7a4c]" },
  parcial: { text: "En parte", className: "bg-fila-calida text-semaforo-amarillo-texto" },
  no: { text: "No se realizó", className: "bg-campo text-tinta-tenue" },
  pendiente: null,
  futuro: null,
};

function TaskRow({ task, onOpen }: { task: PlanTask; onOpen: () => void }) {
  const badge = estadoBadge[task.estado];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left flex gap-3.5 items-start rounded-2xl border border-borde bg-white p-3.5 hover:border-verde-serenidad cursor-pointer"
    >
      <div className="shrink-0 w-16">
        <ImagePlaceholder label={task.tipo} height={64} rounded="rounded-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-verde-profundo">{task.hora}</span>
          {task.duracion && <span className="text-[13px] text-tinta-tenue">· {task.duracion}</span>}
        </div>
        <p className="m-0 text-[16px] font-semibold text-tinta leading-snug">{task.titulo}</p>
        {task.detalle && <p className="m-0 mt-0.5 text-[14px] text-tinta-suave leading-snug line-clamp-2">{task.detalle}</p>}
        {badge && <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[12px] font-semibold ${badge.className}`}>{badge.text}</span>}
      </div>
    </button>
  );
}

export function Hoy() {
  const navigate = useNavigate();
  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const { data: myPatient } = useMyPatient();
  const { data: days, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);

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

  const today = days?.find((d) => d.isToday);
  // Registered tasks (any outcome) drop to a separate "Realizado" section so
  // the top of the page only ever shows what's still actionable today.
  const pendingTasks = today?.tasks.filter((t) => t.estado !== "realizado" && t.estado !== "parcial" && t.estado !== "no") ?? [];
  const doneTasks = today?.tasks.filter((t) => t.estado === "realizado" || t.estado === "parcial" || t.estado === "no") ?? [];

  const allTasks = days?.flatMap((d) => d.tasks) ?? [];
  const weekComplete = allTasks.length > 0 && allTasks.every((t) => t.estado !== "pendiente" && t.estado !== "futuro");

  if (loadingPlan) return <div className="flex-1" />;

  return (
    <div>
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

      <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Actividades de hoy</p>

      {!today || today.tasks.length === 0 ? (
        <div className="bg-fila-fria rounded-2xl p-5 mb-4.5">
          <p className="m-0 text-[16px] leading-relaxed text-verde-profundo">No hay actividades programadas para hoy.</p>
        </div>
      ) : (
        <>
          {pendingTasks.length === 0 ? (
            <div className="bg-fila-fria rounded-2xl p-5 mb-4.5">
              <p className="m-0 text-[16px] leading-relaxed text-verde-profundo">Ya registraste todas las actividades de hoy. ¡Buen trabajo!</p>
            </div>
          ) : (
            <div className="grid gap-2.5 mb-4.5">
              {pendingTasks.map((task) => (
                <TaskRow key={task.id} task={task} onOpen={() => navigate(`/app/hoy/actividad/${task.id}`)} />
              ))}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="mb-4.5">
              <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Realizado</p>
              <div className="grid gap-2.5 opacity-80">
                {doneTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onOpen={() => navigate(`/app/hoy/actividad/${task.id}`)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {weekComplete && planMeta && !planMeta.family_reviewed_at && (
        <div className="border-[1.5px] border-verde-serenidad bg-[#f5f9f9] rounded-2xl p-4.5 mt-4.5">
          <p className="m-0 mb-1 text-[16px] font-bold text-verde-profundo">¡Semana completa!</p>
          <p className="m-0 mb-3 text-[14px] text-tinta-suave">Ya registraste todas las actividades de la semana. Contanos cómo estuvo.</p>
          <Button variant="ink" dense to={`/app/revision?plan=${planMeta.id}`}>
            Evaluar la semana
          </Button>
        </div>
      )}

      {weekComplete && planMeta?.family_reviewed_at && (
        <div className="border border-borde bg-white rounded-2xl p-4.5 mt-4.5">
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
            Tu equipo clínico está revisando la semana. Pronto vas a tener novedades y las actividades de la próxima semana.
          </p>
        </div>
      )}
    </div>
  );
}
