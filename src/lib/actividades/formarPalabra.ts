import { barajar, desordenar, type Azar } from "./azar";
import { PALABRAS, largo, letrasDe, type PalabraBanco } from "./bancos/palabras";
import { enRango, type DefActividad } from "./contrato";

// «Armá la palabra»: letras desordenadas en fichas; tocar una la pone en la
// siguiente casilla libre y tocar una casilla llena la devuelve.

export interface ConfigFormarPalabra {
  // Lista propia (nombres de la familia, lugares, cosas significativas).
  palabras: string[];
  banco: "todas" | PalabraBanco["categoria"];
  longitudMin: number;
  longitudMax: number;
  mostrarPista: boolean;
  primeraLetra: boolean;
  semilla?: number;
}

export interface EjercicioPalabra {
  objetivo: string[]; // letras de la palabra, en orden
  fichas: { id: number; letra: string }[]; // desordenadas
  pista: string | null;
  // Cuántas letras del comienzo ya vienen puestas.
  fijas: number;
  // Otras palabras del banco con las mismas letras (también valen).
  aceptadas: string[];
}

const norm = (s: string) => s.normalize("NFC").toLocaleLowerCase("es");
const firma = (s: string) => letrasDe(norm(s)).sort().join("");

export function generarPalabra(palabra: string, pista: string | null, c: ConfigFormarPalabra, azar: Azar, banco: string[]): EjercicioPalabra {
  const objetivo = letrasDe(palabra);
  const fijas = c.primeraLetra ? 1 : 0;
  const ids = objetivo.map((letra, id) => ({ id, letra }));
  const sueltas = desordenar(ids.slice(fijas), azar);
  const f = firma(palabra);
  return {
    objetivo,
    fichas: [...ids.slice(0, fijas), ...sueltas],
    pista: c.mostrarPista ? pista : null,
    fijas,
    aceptadas: [...new Set([norm(palabra), ...banco.filter((w) => firma(w) === f).map(norm)])],
  };
}

// Letras correctas desde el comienzo.
export function prefijoCorrecto(objetivo: string[], puestas: string[]): number {
  let i = 0;
  while (i < puestas.length && norm(puestas[i]) === norm(objetivo[i])) i++;
  return i;
}

export const palabraFormada = (ej: EjercicioPalabra, puestas: string[]) => puestas.length === ej.objetivo.length && ej.aceptadas.includes(norm(puestas.join("")));

function candidatas(c: ConfigFormarPalabra): { palabra: string; pista: string | null }[] {
  const propias = c.palabras.map((p) => p.trim()).filter((p) => largo(p) >= 2 && !/\s/.test(p));
  if (propias.length) return propias.map((palabra) => ({ palabra, pista: null }));
  return PALABRAS.filter((p) => (c.banco === "todas" || p.categoria === c.banco) && largo(p.palabra) >= c.longitudMin && largo(p.palabra) <= c.longitudMax).map((p) => ({
    palabra: p.palabra,
    pista: p.pista,
  }));
}

export const formarPalabra: DefActividad<ConfigFormarPalabra, EjercicioPalabra> = {
  tipo: "formar-palabra",
  version: 1,
  nombre: "El rotulista",
  area: "Lenguaje",
  funcion: "Vocabulario",
  porNivel: {
    suave: { palabras: [], banco: "todas", longitudMin: 3, longitudMax: 4, mostrarPista: true, primeraLetra: true },
    medio: { palabras: [], banco: "todas", longitudMin: 5, longitudMax: 6, mostrarPista: true, primeraLetra: false },
    retador: { palabras: [], banco: "todas", longitudMin: 7, longitudMax: 9, mostrarPista: false, primeraLetra: false },
  },
  campos: [
    { clave: "palabras", tipo: "lista", etiqueta: "Palabras propias (opcional)", ayuda: "Separadas por comas: nombres de la familia, lugares, cosas importantes para la persona. Si hay, se usan en lugar del banco." },
    {
      clave: "banco",
      tipo: "opcion",
      etiqueta: "Palabras del banco",
      opciones: [
        { valor: "todas", etiqueta: "Todas" },
        { valor: "casa", etiqueta: "La casa" },
        { valor: "comida", etiqueta: "Comidas" },
        { valor: "lugar", etiqueta: "Lugares" },
        { valor: "naturaleza", etiqueta: "Naturaleza y animales" },
        { valor: "persona", etiqueta: "Personas" },
      ],
    },
    { clave: "longitudMin", tipo: "numero", etiqueta: "Letras, mínimo", min: 3, max: 9 },
    { clave: "longitudMax", tipo: "numero", etiqueta: "Letras, máximo", min: 3, max: 9 },
    { clave: "mostrarPista", tipo: "booleano", etiqueta: "Mostrar una pista corta (qué es)" },
    { clave: "primeraLetra", tipo: "booleano", etiqueta: "Dar la primera letra ya puesta" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.longitudMin, 3, 9, "Las letras mínimas");
    enRango(e, c.longitudMax, 3, 9, "Las letras máximas");
    if (c.longitudMin > c.longitudMax) e.push("El mínimo de letras no puede ser mayor que el máximo.");
    const propias = (c.palabras ?? []).filter((p) => p.trim());
    if (propias.some((p) => /\s/.test(p.trim()))) e.push("Cada palabra propia tiene que ser una sola palabra, sin espacios.");
    if (propias.some((p) => largo(p.trim()) > 12)) e.push("Las palabras propias pueden tener hasta 12 letras.");
    if (!e.length && !candidatas(c).length) e.push("No hay palabras del banco con ese largo en esa categoría.");
    return e;
  },
  generar(c, n, { azar }) {
    const lista = barajar(candidatas(c), azar);
    const banco = PALABRAS.map((p) => p.palabra);
    return Array.from({ length: n }, (_, i) => {
      const w = lista[i % lista.length];
      return generarPalabra(w.palabra, w.pista, c, azar, banco);
    });
  },
  consigna: () => "El rotulista necesita ayuda: tocá las letras en orden para pintar el rótulo.",
};
