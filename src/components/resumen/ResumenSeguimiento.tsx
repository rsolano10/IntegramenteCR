import type { ReactNode } from "react";
import { moduloLabel, moduloTheme } from "../../lib/modulos";
import { moodMeta } from "../../lib/seguimiento";
import { planTiers } from "../../lib/mockData";
import { rangoSemana } from "../../lib/planWeek";
import { Logo } from "../ui/Logo";

// Resumen de seguimiento en casa: lo que ve el médico (por enlace o
// impreso), el profesional que refirió (con permiso), el equipo clínico en
// una tarea y la familia antes de compartirlo.
//
// Pensado para entrar en contexto en un minuto: primero «En pocas palabras»
// (redactado con IA o automático, guardado en el servidor) y las cifras;
// después la constancia semana a semana, las áreas, lo que contó la familia y
// el detalle. Con la línea de la marca (verde profundo, beige serenidad,
// mostaza vital, serif en los títulos). Sin semáforos ni puntajes: es un
// documento de la familia.

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
  ia?: { titular: string; puntos: string[]; atencion: string[]; fuente: "llm" | "automatico"; generado_en: string } | null;
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" }).replace(".", "");
const ESTADO: Record<string, { texto: string; tono: string }> = {
  realizado: { texto: "Hecha", tono: "bg-[#e3efe6] text-[#22663f]" },
  parcial: { texto: "En parte", tono: "bg-mostaza-vital/45 text-[#6e521c]" },
  no: { texto: "No se pudo", tono: "bg-campo text-tinta-suave" },
};
const DIFICULTAD: Record<string, string> = { facil: "le resultó fácil", justo: "justa", dificil: "le costó" };
const areaDe = (m: string | null) => (m && m in moduloLabel ? moduloLabel[m as keyof typeof moduloLabel] : "Otras");
const colorDe = (m: string | null) => (m && m in moduloTheme ? moduloTheme[m as keyof typeof moduloTheme].to : "#9aa7a8");

function Titulo({ ceja, children }: { ceja: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">{ceja}</p>
      <h2 className="m-0 mt-0.5 font-serif font-normal text-[23px] leading-tight text-tinta">{children}</h2>
    </div>
  );
}

