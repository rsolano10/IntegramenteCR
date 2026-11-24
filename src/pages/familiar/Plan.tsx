import { useNavigate } from "react-router-dom";
import { useMyPatient } from "../../lib/useMyPatient";
import { useCurrentPlanMeta, usePendingReviews, usePlan } from "../../lib/usePlan";
import { weekDays } from "../../lib/planWeek";
import type { PlanDay } from "../../lib/mockData";
import { useSemanasAnteriores } from "../../lib/semanasAnteriores";
import { FilaSemana } from "../../components/familiar/FilaSemana";
import { Cargando } from "../../components/ui/Cargando";
import { CajaAvance } from "../../components/ui/CajaAvance";
import { TarjetaActividad } from "../../components/actividad/TarjetaActividad";
import { AvisoEvaluarSemana } from "../../components/familiar/AvisoEvaluarSemana";
import { contarHechas } from "../../lib/estadoActividad";
import { rangoSemana, semanaTerminada } from "../../lib/planWeek";

export function Plan() {
  const { data: myPatient } = useMyPatient();
  const { data: plan, isLoading: loadingPlan } = usePlan(myPatient?.id);
  const { data: pendientes } = usePendingReviews(myPatient?.id);
  const { data: planMeta } = useCurrentPlanMeta(myPatient?.id);

  if (loadingPlan) return <Cargando />;

  // Sin semana en curso (la última ya terminó y no hay otra publicada): solo
  // el aviso, sin el detalle de la semana pasada, que queda en «Semanas
  // anteriores» como las demás.
  const sinSemanaActual = semanaTerminada(planMeta?.publish_at);
  const nombre = myPatient?.nombre?.split(" ")[0] ?? null;
  // Evaluación semanal, solo cuando corresponde. Si la semana sigue en curso
  // y está pendiente, es porque se hizo todo.
  const aviso =
    pendientes && pendientes.length > 0 ? (
      <AvisoEvaluarSemana to={`/app/revision?plan=${pendientes[0].id}`} completa={!semanaTerminada(pendientes[0].publishAt)} />
    ) : null;

  return (
    <div className="grid gap-8">
      {/* Con semana en curso, el aviso de evaluar va arriba de todo. */}
      {!sinSemanaActual && aviso}
      {sinSemanaActual ? (
        <p className="m-0 rounded-[22px] border border-borde bg-white px-5 py-4 text-[15.5px] leading-relaxed text-tinta">
          <strong className="font-semibold">Estamos preparando la próxima semana.</strong> El equipo está armando las actividades{nombre ? ` de ${nombre}` : ""}. Te avisamos cuando estén listas.
        </p>
      ) : !plan || plan.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Todavía no hay un plan asignado.</p>
      ) : (
        // Toda actividad se abre en su pantalla (la misma que desde Hoy);
        // «Volver» regresa a Mi semana.
        <EstaSemana plan={plan} publishAt={planMeta?.publish_at ?? null} />
      )}

      {/* Sin semana en curso, el aviso de evaluar va después del mensaje. */}
      {sinSemanaActual && aviso}

      {myPatient?.id && <SemanasAnteriores patientId={myPatient.id} />}


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
  const rango = publishAt ? rangoSemana(publishAt) : "Tu plan";
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
            <li key={day.dia} className={`grid gap-2.5 sm:grid-cols-[64px_1fr] sm:gap-4 ${pasado ? "opacity-75" : ""}`}>
              {/* Celular: el día como encabezado, así las tarjetas usan todo el ancho. */}
              <p className={`sm:hidden m-0 flex items-center gap-2 text-[15px] font-semibold ${day.isToday ? "text-verde-profundo" : "text-tinta-suave"}`}>
                <span className="first-letter:uppercase">
                  {day.dia}
                  {fecha ? ` ${fecha.getDate()}` : ""}
                </span>
                {day.isToday && <span className="rounded-full bg-verde-profundo px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white">Hoy</span>}
              </p>
              <div className="hidden sm:flex flex-col items-center">
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

// Historial corto: las últimas 4 semanas ya terminadas. Si hay más, «Ver
// historial completo» lleva a su pantalla (/app/historial).
const SEMANAS_VISIBLES = 4;
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
