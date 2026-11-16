import { barajar, entero, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «La carreta por pintar»: copiar en una rueda en blanco los colores de la
// rueda modelo, sector por sector. Tocar un bote (queda elegido) y después
// un sector. Con `rotada`, el modelo cuelga girado y vale cualquier giro.

// Los botes: color de la carreta y una marca en la tapa (no depender solo
// del color). Elegidos para que se distingan bien entre sí.
export const PINTURAS = [
  { id: "naranja", nombre: "naranja", color: "#E2582A", marca: "circulo" },
  { id: "verde", nombre: "verde", color: "#3f6a70", marca: "cuadrado" },
  { id: "amarillo", nombre: "amarillo", color: "#f4d096", marca: "triangulo" },
  { id: "rojo", nombre: "rojo vino", color: "#8E1F2A", marca: "rombo" },
] as const;
export type Marca = (typeof PINTURAS)[number]["marca"];

export interface ConfigPintarRueda {
  sectores: number;
  anillos: number;
  colores: number;
  rotada: boolean;
  semilla?: number;
}

export interface EjercicioRueda {
  sectores: number;
  anillos: number;
  // Índice de pintura por celda; celda = anillo * sectores + sector (anillo 0 = el de afuera).
  modelo: number[];
  // Pinturas disponibles (índices de PINTURAS).
  pinturas: number[];
  // Cuántos sectores aparece girado el modelo (0 si no está girado).
  giro: number;
}

export const celda = (sector: number, anillo: number, sectores: number) => anillo * sectores + sector;

export function generarRueda(c: ConfigPintarRueda, azar: Azar): EjercicioRueda {
  const pinturas = barajar(PINTURAS.map((_, i) => i), azar).slice(0, c.colores).sort((a, b) => a - b);
  const n = c.sectores * c.anillos;
  let modelo: number[] = [];
  // Que se usen todos los colores y que vecinos del mismo anillo no sean
  // todos iguales (un patrón con algo que copiar).
  for (let intento = 0; intento < 50; intento++) {
    modelo = Array.from({ length: n }, () => pinturas[entero(azar, 0, pinturas.length - 1)]);
    const usa = new Set(modelo);
    if (pinturas.every((p) => usa.has(p))) break;
  }
  if (!pinturas.every((p) => modelo.includes(p))) pinturas.forEach((p, i) => (modelo[i % n] = p));
  // El modelo girado: al menos un sector, nunca una vuelta entera.
  const giro = c.rotada ? entero(azar, 1, c.sectores - 1) : 0;
  return { sectores: c.sectores, anillos: c.anillos, modelo, pinturas, giro };
}

// Con qué giro la pintura se parece más al modelo (solo 0 si no está girado).
export function mejorGiro(ej: EjercicioRueda, pintura: (number | null)[], rotada: boolean): { giro: number; coinciden: number } {
  const giros = rotada ? Array.from({ length: ej.sectores }, (_, k) => k) : [0];
  let mejor = { giro: 0, coinciden: -1 };
  for (const k of giros) {
    let coinciden = 0;
    for (let a = 0; a < ej.anillos; a++)
      for (let s = 0; s < ej.sectores; s++) if (pintura[celda(s, a, ej.sectores)] === ej.modelo[celda((s + k) % ej.sectores, a, ej.sectores)]) coinciden++;
    // A igualdad, el giro con que se ve el modelo (copiar lo que se ve).
    if (coinciden > mejor.coinciden || (coinciden === mejor.coinciden && k === (ej.sectores - ej.giro) % ej.sectores)) mejor = { giro: k, coinciden };
  }
  return mejor;
}

// Lo que corresponde pintar en cada celda, con un giro dado.
export const objetivo = (ej: EjercicioRueda, giro: number) =>
  Array.from({ length: ej.sectores * ej.anillos }, (_, i) => ej.modelo[celda((i % ej.sectores + giro) % ej.sectores, Math.floor(i / ej.sectores), ej.sectores)]);

export function revisarRueda(ej: EjercicioRueda, pintura: (number | null)[], rotada: boolean): { completa: boolean; malas: number[]; giro: number } {
  const { giro } = mejorGiro(ej, pintura, rotada);
  const meta = objetivo(ej, giro);
  const malas = meta.map((p, i) => (pintura[i] === p ? -1 : i)).filter((i) => i >= 0);
  return { completa: malas.length === 0, malas, giro };
}

// Contraste entre dos colores (WCAG), para validar que los botes se distingan.
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export const pintarRueda: DefActividad<ConfigPintarRueda, EjercicioRueda> = {
  tipo: "pintar-rueda",
  version: 1,
  nombre: "La carreta por pintar",
  area: "Praxias",
  funcion: "Praxias visoconstructivas",
  porNivel: {
    suave: { sectores: 4, anillos: 1, colores: 2, rotada: false },
    medio: { sectores: 8, anillos: 1, colores: 3, rotada: false },
    retador: { sectores: 8, anillos: 2, colores: 4, rotada: false },
  },
  campos: [
    { clave: "sectores", tipo: "numero", etiqueta: "Sectores de la rueda", min: 4, max: 12 },
    { clave: "anillos", tipo: "numero", etiqueta: "Anillos", min: 1, max: 2 },
    { clave: "colores", tipo: "numero", etiqueta: "Colores", min: 2, max: 4 },
    { clave: "rotada", tipo: "booleano", etiqueta: "El modelo cuelga girado (vale cualquier giro)" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.sectores, 4, 12, "Sectores");
    enRango(e, c.anillos, 1, 2, "Anillos");
    enRango(e, c.colores, 2, 4, "Colores");
    if (!e.length && c.colores > c.sectores * c.anillos) e.push("Hay más colores que sectores para pintar.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarRueda(c, azar)),
  consigna: (c) =>
    `En el taller: pintá la rueda en blanco igual a la que cuelga en la pared. Tocá un bote y después el sector.${c.rotada ? " La de la pared está girada: vale igual." : ""}`,
  resumen: (c) => `${c.sectores} sectores, ${c.anillos === 1 ? "1 anillo" : "2 anillos"} y ${c.colores} colores${c.rotada ? "; el modelo cuelga girado" : ""}.`,
};
