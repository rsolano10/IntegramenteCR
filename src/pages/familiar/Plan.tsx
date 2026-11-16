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
