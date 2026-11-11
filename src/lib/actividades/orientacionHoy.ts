import { barajar, type Azar } from "./azar";
import { type DefActividad } from "./contrato";

// «El día de hoy»: preguntas de opción múltiple sobre el momento actual. La
// respuesta sale de la fecha y hora del dispositivo, siempre en la zona de
// Costa Rica. Es la actividad más sensible: los mensajes nunca sugieren que
// la persona «debería saberlo».

export type Pregunta = "dia-semana" | "parte-dia" | "mes" | "epoca" | "anio" | "ayer" | "manana";
export const ZONA = "America/Costa_Rica";

export interface ConfigOrientacion {
  preguntas: Pregunta[];
  opciones: number;
  // Distractores cercanos (el día de al lado, el mes de al lado).
  cercanos: boolean;
  // Meses de la época seca (1 = enero). El resto es lluviosa.
  mesesSeca: number[];
  // La escena muestra la luz del momento y la lluvia en época lluviosa.
  pistasEnEscena: boolean;
  semilla?: number;
}

export interface EjercicioOrientacion {
  pregunta: Pregunta;
  texto: string;
  opciones: string[];
  correcta: string;
}

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const PARTES = ["la mañana", "la tarde", "la noche"];

// Fecha y hora en Costa Rica, sin depender de la zona del navegador.
export function momentoCR(ahora: Date) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: ZONA, year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "numeric", hourCycle: "h23" })
      .formatToParts(ahora)
      .map((p) => [p.type, p.value]),
  );
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partes.weekday);
  return { anio: Number(partes.year), mes: Number(partes.month), diaSemana: dia, hora: Number(partes.hour) % 24 };
}

export const parteDelDia = (hora: number) => (hora >= 5 && hora < 12 ? 0 : hora >= 12 && hora < 18 ? 1 : 2);

const TEXTO: Record<Pregunta, string> = {
  "dia-semana": "¿Qué día de la semana es hoy?",
  "parte-dia": "¿En qué parte del día estamos?",
  mes: "¿En qué mes estamos?",
  epoca: "¿En qué época del año estamos?",
  anio: "¿En qué año estamos?",
  ayer: "¿Qué día de la semana fue ayer?",
  manana: "¿Qué día de la semana será mañana?",
};

// Opciones: la correcta y distractores (cercanos o al azar) de un ciclo.
function deCiclo(lista: string[], i: number, n: number, cercanos: boolean, azar: Azar): string[] {
  const otros = lista.filter((_, k) => k !== i);
  let distractores: string[];
  if (cercanos) {
    const L = lista.length;
    const vecinos = [lista[(i + 1) % L], lista[(i - 1 + L) % L], lista[(i + 2) % L], lista[(i - 2 + L) % L]];
    distractores = [...new Set(vecinos)].slice(0, n - 1);
  } else distractores = barajar(otros, azar).slice(0, n - 1);
  return barajar([lista[i], ...distractores], azar);
}

export function generarPregunta(p: Pregunta, c: ConfigOrientacion, ahora: Date, azar: Azar): EjercicioOrientacion {
  const m = momentoCR(ahora);
  const n = Math.min(4, Math.max(3, c.opciones));
  let opciones: string[];
  let correcta: string;
  switch (p) {
    case "dia-semana":
    case "ayer":
    case "manana": {
      const d = (m.diaSemana + (p === "ayer" ? 6 : p === "manana" ? 1 : 0)) % 7;
      correcta = DIAS[d];
      opciones = deCiclo(DIAS, d, n, c.cercanos, azar);
      break;
    }
    case "parte-dia": {
      const k = parteDelDia(m.hora);
      correcta = PARTES[k];
      opciones = [...PARTES];
      break;
    }
    case "mes":
      correcta = MESES[m.mes - 1];
      opciones = deCiclo(MESES, m.mes - 1, n, c.cercanos, azar);
      break;
    case "epoca": {
      const seca = c.mesesSeca.includes(m.mes);
      correcta = seca ? "la época seca (verano)" : "la época lluviosa (invierno)";
      opciones = ["la época seca (verano)", "la época lluviosa (invierno)"];
      break;
    }
    case "anio": {
      const deltas = c.cercanos ? [-1, 1, -2, 2] : barajar([-3, -2, 2, 3, 5, -5], azar);
      correcta = String(m.anio);
      opciones = barajar([m.anio, ...deltas.slice(0, n - 1).map((d) => m.anio + d)].map(String), azar);
      break;
    }
  }
  return { pregunta: p, texto: TEXTO[p], opciones, correcta };
}

