import { barajar, type Azar } from "./azar";
import { OBJETOS } from "./bancos/figuras";
import { PALABRAS, largo } from "./bancos/palabras";
import { claveRoseton, type FormaPetalo, type ParamsRoseton } from "./roseton";
import { enRango, type DefActividad } from "./contrato";

// «Encontrá las parejas»: cartas boca abajo; se voltean de a dos. Si no son
// pareja quedan a la vista hasta tocar «Continuar» (no se voltean solas).

export interface ConfigParejas {
  pares: number;
  contenido: "baldosas" | "iconos" | "palabras" | "icono-palabra";
  numerarReverso: boolean;
  semilla?: number;
}

// Baldosa hidráulica: fondo, rosetón central y cuartos de rosetón en las esquinas.
export interface Baldosa {
  fondo: string;
  centro: ParamsRoseton;
  esquina: string;
}
export type Cara = { tipo: "icono"; valor: string; nombre: string } | { tipo: "palabra"; valor: string } | { tipo: "baldosa"; valor: string; nombre: string; baldosa: Baldosa };

const FONDOS: [string, string][] = [
  ["#F6F1E4", "cal"],
  ["#3f6a70", "verde"],
  ["#A8232B", "rojo"],
  ["#f4d096", "mostaza"],
  ["#E2582A", "naranja"],
  ["#8A4B9A", "morado"],
];
const FORMAS: [FormaPetalo, string][] = [
  ["gota", "flor de pétalos"],
  ["punta", "estrella"],
  ["redonda", "flor de puntos"],
];

// Baldosas distintas entre sí: cada una con su fondo, forma y número de pétalos.
export function generarBaldosas(n: number, azar: Azar): { clave: string; nombre: string; baldosa: Baldosa }[] {
  const combos = barajar(
    FONDOS.flatMap((f, i) => FORMAS.map((fo, j) => ({ f, fo, k: (i + j) % 3 }))),
    azar,
  );
  return combos.slice(0, n).map(({ f, fo, k }) => {
    const resto = FONDOS.filter((x) => x !== f).map((x) => x[0]);
    const colores = barajar(resto, azar).slice(0, 3);
    const centro: ParamsRoseton = { petalos: [6, 8, 12][k], anillos: 2, forma: fo[0], colores, puntos: k === 1 };
    return { clave: `${f[0]}|${claveRoseton(centro)}`, nombre: `baldosa ${f[1]} con ${fo[1]}`, baldosa: { fondo: f[0], centro, esquina: colores[0] } };
  });
}
export interface Carta {
  id: number;
  pareja: number;
  cara: Cara;
}
export interface EjercicioParejas {
  cartas: Carta[];
}

const sinArticulo = (s: string) => s.replace(/^(el|la|los|las) /, "");

export function generarParejas(c: ConfigParejas, azar: Azar): EjercicioParejas {
  const cartas: Omit<Carta, "id">[] = [];
  if (c.contenido === "baldosas") {
    generarBaldosas(c.pares, azar).forEach((b, k) => {
      const cara: Cara = { tipo: "baldosa", valor: b.clave, nombre: b.nombre, baldosa: b.baldosa };
      cartas.push({ pareja: k, cara }, { pareja: k, cara });
    });
  } else if (c.contenido === "palabras") {
    const palabras = barajar(
      PALABRAS.filter((p) => largo(p.palabra) <= 7),
      azar,
    ).slice(0, c.pares);
    palabras.forEach((p, k) => cartas.push({ pareja: k, cara: { tipo: "palabra", valor: p.palabra } }, { pareja: k, cara: { tipo: "palabra", valor: p.palabra } }));
  } else {
    const objetos = barajar(OBJETOS, azar).slice(0, c.pares);
    objetos.forEach((o, k) => {
      const icono: Cara = { tipo: "icono", valor: o.id, nombre: sinArticulo(o.nombre) };
      cartas.push({ pareja: k, cara: icono }, { pareja: k, cara: c.contenido === "icono-palabra" ? { tipo: "palabra", valor: sinArticulo(o.nombre) } : icono });
    });
  }
  return { cartas: barajar(cartas, azar).map((x, id) => ({ ...x, id })) };
}