export function ResumenSeguimiento({ datos, para = "medico" }: { datos: ResumenDatos; para?: "medico" | "familia" }) {
  const { persona, totales: tt } = datos;
  const programa = planTiers.find((p) => p.id === persona.programa)?.nombre ?? persona.programa ?? "";
  const hechas = tt.hechas + tt.en_parte;
  // De la semana más vieja a la más nueva: así se lee la tendencia.
  const cronologicas = [...datos.semanas].reverse();
  const periodo = cronologicas.length
    ? `${fechaCorta(cronologicas[0].inicio)} al ${rangoSemana(cronologicas[cronologicas.length - 1].inicio).split(" al ").pop()}`
    : null;
  const maxArea = Math.max(1, ...datos.por_area.map((a) => a.total));
  const conVoz = datos.semanas.filter((s) => s.lo_que_mas_gusto || s.preocupacion || s.animo).slice(0, 6);
  const chip = "rounded-full bg-white/15 px-3 py-1.5";

  return (
    <article className="resumen-doc min-w-0 overflow-hidden bg-white text-tinta rounded-[28px] border border-borde print:border-0 print:rounded-none print:shadow-none">
      {/* Encabezado de marca */}
      <header className="relative overflow-hidden bg-verde-profundo text-white px-5 sm:px-9 pt-7 pb-7">
        <div aria-hidden="true" className="absolute -right-16 -top-24 w-60 h-60 rounded-full bg-verde-serenidad/45" />
        <div aria-hidden="true" className="absolute right-24 -bottom-36 w-52 h-52 rounded-full bg-mostaza-vital/20" />
        <div className="relative">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#cfe2e2]">Resumen de seguimiento en casa</p>
          <h1 className="m-0 mt-1.5 font-serif font-normal text-[31px] sm:text-[36px] leading-tight">{persona.nombre}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-[13px] font-semibold">
            {persona.edad && <span className={chip}>{persona.edad} años</span>}
            {programa && <span className={chip}>Programa {programa}</span>}
            <span className={chip}>En el programa desde el {fecha(persona.desde)}</span>
            {periodo && <span className="rounded-full bg-mostaza-vital text-tinta px-3 py-1.5">Período: {periodo}</span>}
          </div>
        </div>
      </header>

      <div className="px-5 sm:px-9 py-7 grid grid-cols-[minmax(0,1fr)] gap-9 print:px-6">
        {/* En pocas palabras */}
        {datos.ia && (
          <section className="relative overflow-hidden rounded-[24px] bg-beige-serenidad/60 px-5 sm:px-7 py-6">
            <div aria-hidden="true" className="absolute -right-10 -top-12 w-36 h-36 rounded-full bg-mostaza-vital/30" />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="w-9 h-9 rounded-full bg-verde-profundo text-mostaza-vital inline-flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 2.5l1.9 5.6 5.6 1.9-5.6 1.9L11 17.5l-1.9-5.6L3.5 10l5.6-1.9L11 2.5zM18.5 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
                  </svg>
                </span>
                <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-verde-profundo">En pocas palabras</p>
              </div>
              <p className="m-0 mt-3.5 font-serif text-[21px] sm:text-[24px] leading-snug text-tinta">{datos.ia.titular}</p>
              {datos.ia.puntos.length > 0 && (
                <ul className="m-0 mt-4 p-0 list-none grid gap-2.5">
                  {datos.ia.puntos.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-tinta">
                      <span aria-hidden="true" className="mt-[9px] w-2 h-2 shrink-0 rounded-full bg-verde-profundo" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              {datos.ia.atencion.length > 0 && (
                <div className="mt-5 rounded-2xl bg-white border-l-[5px] border-mostaza-vital px-4 py-3.5">
                  <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6e521c]">Para mirar en consulta</p>
                  <ul className="m-0 p-0 list-none grid gap-1.5">
                    {datos.ia.atencion.map((a) => (
                      <li key={a} className="flex gap-3 text-[14.5px] leading-relaxed text-tinta">
                        <span aria-hidden="true" className="mt-[8px] w-2 h-2 shrink-0 rounded-full bg-[#d9a94f]" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="m-0 mt-4 text-[12.5px] leading-relaxed text-tinta-suave">
                {datos.ia.fuente === "llm"
                  ? "Redactado con inteligencia artificial a partir de los registros de la familia; puede tener errores. El detalle está abajo."
                  : "Armado automáticamente a partir de los registros de la familia. El detalle está abajo."}
              </p>
            </div>
          </section>
        )}

        {/* Cifras */}
        <section className="grid gap-3 grid-cols-2 sm:grid-cols-4 print:grid-cols-4">
          <Cifra valor={String(tt.semanas)} etiqueta={tt.semanas === 1 ? "semana con plan" : "semanas con plan"} detalle="Últimas 8 como máximo" color="#3f6a70" />
          <Cifra valor={`${hechas}/${tt.actividades}`} etiqueta="actividades hechas" detalle={tt.en_parte ? `${tt.en_parte} de ellas en parte` : "Todas completas"} color="#6a969c" />
          <Cifra valor={String(tt.no)} etiqueta="no se pudieron hacer" detalle={tt.sin_registrar ? `${tt.sin_registrar} sin registrar` : "Todas registradas"} color="#e8b857" />
          <Cifra
            valor={String(datos.avisos.alertas_90_dias)}
            etiqueta="avisos de riesgo"
            detalle={datos.avisos.ultima_alerta ? `90 días · el último, ${fechaCorta(datos.avisos.ultima_alerta)}` : "Últimos 90 días"}
            color="#c0664f"
            alerta={datos.avisos.alertas_90_dias > 0}
          />
        </section>

        {/* Constancia semana a semana */}
        {cronologicas.length > 1 && (
          <section>
            <Titulo ceja="Constancia">Semana a semana</Titulo>
            <div
              className="flex items-end gap-2 sm:gap-3 h-[156px]"
              role="img"
              aria-label={`Actividades hechas por semana: ${cronologicas.map((s) => `${rangoSemana(s.inicio)}, ${s.hechas + s.en_parte} de ${s.total}`).join("; ")}`}
            >
              {cronologicas.map((s) => {
                const h = s.hechas + s.en_parte;
                const pct = s.total ? h / s.total : 0;
                return (
                  <div key={s.inicio} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5" title={`${rangoSemana(s.inicio)}: ${h} de ${s.total}`}>
                    <span className="text-[12px] font-semibold text-tinta tabular-nums">
                      {h}/{s.total}
                    </span>
                    <div className="w-full max-w-[44px] flex-1 flex flex-col justify-end rounded-t-[10px] bg-beige-serenidad/70 overflow-hidden">
                      <div className="w-full rounded-t-[10px] bg-verde-profundo" style={{ height: `${pct > 0 ? Math.max(6, pct * 100) : 0}%` }} />
                    </div>
                    <span className="text-[11.5px] text-tinta-tenue whitespace-nowrap">{fechaCorta(s.inicio)}</span>
                  </div>
                );
              })}
            </div>
            <p className="m-0 mt-2.5 text-[12.5px] text-tinta-tenue">Cada barra es una semana: la parte oscura es lo que hizo de lo asignado.</p>
          </section>
        )}

        {/* Áreas */}
        {datos.por_area.length > 0 && (
          <section>
            <Titulo ceja="Qué se trabajó">Por área</Titulo>
            <ul className="m-0 p-0 list-none grid gap-3">
              {datos.por_area.map((a) => (
                <li key={a.modulo} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[190px_minmax(0,1fr)_80px] items-center gap-x-3 gap-y-1.5 text-[14.5px]">
                  <span className="flex items-center gap-2 min-w-0">
                    <span aria-hidden="true" className="w-3 h-3 shrink-0 rounded-full" style={{ background: colorDe(a.modulo) }} />
                    <span className="truncate">{areaDe(a.modulo)}</span>
                  </span>
                  <span className="order-last col-span-2 sm:order-none sm:col-span-1 h-3.5 rounded-full bg-beige-serenidad/60 overflow-hidden">
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
            <p className="m-0 mt-2.5 text-[12.5px] text-tinta-tenue">Barra clara: asignadas. Barra oscura: hechas (completas o en parte).</p>
          </section>
        )}

        {/* Lo que contó la familia */}
        {conVoz.length > 0 && (
          <section>
            <Titulo ceja="En sus palabras">Lo que contó la familia</Titulo>
            <ul className="m-0 p-0 list-none grid gap-3">
              {conVoz.map((s) => (
                <li key={s.inicio} className="rounded-2xl bg-fondo-papel border border-borde-suave px-4 py-3.5 text-[14.5px] leading-relaxed">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">Semana del {rangoSemana(s.inicio)}</span>
                    {s.animo && moodMeta[s.animo] && (
                      <span className="rounded-full bg-white border border-borde px-2.5 py-0.5 text-[12.5px] text-tinta-suave">
                        <span aria-hidden="true">{moodMeta[s.animo].icon} </span>
                        {moodMeta[s.animo].label}
                      </span>
                    )}
                  </div>
                  {s.lo_que_mas_gusto && (
                    <p className="m-0 mt-1.5">
                      <span className="text-tinta-tenue">Lo que más le gustó:</span> «{s.lo_que_mas_gusto}»
                    </p>
                  )}
                  {s.preocupacion && (
                    <p className="m-0 mt-1">
                      <span className="text-tinta-tenue">Les preocupó:</span> «{s.preocupacion}»
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Últimas actividades */}
        {datos.ultimas.length > 0 && (
          <section>
            <Titulo ceja="El detalle">Últimas actividades registradas</Titulo>
            <ul className="m-0 p-0 list-none rounded-[20px] border border-borde divide-y divide-borde-suave overflow-hidden text-[14px]">
              {datos.ultimas.map((u, i) => (
                <li key={i} className="grid gap-1 sm:grid-cols-[70px_minmax(0,1fr)_auto] sm:items-center sm:gap-3 px-4 py-3">
                  <span className="text-tinta-tenue">{fechaCorta(u.fecha)}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: colorDe(u.modulo) }} />
                      <span className="font-semibold">{u.titulo}</span>
                    </span>
                    <span className="block pl-[18px] text-[13px] text-tinta-tenue">
                      {areaDe(u.modulo)}
                      {u.dificultad_percibida ? ` · ${DIFICULTAD[u.dificultad_percibida] ?? u.dificultad_percibida}` : ""}
                    </span>
                    {u.comentario && <span className="block pl-[18px] text-[13.5px] text-tinta-suave">«{u.comentario}»</span>}
                  </span>
                  <span className={`justify-self-start sm:justify-self-end rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${ESTADO[u.estado]?.tono ?? "bg-campo text-tinta-suave"}`}>
                    {ESTADO[u.estado]?.texto ?? u.estado}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hechas + tt.no === 0 && datos.semanas.length === 0 && <p className="m-0 text-[15px] text-tinta-suave">Todavía no hay actividades registradas.</p>}
      </div>

      {/* Pie de marca */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-borde-suave bg-fondo-papel px-5 sm:px-9 py-5">
        <Logo />
        <p className="m-0 max-w-[470px] text-[12.5px] leading-relaxed text-tinta-tenue">
          {para === "medico"
            ? "Registro de lo que la familia hizo en casa con IntegraMente en Casa. No es una evaluación clínica ni reemplaza la valoración profesional."
            : "Así lo va a ver el médico. Es el registro de lo que hicieron en casa; no incluye mensajes ni el cuestionario."}{" "}
          Generado el {fecha(datos.generado_en)}.{datos.enlace_vence ? ` Este enlace vence el ${fecha(datos.enlace_vence)}.` : ""}
        </p>
      </footer>
    </article>
  );
}

function Cifra({ valor, etiqueta, detalle, color, alerta = false }: { valor: string; etiqueta: string; detalle?: string; color: string; alerta?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-borde bg-white px-4 pt-4 pb-3.5">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[5px]" style={{ background: color }} />
      <span className={`block font-serif text-[30px] leading-none tabular-nums ${alerta ? "text-alerta-texto" : "text-tinta"}`}>{valor}</span>
      <span className="block mt-2 text-[13.5px] font-semibold leading-snug">{etiqueta}</span>
      {detalle && <span className="block mt-0.5 text-[12px] leading-snug text-tinta-tenue">{detalle}</span>}
    </div>
  );
}
