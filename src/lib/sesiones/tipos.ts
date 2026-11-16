// Sesión guiada: cada recurso con guion propio se recorre como una serie de
// escenas cortas (una idea por pantalla) en vez de leer la ficha completa.
// El guion vive en el código a propósito: cada actividad tiene su lógica
// (qué se elige, qué se arma, qué se repasa) y no se edita desde la
// Biblioteca. Editar el recurso cambia la ficha completa, no la sesión.
// Los textos cortos salen del texto validado del manual y quedaron
// aprobados por la clínica (`revisado`).

import type { NivelCognitivo } from "../mediaResources";
import type { NombreIcono } from "./iconos";

export interface Opcion {
  id: string;
  texto: string;
  icono: NombreIcono;
  // Cómo se dice dentro de una frase («visitar a un familiar»).
  dicho?: string;
}

export interface Item {
  icono: NombreIcono;
  texto: string;
}

// Condición para mostrar una escena según lo que se eligió antes.
export interface Si {
  clave: string;
  es: string[];
}

interface Base {
  si?: Si;
}

export type Escena = Base &
  (
    | { tipo: "seguridad" }
    | { tipo: "preparar"; titulo: string; nota?: string; items: Item[] }
    | { tipo: "video"; titulo: string; nota?: string }
    | { tipo: "consigna"; titulo: string; texto: string; icono?: NombreIcono; nota?: string; paso?: { n: number; de: number } }
    | {
        tipo: "decir";
        titulo: string;
        frase: string;
        icono?: NombreIcono;
        nota?: string;
        otras?: string[];
        pista?: string;
        // Un contador para festejar cada hallazgo («Lo encontró»).
        contar?: string;
      }
    // Un texto breve para leerle en voz alta (noticia, escena, mensaje).
    // `resaltar` marca una palabra dentro del texto.
    | { tipo: "leer"; titulo: string; texto: string; nota?: string; resaltar?: string; icono?: NombreIcono }
    // El material de apoyo del recurso (tabla, tarjetas, temporizador).
    | { tipo: "material"; titulo: string; nota?: string }
    | {
        tipo: "elegir";
        clave: string;
        titulo: string;
        nota?: string;
        opciones: Opcion[];
        // Una opción más para escribir («Otra salida»): se guarda en `${clave}_texto`.
        libre?: string;
      }
    | {
        tipo: "lista";
        clave: string;
        titulo: string;
        frase?: string;
        nota?: string;
        // Sugerencias fijas o según una elección anterior (`segun`).
        sugerencias: Opcion[] | Record<string, Opcion[]>;
        segun?: string;
        minimo: number;
        pista?: string;
        // Agregar algo que no está entre las sugerencias.
        libre?: string;
      }
    | {
        tipo: "ordenar";
        clave: string;
        titulo: string;
        frase?: string;
        nota?: string;
        items: Opcion[] | Record<string, Opcion[]>;
        segun?: string;
        // Ordenar lo que se armó antes en una lista (en vez de `items`).
        desde?: string;
        minimo: number;
        pista?: string;
      }
    // Ritmos para escuchar e imitar. Cada patrón son golpes separados por
    // espacios: «x» golpe, «-» pausa, «A» y «B» dos sonidos distintos.
    // Con `pulso`, un pulso parejo y lento para acompañar.
    | { tipo: "ritmo"; titulo: string; nota?: string; patrones: string[]; pulso?: boolean }
    | { tipo: "repeticiones"; titulo: string; nota: string; min: number; max: number; recordatorios: string[]; lados?: boolean }
    // Sostener una posición unos segundos (cuenta regresiva) o hacer un
    // recorrido (cuenta hacia arriba, con un mínimo).
    | {
        tipo: "tiempo";
        modo: "sostener" | "recorrido";
        titulo: string;
        nota: string;
        segundos: number;
        minimo?: number;
        intentos: number;
        lados?: boolean;
        recordatorios: string[];
      }
    | { tipo: "descanso"; titulo: string; segundos: number; texto: string }
    | { tipo: "sentir"; titulo: string }
    | { tipo: "repaso"; titulo: string; nota?: string; partes: { etiqueta: string; clave: string }[] }
    // `icono`: el dibujo de cada marca; sin él, el de lo elegido antes.
    | { tipo: "mision"; clave: string; titulo: string; texto: string; veces: number; nota?: string; icono?: NombreIcono }
    | { tipo: "cuidados"; titulo: string; nota?: string; items: Item[] }
    | { tipo: "cierre"; texto: string; dato?: boolean }
  );

export type TipoEscena = Escena["tipo"];

export interface Guion {
  codigo: string;
  revisado: boolean;
  // Portada: qué es, en una frase, con su dibujo y etiquetas cortas.
  frase: string;
  icono: NombreIcono;
  etiquetas: string[];
  // Un solo cuidado clave antes de empezar (el resto, en su escena).
  cuidado?: string;
  // Ejercicio físico: botón «Parar» siempre a mano y escena de seguridad.
  ejercicio?: boolean;
  // «Necesita ayuda»: consejos generales y, si hay, por etapa.
  ayuda: string[];
  ayudaPorEtapa?: Partial<Record<NivelCognitivo, string>>;
  escenas: Escena[];
}

// Lo que se responde durante la sesión: una opción (elegir) o varias en
// orden (lista, ordenar).
export type Respuestas = Record<string, string | string[]>;

// Lo que queda guardado en plan_tasks.progreso.
// Cómo se usó la sesión (para la clínica: qué conviene ajustar).
export interface UsoSesion {
  vistas: number; // pantallas vistas (sin la portada)
  total: number;
  ayuda: number; // veces que abrió «Ayuda»
  parar: number; // veces que abrió «Parar»
  segundos: number;
  terminada: boolean;
  clara?: "si" | "masomenos" | "no";
}

export interface Progreso {
  respuestas?: Respuestas;
  uso?: UsoSesion;
  mision?: { clave: string; veces: number; marcas: boolean[]; texto: string; detalle?: string; icono?: NombreIcono };
  terminada?: string;
}
