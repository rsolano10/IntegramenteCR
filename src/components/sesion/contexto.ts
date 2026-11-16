import { createContext, useContext } from "react";
import type { AdaptacionPorEtapa, NivelCognitivo, ResourceExtras } from "../../lib/mediaResources";
import type { ResourceModulo } from "../../lib/modulos";
import type { Guion, Respuestas } from "../../lib/sesiones";

// Lo que la sesión necesita del recurso o de la tarea del plan.
export interface DatosSesion {
  titulo: string;
  modulo: ResourceModulo | null;
  videoUrl: string | null;
  posterUrl?: string;
  sabiasQue: string | null;
  // Dosis autorizada para esta persona (plan_tasks.indicacion_individual).
  indicacionIndividual: string | null;
  // Material de apoyo del recurso (tabla, tarjetas, temporizador).
  extras?: ResourceExtras | null;
  // La ayuda validada de la ficha: se suma en «Ayuda». (La «adaptación»
  // de los primeros recursos usa los semáforos de la clínica: no se muestra.)
  ayuda?: string | null;
  adaptacion?: string | null;
  adaptacionPorEtapa?: AdaptacionPorEtapa | null;
}

export interface Tema {
  claro: string;
  fuerte: string;
  tinta: string;
  // Relleno de los dibujos: el color fuerte del módulo, suavizado.
  relleno: string;
}

export interface RegistroSesion {
  v: "done" | "partial" | "no";
  comentario?: string;
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
  // Termina la sesión: guarda el avance y, si corresponde, el registro.
  terminar: (reg?: RegistroSesion) => Promise<void>;
  // Si al terminar se pregunta «¿Pudieron hacer la actividad?» (no, cuando
  // se hace para practicar o en la prueba de la clínica).
  registro: boolean;
  // Se paró antes de terminar (desde «Parar»).
  paradaAntes: boolean;
  leerSiempre: boolean;
  alternarLeer: () => void;
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
    ceja: large ? "text-[14px]" : "text-[14px]",
  };
}
