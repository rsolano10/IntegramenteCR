import { barajar, elegir, type Azar } from "./azar";
import { TEXTOS, type TextoComprension } from "./bancos/comprension";
import { enRango, type DefActividad } from "./contrato";

// «La radio y El correo»: escuchar un aviso de la radio comunal o leer una
// carta de la familia, y después responder de 1 a 3 preguntas de opción
// múltiple (datos del texto y, en el nivel retador, una inferencia).

export type EscenaComprension = "radio" | "correo" | "ambas";

export interface ConfigComprension {
  escena: EscenaComprension;
  longitud: "corta" | "media";
  preguntas: number;
  inferencia: boolean;
  textoVisible: boolean;
  escucharOtraVez: boolean;
  semilla?: number;
}

export interface PreguntaLista {
  texto: string;
  opciones: string[];
  correcta: number;
  inferencia: boolean;
  frase?: string;
}

export interface EjercicioComprension {
  id: string;
  escena: "radio" | "correo";
  titulo: string;
  texto: string;
  preguntas: PreguntaLista[];
}

const ESCENAS = [
  { valor: "radio", etiqueta: "La radio (escuchar un aviso)" },
  { valor: "correo", etiqueta: "El correo (leer una carta)" },
  { valor: "ambas", etiqueta: "Las dos, alternadas" },
];
const LONGITUDES = [
  { valor: "corta", etiqueta: "Corto (dos o tres frases)" },
  { valor: "media", etiqueta: "Más largo (cuatro o cinco frases)" },
];

const textosDe = (escena: "radio" | "correo", longitud: ConfigComprension["longitud"]) => TEXTOS.filter((x) => x.escena === escena && x.longitud === longitud);

export function armarPreguntas(x: TextoComprension, c: Pick<ConfigComprension, "preguntas" | "inferencia">, azar: Azar): PreguntaLista[] {
  const literales = x.preguntas.filter((p) => !p.inferencia);
  const inferencias = x.preguntas.filter((p) => p.inferencia);
  const conInferencia = c.inferencia && inferencias.length > 0;
  // Las literales en el orden del texto; la inferencia, al final.
  const elegidas = [...literales.slice(0, conInferencia ? c.preguntas - 1 : c.preguntas), ...(conInferencia ? [elegir(inferencias, azar)] : [])];
  return elegidas.map((p) => {
    const opciones = barajar([...p.opciones], azar);
    return { texto: p.texto, opciones, correcta: opciones.indexOf(p.opciones[0]), inferencia: !!p.inferencia, frase: p.frase };
  });
}

export function generarComprension(c: ConfigComprension, azar: Azar, escena: "radio" | "correo", evitar: string[] = []): EjercicioComprension {
  const pool = textosDe(escena, c.longitud);
  const libres = pool.filter((x) => !evitar.includes(x.id));
  const x = elegir(libres.length ? libres : pool, azar);
  return { id: x.id, escena, titulo: x.titulo, texto: x.texto, preguntas: armarPreguntas(x, c, azar) };
}

export const comprension: DefActividad<ConfigComprension, EjercicioComprension> = {
  tipo: "comprension",
  version: 1,
  nombre: "La radio y El correo",
  area: "Lenguaje",
  funcion: "Comprensión auditiva y lectora",
  porNivel: {
    suave: { escena: "ambas", longitud: "corta", preguntas: 1, inferencia: false, textoVisible: true, escucharOtraVez: true },
    medio: { escena: "ambas", longitud: "corta", preguntas: 2, inferencia: false, textoVisible: false, escucharOtraVez: true },
    retador: { escena: "ambas", longitud: "media", preguntas: 3, inferencia: true, textoVisible: false, escucharOtraVez: true },
  },
  campos: [
    { clave: "escena", tipo: "opcion", etiqueta: "Radio o correo", opciones: ESCENAS },
    { clave: "longitud", tipo: "opcion", etiqueta: "Largo del texto", opciones: LONGITUDES },
    { clave: "preguntas", tipo: "numero", etiqueta: "Preguntas por texto", min: 1, max: 3 },
    { clave: "inferencia", tipo: "booleano", etiqueta: "Incluir una pregunta para pensar (cómo se siente, qué pasaría)" },
    { clave: "textoVisible", tipo: "booleano", etiqueta: "Dejar el texto a la vista mientras responde" },
    { clave: "escucharOtraVez", tipo: "booleano", etiqueta: "Botón para escucharlo otra vez al responder" },
  ],
  validar(c) {
    const e: string[] = [];
    if (!ESCENAS.some((x) => x.valor === c.escena)) e.push("Elegí radio, correo o las dos.");
    if (!LONGITUDES.some((x) => x.valor === c.longitud)) e.push("Elegí el largo del texto.");
    enRango(e, c.preguntas, 1, 3, "Preguntas");
    return e;
  },
  generar: (c, n, { azar }) => {
    const out: EjercicioComprension[] = [];
    const empiezaCorreo = c.escena === "ambas" && azar() < 0.5;
    for (let i = 0; i < n; i++) {
      const escena = c.escena === "ambas" ? ((i % 2 === 1) !== empiezaCorreo ? "correo" : "radio") : c.escena;
      out.push(generarComprension(c, azar, escena, out.map((x) => x.id)));
    }
    return out;
  },
  consigna: (c) =>
    c.escena === "radio"
      ? "Escuchá el aviso de la radio y después respondé las preguntas."
      : c.escena === "correo"
        ? "Leé la carta que llegó al correo y después respondé las preguntas."
        : "Escuchá el aviso de la radio o leé la carta del correo, y después respondé las preguntas.",
  resumen: (c) =>
    `${c.escena === "radio" ? "Avisos de radio" : c.escena === "correo" ? "Cartas" : "Avisos de radio y cartas"} ${c.longitud === "corta" ? "cortos" : "más largos"}, con ${c.preguntas} ${c.preguntas === 1 ? "pregunta" : "preguntas"}${c.inferencia ? " (una para pensar)" : ""}${c.textoVisible ? "; el texto queda a la vista" : ""}.`,
};
