import { barajar, desordenar, entero, type Azar } from "./azar";
import { RUTINAS } from "./bancos/rutinas";
import { PALABRAS } from "./bancos/palabras";
import { enRango, type DefActividad } from "./contrato";

// Lógica común de «Ordenar los pasos» y «En orden»: se tocan las tarjetas en el
// orden correcto y cada toque válido la pasa a la fila ordenada. Un toque que
// no corresponde no mueve nada (sin castigo).

export interface Tarjeta {
  id: number;
  texto: string;
  // Posición correcta (0 = la primera).
  orden: number;
}

export interface EjercicioOrdenar {
  titulo?: string;
  tarjetas: Tarjeta[]; // desordenadas, como se muestran
  // Pares de posiciones que se aceptan en cualquier orden.
  intercambiables: [number, number][];
}

// ¿Puede ir esta tarjeta ahora? Sí, si todas las que faltan y van antes son
// intercambiables con ella.
export function esSiguienteValida(ej: EjercicioOrdenar, colocadas: number[], id: number): boolean {
  if (colocadas.includes(id)) return false;
  const t = ej.tarjetas.find((x) => x.id === id);
  if (!t) return false;
  const par = (a: number, b: number) => ej.intercambiables.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return ej.tarjetas.every((o) => o.id === id || colocadas.includes(o.id) || o.orden > t.orden || par(o.orden, t.orden));
}

// La que sigue en el orden canónico (para la pista).
export function siguienteCorrecta(ej: EjercicioOrdenar, colocadas: number[]): number | null {
  const faltan = ej.tarjetas.filter((t) => !colocadas.includes(t.id)).sort((a, b) => a.orden - b.orden);
  return faltan[0]?.id ?? null;
}

// ─── Ordenar los pasos ───

export interface ConfigOrdenarPasos {
  rutinas: string[]; // vacío = todas
  pasos: number;
  semilla?: number;
}

export function generarPasos(c: ConfigOrdenarPasos, cantidad: number, azar: Azar): EjercicioOrdenar[] {
  const elegibles = RUTINAS.filter((r) => (!c.rutinas.length || c.rutinas.includes(r.id)) && r.pasos.length >= c.pasos);
  const orden = barajar(elegibles, azar);
  return Array.from({ length: cantidad }, (_, i) => {
    const r = orden[i % orden.length];
    // Un subconjunto de pasos que conserva el orden de la rutina.
    const indices = barajar(r.pasos.map((_, k) => k), azar).slice(0, c.pasos).sort((a, b) => a - b);
    const nuevo = new Map(indices.map((k, pos) => [k, pos]));
    const tarjetas = indices.map((k, pos) => ({ id: pos, texto: r.pasos[k], orden: pos }));
    return {
      titulo: r.nombre,
      tarjetas: desordenar(tarjetas, azar),
      intercambiables: (r.intercambiables ?? []).filter(([a, b]) => nuevo.has(a) && nuevo.has(b)).map(([a, b]) => [nuevo.get(a)!, nuevo.get(b)!] as [number, number]),
    };
  });
}

export const ordenarPasos: DefActividad<ConfigOrdenarPasos, EjercicioOrdenar> = {
  tipo: "ordenar-pasos",
  version: 1,
  nombre: "El café de la tarde",
  area: "Funciones ejecutivas",
  funcion: "Planificación (secuenciación)",
  porNivel: {
    suave: { rutinas: [], pasos: 3 },
    medio: { rutinas: [], pasos: 5 },
    retador: { rutinas: [], pasos: 7 },
  },
  campos: [
    { clave: "pasos", tipo: "numero", etiqueta: "Pasos por rutina", min: 3, max: 7 },
    { clave: "rutinas", tipo: "multiple", etiqueta: "Rutinas (ninguna marcada = todas)", opciones: RUTINAS.map((r) => ({ valor: r.id, etiqueta: `${r.nombre} (${r.pasos.length} pasos)` })) },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.pasos, 3, 7, "Los pasos por rutina");
    if (!Array.isArray(c.rutinas)) e.push("La lista de rutinas no es válida.");
    else if (!e.length && !RUTINAS.some((r) => (!c.rutinas.length || c.rutinas.includes(r.id)) && r.pasos.length >= c.pasos))
      e.push(`Ninguna de las rutinas elegidas tiene ${c.pasos} pasos o más.`);
    return e;
  },
  generar: (c, n, { azar }) => generarPasos(c, n, azar),
  consigna: () => "Tocá los pasos en el orden en que se hacen, del primero al último.",
};

// ─── En orden ───

export type ContenidoSecuencia = "numeros" | "letras" | "palabras";

export interface ConfigOrdenarSecuencia {
  contenido: ContenidoSecuencia;
  cantidad: number;
  sentido: "ascendente" | "descendente";
  numeroMax: number;
  // Lista propia de palabras (opcional).
  palabras: string[];
  // Palabras que empiezan con la misma letra (más difícil).
  mismaInicial: boolean;
  semilla?: number;
}

