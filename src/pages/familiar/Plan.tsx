import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Modal } from "../../components/ui/Modal";
import { ResourceCard } from "../../components/ui/ResourceCard";
import { ChipToggle } from "../../components/ui/ChipToggle";
import { moduloLabel, moduloTheme, tipoLabel as resourceTipoLabel, type MediaResource, type ResourceModulo } from "../../lib/mediaResources";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { useMyPatient } from "../../lib/useMyPatient";
import { ModuloIcon } from "../../components/ui/ModuloIcon";
import { useCurrentPlanMeta, usePendingReviews, usePlan } from "../../lib/usePlan";
import { weekDays } from "../../lib/planWeek";
import type { PlanDay } from "../../lib/mockData";
import { contenidoDeRecurso } from "../../lib/contenidoRecurso";
import { usePerfilRecursos } from "../../lib/usePerfilRecursos";
import { IntroGerontogimnasia } from "../../components/ui/IntroGerontogimnasia";
import { useSemanasAnteriores } from "../../lib/semanasAnteriores";
import { FilaSemana } from "../../components/familiar/FilaSemana";
import { Cargando } from "../../components/ui/Cargando";
import { CajaAvance } from "../../components/ui/CajaAvance";
import { TarjetaActividad } from "../../components/actividad/TarjetaActividad";
import { AvisoEvaluarSemana } from "../../components/familiar/AvisoEvaluarSemana";
import { contarHechas } from "../../lib/estadoActividad";

// «15 al 21 de noviembre», o «29 de octubre al 4 de noviembre».
function rangoDeFechas(a: Date, b: Date) {
  const mes = (d: Date) => d.toLocaleDateString("es-CR", { month: "long" });
  return mes(a) === mes(b) ? `${a.getDate()} al ${b.getDate()} de ${mes(b)}` : `${a.getDate()} de ${mes(a)} al ${b.getDate()} de ${mes(b)}`;
}

export function Plan() {
  const { data: myPatient } = useMyPatient();
  const { data: plan, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: pendientes } = usePendingReviews(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);

  if (loadingPlan) return <Cargando />;

  return (
    <div className="grid gap-8">
      {/* Evaluación semanal: solo aparece cuando corresponde. */}
      {pendientes && pendientes.length > 0 && <AvisoEvaluarSemana to={`/app/revision?plan=${pendientes[0].id}`} />}

      {!plan || plan.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Todavía no hay un plan asignado.</p>
      ) : (
        // Toda actividad se abre en su pantalla (la misma que desde Hoy);
        // «Volver» regresa a Mi semana.
        <EstaSemana plan={plan} publishAt={planMeta?.publish_at ?? null} />
      )}

      {myPatient?.id && <SemanasAnteriores patientId={myPatient.id} />}

      <MasActividades />

    </div>
  );
}