// Pista: una opción equivocada para descartar (determinística).
export const opcionADescartar = (ej: EjercicioOrientacion, descartadas: string[]) => ej.opciones.find((o) => o !== ej.correcta && !descartadas.includes(o)) ?? null;

const TODAS: { valor: Pregunta; etiqueta: string }[] = [
  { valor: "dia-semana", etiqueta: "Día de la semana" },
  { valor: "parte-dia", etiqueta: "Parte del día (mañana, tarde, noche)" },
  { valor: "mes", etiqueta: "Mes" },
  { valor: "epoca", etiqueta: "Época (seca o lluviosa)" },
  { valor: "anio", etiqueta: "Año" },
  { valor: "ayer", etiqueta: "Qué día fue ayer" },
  { valor: "manana", etiqueta: "Qué día será mañana" },
];

export const orientacionHoy: DefActividad<ConfigOrientacion, EjercicioOrientacion> = {
  tipo: "orientacion-hoy",
  version: 1,
  nombre: "El almanaque",
  area: "Orientación",
  funcion: "Orientación temporal",
  porNivel: {
    suave: { preguntas: ["dia-semana", "parte-dia"], opciones: 3, cercanos: false, mesesSeca: [12, 1, 2, 3, 4], pistasEnEscena: true },
    medio: { preguntas: ["dia-semana", "parte-dia", "mes", "epoca"], opciones: 3, cercanos: false, mesesSeca: [12, 1, 2, 3, 4], pistasEnEscena: true },
    retador: { preguntas: ["dia-semana", "parte-dia", "mes", "epoca", "anio", "ayer", "manana"], opciones: 4, cercanos: true, mesesSeca: [12, 1, 2, 3, 4], pistasEnEscena: false },
  },
  campos: [
    { clave: "preguntas", tipo: "multiple", etiqueta: "Preguntas", opciones: TODAS },
    { clave: "opciones", tipo: "numero", etiqueta: "Opciones por pregunta", min: 3, max: 4 },
    { clave: "pistasEnEscena", tipo: "booleano", etiqueta: "La escena muestra la luz del momento y la lluvia (ayuda)" },
    { clave: "cercanos", tipo: "booleano", etiqueta: "Opciones cercanas (el día o el mes de al lado)" },
    {
      clave: "mesesSeca",
      tipo: "multiple",
      etiqueta: "Meses de la época seca",
      opciones: MESES.map((m, i) => ({ valor: String(i + 1), etiqueta: m[0].toUpperCase() + m.slice(1) })),
      ayuda: "Los demás meses cuentan como época lluviosa.",
    },
  ],
  validar(c) {
    const e: string[] = [];
    const validas = TODAS.map((t) => t.valor);
    if (!Array.isArray(c.preguntas) || !c.preguntas.length) e.push("Elegí al menos una pregunta.");
    else if (c.preguntas.some((p) => !validas.includes(p))) e.push("Hay una pregunta que no existe.");
    if (c.opciones !== 3 && c.opciones !== 4) e.push("Las opciones por pregunta tienen que ser 3 o 4.");
    if (!Array.isArray(c.mesesSeca) || c.mesesSeca.some((m) => !(Number(m) >= 1 && Number(m) <= 12))) e.push("Los meses de la época seca no son válidos.");
    return e;
  },
  // Una pregunta por ejercicio, en el orden de la lista.
  generar: (c, _n, { azar, ahora }) => {
    const cc = { ...c, mesesSeca: c.mesesSeca.map(Number) };
    return c.preguntas.map((p) => generarPregunta(p, cc, ahora, azar));
  },
  cantidadFija: (c) => c.preguntas.length,
  consigna: () => "Vamos a conversar sobre el día de hoy. Tocá la respuesta que te parezca. Si querés, mirá un calendario o un reloj.",
};
