import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { ResourceCard } from "../../components/ui/ResourceCard";
import { ChipToggle } from "../../components/ui/ChipToggle";
import { moduloLabel, moduloTheme, tipoLabel as resourceTipoLabel, type MediaResource, type ResourceModulo } from "../../lib/mediaResources";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { useMyPatient } from "../../lib/useMyPatient";
import { useCurrentPlanMeta, usePendingReviews, usePlan } from "../../lib/usePlan";
import { weekDays } from "../../lib/planWeek";
import { ModuloIcon } from "../../components/ui/ModuloIcon";
import type { PlanDay, PlanDayStatus, PlanTask } from "../../lib/mockData";

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

const estadoMeta: Record<PlanDayStatus, { label: string; pill: string } | null> = {
  realizado: { label: "Hecha", pill: "bg-[#e3efe3] text-semaforo-verde-texto" },
  parcial: { label: "En parte", pill: "bg-aviso text-aviso-texto" },
  no: { label: "No se hizo", pill: "bg-campo text-tinta-tenue" },
  pendiente: null,
  futuro: null,
};

// Una actividad de la semana: el color y el ícono del módulo dan el
// "carácter" de la actividad de un vistazo, la hora manda en la jerarquía
// (es lo que organiza el día de un cuidador) y el estado se marca sin
// dramatismo — un día difícil nunca se pinta como un fracaso.
function WeekTaskCard({ task, isToday, onOpen }: { task: PlanTask; isToday: boolean; onOpen: () => void }) {
  const theme = task.modulo ? moduloTheme[task.modulo] : null;
  const estado = estadoMeta[task.estado];
  const hecha = task.estado === "realizado";
  const hora = task.hora ? task.hora.replace(/\s?([ap])\.m\./, " $1.m.") : "";
  const [hh, sufijo] = hora ? [hora.split(" ")[0], hora.split(" ").slice(1).join(" ")] : ["", ""];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full text-left flex items-stretch gap-0 rounded-[20px] border bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevada font-sans ${
        isToday && !estado ? "border-verde-serenidad" : "border-borde"
      }`}
    >
      <div
        className="relative w-[78px] shrink-0 flex flex-col items-center justify-center gap-1 text-white px-2 py-3"
        style={{ backgroundImage: theme ? `linear-gradient(160deg, ${theme.from}, ${theme.to})` : "linear-gradient(160deg, #a9c5c8, #6a969c)" }}
      >
        {task.modulo && <ModuloIcon modulo={task.modulo} className="w-5 h-5 opacity-90" />}
        {hh ? (
          <span className="text-center leading-none drop-shadow-sm">
            <span className="block font-serif text-[22px]">{hh}</span>
            <span className="block text-[10.5px] font-semibold uppercase tracking-wide mt-0.5 opacity-90">{sufijo}</span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Sin hora</span>
        )}
        {hecha && (
          <span className="absolute inset-0 bg-[#5f8b5f] flex flex-col items-center justify-center gap-1" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.2 4.2L19 7" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hh && <span className="text-[10.5px] font-semibold opacity-90">{hora}</span>}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center">
        <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: theme?.ink ?? "#3f6a70" }}>
          {task.modulo ? moduloLabel[task.modulo] : tipoLabel[task.tipo]}
          {task.duracion ? <span className="text-tinta-tenue font-normal normal-case tracking-normal"> · {task.duracion}</span> : null}
        </p>
        <p className={`m-0 mt-1 font-serif text-[18.5px] leading-snug ${hecha ? "text-tinta-suave" : "text-tinta"}`}>{task.titulo}</p>
        {(estado || task.notaClinica) && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {estado && <span className={`text-[12px] font-semibold rounded-full px-2.5 py-0.5 ${estado.pill}`}>{estado.label}</span>}
            {task.notaClinica && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-verde-profundo">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-verde-serenidad" />
                Nota de tu profesional
              </span>
            )}
          </div>
        )}
      </div>
      <span aria-hidden="true" className="self-center pr-4 text-tinta-tenue text-[18px] transition-transform group-hover:translate-x-0.5">
        ›
      </span>
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
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);
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

      {!plan || plan.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Todavía no hay un plan asignado.</p>
      ) : (
        <EstaSemana plan={plan} publishAt={planMeta?.publish_at ?? null} onOpen={(task, isToday) => (isToday && task.estado === "pendiente" ? navigate(`/app/hoy/actividad/${task.id}`) : setOpenTask(task))} />
      )}

      {myPatient?.id && <SemanasAnteriores patientId={myPatient.id} />}

      <MasActividades />

      {openTask && (
        <Modal onClose={() => setOpenTask(null)}>
          <TaskDetail task={openTask} />
        </Modal>
      )}
    </div>
  );
}

// La semana como línea de tiempo: encabezado con el avance, y cada día con
// su fecha "de calendario" a la izquierda — hoy resaltado, días pasados más
// tenues — y sus actividades a la derecha.
function EstaSemana({ plan, publishAt, onOpen }: { plan: PlanDay[]; publishAt: string | null; onOpen: (task: PlanTask, isToday: boolean) => void }) {
  const fechas = new Map((publishAt ? weekDays(new Date(publishAt)) : []).map((d) => [d.dia, d.date]));
  const todas = plan.flatMap((d) => d.tasks);
  const registradas = todas.filter((t) => t.estado === "realizado" || t.estado === "parcial").length;
  const pct = todas.length ? Math.round((registradas / todas.length) * 100) : 0;
  // By real date when the plan's start is known (a plan published on a
  // Sunday starts with that Sunday; a mid-week one ends with the coming
  // Sunday) — the stored order only knows weekday names.
  const dias = plan
    .filter((d) => d.tasks.length > 0)
    .sort((a, b) => (fechas.get(a.dia)?.getTime() ?? 0) - (fechas.get(b.dia)?.getTime() ?? 0));
  const primera = fechas.size ? [...fechas.values()][0] : null;
  const ultima = fechas.size ? [...fechas.values()][fechas.size - 1] : null;
  const fmt = (d: Date) => d.toLocaleDateString("es-CR", { day: "numeric", month: "long" });
  const hoyIdx = dias.findIndex((d) => d.isToday);

  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl bg-white border border-borde p-5 sm:p-6 mb-6">
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">Esta semana</p>
            <p className="m-0 mt-1 font-serif text-[24px] leading-tight text-tinta">
              {primera && ultima ? `${fmt(primera)} – ${fmt(ultima)}` : "Tu plan"}
            </p>
            <p className="m-0 mt-1 text-[14px] text-tinta-suave">
              {todas.length} actividades · {dias.length} {dias.length === 1 ? "día" : "días"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="-rotate-90">
              <circle cx="32" cy="32" r="27" fill="none" stroke="#ebe6ce" strokeWidth="7" />
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="#6a969c"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 27} ${2 * Math.PI * 27}`}
              />
            </svg>
            <div>
              <p className="m-0 font-serif text-[26px] leading-none text-tinta">
                {registradas}
                <span className="text-[16px] text-tinta-tenue">/{todas.length}</span>
              </p>
              <p className="m-0 mt-1 text-[12.5px] text-tinta-tenue">hechas</p>
            </div>
          </div>
        </div>
      </div>

      <ol className="list-none m-0 p-0 grid gap-6">
        {dias.map((day, i) => {
          const fecha = fechas.get(day.dia);
          const pasado = hoyIdx >= 0 && i < hoyIdx;
          return (
            <li key={day.dia} className={`grid grid-cols-[52px_1fr] sm:grid-cols-[64px_1fr] gap-3 sm:gap-4 ${pasado ? "opacity-75" : ""}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-[52px] sm:w-[60px] rounded-2xl text-center py-2 ${
                    day.isToday ? "bg-verde-profundo text-white shadow-elevada" : "bg-white border border-borde text-tinta"
                  }`}
                >
                  <span className={`block text-[11px] font-semibold uppercase tracking-wide ${day.isToday ? "text-[#c4dbdb]" : "text-tinta-tenue"}`}>
                    {day.dia.slice(0, 3)}
                  </span>
                  <span className="block font-serif text-[22px] leading-tight">{fecha ? fecha.getDate() : "·"}</span>
                </div>
                {day.isToday && <span className="mt-1.5 text-[10.5px] font-bold uppercase tracking-wider text-verde-profundo">Hoy</span>}
                {i < dias.length - 1 && <span aria-hidden="true" className="flex-1 w-px bg-borde mt-2" />}
              </div>
              <div className="grid gap-2.5 min-w-0">
                {day.tasks.map((task) => (
                  <WeekTaskCard key={task.id} task={task} isToday={!!day.isToday} onOpen={() => onOpen(task, !!day.isToday)} />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
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
  // Plegado por defecto: el plan de la semana es lo principal; esto es un
  // extra para quien lo busca. La consulta corre igual (para mostrar
  // cuántas hay en el botón), pero el catálogo solo se despliega a pedido.
  const [abierto, setAbierto] = useState(false);
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

  if (!abierto) {
    if (!isLoading && (resources ?? []).length === 0) return null;
    return (
      <section>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="group w-full text-left relative overflow-hidden rounded-3xl border border-borde bg-white p-5 sm:p-6 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-elevada font-sans"
        >
          <div aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex -space-x-3">
            {(Object.keys(moduloTheme) as ResourceModulo[]).map((m) => (
              <span
                key={m}
                className="w-12 h-12 rounded-2xl border-2 border-white flex items-center justify-center text-white shadow-sm"
                style={{ backgroundImage: `linear-gradient(150deg, ${moduloTheme[m].from}, ${moduloTheme[m].to})` }}
              >
                <ModuloIcon modulo={m} className="w-5 h-5" />
              </span>
            ))}
          </div>
          <p className="m-0 text-[12px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">¿Con ganas de más?</p>
          <p className="m-0 mt-1 font-serif text-[21px] leading-snug text-tinta sm:pr-56">Ver actividades sugeridas para hacer juntos</p>
          <p className="m-0 mt-1.5 text-[14px] text-tinta-suave sm:pr-56">
            {isLoading ? "Buscando…" : `${(resources ?? []).length} ideas elegidas según el perfil, además de lo del plan.`}
            <span className="ml-1.5 font-semibold text-verde-profundo group-hover:underline">Ver ›</span>
          </p>
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Más actividades para hacer juntos</p>
          <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave">
            Elegidas según el perfil — para los días con ganas de más, además de lo que ya está en el plan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="shrink-0 text-[13.5px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none"
        >
          Ocultar
        </button>
      </div>
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
