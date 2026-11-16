import { barajar, elegir, type Azar } from "./azar";
import { CONJUNTOS, type Cosa, type Sutileza } from "./bancos/intrusos";
import { enRango, type DefActividad } from "./contrato";

// «La olla de carne»: sobre la mesa hay de 4 a 6 cosas; todas van en la
// olla menos una. La persona toca la que no va.

export interface ConfigIntruso {
  elementos: number;
  sutileza: Sutileza;
  mostrarCriterio: boolean;
  semilla?: number;
}

export interface EjercicioIntruso {
  conjunto: string;
  titulo: string;
  cosas: Cosa[];
  // Índice del que no va.
  intruso: number;
  // Por qué no va, ya armado («Todos son verdes menos la zanahoria.»).
  criterio: string;
}

const SUTILEZAS: { valor: Sutileza; etiqueta: string }[] = [
  { valor: "evidente", etiqueta: "Evidente (un jabón entre verduras)" },
  { valor: "categoria", etiqueta: "De una categoría cercana (una fruta entre verduras)" },
  { valor: "propiedad", etiqueta: "Por una propiedad (todos son verdes menos uno)" },
];

const conjuntosDe = (s: Sutileza, elementos: number) => CONJUNTOS.filter((k) => k.sutileza === s && k.van.length >= elementos - 1 && k.intrusos.length > 0);

export function generarIntruso(c: ConfigIntruso, azar: Azar, evitar?: string): EjercicioIntruso {
  const posibles = conjuntosDe(c.sutileza, c.elementos);
  // No repetir el mismo conjunto dos veces seguidas si hay otro.
  const k = elegir(posibles.length > 1 ? posibles.filter((x) => x.id !== evitar) : posibles, azar);
  const van = barajar(k.van, azar).slice(0, c.elementos - 1);
  const intruso = elegir(k.intrusos, azar);
  const cosas = barajar([...van, intruso], azar);
  return {
    conjunto: k.id,
    titulo: k.titulo,
    cosas,
    intruso: cosas.indexOf(intruso),
    criterio: k.criterio.replace("{x}", `«${intruso.texto.toLowerCase()}»`),
  };
}

export const intruso: DefActividad<ConfigIntruso, EjercicioIntruso> = {
  tipo: "intruso",
  version: 1,
  nombre: "La olla de carne",
  area: "Funciones ejecutivas",
  funcion: "Razonamiento (categorías y propiedades)",
  porNivel: {
    suave: { elementos: 4, sutileza: "evidente", mostrarCriterio: true },
    medio: { elementos: 5, sutileza: "categoria", mostrarCriterio: true },
    retador: { elementos: 6, sutileza: "propiedad", mostrarCriterio: false },
  },
  campos: [
    { clave: "elementos", tipo: "numero", etiqueta: "Cosas sobre la mesa", min: 4, max: 6 },
    { clave: "sutileza", tipo: "opcion", etiqueta: "Qué tan evidente es el que no va", opciones: SUTILEZAS },
    { clave: "mostrarCriterio", tipo: "booleano", etiqueta: "Después de acertar, mostrar por qué no va" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.elementos, 4, 6, "Cosas sobre la mesa");
    if (!SUTILEZAS.some((s) => s.valor === c.sutileza)) e.push("Elegí qué tan evidente es el que no va.");
    else if (!e.length && !conjuntosDe(c.sutileza, c.elementos).length) e.push(`No hay contenido para ${c.elementos} cosas con esa dificultad.`);
    return e;
  },
  generar: (c, n, { azar }) => {
    const out: EjercicioIntruso[] = [];
    let previo: string | undefined;
    for (let i = 0; i < n; i++) {
      const ej = generarIntruso(c, azar, previo);
      previo = ej.conjunto;
      out.push(ej);
    }
    return out;
  },
  consigna: () => "En la cocina: todo lo de la mesa va junto menos una cosa. Tocá la que no va.",
  resumen: (c) => `${c.elementos} cosas sobre la mesa; el que no va es ${c.sutileza === "evidente" ? "evidente" : c.sutileza === "categoria" ? "de una categoría cercana" : "por una propiedad (color, si se cocina…)"}${c.mostrarCriterio ? "; después dice por qué" : ""}.`,
};
