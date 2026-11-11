import { barajar, elegir, type Azar } from "./azar";
import { FLECHAS } from "./bancos/figuras";
import { claveRoseton, type FormaPetalo, type ParamsRoseton } from "./roseton";
import { enRango, type DefActividad } from "./contrato";

// «Buscá los iguales»: arriba un modelo; abajo, tocar todos los que son
// iguales y después «Listo».

export type ContenidoIguales = "ruedas" | "figuras" | "letras" | "numeros";
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
  // Para "ruedas": cómo pintar cada clave.
  ruedas?: Record<string, ParamsRoseton>;
}

// ─── Ruedas de carreta (generadas con el rosetón) ───
// Juegos de colores de carreta (paleta de ilustración).
export const JUEGOS_COLOR = [
  ["#E2582A", "#f4d096", "#A8232B", "#F6F1E4"],
  ["#3f6a70", "#f4d096", "#E2582A", "#F6F1E4"],
  ["#A8232B", "#F6F1E4", "#3f6a70", "#f4d096"],
  ["#8A4B9A", "#f4d096", "#F6F1E4", "#E2582A"],
  ["#f4d096", "#E2582A", "#3f6a70", "#A8232B"],
];
const FORMAS: FormaPetalo[] = ["gota", "punta", "redonda"];

function ruedaAlAzar(azar: Azar): ParamsRoseton {
  return {
    petalos: elegir([6, 8, 10, 12], azar),
    anillos: elegir([1, 2, 2, 3], azar),
    forma: elegir(FORMAS, azar),
    colores: elegir(JUEGOS_COLOR, azar),
    desfase: false,
    puntos: azar() < 0.5,
  };
}

// Variante de la rueda modelo: cuanto más alto el parecido, menos cambia.
export function variarRueda(m: ParamsRoseton, parecido: Parecido, azar: Azar): ParamsRoseton {
  const otroColor = () => elegir(JUEGOS_COLOR.filter((c) => c !== m.colores), azar);
  const otraForma = () => elegir(FORMAS.filter((f) => f !== m.forma), azar);
  if (parecido === "bajo") return { ...m, colores: otroColor(), forma: otraForma(), anillos: m.anillos === 1 ? 2 : 1 };
  if (parecido === "medio")
    return elegir<() => ParamsRoseton>(
      [() => ({ ...m, colores: otroColor() }), () => ({ ...m, forma: otraForma() }), () => ({ ...m, anillos: m.anillos === 3 ? 2 : m.anillos + 1 })],
      azar,
    )();
  return elegir<() => ParamsRoseton>(
    [
      () => ({ ...m, petalos: m.petalos === 12 ? 10 : m.petalos + 2 }),
      () => ({ ...m, puntos: !m.puntos }),
      () => ({ ...m, colores: [m.colores[1], m.colores[0], ...m.colores.slice(2)] }),
      () => ({ ...m, anillos: m.anillos === 1 ? 2 : m.anillos - 1 }),
    ],
    azar,
  )();
}

function generarRuedas(c: ConfigEncontrarIguales, azar: Azar): EjercicioIguales {
  const modelo = ruedaAlAzar(azar);
  const km = claveRoseton(modelo);
  const ruedas: Record<string, ParamsRoseton> = { [km]: modelo };
  const distractores = Array.from({ length: c.total - c.objetivos }, () => {
    let v = variarRueda(modelo, c.parecido, azar);
    for (let i = 0; i < 5 && claveRoseton(v) === km; i++) v = variarRueda(modelo, c.parecido, azar);
    const k = claveRoseton(v);
    ruedas[k] = v;
    return k;
  }).filter((k) => k !== km);
  while (distractores.length < c.total - c.objetivos) {
    const v = { ...modelo, colores: JUEGOS_COLOR.find((x) => x !== modelo.colores)! };
    ruedas[claveRoseton(v)] = v;
    distractores.push(claveRoseton(v));
  }
  return { contenido: "ruedas", modelo: km, celdas: barajar([...Array(c.objetivos).fill(km), ...distractores], azar), ruedas };
}

// Familias de elementos que se confunden entre sí (parecido alto).
const FAMILIAS: Record<Exclude<ContenidoIguales, "ruedas">, string[][]> = {
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
  if (c.contenido === "ruedas") return generarRuedas(c, azar);
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
  nombre: "El taller de carretas",
  area: "Atención",
  funcion: "Atención selectiva",
  porNivel: {
    suave: { contenido: "ruedas", total: 6, objetivos: 2, parecido: "bajo" },
    medio: { contenido: "ruedas", total: 9, objetivos: 3, parecido: "medio" },
    retador: { contenido: "ruedas", total: 12, objetivos: 4, parecido: "alto" },
  },
  campos: [
    {
      clave: "contenido",
      tipo: "opcion",
      etiqueta: "Qué se busca",
      opciones: [
        { valor: "ruedas", etiqueta: "Ruedas de carreta" },
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
        { valor: "alto", etiqueta: "Mucho (cambia un solo detalle de la rueda; b/d/p/q; 69/96)" },
      ],
    },
  ],
  validar(c) {
    const e: string[] = [];
    if (!["ruedas", "figuras", "letras", "numeros"].includes(c.contenido)) e.push("Elegí qué se busca.");
    if (!["bajo", "medio", "alto"].includes(c.parecido)) e.push("Elegí qué tanto se parecen.");
    enRango(e, c.total, 6, 20, "Los elementos en pantalla");
    enRango(e, c.objetivos, 2, 6, "Los iguales");
    if (!e.length && c.objetivos >= c.total) e.push("Tiene que haber más elementos que iguales.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarIguales(c, azar)),
  consigna: () => "Mirá la rueda que cuelga en la pared. Tocá todas las ruedas iguales a ella y después «Listo».",
  resumen: (c) => `${c.total} ruedas, ${c.objetivos} iguales al modelo; las demás se parecen ${c.parecido === "bajo" ? "poco" : c.parecido === "medio" ? "algo" : "mucho"}.`,
};
