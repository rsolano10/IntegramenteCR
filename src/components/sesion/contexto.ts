import { createContext, useContext } from "react";
import type { NivelCognitivo } from "../../lib/mediaResources";
import type { ResourceModulo } from "../../lib/modulos";
import type { Guion, Progreso, Respuestas } from "../../lib/sesiones";

// Lo que la sesión necesita del recurso o de la tarea del plan.
export interface DatosSesion {
  titulo: string;
  modulo: ResourceModulo | null;
  videoUrl: string | null;
  posterUrl?: string;
  sabiasQue: string | null;
  // Dosis autorizada para esta persona (plan_tasks.indicacion_individual).
  indicacionIndividual: string | null;
}

export interface Tema {
  claro: string;
  fuerte: string;
  tinta: string;
  // Relleno de los dibujos: el color fuerte del módulo, suavizado.
  relleno: string;
}

export interface CtxSesion {
  guion: Guion;
  datos: DatosSesion;
  etapas: NivelCognitivo[];
  large: boolean;
  participante: boolean;
  tema: Tema;
  respuestas: Respuestas;
  responder: (clave: string, valor: string | string[]) => void;
  marcas: boolean[];
  marcar: (i: number) => void;
  siguiente: () => void;
  anterior: (() => void) | null;
  abrirAyuda: (() => void) | null;
  abrirParar: () => void;
  terminar: (extra?: Partial<Progreso>) => void;
  textoTerminar: string;
}

export const SesionContexto = createContext<CtxSesion | null>(null);

export function useSesion(): CtxSesion {
  const c = useContext(SesionContexto);
  if (!c) throw new Error("Fuera de una sesión guiada");
  return c;
}

// Tamaños de letra según el modo (familia o participante, más grande).
export function useTam() {
  const { large } = useSesion();
  return {
    titulo: large ? "text-[34px]" : "text-[28px] sm:text-[30px]",
    grande: large ? "text-[28px]" : "text-[23px] sm:text-[25px]",
    cuerpo: large ? "text-[21px]" : "text-[17.5px]",
    chico: large ? "text-[18px]" : "text-[15px]",
    ceja: large ? "text-[14px]" : "text-[12.5px]",
  };
}
