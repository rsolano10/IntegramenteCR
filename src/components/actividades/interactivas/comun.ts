import { createContext, useEffect, useRef } from "react";

// Los mensajes del juego («Muy bien…», «Probemos otra vez», las pistas) se
// muestran en el mismo letrero de la consigna: el letrero queda fijo y solo
// cambia el texto un rato; después vuelve la consigna.
export type Aviso = { id: number; tipo: "ok" | "reintento" | "info"; texto: string };
export const MensajeJuego = createContext<Aviso | null>(null);
// Cuánto queda un mensaje en el letrero: más cuanto más texto (entre 2,6 y 6 segundos).
export const esperaMensaje = (texto: string) => Math.min(6000, Math.max(2600, 1400 + texto.length * 55));

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
  // Ejercicio actual (0 = el primero) y total de la sesión, para que la
  // escena responda al avance (por ejemplo, el sol que sale en la feria).
  indice: number;
  total: number;
  // Lugar de la barra de acciones del marco (ver <Acciones>).
  barra: HTMLElement | null;
}

export const foco = "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo";

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

