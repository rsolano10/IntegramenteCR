import { createContext, useEffect, useRef } from "react";

// Contrato entre el marco y cada juego, y ayudas comunes (sin componentes).

export interface Control {
  // Respuesta que corresponde: confirmación breve y se reinician los intentos del paso.
  acierto: (texto?: string) => void;
  // Respuesta que no corresponde: mensaje neutro; tras 2 en el mismo paso aparece «Ver una pista».
  reintento: (texto?: string) => void;
  // Mensaje informativo (no cuenta como intento).
  aviso: (texto: string) => void;
  // El ejercicio quedó resuelto.
  listo: () => void;
  // Sube cada vez que la persona toca «Ver una pista».
  pista: number;
  large: boolean;
}

export const foco = "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo";

// Clases de una ficha tocable según su estado.
export function claseFicha({ elegida, hecha, pista, reintento }: { elegida?: boolean; hecha?: boolean; pista?: boolean; reintento?: boolean }) {
  const estado = hecha
    ? "bg-campo border-2 border-semaforo-verde-texto text-tinta cursor-default"
    : reintento
      ? "bg-aviso border-[3px] border-mostaza-vital text-tinta"
      : elegida
        ? "bg-white border-[3px] border-verde-profundo text-tinta shadow-elevada motion-safe:-translate-y-0.5"
        : pista
          ? "bg-white border-[3px] border-dashed border-mostaza-vital text-tinta"
          : "bg-white border-2 border-borde-campo text-tinta hover:border-verde-serenidad";
  return `relative min-h-14 min-w-14 rounded-2xl font-sans font-semibold cursor-pointer transition-[transform,box-shadow,background-color,border-color] duration-200 motion-reduce:transition-none ${estado} ${foco}`;
}

// Ejecuta `aplicar` cada vez que la persona pide una pista (no al montar).
export function usePista(pista: number, aplicar: () => void) {
  const previa = useRef(pista);
  const fn = useRef(aplicar);
  fn.current = aplicar;
  useEffect(() => {
    if (pista === previa.current) return;
    previa.current = pista;
    fn.current();
  }, [pista]);
}

// Tema visual del marco: "noche" para las actividades con escena inmersiva
// (por ahora, «Ventanas encendidas»). Los botones lo leen solos.
export type Tema = "claro" | "noche";
export const TemaJuego = createContext<Tema>("claro");