const ALFABETO = "ABCDEFGHIJLMNÑOPRSTUVZ".split("");
const comparar = (a: string, b: string) => a.localeCompare(b, "es", { sensitivity: "base" });

export function generarSecuencia(c: ConfigOrdenarSecuencia, azar: Azar): EjercicioOrdenar {
  let valores: string[];
  if (c.contenido === "numeros") {
    const set = new Set<number>();
    while (set.size < c.cantidad) set.add(entero(azar, 1, c.numeroMax));
    valores = [...set].sort((a, b) => a - b).map(String);
  } else if (c.contenido === "letras") {
    valores = barajar(ALFABETO, azar).slice(0, c.cantidad).sort(comparar);
  } else {
    const propias = c.palabras.map((p) => p.trim()).filter(Boolean);
    let fuente = propias.length >= c.cantidad ? propias : PALABRAS.map((p) => p.palabra);
    if (c.mismaInicial && !propias.length) {
      const grupos = new Map<string, string[]>();
      for (const p of fuente) grupos.set(p[0].toUpperCase(), [...(grupos.get(p[0].toUpperCase()) ?? []), p]);
      const ok = [...grupos.values()].filter((g) => g.length >= c.cantidad);
      if (ok.length) fuente = ok[Math.floor(azar() * ok.length)];
    }
    valores = barajar([...new Set(fuente)], azar).slice(0, c.cantidad).sort(comparar);
  }
  if (c.sentido === "descendente") valores.reverse();
  const tarjetas = valores.map((texto, orden) => ({ id: orden, texto, orden }));
  return { tarjetas: desordenar(tarjetas, azar), intercambiables: [] };
}

export const ordenarSecuencia: DefActividad<ConfigOrdenarSecuencia, EjercicioOrdenar> = {
  tipo: "ordenar-secuencia",
  version: 1,
  nombre: "La estación",
  area: "Funciones ejecutivas",
  funcion: "Memoria de trabajo",
  porNivel: {
    suave: { contenido: "numeros", cantidad: 4, sentido: "ascendente", numeroMax: 20, palabras: [], mismaInicial: false },
    medio: { contenido: "numeros", cantidad: 6, sentido: "ascendente", numeroMax: 100, palabras: [], mismaInicial: false },
    retador: { contenido: "numeros", cantidad: 9, sentido: "ascendente", numeroMax: 1000, palabras: [], mismaInicial: false },
  },
  campos: [
    {
      clave: "contenido",
      tipo: "opcion",
      etiqueta: "Qué se ordena",
      opciones: [
        { valor: "numeros", etiqueta: "Números" },
        { valor: "letras", etiqueta: "Letras" },
        { valor: "palabras", etiqueta: "Palabras (orden alfabético)" },
      ],
    },
    { clave: "cantidad", tipo: "numero", etiqueta: "Tarjetas por ejercicio", min: 3, max: 9 },
    {
      clave: "sentido",
      tipo: "opcion",
      etiqueta: "Sentido",
      opciones: [
        { valor: "ascendente", etiqueta: "De menor a mayor (A a Z)" },
        { valor: "descendente", etiqueta: "De mayor a menor (Z a A)" },
      ],
    },
    { clave: "numeroMax", tipo: "numero", etiqueta: "Número más alto", min: 10, max: 1000 },
    { clave: "palabras", tipo: "lista", etiqueta: "Palabras propias (opcional)", ayuda: "Separadas por comas: nombres de la familia, lugares conocidos." },
    { clave: "mismaInicial", tipo: "booleano", etiqueta: "Palabras que empiezan con la misma letra" },
  ],
  validar(c) {
    const e: string[] = [];
    if (!["numeros", "letras", "palabras"].includes(c.contenido)) e.push("Elegí qué se ordena.");
    enRango(e, c.cantidad, 3, 9, "Las tarjetas por ejercicio");
    enRango(e, c.numeroMax, 10, 1000, "El número más alto");
    if (c.contenido === "numeros" && c.numeroMax < c.cantidad) e.push("El número más alto tiene que ser mayor que la cantidad de tarjetas.");
    const propias = (c.palabras ?? []).filter((p) => p.trim());
    if (c.contenido === "palabras" && propias.length > 0 && propias.length < c.cantidad) e.push(`Faltan palabras propias: hacen falta al menos ${c.cantidad}.`);
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarSecuencia(c, azar)),
  consigna: (c) => {
    const que = c.contenido === "numeros" ? "los números" : c.contenido === "letras" ? "las letras" : "las palabras";
    const como =
      c.contenido === "numeros" ? (c.sentido === "ascendente" ? "de menor a mayor" : "de mayor a menor") : c.sentido === "ascendente" ? "en orden alfabético, de la A a la Z" : "de la Z a la A";
    return `Enganchá los vagones al tren: tocá ${que} ${como}.`;
  },
};
