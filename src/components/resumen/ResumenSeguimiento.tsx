import { moduloLabel } from "../../lib/modulos";
import { moodMeta } from "../../lib/seguimiento";
import { planTiers } from "../../lib/mockData";
import { rangoSemana } from "../../lib/planWeek";
import { Logo } from "../ui/Logo";

// Resumen de seguimiento en casa: lo que ve el médico (por enlace o
// impreso), el profesional que refirió (con permiso), el equipo clínico en
// una tarea y la familia antes de compartirlo. Pensado para leerse en un
// minuto: primero los números, después cada semana y lo que contó la
// familia. Sin semáforos ni puntajes (es un documento de la familia).

export interface ResumenDatos {
  generado_en: string;
  enlace_vence?: string;
  persona: { nombre: string; edad: string | null; programa: string | null; desde: string };
  totales: { semanas: number; actividades: number; hechas: number; en_parte: number; no: number; sin_registrar: number };
  semanas: {
    inicio: string;
    total: number;
    hechas: number;
    en_parte: number;
    animo: string | null;
    lo_que_mas_gusto: string | null;
    preocupacion: string | null;
    mensaje_equipo: string | null;
  }[];
  por_area: { modulo: string; total: number; hechas: number }[];
  ultimas: { fecha: string; titulo: string; modulo: string | null; estado: string; comentario: string | null; dificultad_percibida: string | null }[];
  avisos: { alertas_90_dias: number; ultima_alerta: string | null; pedidos_ayuda_90_dias: number };
}

const fecha = (iso: string, conAnio = true) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}) });
const ESTADO: Record<string, string> = { realizado: "Hecha", parcial: "En parte", no: "No se pudo" };
const DIFICULTAD: Record<string, string> = { facil: "le resultó fácil", justo: "justa", dificil: "le costó" };
const areaDe = (m: string | null) => (m && m in moduloLabel ? moduloLabel[m as keyof typeof moduloLabel] : "Otras");

