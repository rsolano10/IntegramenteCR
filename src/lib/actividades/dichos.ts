import { barajar, elegir, type Azar } from "./azar";
import { DICHOS, type Dicho } from "./bancos/dichos";
import { enRango, type DefActividad } from "./contrato";

// «La banca del parque»: el inicio de un dicho y de 3 a 4 finales; la
// persona toca el que corresponde. En modo «significado» aparece el dicho
// completo y se elige qué quiere decir.

export type ModoDichos = "completar" | "significado" | "mixto";

export interface ConfigDichos {
  modo: ModoDichos;
  opciones: number;
  parecidos: boolean;
  soloMuyConocidos: boolean;
  leerEnVoz: boolean;
  semilla?: number;
}

export interface EjercicioDicho {
  dicho: string; // id
  tipo: "completar" | "significado";
  // Lo que se muestra arriba: el inicio, o el dicho completo.
  enunciado: string;
  completo: string;
  opciones: string[];
  correcta: number;
}

const MODOS = [
  { valor: "completar", etiqueta: "Completar el dicho" },
  { valor: "significado", etiqueta: "Elegir qué quiere decir" },
  { valor: "mixto", etiqueta: "Las dos cosas, alternadas" },
];

export const completoDe = (x: Dicho) => `${x.inicio.replace(/…$/, "")} ${x.final}.`;

const disponibles = (c: Pick<ConfigDichos, "soloMuyConocidos">) => DICHOS.filter((x) => !c.soloMuyConocidos || x.muyConocido);

export function generarDicho(c: ConfigDichos, azar: Azar, tipo: "completar" | "significado", evitar: string[] = []): EjercicioDicho {
  const pool = disponibles(c);
  const libres = pool.filter((x) => !evitar.includes(x.id));
  const x = elegir(libres.length ? libres : pool, azar);
  const otros = barajar(
    DICHOS.filter((o) => o.id !== x.id),
    azar,
  );
  let falsas: string[];
  if (tipo === "completar") {
    // Finales falsos: primero los parecidos (si se pidieron), después finales de otros dichos.
    const desdeOtros = otros.map((o) => o.final);
    const base = c.parecidos ? [...barajar(x.parecidos, azar), ...desdeOtros] : desdeOtros;
    const prohibidos = new Set([x.final, ...(x.aceptados ?? [])]);
    falsas = [...new Set(base)].filter((f) => !prohibidos.has(f)).slice(0, c.opciones - 1);
  } else {
    falsas = otros.map((o) => o.significado).slice(0, c.opciones - 1);
  }
  const verdadera = tipo === "completar" ? x.final : x.significado;
  const opciones = barajar([verdadera, ...falsas], azar);
  return {
    dicho: x.id,
    tipo,
    enunciado: tipo === "completar" ? x.inicio : completoDe(x),
    completo: completoDe(x),
    opciones,
    correcta: opciones.indexOf(verdadera),
  };
}

export const dichos: DefActividad<ConfigDichos, EjercicioDicho> = {
  tipo: "dichos",
  version: 1,
  nombre: "La banca del parque",
  area: "Lenguaje",
  funcion: "Comprensión y memoria semántica (dichos y refranes)",
  porNivel: {
    suave: { modo: "completar", opciones: 3, parecidos: false, soloMuyConocidos: true, leerEnVoz: true },
    medio: { modo: "completar", opciones: 4, parecidos: true, soloMuyConocidos: false, leerEnVoz: true },
    retador: { modo: "mixto", opciones: 4, parecidos: true, soloMuyConocidos: false, leerEnVoz: true },
  },
  campos: [
    { clave: "modo", tipo: "opcion", etiqueta: "Qué se hace con el dicho", opciones: MODOS },
    { clave: "opciones", tipo: "numero", etiqueta: "Opciones para elegir", min: 3, max: 4 },
    { clave: "parecidos", tipo: "booleano", etiqueta: "Finales falsos parecidos (más difícil)" },
    { clave: "soloMuyConocidos", tipo: "booleano", etiqueta: "Solo los dichos más conocidos" },
    { clave: "leerEnVoz", tipo: "booleano", etiqueta: "Botón para escuchar el dicho" },
  ],
  validar(c) {
    const e: string[] = [];
    if (!MODOS.some((m) => m.valor === c.modo)) e.push("Elegí qué se hace con el dicho.");
    enRango(e, c.opciones, 3, 4, "Opciones");
    return e;
  },
  generar: (c, n, { azar }) => {
    const out: EjercicioDicho[] = [];
    // El modo mixto empieza al azar y alterna.
    const empiezaSignificado = c.modo === "mixto" && azar() < 0.5;
    for (let i = 0; i < n; i++) {
      const tipo = c.modo === "mixto" ? ((i % 2 === 1) !== empiezaSignificado ? "significado" : "completar") : c.modo;
      out.push(generarDicho(c, azar, tipo, out.map((x) => x.dicho)));
    }
    return out;
  },
  consigna: (c) =>
    c.modo === "significado"
      ? "En la banca del parque: leé el dicho y tocá lo que quiere decir."
      : c.modo === "mixto"
        ? "En la banca del parque: completá el dicho o elegí lo que quiere decir."
        : "En la banca del parque: leé el comienzo del dicho y tocá cómo sigue.",
  resumen: (c) =>
    `${c.modo === "completar" ? "Completar dichos" : c.modo === "significado" ? "Elegir qué quieren decir" : "Completar y explicar dichos"}, con ${c.opciones} opciones${c.parecidos ? " parecidas" : ""}${c.soloMuyConocidos ? "; solo los más conocidos" : ""}.`,
};
