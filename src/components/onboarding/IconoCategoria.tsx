import type { ReactNode } from "react";
import type { CategoriaCuestionario } from "../../lib/categoriasCuestionario";

// Íconos de línea de las categorías del cuestionario (mismo trazo que el home).
export function IconoCategoria({ icono, className = "w-7 h-7" }: { icono: CategoriaCuestionario["icono"]; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<CategoriaCuestionario["icono"], ReactNode> = {
    persona: (
      <>
        <circle {...p} cx="12" cy="8" r="3.6" />
        <path {...p} d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    corazon: <path {...p} d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z" />,
    estetoscopio: (
      <>
        <path {...p} d="M6 3.5v5a4 4 0 0 0 8 0v-5" />
        <path {...p} d="M10 12.5v2a4.5 4.5 0 0 0 9 0V12" />
        <circle {...p} cx="19" cy="10" r="2" />
      </>
    ),
    cerebro: (
      <>
        <path {...p} d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3.2 3.2 0 0 0 7 18h2V4.5z" />
        <path {...p} d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2A3.2 3.2 0 0 1 17 18h-2V4.5z" />
        <path {...p} d="M9 4.5h6M9 18v2M15 18v2" />
      </>
    ),
    luna: <path {...p} d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
    brujula: (
      <>
        <circle {...p} cx="12" cy="12" r="8.5" />
        <path {...p} d="M15.5 8.5l-2 5-5 2 2-5z" />
      </>
    ),
    casa: (
      <>
        <path {...p} d="M4 11l8-6.5 8 6.5" />
        <path {...p} d="M6 9.5V20h12V9.5M10 20v-5h4v5" />
      </>
    ),
    mano: <path {...p} d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V11m0-4a1.5 1.5 0 0 1 3 0v6.5a6.5 6.5 0 0 1-6.5 6.5h-.3a6 6 0 0 1-4.6-2.2L4.5 15a1.6 1.6 0 0 1 2.4-2.1L8 14" />,
    equilibrio: (
      <>
        <circle {...p} cx="12" cy="4.5" r="1.8" />
        <path {...p} d="M12 7v7M12 14l-3 6.5M12 14h4.5M5.5 9.5l6.5-1 6.5 1" />
      </>
    ),
    manzana: (
      <>
        <path {...p} d="M12 7.5c-2-1.6-6-1.4-6.8 2.6-.9 4.4 2 9.4 4.3 9.4 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.3 0 5.2-5 4.3-9.4C18 6.1 14 5.9 12 7.5z" />
        <path {...p} d="M12 7.5c0-2 1-3.5 3-4" />
      </>
    ),
    reloj: (
      <>
        <circle {...p} cx="12" cy="12" r="8.5" />
        <path {...p} d="M12 7.5V12l3 2" />
      </>
    ),
    estrella: <path {...p} d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[icono]}
    </svg>
  );
}
