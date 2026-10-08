import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { ResourceCard } from "../../components/ui/ResourceCard";
import { ChipToggle } from "../../components/ui/ChipToggle";
import { moduloLabel, tipoLabel as resourceTipoLabel, type MediaResource, type ResourceModulo } from "../../lib/mediaResources";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { CalendarSyncCard } from "../../components/ui/CalendarSyncCard";
import { useMyPatient } from "../../lib/useMyPatient";
import { usePendingReviews, usePlan } from "../../lib/usePlan";
import type { PlanDayStatus, PlanTask } from "../../lib/mockData";

const tipoLabel: Record<PlanTask["tipo"], string> = {
  video: "Video",
  actividad: "Actividad",
  estrategia: "Estrategia",
  neuroproteccion: "Neuroprotección",
};

const estadoBadge: Record<PlanDayStatus, { text: string; className: string } | null> = {
  realizado: { text: "✓ Realizado", className: "bg-fila-fria text-semaforo-verde-texto" },
  parcial: { text: "En parte", className: "bg-fila-calida text-semaforo-amarillo-texto" },
  no: { text: "No se realizó", className: "bg-campo text-tinta-tenue" },
  pendiente: { text: "Pendiente", className: "bg-verde-tenue text-verde-profundo" },
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
        <div className="border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-2xl p-3.5 mb-3">
          <p className="m-0 mb-1 text-[12px] tracking-[0.1em] uppercase text-verde-profundo">Mensaje de tu equipo clínico</p>
          <p className="m-0 text-[14px] leading-relaxed text-tinta">{task.notaClinica}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 mb-3">
        <ResourceDetailView
          content={{
            mediaKind: task.mediaKind,
            storagePath: task.storagePath,
            externalUrl: task.externalUrl,
            materiales: task.materiales,
            adaptacion: task.adaptacion,
            ciencia: task.ciencia,
            porQue: task.porQue,
            pasos: task.pasos,
            fallbackLabel: `${tipoLabel[task.tipo]}${task.duracion ? ` · ${task.duracion}` : ""}`,
          }}
        />
      </div>
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
  const navigate = useNavigate();
  const { data: myPatient } = useMyPatient();
  const { data: plan, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: pendientes } = usePendingReviews(myPatient?.id);
  const [openTask, setOpenTask] = useState<PlanTask | null>(null);

  if (loadingPlan) return <div className="flex-1" />;

  return (
    <div className="grid gap-8">
      {/* Evaluación semanal: solo aparece cuando corresponde (antes era una pestaña casi siempre vacía) */}
      {pendientes && pendientes.length > 0 && (
        <div className="border-[1.5px] border-verde-serenidad bg-verde-tenue rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 mb-0.5 text-[16px] font-bold text-verde-profundo">¿Cómo les fue la semana?</p>
            <p className="m-0 text-[14px] text-tinta-suave">Tres preguntas rápidas para que tu equipo ajuste la próxima.</p>
          </div>
          <Button variant="ink" dense onClick={() => navigate(`/app/revision?plan=${pendientes[0].id}`)}>
            Evaluar la semana
          </Button>
        </div>
      )}

      <section>
        <p className="m-0 mb-4.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Esta semana</p>
        {!plan || plan.length === 0 ? (
          <p className="m-0 text-[15px] text-tinta-tenue">Todavía no hay un plan asignado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {plan.map((day) => (
              <div key={day.dia}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className={`text-[14px] font-bold ${day.isToday ? "text-verde-profundo" : "text-tinta-tenue"}`}>{day.dia}</span>
                  {day.isToday && <span className="text-[11px] uppercase tracking-[0.08em] bg-verde-tenue text-verde-profundo px-2 py-0.5 rounded-full font-semibold">Hoy</span>}
                </div>
                {day.tasks.length === 0 ? (
                  <p className="m-0 text-[14px] text-tinta-tenue">Sin actividades programadas.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {day.tasks.map((task) => (
                      <TaskChip key={task.id} task={task} onOpen={() => setOpenTask(task)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {myPatient?.id && <SemanasAnteriores patientId={myPatient.id} />}

      <MasActividades />

      {myPatient?.id && <CalendarSyncCard patientId={myPatient.id} />}

      {openTask && (
        <Modal onClose={() => setOpenTask(null)}>
          <TaskDetail task={openTask} />
        </Modal>
      )}
    </div>
  );
}

// Historial corto: las últimas semanas ya terminadas, con acceso a su resumen.
function SemanasAnteriores({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["semanas-anteriores", patientId],
    queryFn: async () => {
      const { data: plans, error } = await supabase
        .from("plans")
        .select("id, publish_at, family_reviewed_at")
        .eq("patient_id", patientId)
        .eq("status", "published")
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (plans ?? []).slice(1) as { id: string; publish_at: string; family_reviewed_at: string | null }[];
    },
  });
  if (!data || data.length === 0) return null;
  return (
    <section>
      <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Semanas anteriores</p>
      <div className="grid gap-2">
        {data.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => navigate(p.family_reviewed_at ? `/app/resumen?plan=${p.id}` : `/app/revision?plan=${p.id}`)}
            className="flex items-center justify-between gap-3 text-left bg-white border border-borde rounded-2xl px-4 py-3 cursor-pointer hover:border-verde-serenidad font-sans"
          >
            <span className="text-[15px] font-semibold text-tinta">
              Semana del {new Date(p.publish_at).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}
            </span>
            <span className={`text-[13px] font-semibold ${p.family_reviewed_at ? "text-tinta-tenue" : "text-verde-profundo"}`}>
              {p.family_reviewed_at ? "Ver resumen ›" : "Evaluar ›"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// La biblioteca, pero solo lo compatible con el perfil (actividades_sugeridas
// filtra por nivel cognitivo informado y seguridad motora) — reemplaza a la
// antigua pestaña Actividades, que mostraba el catálogo completo.
function MasActividades() {
  const { data: resources, isLoading } = useQuery({
    queryKey: ["actividades-sugeridas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("actividades_sugeridas");
      if (error) throw error;
      return data as MediaResource[];
    },
  });
  const [modulo, setModulo] = useState<ResourceModulo | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [opened, setOpened] = useState<MediaResource | null>(null);

  const list = (resources ?? []).filter((r) => !modulo || r.modulo === modulo);
  const visibles = verTodas ? list : list.slice(0, 6);
  const modulosPresentes = (Object.keys(moduloLabel) as ResourceModulo[]).filter((m) => (resources ?? []).some((r) => r.modulo === m));

  return (
    <section>
      <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Más actividades para hacer juntos</p>
      <p className="m-0 mb-3.5 text-[14.5px] leading-relaxed text-tinta-suave">
        Elegidas según el perfil — para los días con ganas de más, además de lo que ya está en el plan.
      </p>
      {modulosPresentes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <ChipToggle active={modulo === null} onToggle={() => setModulo(null)}>
            Todas
          </ChipToggle>
          {modulosPresentes.map((m) => (
            <ChipToggle key={m} active={modulo === m} onToggle={() => setModulo(modulo === m ? null : m)}>
              {moduloLabel[m]}
            </ChipToggle>
          ))}
        </div>
      )}
      {isLoading && <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>}
      {!isLoading && list.length === 0 && <p className="m-0 text-[15px] text-tinta-tenue">Por ahora no hay actividades extra para sugerir.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibles.map((r) => (
          <ResourceCard key={r.id} resource={r} onClick={() => setOpened(r)} />
        ))}
      </div>
      {list.length > 6 && (
        <button
          type="button"
          onClick={() => setVerTodas((v) => !v)}
          className="mt-3.5 text-[14px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none"
        >
          {verTodas ? "Ver menos" : `Ver las ${list.length} actividades`}
        </button>
      )}
      {opened && (
        <Modal onClose={() => setOpened(null)}>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">
            {moduloLabel[opened.modulo]} · {resourceTipoLabel[opened.tipo]}
            {opened.duracion ? ` · ${opened.duracion}` : ""}
          </p>
          <h3 className="font-serif font-normal text-2xl m-0 mb-4">{opened.titulo}</h3>
          <div className="grid grid-cols-1 gap-4">
            <ResourceDetailView
              content={{
                mediaKind: opened.media_kind,
                storagePath: opened.storage_path,
                externalUrl: opened.external_url,
                materiales: opened.materiales,
                adaptacion: opened.adaptacion,
                ciencia: opened.ciencia,
                porQue: opened.por_que,
                pasos: opened.pasos ?? undefined,
                fallbackLabel: `${resourceTipoLabel[opened.tipo]}${opened.duracion ? ` · ${opened.duracion}` : ""}`,
              }}
            />
            {opened.precaucion && (
              <p className="m-0 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3">{opened.precaucion}</p>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
