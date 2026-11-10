import { barajar, elegir, type Azar } from "./azar";
import { FLECHAS } from "./bancos/figuras";
import { enRango, type DefActividad } from "./contrato";

// «Buscá los iguales»: arriba un modelo; abajo, tocar todos los que son
// iguales y después «Listo».

export type ContenidoIguales = "figuras" | "letras" | "numeros";
export type Parecido = "bajo" | "medio" | "alto";

export interface ConfigEncontrarIguales {
  contenido: ContenidoIguales;
  total: number;
  objetivos: number;
  parecido: Parecido;
  semilla?: number;
}

export interface EjercicioIguales {
  contenido: ContenidoIguales;
  modelo: string;
  celdas: string[];
}

// Familias de elementos que se confunden entre sí (parecido alto).
const FAMILIAS: Record<ContenidoIguales, string[][]> = {
  letras: [
    ["b", "d", "p", "q"],
    ["m", "n", "u", "w"],
    ["E", "F", "L", "T"],
    ["O", "Q", "C", "G"],
    ["M", "N", "W", "V"],
  ],
  numeros: [
    ["69", "96", "66", "99"],
    ["18", "81", "88", "11"],
    ["23", "32", "22", "33"],
    ["47", "74", "44", "77"],
    ["35", "53", "55", "38"],
  ],
  figuras: [[...FLECHAS], ["cuadrado", "rombo"], ["circulo"], ["triangulo"], ["estrella"], ["cruz"]],
};

export function generarIguales(c: ConfigEncontrarIguales, azar: Azar): EjercicioIguales {
  const familias = FAMILIAS[c.contenido];
  const conVecinos = familias.filter((f) => f.length >= (c.parecido === "alto" ? 3 : 2));
  const familia = c.parecido === "bajo" ? elegir(familias, azar) : elegir(conVecinos, azar);
  const modelo = elegir(familia, azar);
  const parecidos = familia.filter((x) => x !== modelo);
  const otros = familias.filter((f) => f !== familia).flat().filter((x) => x !== modelo);
  const n = c.total - c.objetivos;
  const distractores = Array.from({ length: n }, (_, i) => {
    const deFamilia = c.parecido === "alto" || (c.parecido === "medio" && i % 2 === 0);
    return deFamilia && parecidos.length ? elegir(parecidos, azar) : elegir(otros, azar);
  });
  return { contenido: c.contenido, modelo, celdas: barajar([...Array(c.objetivos).fill(modelo), ...distractores], azar) };
}

export const indicesObjetivo = (ej: EjercicioIguales) => ej.celdas.flatMap((x, i) => (x === ej.modelo ? [i] : []));

export function revisarIguales(ej: EjercicioIguales, marcadas: number[]) {
  const objetivo = indicesObjetivo(ej);
  const sobran = marcadas.filter((i) => !objetivo.includes(i));
  const faltan = objetivo.filter((i) => !marcadas.includes(i));
  return { correcto: !sobran.length && !faltan.length, sobran, faltan };
}

export const encontrarIguales: DefActividad<ConfigEncontrarIguales, EjercicioIguales> = {
  tipo: "encontrar-iguales",
  version: 1,
  nombre: "Buscá los iguales",
  area: "Atención",
  funcion: "Atención selectiva",
  porNivel: {
    suave: { contenido: "figuras", total: 6, objetivos: 2, parecido: "bajo" },
    medio: { contenido: "figuras", total: 12, objetivos: 4, parecido: "medio" },
    retador: { contenido: "figuras", total: 20, objetivos: 6, parecido: "alto" },
  },
  campos: [
    {
      clave: "contenido",
      tipo: "opcion",
      etiqueta: "Qué se busca",
      opciones: [
        { valor: "figuras", etiqueta: "Figuras" },
        { valor: "letras", etiqueta: "Letras" },
        { valor: "numeros", etiqueta: "Números" },
      ],
    },
    { clave: "total", tipo: "numero", etiqueta: "Elementos en pantalla", min: 6, max: 20 },
    { clave: "objetivos", tipo: "numero", etiqueta: "Cuántos iguales hay", min: 2, max: 6 },
    {
      clave: "parecido",
      tipo: "opcion",
      etiqueta: "Qué tanto se parecen los demás",
      opciones: [
        { valor: "bajo", etiqueta: "Poco (muy distintos)" },
        { valor: "medio", etiqueta: "Algo" },
        { valor: "alto", etiqueta: "Mucho (b/d/p/q, 69/96, flechas)" },
      ],
    },
  ],
  validar(c) {
    const e: string[] = [];
    if (!["figuras", "letras", "numeros"].includes(c.contenido)) e.push("Elegí qué se busca.");
    if (!["bajo", "medio", "alto"].includes(c.parecido)) e.push("Elegí qué tanto se parecen.");
    enRango(e, c.total, 6, 20, "Los elementos en pantalla");
    enRango(e, c.objetivos, 2, 6, "Los iguales");
    if (!e.length && c.objetivos >= c.total) e.push("Tiene que haber más elementos que iguales.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarIguales(c, azar)),
  consigna: () => "Mirá el modelo de arriba. Tocá todos los que son iguales y después «Listo».",
};
