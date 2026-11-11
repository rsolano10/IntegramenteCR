import type { CSSProperties } from "react";
import { P } from "./paleta";

// Comportamiento de las piezas tocables de todas las escenas. Se distinguen
// del decorado por tres señales a la vez: más contraste, sombra de papel y
// borde claro. Seleccionada: se levanta y gana borde mostaza. Acierto: se
// asienta con un rebote corto. Reintento: vuelve con suavidad. 150-400 ms.

export type EstadoPieza = "reposo" | "elegida" | "pista" | "regreso" | "asentada" | "quieta";

export const clasePieza =
  "relative select-none cursor-pointer p-0 font-sans transition-[transform,box-shadow] duration-200 motion-reduce:transition-none disabled:cursor-default focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo";

export function estiloPieza(estado: EstadoPieza, sombra = "rgba(51,36,28,0.38)"): { className: string; style: CSSProperties } {
  switch (estado) {
    case "elegida":
      return {
        className: "-translate-y-1.5 scale-[1.04]",
        style: { border: `3px solid ${P.mostaza}`, boxShadow: `0 9px 0 rgba(51,36,28,0.22), 0 0 0 3px ${P.tierra}22` },
      };
    case "pista":
      return { className: "", style: { border: `3px dashed ${P.mostaza}`, boxShadow: `0 4px 0 ${sombra}` } };
    case "regreso":
      return { className: "motion-safe:animate-[pueblo-regreso_320ms_ease-out]", style: { border: `2px solid ${P.cal}`, boxShadow: `0 4px 0 ${sombra}` } };
    case "asentada":
      return { className: "motion-safe:animate-[pueblo-asentar_320ms_ease-out]", style: { border: `2px solid ${P.cal}`, boxShadow: `0 3px 0 ${sombra}` } };
    case "quieta":
      // Ya ubicada: parte de la escena, sin borde de «tocable».
      return { className: "", style: { boxShadow: `0 3px 0 ${sombra}` } };
    default:
      return { className: "", style: { border: `2px solid ${P.cal}`, boxShadow: `0 4px 0 ${sombra}` } };
  }
}

// Sombra de capa (papel sobre papel) para las escenas.
export const sombraCapa = { boxShadow: "0 4px 0 rgba(51,36,28,0.25)" } as const;
