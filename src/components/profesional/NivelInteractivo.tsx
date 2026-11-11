import { Suspense, lazy, useState } from "react";
import { NIVELES, nivelDe, nivelLabel, type ExtrasInteractiva, type Nivel } from "../../lib/actividades/contrato";
import { resumenNivel } from "../../lib/actividades/registro";
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
      Interactivo
    </span>
  );
}

// Elegir la dificultad de una actividad interactiva al asignarla. `valor`
// null = la del recurso (se muestra marcada como «del recurso»).
export function NivelInteractivo({ extras, valor, onChange }: { extras: ExtrasInteractiva; valor: Nivel | null; onChange: (n: Nivel) => void }) {
  const [probando, setProbando] = useState(false);
  const delRecurso = nivelDe(extras);
  const actual = valor ?? delRecurso;
  return (
    <fieldset className="m-0 mt-3 p-0 border-0 grid gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-tinta-suave">Dificultad para esta persona</legend>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup">
        {NIVELES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={actual === n}
            onClick={() => onChange(n)}
            className={`min-h-11 rounded-xl text-[14px] font-semibold cursor-pointer border-[1.5px] ${
              actual === n ? "bg-verde-profundo border-verde-profundo text-white" : "bg-white border-borde-campo text-tinta-suave hover:border-verde-serenidad"
            }`}
          >
            {nivelLabel[n]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="m-0 flex-1 min-w-[12rem] text-[13px] leading-relaxed text-tinta-suave">
          {resumenNivel(extras, actual)}
          {actual === delRecurso && <span className="text-tinta-tenue"> (nivel del recurso)</span>}
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
      Solo interactivos
    </button>
  );
}
