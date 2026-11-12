import { createContext } from "react";
import type { Dificultad } from "./nivelSugerido";

// Registro dentro del cierre del juego. Lo da la pantalla que muestra una
// actividad de hoy todavía sin registrar (familia o participante): al
// terminar, el mismo cierre pregunta «¿Cómo le resultó?» y «¿Lo pudieron
// hacer?». Sin contexto (Biblioteca, vista previa de la clínica), el cierre
// es el de siempre y no se guarda nada.
export type ValorRegistro = "done" | "partial" | "no";

export interface RegistroJuego {
  guardar: (v: ValorRegistro, dificultad: Dificultad | null, comentario?: string) => Promise<void>;
  // Después de registrar (volver a Hoy, etc.).
  onListo?: () => void;
  textoListo?: string;
}

export const RegistroJuegoContexto = createContext<RegistroJuego | null>(null);
