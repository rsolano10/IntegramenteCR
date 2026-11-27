import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { MediaResource } from "../../lib/mediaResources";
import { tareaDeRecurso } from "../../lib/usePlan";
import { guionDe } from "../../lib/sesiones";
import { guionDeJuego } from "../../lib/sesiones/juego";
import { datosDeTarea } from "../../lib/sesiones/datos";
import { esInteractivo } from "../../lib/clasificarNumeros";
import { detenerVoz } from "../../lib/voz";
import { useBodyScrollLock } from "../../lib/useBodyScrollLock";
import { PanelActividad } from "../actividad/PanelActividad";
import { SesionGuiada } from "../sesion/SesionGuiada";
import { ResourceDetailView } from "../ui/ResourceDetailView";
import { contenidoDeRecurso } from "../../lib/contenidoRecurso";

// «Ver una actividad de ejemplo» del home: la misma actividad que ve la
// familia en la app, con los mismos componentes. Primero el tablero de la
// actividad (PanelActividad) y, con «Empezar», la sesión guiada a pantalla
// completa (o el juego del pueblo), en modo práctica: no se guarda nada.
// Al terminar, una invitación a crear la cuenta. Sin Clara (necesita una
// cuenta). Se carga aparte (lazy) para no sumar el cliente de Supabase al home.
export default function EjemploActividad({ codigo, onClose }: { codigo: string; onClose: () => void }) {
  useBodyScrollLock();
  const [fase, setFase] = useState<"tablero" | "sesion" | "fin">("tablero");
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => () => detenerVoz(), []);
  useEffect(() => {
    caja.current?.scrollTo(0, 0);
  }, [fase]);

  const { data: recurso, isLoading, error } = useQuery({
    queryKey: ["ejemplo-home", codigo],
    queryFn: async () => {
      const { data, error: e } = await supabase.from("media_resources").select("*").eq("codigo", codigo).eq("activo", true).single();
      if (e) throw e;
      return data as MediaResource;
    },
    staleTime: 10 * 60 * 1000,
  });

  const task = recurso ? tareaDeRecurso(recurso) : null;
  const esJuego = !!task && esInteractivo(task.extras) && task.extras?.modo === "interactiva";
  const guion = task ? (guionDe(task.codigo) ?? (esJuego ? guionDeJuego(task) : null)) : null;

  return (
    <div role="dialog" aria-modal="true" aria-label={recurso?.titulo ?? "Actividad de ejemplo"} className="im-in fixed inset-0 z-50 flex flex-col bg-fondo-papel">
      {/* Siempre a la vista (fuera del scroll): volver al home, a las áreas. */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-3 sm:px-6 py-2 bg-verde-profundo text-white">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 min-h-11 pl-2 pr-4 rounded-full border-0 bg-white/15 text-white text-[15px] font-semibold cursor-pointer hover:bg-white/25"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver al inicio
        </button>
        <span className="hidden sm:inline text-[12.5px] font-semibold tracking-[0.12em] uppercase text-[#c4dbdb]">Así se ve en la app · ejemplo</span>
        <span className="sm:hidden text-[12px] font-semibold tracking-[0.12em] uppercase text-[#c4dbdb]">Ejemplo</span>
      </div>
      <div ref={caja} data-sesion-scroll="" className="flex-1 min-h-0 overflow-y-auto overscroll-contain [&>div]:min-h-full">
      {isLoading ? (
        <div className="min-h-[70vh] flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
        </div>
      ) : error || !recurso || !task ? (
        <p className="m-0 px-5 py-10 text-center text-[16px] text-tinta-suave">No pudimos cargar la actividad. Probá de nuevo en un momento.</p>
      ) : fase === "sesion" && guion ? (
        <SesionGuiada
          guion={guion}
          datos={datosDeTarea(task)}
          etapas={[]}
          // El tablero ya presentó la actividad: la sesión arranca directo.
          inicio={0}
          registro={false}
          conClara={false}
          onSalir={() => setFase("tablero")}
          onTerminar={() => setFase("fin")}
        />
      ) : fase === "fin" ? (
        <Final titulo={recurso.titulo} onOtraVez={() => setFase("sesion")} onClose={onClose} />
      ) : (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {guion ? (
            <PanelActividad
              task={task}
              dia={{ dia: "", isToday: false, tasks: [task] }}
              rutaPasos=""
              publishAt={null}
              demo={{ onEmpezar: () => setFase("sesion"), nota: "Probala como si fuera tu familia: es un ejemplo y no se guarda nada." }}
            />
          ) : (
            // Sin sesión guiada: la ficha, como en la app.
            <>
              <h3 className="font-serif font-normal text-[26px] m-0 mb-3.5">{recurso.titulo}</h3>
              <div className="grid gap-4.5">
                <ResourceDetailView content={contenidoDeRecurso(recurso, `${recurso.tipo}${recurso.duracion ? ` · ${recurso.duracion}` : ""}`)} />
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function Final({ titulo, onOtraVez, onClose }: { titulo: string; onOtraVez: () => void; onClose: () => void }) {
  return (
    <div className="min-h-full flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white border border-borde px-6 py-8 text-center shadow-[0_18px_40px_-30px_rgba(31,51,56,0.55)]">
        <span aria-hidden="true" className="mx-auto mb-4 w-16 h-16 rounded-full bg-verde-tenue text-verde-profundo flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="m-0 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-tenue">Así de fácil</p>
        <h3 className="m-0 mt-1.5 font-serif font-normal text-[28px] leading-tight text-tinta">Terminaste «{titulo}»</h3>
        <p className="m-0 mt-3 text-[16.5px] leading-relaxed text-tinta-suave">
          Con tu cuenta, cada semana recibís un plan con actividades como esta, elegidas por nuestro equipo para vos o tu ser querido.
        </p>
        <div className="mt-6 grid gap-2.5">
          <Link
            to="/ingresar?mode=register"
            className="min-h-[54px] inline-flex items-center justify-center rounded-full bg-verde-profundo text-white text-[17px] font-semibold no-underline hover:bg-tinta"
          >
            Crear mi cuenta gratis
          </Link>
          <button
            type="button"
            onClick={onOtraVez}
            className="min-h-12 rounded-full border-[1.5px] border-borde bg-white text-[16px] font-semibold text-verde-profundo cursor-pointer hover:border-verde-serenidad"
          >
            Hacerla otra vez
          </button>
          <button type="button" onClick={onClose} className="min-h-11 border-0 bg-transparent text-[15px] font-semibold text-tinta-suave cursor-pointer underline underline-offset-4">
            Volver al inicio
          </button>
        </div>
      </section>
    </div>
  );
}