// ─── Estado (puro) ───

export interface EstadoParejas {
  encontradas: number[]; // ids de cartas ya emparejadas
  volteadas: number[]; // 0, 1 o 2 cartas boca arriba sin pareja
  // Dos cartas distintas a la vista: esperan «Continuar».
  esperando: boolean;
}
export const estadoParejas = (): EstadoParejas => ({ encontradas: [], volteadas: [], esperando: false });

export type ResultadoVolteo = "nada" | "primera" | "pareja" | "distintas";

export function voltear(ej: EjercicioParejas, e: EstadoParejas, id: number): { estado: EstadoParejas; resultado: ResultadoVolteo } {
  if (e.esperando || e.encontradas.includes(id) || e.volteadas.includes(id)) return { estado: e, resultado: "nada" };
  if (e.volteadas.length === 0) return { estado: { ...e, volteadas: [id] }, resultado: "primera" };
  const [a] = e.volteadas;
  const ca = ej.cartas[a];
  const cb = ej.cartas[id];
  if (ca.pareja === cb.pareja) return { estado: { encontradas: [...e.encontradas, a, id], volteadas: [], esperando: false }, resultado: "pareja" };
  return { estado: { ...e, volteadas: [a, id], esperando: true }, resultado: "distintas" };
}

export const continuar = (e: EstadoParejas): EstadoParejas => (e.esperando ? { ...e, volteadas: [], esperando: false } : e);
export const parejasCompletas = (ej: EjercicioParejas, e: EstadoParejas) => e.encontradas.length === ej.cartas.length;
export const companera = (ej: EjercicioParejas, id: number) => ej.cartas.find((c) => c.id !== id && c.pareja === ej.cartas[id].pareja)!.id;

export const parejas: DefActividad<ConfigParejas, EjercicioParejas> = {
  tipo: "parejas",
  version: 1,
  nombre: "El piso de mosaico",
  area: "Memoria",
  funcion: "Memoria episódica",
  porNivel: {
    suave: { pares: 3, contenido: "baldosas", numerarReverso: true },
    medio: { pares: 6, contenido: "baldosas", numerarReverso: true },
    retador: { pares: 8, contenido: "baldosas", numerarReverso: false },
  },
  campos: [
    { clave: "pares", tipo: "numero", etiqueta: "Parejas", min: 3, max: 8 },
    {
      clave: "contenido",
      tipo: "opcion",
      etiqueta: "Contenido de las cartas",
      opciones: [
        { valor: "baldosas", etiqueta: "Baldosas de mosaico" },
        { valor: "iconos", etiqueta: "Dibujos iguales" },
        { valor: "palabras", etiqueta: "Palabras iguales" },
        { valor: "icono-palabra", etiqueta: "Un dibujo y su nombre" },
      ],
    },
    { clave: "numerarReverso", tipo: "booleano", etiqueta: "Número en el reverso (ayuda para ubicar las cartas)" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.pares, 3, 8, "Las parejas");
    if (!["baldosas", "iconos", "palabras", "icono-palabra"].includes(c.contenido)) e.push("Elegí el contenido de las cartas.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarParejas(c, azar)),
  consigna: (c) =>
    c.contenido === "icono-palabra"
      ? "Tocá dos cartas para darles vuelta. Buscá cada dibujo con su nombre."
      : c.contenido === "baldosas"
        ? "Tocá dos baldosas para darles vuelta. Buscá las que tienen el mismo dibujo."
        : "Tocá dos cartas para darles vuelta. Buscá las que son iguales.",
  resumen: (c) => `${c.pares} parejas${c.numerarReverso ? ", con las baldosas numeradas" : ""}.`,
};
