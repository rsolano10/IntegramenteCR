import { barajar, type Azar } from "./azar";
import { PRODUCTOS, TRAMOS, productoDe, type Tramo } from "./bancos/mandado";
import { enRango, type DefActividad } from "./contrato";

// «El mandado»: primero la lista (escrita, escuchada o las dos); la persona
// toca «Ya me la aprendí» y, de memoria, busca en los tramos del mercado lo
// que había que traer. Cada producto tocado entra a la bolsa; «Listo»
// revisa. Lo que no estaba en la lista sale de la bolsa con suavidad.

export type Formato = "escrita" | "escuchada" | "ambas";

export interface ConfigMandado {
  productos: number;
  distractores: number;
  formato: Formato;
  agruparPorTramo: boolean;
  verLista: boolean;
  mismaCategoria: boolean;
  semilla?: number;
}

export interface Puesto {
  tramo: Tramo;
  items: string[];
}

export interface EjercicioMandado {
  lista: string[]; // ids, en el orden en que se dicen
  puestos: Puesto[];
  texto: string; // la lista, para leer en voz alta
}

const FORMATOS = [
  { valor: "escrita", etiqueta: "Escrita en el papelito" },
  { valor: "escuchada", etiqueta: "Solo escuchada" },
  { valor: "ambas", etiqueta: "Escrita y para escuchar" },
];

const ORDEN_TRAMOS: Tramo[] = ["verduras", "lacteos", "abarrotes", "flores"];

export const textoLista = (ids: string[]) => {
  const n = ids.map((id) => productoDe(id).nombre.toLowerCase());
  return `Hay que traer: ${n.length === 1 ? n[0] : `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`}.`;
};

export function generarMandado(c: ConfigMandado, azar: Azar, evitar: string[] = []): EjercicioMandado {
  // Que no se repita la misma lista dos veces seguidas.
  let lista: string[] = [];
  for (let k = 0; k < 10; k++) {
    lista = barajar(PRODUCTOS, azar)
      .slice(0, c.productos)
      .map((x) => x.id);
    if (lista.join() !== [...evitar].sort().join() || k === 9) break;
  }
  if (c.agruparPorTramo) lista.sort((a, b) => ORDEN_TRAMOS.indexOf(productoDe(a).tramo) - ORDEN_TRAMOS.indexOf(productoDe(b).tramo));
  const enLista = new Set(lista);
  const tramosLista = new Set(lista.map((id) => productoDe(id).tramo));
  const candidatos = PRODUCTOS.filter((x) => !enLista.has(x.id) && (!c.mismaCategoria || tramosLista.has(x.tramo)));
  const resto = PRODUCTOS.filter((x) => !enLista.has(x.id) && !candidatos.includes(x));
  const distractores = [...barajar(candidatos, azar), ...barajar(resto, azar)].slice(0, c.distractores).map((x) => x.id);
  const todos = new Set([...lista, ...distractores]);
  const puestos = ORDEN_TRAMOS.map((tramo) => ({
    tramo,
    items: barajar(
      PRODUCTOS.filter((x) => x.tramo === tramo && todos.has(x.id)).map((x) => x.id),
      azar,
    ),
  })).filter((pu) => pu.items.length > 0);
  return { lista, puestos, texto: textoLista(lista) };
}

// Qué hay en la bolsa que no estaba en la lista, y qué falta.
export function revisarBolsa(ej: Pick<EjercicioMandado, "lista">, bolsa: string[]): { sobran: string[]; faltan: string[]; completa: boolean } {
  const sobran = bolsa.filter((id) => !ej.lista.includes(id));
  const faltan = ej.lista.filter((id) => !bolsa.includes(id));
  return { sobran, faltan, completa: !sobran.length && !faltan.length };
}

export const mandado: DefActividad<ConfigMandado, EjercicioMandado> = {
  tipo: "mandado",
  version: 1,
  nombre: "El mandado",
  area: "Memoria",
  funcion: "Memoria verbal (lista de compras)",
  porNivel: {
    suave: { productos: 2, distractores: 4, formato: "ambas", agruparPorTramo: true, verLista: true, mismaCategoria: false },
    medio: { productos: 4, distractores: 6, formato: "ambas", agruparPorTramo: false, verLista: false, mismaCategoria: false },
    retador: { productos: 6, distractores: 8, formato: "escuchada", agruparPorTramo: false, verLista: false, mismaCategoria: true },
  },
  campos: [
    { clave: "productos", tipo: "numero", etiqueta: "Cosas en la lista", min: 2, max: 6 },
    { clave: "distractores", tipo: "numero", etiqueta: "Otras cosas en los puestos", min: 2, max: 10 },
    { clave: "formato", tipo: "opcion", etiqueta: "Cómo se da la lista", opciones: FORMATOS },
    { clave: "agruparPorTramo", tipo: "booleano", etiqueta: "La lista viene ordenada por tramo" },
    { clave: "verLista", tipo: "booleano", etiqueta: "Permitir volver a ver la lista" },
    { clave: "mismaCategoria", tipo: "booleano", etiqueta: "Las otras cosas, de los mismos tramos (más difícil)" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.productos, 2, 6, "Cosas en la lista");
    enRango(e, c.distractores, 2, 10, "Otras cosas en los puestos");
    if (!FORMATOS.some((f) => f.valor === c.formato)) e.push("Elegí cómo se da la lista.");
    if (!e.length && c.productos + c.distractores > PRODUCTOS.length) e.push(`Entre la lista y las otras cosas no pueden pasar de ${PRODUCTOS.length}.`);
    return e;
  },
  generar: (c, n, { azar }) => {
    const out: EjercicioMandado[] = [];
    for (let i = 0; i < n; i++) out.push(generarMandado(c, azar, out[i - 1]?.lista));
    return out;
  },
  consigna: (c) =>
    `En el mercado: ${c.formato === "escuchada" ? "escuchá" : "leé"} la lista del mandado y aprendétela. Después, tocá en los puestos lo que hay que traer.`,
  resumen: (c) =>
    `Listas de ${c.productos} cosas, ${c.formato === "escuchada" ? "solo escuchadas" : c.formato === "escrita" ? "escritas" : "escritas y para escuchar"}, con ${c.distractores} cosas de más en los puestos${c.mismaCategoria ? " (de los mismos tramos)" : ""}${c.verLista ? "; se puede volver a ver la lista" : ""}.`,
};

export const nombreTramo = (t: Tramo) => TRAMOS[t].nombre;