export function ResumenSeguimiento({ datos, para = "medico" }: { datos: ResumenDatos; para?: "medico" | "familia" }) {
  const { persona, totales: tt } = datos;
  const programa = planTiers.find((p) => p.id === persona.programa)?.nombre ?? persona.programa ?? "";
  const registradas = tt.hechas + tt.en_parte + tt.no;
  const maxArea = Math.max(1, ...datos.por_area.map((a) => a.total));
  const conVoz = datos.semanas.filter((s) => s.lo_que_mas_gusto || s.preocupacion);

  return (
    <article className="resumen-doc min-w-0 bg-white text-tinta rounded-[24px] border border-borde px-5 py-6 sm:px-8 sm:py-8 print:border-0 print:rounded-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-borde-suave pb-5">
        <div>
          <p className="m-0 tracking-[0.14em] uppercase text-[12px] font-semibold text-tinta-tenue">Resumen de seguimiento en casa</p>
          <h1 className="m-0 mt-1 font-serif font-normal text-[30px] leading-tight">{persona.nombre}</h1>
          <p className="m-0 mt-1 text-[15px] text-tinta-suave">
            {[persona.edad ? `${persona.edad} años` : null, programa ? `Programa ${programa}` : null, `en el programa desde el ${fecha(persona.desde)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <Logo />
          <p className="m-0 mt-1 text-[12.5px] text-tinta-tenue">Generado el {fecha(datos.generado_en)}</p>
        </div>
      </header>

      {/* En un vistazo */}
      <section className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4 print:grid-cols-4">
        <Cifra valor={String(tt.semanas)} etiqueta={tt.semanas === 1 ? "semana con plan" : "semanas con plan"} detalle="Últimas 8 como máximo" />
        <Cifra valor={`${tt.hechas + tt.en_parte} de ${tt.actividades}`} etiqueta="actividades hechas" detalle={tt.en_parte ? `${tt.en_parte} en parte` : "Completas"} />
        <Cifra valor={String(tt.no)} etiqueta="no se pudieron hacer" detalle={tt.sin_registrar ? `${tt.sin_registrar} sin registrar` : "Todas registradas"} />
        <Cifra
          valor={String(datos.avisos.alertas_90_dias)}
          etiqueta="avisos de riesgo (90 días)"
          detalle={datos.avisos.ultima_alerta ? `Último: ${fecha(datos.avisos.ultima_alerta, false)}` : "Ninguno"}
          alerta={datos.avisos.alertas_90_dias > 0}
        />
      </section>

      {/* Por área */}
      {datos.por_area.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-3 font-serif font-normal text-[21px]">Qué se trabajó</h2>
          <ul className="m-0 p-0 list-none grid gap-2">
            {datos.por_area.map((a) => (
              <li key={a.modulo} className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_88px] sm:grid-cols-[200px_minmax(0,1fr)_110px] items-center gap-3 text-[14.5px]">
                <span className="truncate">{areaDe(a.modulo)}</span>
                <span className="h-3 rounded-full bg-campo overflow-hidden print:border print:border-borde">
                  <span className="block h-full rounded-full bg-verde-profundo/25" style={{ width: `${(a.total / maxArea) * 100}%` }}>
                    <span className="block h-full rounded-full bg-verde-profundo" style={{ width: `${a.total ? (a.hechas / a.total) * 100 : 0}%` }} />
                  </span>
                </span>
                <span className="text-right text-tinta-suave tabular-nums">
                  {a.hechas} de {a.total}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2 text-[12.5px] text-tinta-tenue">Barra clara: actividades asignadas. Barra oscura: hechas (completas o en parte).</p>
        </section>
      )}

      {/* Semana a semana */}
      {datos.semanas.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-3 font-serif font-normal text-[21px]">Semana a semana</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-tinta-tenue text-[12.5px] uppercase tracking-[0.08em]">
                  <th className="py-2 pr-3 font-semibold">Semana</th>
                  <th className="py-2 pr-3 font-semibold">Hechas</th>
                  <th className="py-2 pr-3 font-semibold">Comparada con la anterior</th>
                </tr>
              </thead>
              <tbody>
                {datos.semanas.map((s) => (
                  <tr key={s.inicio} className="border-t border-borde-suave align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{rangoSemana(s.inicio)}</td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {s.hechas + s.en_parte} de {s.total}
                      {s.en_parte ? <span className="text-tinta-tenue"> ({s.en_parte} en parte)</span> : null}
                    </td>
                    <td className="py-2.5 pr-3">{s.animo ? (moodMeta[s.animo]?.short ?? s.animo) : <span className="text-tinta-tenue">Sin evaluar</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lo que contó la familia */}
      {conVoz.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-3 font-serif font-normal text-[21px]">Lo que contó la familia</h2>
          <ul className="m-0 p-0 list-none grid gap-3">
            {conVoz.slice(0, 6).map((s) => (
              <li key={s.inicio} className="rounded-2xl bg-campo px-4 py-3 text-[14.5px] leading-relaxed print:bg-transparent print:border print:border-borde-suave">
                <p className="m-0 font-semibold">{rangoSemana(s.inicio)}</p>
                {s.lo_que_mas_gusto && <p className="m-0 mt-1"><span className="text-tinta-tenue">Lo que más le gustó:</span> {s.lo_que_mas_gusto}</p>}
                {s.preocupacion && <p className="m-0 mt-1"><span className="text-tinta-tenue">Les preocupó:</span> {s.preocupacion}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Últimas actividades */}
      {datos.ultimas.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-3 font-serif font-normal text-[21px]">Últimas actividades registradas</h2>
          <ul className="m-0 p-0 list-none divide-y divide-borde-suave text-[14px]">
            {datos.ultimas.map((u, i) => (
              <li key={i} className="py-2.5 grid gap-0.5 sm:grid-cols-[110px_minmax(0,1fr)_110px] sm:gap-3">
                <span className="text-tinta-tenue">{fecha(u.fecha, false)}</span>
                <span>
                  <span className="font-semibold">{u.titulo}</span>
                  <span className="text-tinta-tenue"> · {areaDe(u.modulo)}</span>
                  {u.dificultad_percibida && <span className="text-tinta-tenue"> · {DIFICULTAD[u.dificultad_percibida] ?? u.dificultad_percibida}</span>}
                  {u.comentario && <span className="block text-tinta-suave">«{u.comentario}»</span>}
                </span>
                <span className="sm:text-right font-semibold">{ESTADO[u.estado] ?? u.estado}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {registradas === 0 && datos.semanas.length === 0 && <p className="m-0 mt-8 text-[15px] text-tinta-suave">Todavía no hay actividades registradas.</p>}

      <footer className="mt-8 border-t border-borde-suave pt-4 text-[12.5px] leading-relaxed text-tinta-tenue">
        {para === "medico"
          ? "Registro de lo que la familia hizo en casa con el programa IntegraMente en Casa. No es una evaluación clínica ni reemplaza la valoración profesional."
          : "Así lo va a ver el médico. Es el registro de lo que hicieron en casa; no incluye mensajes ni el cuestionario."}
        {datos.enlace_vence && ` Este enlace vence el ${fecha(datos.enlace_vence)}.`}
      </footer>
    </article>
  );
}

function Cifra({ valor, etiqueta, detalle, alerta = false }: { valor: string; etiqueta: string; detalle?: string; alerta?: boolean }) {
  return (
    <div className="rounded-2xl border border-borde px-4 py-3.5">
      <span className={`block font-serif text-[26px] leading-none ${alerta ? "text-alerta-texto" : "text-tinta"}`}>{valor}</span>
      <span className="block mt-1.5 text-[13.5px] font-semibold leading-snug">{etiqueta}</span>
      {detalle && <span className="block text-[12.5px] text-tinta-tenue">{detalle}</span>}
    </div>
  );
}
