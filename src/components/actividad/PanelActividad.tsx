import { Suspense, lazy, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { ModuloIcon } from "../ui/ModuloIcon";
import { Icono } from "../sesion/Icono";
import { MisionSemana } from "../sesion/ResumenSesion";
import { CienciaActividad } from "./CienciaActividad";
import { esInteractivo } from "../../lib/clasificarNumeros";
import { moduloTheme } from "../../lib/modulos";
import { aTenerAMano, guionDe, resumenPasos, type PasoResumen, type Progreso } from "../../lib/sesiones";
import type { PlanDay, PlanTask } from "../../lib/mockData";
import { cuandoEsElDia, diaConFecha } from "../../lib/planWeek";

// La pantalla de una actividad antes de empezar, como un tablero: arriba,
// qué es (con su dibujo o la portada del juego); después, lo que mandó el
// equipo, la ciencia de la actividad, qué tener a mano y cómo va a ser
// (una línea de tiempo con cómo se hace cada paso); al final «Empezar».
// Registrar se hace solo dentro de la actividad.
// Una actividad ya registrada se puede repetir: se elige si el nuevo
// registro reemplaza al anterior o si se hace sin registrar.

const PortadaJuego = lazy(() => import("../actividades/interactivas/Marco").then((m) => ({ default: m.PortadaDeJuego })));

export type ModoInicio = "normal" | "sobrescribir" | "sin-registro";

const ESTADO: Partial<Record<PlanTask["estado"], string>> = {
  realizado: "Realizada",
  parcial: "Hecha en parte",
  no: "No se realizó",
};

export function PanelActividad({
  task,
  dia,
  rutaPasos,
  publishAt,
  large = false,
  onGuardarProgreso,
}: {
  task: PlanTask;
  dia: PlanDay;
  rutaPasos: string;
  // Inicio del plan, para saber la fecha real de cada día.
  publishAt: string | null;
  large?: boolean;
  onGuardarProgreso?: (p: Progreso) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [preguntando, setPreguntando] = useState(false);
  const guion = guionDe(task.codigo);
  const juego = esInteractivo(task.extras) && task.extras?.modo === "interactiva" ? task.extras.tipo : null;
  const tema = task.modulo ? moduloTheme[task.modulo] : moduloTheme.bienvenida;
  const hecha = ESTADO[task.estado] ?? null;
  const hoyPendiente = !!dia.isToday && (task.estado === "pendiente" || task.estado === "futuro");
  const cuando = cuandoEsElDia(dia.dia, publishAt);
  // Sin guion (los juegos): sus pasos, tal como están en la ficha.
  const pasos: PasoResumen[] = guion
    ? resumenPasos(guion, task.mediaKind === "video" && !!(task.storagePath || task.externalUrl))
    : (task.pasos ?? []).map((texto, i, todos) => ({ icono: i === todos.length - 1 ? ("estrella" as const) : ("lista" as const), texto }));
  // La ciencia de la actividad: el texto de la ficha que explica por qué sirve.
  const ciencia =
    task.ciencia && (task.ciencia.gancho || task.ciencia.evidencia || task.ciencia.cierre)
      ? task.ciencia
      : task.sabiasQue
        ? { gancho: task.sabiasQue }
        : task.porQue
          ? { gancho: task.porQue }
          : null;
  const aMano = guion ? aTenerAMano(guion) : [];
  const frase = guion?.frase ?? task.intro ?? task.detalle ?? "";
  const t = {
    titulo: large ? "text-[32px]" : "text-[28px]",
    cuerpo: large ? "text-[20px]" : "text-[16.5px]",
    seccion: large ? "text-[15px]" : "text-[13px]",
  };

  const ir = (modo: ModoInicio) => navigate(modo === "normal" ? rutaPasos : `${rutaPasos}?modo=${modo}`);

  // Qué dice el botón y qué hace, según el estado de la actividad.
  const accion = hoyPendiente
    ? { texto: "Empezar", nota: null, onClick: () => ir("normal") }
    : hecha
      ? { texto: "Volver a hacerla", nota: null, onClick: () => setPreguntando(true) }
      : {
          texto: "Hacerla sin registrar",
          // El tiempo verbal según la fecha real: si el día ya pasó o todavía no llega.
          nota:
            cuando.tiempo === "pasado"
              ? `Esta actividad era para ${diaConFecha(dia.dia, cuando.fecha)}. Podés hacerla, pero ya no se registra.`
              : `Esta actividad es para ${diaConFecha(dia.dia, cuando.fecha)}. Podés hacerla ahora para practicar; se registra ese día.`,
          onClick: () => ir("sin-registro"),
        };

  return (
    <div className="grid gap-4">
      {/* Qué es */}
      <section
        className="relative overflow-hidden rounded-[28px] px-5 pt-5 pb-6 shadow-[0_18px_40px_-28px_rgba(31,51,56,0.6)]"
        style={{ background: `radial-gradient(130% 120% at 0% 0%, #fff 0%, ${tema.from} 55%, ${tema.to} 140%)` }}
      >
        {hecha && (
          <span
            className={`absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 font-semibold ${large ? "text-[16px]" : "text-[13.5px]"}`}
            style={{ color: tema.ink }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hecha}
          </span>
        )}
        {juego ? (
          <div className="mb-4 flex justify-center">
            <Suspense fallback={<div className="h-[160px]" />}>
              <PortadaJuego tipo={juego} />
            </Suspense>
          </div>
        ) : (
          <span className={`mb-4 sm:mb-0 sm:float-left sm:mr-5 flex items-center justify-center rounded-full bg-white/80 ${large ? "w-24 h-24" : "w-20 h-20 sm:w-24 sm:h-24"}`} aria-hidden="true">
            {guion ? (
              <Icono nombre={guion.icono} className="w-[62%] h-[62%] text-tinta" relleno={`${tema.to}80`} />
            ) : task.modulo ? (
              <span className="text-tinta">
                <ModuloIcon modulo={task.modulo} className="w-10 h-10" />
              </span>
            ) : null}
          </span>
        )}
        <h1 className={`m-0 font-serif font-normal leading-tight text-tinta ${t.titulo}`}>{task.titulo}</h1>
        {frase && <p className={`m-0 mt-2 max-w-xl leading-relaxed text-tinta/80 ${t.cuerpo}`}>{frase}</p>}
        <span className="block clear-both" aria-hidden="true" />
      </section>

      {/* La ciencia de esta actividad */}
      {ciencia && <CienciaActividad ciencia={ciencia} large={large} />}

      {/* Lo que mandó el equipo */}
      {task.notaClinica && (
        <section className="rounded-[22px] border-[1.5px] border-verde-serenidad bg-verde-tenue px-4 py-3.5">
          <p className={`m-0 mb-1 tracking-[0.12em] uppercase font-semibold text-verde-profundo ${t.seccion}`}>Mensaje de tu equipo</p>
          <p className={`m-0 leading-relaxed text-tinta ${t.cuerpo}`}>{task.notaClinica}</p>
        </section>
      )}

      {/* La misión de la semana, si la actividad la tiene */}
      {task.progreso?.mision && <MisionSemana key={task.progreso.mision.marcas.join()} progreso={task.progreso} modulo={task.modulo ?? null} onGuardar={onGuardarProgreso} large={large} />}

      {/* Qué tener a mano (antes de cómo va a ser) */}
      {aMano.length > 0 && (
        <section className="rounded-[22px] bg-white border border-borde px-4 py-4">
          <p className={`m-0 mb-3 tracking-[0.12em] uppercase font-semibold text-tinta-tenue ${t.seccion}`}>Para tener a mano</p>
          <ul className="m-0 p-0 list-none grid grid-cols-2 sm:grid-cols-3 gap-2">
            {aMano.map((it) => (
              <li key={it.texto} className={`flex items-center gap-2.5 rounded-2xl bg-campo px-3 py-2.5 leading-tight text-tinta ${large ? "text-[17px]" : "text-[14.5px]"}`}>
                <Icono nombre={it.icono} className="w-8 h-8 shrink-0 text-tinta" relleno={`${tema.to}80`} />
                {it.texto}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cómo va a ser: una línea de tiempo hacia abajo, con cómo se hace cada paso */}
      {pasos.length > 0 && (
        <section className="rounded-[22px] bg-white border border-borde px-4 pt-4 pb-2">
          <p className={`m-0 mb-4 tracking-[0.12em] uppercase font-semibold text-tinta-tenue ${t.seccion}`}>Así va a ser</p>
          <ol className="m-0 p-0 list-none">
            {pasos.map((p, i) => {
              const ultimo = i === pasos.length - 1;
              return (
                <li key={i} className="relative grid grid-cols-[48px_1fr] gap-3 pb-5">
                  {/* La línea que une un paso con el siguiente */}
                  {!ultimo && <span className="absolute left-[23px] top-12 bottom-0 w-[2px] rounded-full" style={{ background: `${tema.to}55` }} aria-hidden="true" />}
                  <span className="relative z-[1] w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white" style={{ borderColor: `${tema.to}88` }} aria-hidden="true">
                    <Icono nombre={p.icono} className="w-8 h-8 text-tinta" relleno={`${tema.to}80`} />
                  </span>
                  <div className="pt-1 min-w-0">
                    <p className={`m-0 tracking-[0.1em] uppercase font-semibold ${large ? "text-[13px]" : "text-[11.5px]"}`} style={{ color: tema.ink }}>
                      {ultimo && guion ? "Al final" : `Paso ${i + 1}`}
                    </p>
                    <p className={`m-0 font-semibold leading-snug text-tinta ${large ? "text-[20px]" : "text-[16.5px]"}`}>{p.texto}</p>
                    {p.detalle && <p className={`m-0 mt-1 leading-relaxed text-tinta-suave ${large ? "text-[17px]" : "text-[14.5px]"}`}>{p.detalle}</p>}
                    {p.lista && (
                      <ol className={`m-0 mt-1.5 pl-5 list-decimal grid gap-1 leading-relaxed text-tinta-suave ${large ? "text-[17px]" : "text-[14.5px]"}`}>
                        {p.lista.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Cómo le fue la vez pasada (si contaron qué ayuda necesitó) */}
      {task.comentario && (
        <section className="rounded-[22px] bg-fila-calida px-4 py-3.5">
          <p className={`m-0 mb-1 tracking-[0.12em] uppercase font-semibold text-semaforo-amarillo-texto ${t.seccion}`}>La ayuda que necesitó</p>
          <p className={`m-0 leading-relaxed text-tinta-suave ${t.cuerpo}`}>{task.comentario}</p>
        </section>
      )}

      {/* Al final, la acción */}
      <div className="grid gap-2 pt-1">
        {accion.nota && <p className={`m-0 rounded-2xl bg-campo border border-borde-suave px-4 py-3 leading-relaxed text-tinta-suave ${large ? "text-[17px]" : "text-[14.5px]"}`}>{accion.nota}</p>}
        <button
          type="button"
          onClick={accion.onClick}
          className={`flex items-center justify-center gap-2.5 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta transition-colors ${large ? "min-h-16 text-[21px]" : "min-h-14 text-[17px]"}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M5 3.2v9.6a.6.6 0 0 0 .92.5l7.4-4.8a.6.6 0 0 0 0-1L5.92 2.7A.6.6 0 0 0 5 3.2Z" />
          </svg>
          {accion.texto}
        </button>
      </div>

      {preguntando && (
        <Modal onClose={() => setPreguntando(false)}>
          <h3 className="m-0 mb-2 font-serif font-normal text-[24px] leading-tight text-tinta">Esta actividad ya está registrada</h3>
          <p className="m-0 mb-5 text-[16px] leading-relaxed text-tinta-suave">
            Quedó como <strong className="text-tinta">«{hecha}»</strong>. Pueden hacerla de nuevo. ¿Qué hacemos con el registro?
          </p>
          <div className="grid gap-2.5">
            <button
              type="button"
              onClick={() => ir("sobrescribir")}
              className="min-h-[56px] rounded-2xl border-0 bg-verde-profundo px-4 text-left text-white cursor-pointer hover:bg-tinta"
            >
              <span className="block font-semibold text-[16.5px]">Hacerla y cambiar el registro</span>
              <span className="block text-[14px] opacity-85">Lo que respondan al final reemplaza lo anterior.</span>
            </button>
            <button
              type="button"
              onClick={() => ir("sin-registro")}
              className="min-h-[56px] rounded-2xl border-[1.5px] border-borde bg-white px-4 text-left text-tinta cursor-pointer hover:border-verde-serenidad"
            >
              <span className="block font-semibold text-[16.5px]">Hacerla sin registrar</span>
              <span className="block text-[14px] text-tinta-suave">Para practicar. El registro anterior queda igual.</span>
            </button>
            <button type="button" onClick={() => setPreguntando(false)} className="min-h-12 rounded-2xl border-0 bg-transparent text-[15.5px] font-semibold text-tinta-suave cursor-pointer">
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
