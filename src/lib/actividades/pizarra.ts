import { barajar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «La pizarra de la escuela»: una consigna («Decí todos los nombres de
// frutas que se te ocurran») y la pizarra se va llenando. Sin tiempo, sin
// conteo visible y sin validar: cualquier palabra cuenta igual. Las
// repetidas se ignoran en silencio. Nada de lo dicho se guarda.
//
// Entrada: «marcas» (la persona las dice en voz alta y el familiar marca
// con tiza), «teclado», o «dictado» (solo si la clínica lo permite: el
// reconocimiento de voz del navegador puede procesar la voz fuera del
// dispositivo; decisión abierta 6.2).

export type ModoEntrada = "marcas" | "teclado" | "dictado";

export interface Consigna {
  id: string;
  texto: string; // «Nombres de frutas»
  frase: string; // «Decí todos los nombres de frutas que se te ocurran.»
  ejemplo: string;
  pistas: string[];
  grupo: "amplia" | "acotada" | "letra";
}

const c = (grupo: Consigna["grupo"], id: string, texto: string, frase: string, ejemplo: string, pistas: string[]): Consigna => ({ id, texto, frase, ejemplo, pistas, grupo });

// `revisado: false` hasta que el equipo lo apruebe.
export const REVISADO_PIZARRA = false;

export const CONSIGNAS: Consigna[] = [
  c("amplia", "frutas", "Frutas", "Decí todos los nombres de frutas que se te ocurran.", "mango", ["Pensá en frutas que se dan en el patio.", "Pensá en las frutas de la feria.", "Pensá en frutas para hacer fresco."]),
  c("amplia", "animales", "Animales", "Decí todos los animales que se te ocurran.", "perro", ["Pensá en animales de la finca.", "Pensá en animales del monte.", "Pensá en animales que vuelan."]),
  c("amplia", "comidas", "Comidas típicas", "Decí todas las comidas típicas que se te ocurran.", "gallo pinto", ["Pensá en lo que se come en un turno.", "Pensá en lo que se come en Navidad.", "Pensá en lo que se desayuna."]),
  c("amplia", "cocina", "Cosas de la cocina", "Decí todas las cosas de la cocina que se te ocurran.", "olla", ["Pensá en lo que hay en los gabinetes.", "Pensá en lo que se usa para servir.", "Pensá en lo que hay sobre la cocina."]),
  c("acotada", "flores", "Flores", "Decí todos los nombres de flores que se te ocurran.", "guaria morada", ["Pensá en flores de un jardín.", "Pensá en flores para la iglesia.", "Pensá en flores de colores fuertes."]),
  c("acotada", "pueblos", "Pueblos de Costa Rica", "Decí todos los pueblos de Costa Rica que se te ocurran.", "Cartago", ["Pensá en pueblos de tu provincia.", "Pensá en pueblos de la costa.", "Pensá en pueblos por donde pasa el bus."]),
  c("acotada", "herramientas", "Herramientas", "Decí todas las herramientas que se te ocurran.", "martillo", ["Pensá en lo que se usa en el taller.", "Pensá en lo que se usa en la huerta.", "Pensá en lo que usa un carpintero."]),
  c("acotada", "oficios", "Oficios", "Decí todos los oficios que se te ocurran.", "zapatero", ["Pensá en quiénes trabajan en el pueblo.", "Pensá en quiénes trabajan en el campo.", "Pensá en quiénes arreglan cosas."]),
  c("letra", "letra-m", "Palabras con M", "Decí todas las palabras que empiecen con M que se te ocurran.", "mesa", ["Pensá en cosas de la casa con M.", "Pensá en comidas con M.", "Pensá en nombres de persona con M."]),
  c("letra", "letra-p", "Palabras con P", "Decí todas las palabras que empiecen con P que se te ocurran.", "papa", ["Pensá en comidas con P.", "Pensá en animales con P.", "Pensá en lugares con P."]),
  c("letra", "letra-c", "Palabras con C", "Decí todas las palabras que empiecen con C que se te ocurran.", "casa", ["Pensá en cosas de la cocina con C.", "Pensá en animales con C.", "Pensá en colores con C."]),
  c("letra", "letra-s", "Palabras con S", "Decí todas las palabras que empiecen con S que se te ocurran.", "sol", ["Pensá en cosas del cielo con S.", "Pensá en comidas con S.", "Pensá en cosas de la ropa con S."]),
];

export interface ConfigPizarra {
  consignas: string[];
  modoEntrada: ModoEntrada;
  permitirDictado: boolean;
  mostrarEjemplo: boolean;
  semilla?: number;
}

export interface EjercicioPizarra {
  consigna: Consigna;
}

const MODOS = [
  { valor: "marcas", etiqueta: "La persona las dice y el familiar marca con tiza" },
  { valor: "teclado", etiqueta: "Escribirlas" },
  { valor: "dictado", etiqueta: "Dictarlas (solo si se permite el dictado)" },
];

// Para ignorar repetidas: sin mayúsculas, tildes ni espacios de más.
export const normalizar = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zñ0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Agrega las palabras nuevas (de lo escrito o dictado) sin repetir.
export function agregarPalabras(actuales: string[], texto: string, separarPorEspacios = false): string[] {
  const vistas = new Set(actuales.map(normalizar));
  const out = [...actuales];
  const nuevas = texto.split(separarPorEspacios ? /[,;.\s]+/ : /[,;.]+/);
  for (const n of nuevas) {
    const limpia = n.replace(/\s+/g, " ").trim();
    const k = normalizar(limpia);
    if (!k || vistas.has(k)) continue;
    vistas.add(k);
    out.push(limpia);
  }
  return out;
}

const ids = (g: Consigna["grupo"]) => CONSIGNAS.filter((x) => x.grupo === g).map((x) => x.id);

export const pizarra: DefActividad<ConfigPizarra, EjercicioPizarra> = {
  tipo: "pizarra",
  version: 1,
  nombre: "La pizarra de la escuela",
  area: "Lenguaje",
  funcion: "Fluidez verbal (categorías y letras)",
  porNivel: {
    suave: { consignas: ids("amplia"), modoEntrada: "marcas", permitirDictado: false, mostrarEjemplo: true },
    medio: { consignas: ids("acotada"), modoEntrada: "marcas", permitirDictado: false, mostrarEjemplo: false },
    retador: { consignas: ids("letra"), modoEntrada: "marcas", permitirDictado: false, mostrarEjemplo: false },
  },
  campos: [
    { clave: "consignas", tipo: "multiple", etiqueta: "Consignas", opciones: CONSIGNAS.map((x) => ({ valor: x.id, etiqueta: x.texto })) },
    { clave: "modoEntrada", tipo: "opcion", etiqueta: "Cómo se anotan las palabras al empezar", opciones: MODOS },
    {
      clave: "permitirDictado",
      tipo: "booleano",
      etiqueta: "Permitir dictar con el micrófono",
      ayuda: "El reconocimiento de voz del navegador puede procesar la voz fuera del teléfono (en Chrome, en servidores de Google). Activalo solo si la familia está de acuerdo.",
    },
    { clave: "mostrarEjemplo", tipo: "booleano", etiqueta: "La pizarra empieza con una palabra de ejemplo" },
  ],
  validar(cfg) {
    const e: string[] = [];
    if (!Array.isArray(cfg.consignas) || !cfg.consignas.some((x) => CONSIGNAS.some((k) => k.id === x))) e.push("Elegí al menos una consigna.");
    if (!MODOS.some((m) => m.valor === cfg.modoEntrada)) e.push("Elegí cómo se anotan las palabras.");
    if (cfg.modoEntrada === "dictado" && !cfg.permitirDictado) e.push("Para empezar con dictado, primero permití el dictado.");
    enRango(e, cfg.consignas?.length ?? 0, 1, CONSIGNAS.length, "Consignas");
    return e;
  },
  generar: (cfg, n, { azar }) => {
    const lista = CONSIGNAS.filter((x) => cfg.consignas.includes(x.id));
    // Una consigna por ejercicio, sin repetir hasta agotar la lista.
    const orden = barajar(lista, azar);
    return Array.from({ length: n }, (_, i) => ({ consigna: orden[i % orden.length] }));
  },
  consigna: () => "En la escuela: decí todas las palabras que se te ocurran. No hay apuro ni respuestas malas; cuando quieras, tocá «Ya terminé».",
  resumen: (cfg) => {
    const g = CONSIGNAS.find((x) => x.id === cfg.consignas[0])?.grupo;
    return `${g === "letra" ? "Palabras por letra inicial" : g === "acotada" ? "Categorías más acotadas" : "Categorías amplias"}${cfg.mostrarEjemplo ? ", con un ejemplo" : ""}; ${cfg.modoEntrada === "marcas" ? "se dicen en voz alta" : cfg.modoEntrada === "teclado" ? "se escriben" : "se dictan"}.`;
  },
};
