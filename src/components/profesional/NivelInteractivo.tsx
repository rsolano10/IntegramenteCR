import { Suspense, lazy, useState } from "react";
import { NIVELES, nivelDe, nivelLabel, type ExtrasInteractiva, type Nivel } from "../../lib/actividades/contrato";
import { resumenNivel } from "../../lib/actividades/registro";
import type { OrigenNivel } from "../../lib/actividades/nivelSugerido";
import { Modal } from "../ui/Modal";

const ActividadInteractiva = lazy(() => import("../actividades/interactivas/Marco"));

// Marca «Interactivo» para listas de recursos (biblioteca, plantillas,
// calendario). Mismo estilo sutil que el módulo.
export function MarcaInteractivo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-mostaza-vital/50 px-2 py-0.5 text-[11.5px] font-semibold text-tinta ${className}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4.2 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16" />
      </svg>
      Juego
    </span>
  );
}

// Elegir la dificultad de un juego al asignarlo. `valor` null = el
// sugerido (por la última vez que se le asignó, por su etapa o, si no hay
// datos, el del recurso). En plantillas, null = «Según el perfil» de cada
// paciente.
const ORIGEN: Record<OrigenNivel, string> = {
  elegido: "el que elegiste para esta persona",
  ultimo: "el mismo de la última vez",
  etapa: "sugerido por su etapa",
  recurso: "sugerido del juego",
};

export function NivelInteractivo({
  extras,
  valor,
  onChange,
  sugerido,
  segunPerfil = false,
}: {
  extras: ExtrasInteractiva;
  valor: Nivel | null;
  onChange: (n: Nivel | null) => void;
  sugerido?: { nivel: Nivel; origen: OrigenNivel };
  /** Plantillas: agrega «Según el perfil» (valor null). */
  segunPerfil?: boolean;
}) {
  const [probando, setProbando] = useState(false);
  const base = sugerido ?? { nivel: nivelDe(extras), origen: "recurso" as const };
  const actual = valor ?? base.nivel;
  const perfilElegido = segunPerfil && valor === null;
  return (
    <fieldset className="m-0 mt-3 p-0 border-0 grid gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-tinta-suave">{segunPerfil ? "Nivel del juego" : "Nivel para esta persona"}</legend>
      <div className={`grid ${segunPerfil ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"} gap-1.5`} role="radiogroup">
        {segunPerfil && (
          <button
            type="button"
            role="radio"
            aria-checked={perfilElegido}
            onClick={() => onChange(null)}
            className={`min-h-11 rounded-xl text-[14px] font-semibold cursor-pointer border-[1.5px] ${
              perfilElegido ? "bg-verde-profundo border-verde-profundo text-white" : "bg-white border-borde-campo text-tinta-suave hover:border-verde-serenidad"
            }`}
          >
            Según el perfil
          </button>
        )}
        {NIVELES.map((n) => {
          const marcado = !perfilElegido && actual === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={marcado}
              onClick={() => onChange(n)}
              className={`min-h-11 rounded-xl text-[14px] font-semibold cursor-pointer border-[1.5px] ${
                marcado ? "bg-verde-profundo border-verde-profundo text-white" : "bg-white border-borde-campo text-tinta-suave hover:border-verde-serenidad"
              }`}
            >
              {nivelLabel[n]}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="m-0 flex-1 min-w-[12rem] text-[13px] leading-relaxed text-tinta-suave">
          {perfilElegido ? (
            "Cada paciente recibe el nivel de su etapa: suave con demencia, medio con deterioro cognitivo leve, retador en preventivo."
          ) : (
            <>
              {resumenNivel(extras, actual)}
              {!segunPerfil && valor === null && <span className="text-tinta-tenue"> ({ORIGEN[base.origen]})</span>}
            </>
          )}
        </p>
        <button type="button" onClick={() => setProbando(true)} className="shrink-0 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none p-0">
          Probar este nivel
        </button>
      </div>
      {probando && (
        <Modal onClose={() => setProbando(false)} size="lg">
          <p className="m-0 mb-3 pr-10 text-[13px] text-tinta-suave">Vista de prueba en nivel {nivelLabel[actual].toLowerCase()}. No se guarda nada.</p>
          <Suspense fallback={<div className="min-h-[240px]" />}>
            <ActividadInteractiva extras={{ ...extras, nivel: actual }} />
          </Suspense>
        </Modal>
      )}
    </fieldset>
  );
}

// Ícono chico de «interactivo» para las celdas del calendario.
export function IconoInteractivo({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4.2 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16" />
    </svg>
  );
}

// Filtro «Solo interactivos» para las listas de recursos.
export function FiltroInteractivos({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={() => onChange(!activo)}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-semibold border cursor-pointer ${
        activo ? "bg-mostaza-vital border-mostaza-vital text-tinta" : "bg-white text-tinta-suave border-borde hover:border-verde-serenidad"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4.2 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16" />
      </svg>
      Solo juegos
    </button>
  );
}