// La semana como línea de tiempo: encabezado con el avance, y cada día con
// su fecha "de calendario" a la izquierda — hoy resaltado, días pasados más
// tenues — y sus actividades a la derecha.
function EstaSemana({ plan, publishAt }: { plan: PlanDay[]; publishAt: string | null }) {
  const fechas = new Map((publishAt ? weekDays(new Date(publishAt)) : []).map((d) => [d.dia, d.date]));
  const todas = plan.flatMap((d) => d.tasks);
  const hechas = contarHechas(todas);
  // By real date when the plan's start is known (a plan published on a
  // Sunday starts with that Sunday; a mid-week one ends with the coming
  // Sunday) — the stored order only knows weekday names.
  const dias = plan
    .filter((d) => d.tasks.length > 0)
    .sort((a, b) => (fechas.get(a.dia)?.getTime() ?? 0) - (fechas.get(b.dia)?.getTime() ?? 0));
  const primera = fechas.size ? [...fechas.values()][0] : null;
  const ultima = fechas.size ? [...fechas.values()][fechas.size - 1] : null;
  const rango = primera && ultima ? rangoDeFechas(primera, ultima) : "Tu plan";
  const hoyIdx = dias.findIndex((d) => d.isToday);

  return (
    <section>
      <div className="mb-6">
        <CajaAvance
          antetitulo="Esta semana"
          hechas={hechas}
          total={todas.length}
          titulo={rango}
          detalle={`${todas.length} ${todas.length === 1 ? "actividad" : "actividades"} · ${dias.length} ${dias.length === 1 ? "día" : "días"}`}
        />
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
                  <span className={`block text-[13px] font-semibold uppercase tracking-wide ${day.isToday ? "text-[#c4dbdb]" : "text-tinta-suave"}`}>
                    {day.dia.slice(0, 3)}
                  </span>
                  <span className="block font-serif text-[22px] leading-tight">{fecha ? fecha.getDate() : "·"}</span>
                </div>
                {day.isToday && <span className="mt-1.5 text-[13px] font-bold uppercase tracking-wider text-verde-profundo">Hoy</span>}
                {i < dias.length - 1 && <span aria-hidden="true" className="flex-1 w-px bg-borde mt-2" />}
              </div>
              <div className="grid gap-2.5 min-w-0">
                {day.tasks.map((task) => (
                  <TarjetaActividad key={task.id} task={task} to={`/app/plan/actividad/${task.id}`} />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Historial corto: las últimas 5 semanas ya terminadas. Si hay más, «Ver
// historial completo» lleva a su pantalla (/app/historial).
const SEMANAS_VISIBLES = 5;
function SemanasAnteriores({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const { data } = useSemanasAnteriores(patientId, SEMANAS_VISIBLES);
  if (!data || data.semanas.length === 0) return null;
  return (
    <section>
      <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-suave">Semanas anteriores</p>
      <div className="grid gap-2">
        {data.semanas.map((s) => (
          <FilaSemana key={s.id} semana={s} />
        ))}
      </div>
      {data.totalAnteriores > SEMANAS_VISIBLES && (
        <button
          type="button"
          onClick={() => navigate("/app/historial")}
          className="mt-3 inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full border-[1.5px] border-borde bg-white text-[14.5px] font-semibold text-verde-profundo cursor-pointer hover:border-verde-serenidad focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
        >
          Ver historial completo ({data.totalAnteriores} semanas) <span aria-hidden="true">→</span>
        </button>
      )}
    </section>
  );
}

// La biblioteca, pero solo lo compatible con el perfil (actividades_sugeridas
// filtra por nivel cognitivo informado y seguridad motora) — reemplaza a la
// antigua pestaña Actividades, que mostraba el catálogo completo.
function MasActividades() {
  const { data: perfilRecursos } = usePerfilRecursos();
  const etapas = perfilRecursos?.etapas ?? null;
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
        {/* Texto e íconos en el mismo flujo (antes los íconos flotaban encima
            del título): solo las áreas que traen las sugerencias, hasta 3. */}
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="group w-full text-left flex items-center gap-4 rounded-3xl border border-borde bg-white p-5 sm:p-6 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-elevada font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
        >
          {/* Desde tablet, los íconos a la izquierda; en el celular, arriba del título. */}
          <span aria-hidden="true" className="hidden sm:flex shrink-0 -space-x-2.5">
            {modulosPresentes.slice(0, 3).map((m) => (
              <span
                key={m}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-white flex items-center justify-center text-white shadow-sm"
                style={{ backgroundImage: `linear-gradient(150deg, ${moduloTheme[m].from}, ${moduloTheme[m].to})` }}
              >
                <ModuloIcon modulo={m} className="w-5 h-5" />
              </span>
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span aria-hidden="true" className="sm:hidden flex -space-x-2 mb-3">
              {modulosPresentes.slice(0, 3).map((m) => (
              <span
                key={m}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-white flex items-center justify-center text-white shadow-sm"
                style={{ backgroundImage: `linear-gradient(150deg, ${moduloTheme[m].from}, ${moduloTheme[m].to})` }}
              >
                <ModuloIcon modulo={m} className="w-5 h-5" />
              </span>
            ))}
            </span>
            <span className="block text-[12px] tracking-[0.14em] uppercase text-tinta-suave font-semibold">¿Con ganas de más?</span>
            <span className="block mt-1 font-serif text-[20px] sm:text-[21px] leading-snug text-tinta">Actividades sugeridas para hacer juntos</span>
            <span className="block mt-1 text-[14px] text-tinta-suave">
              {isLoading ? "Buscando…" : `${(resources ?? []).length} ideas según el perfil, además del plan.`}
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 w-10 h-10 rounded-full bg-verde-tenue text-verde-profundo flex items-center justify-center text-[20px] transition-transform group-hover:translate-x-0.5">
            ›
          </span>
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
            {opened.modulo === "gerontogimnasia" && opened.codigo !== "GER-010" && <IntroGerontogimnasia />}
            <ResourceDetailView
              content={contenidoDeRecurso(opened, `${resourceTipoLabel[opened.tipo]}${opened.duracion ? ` · ${opened.duracion}` : ""}`, etapas)}
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
