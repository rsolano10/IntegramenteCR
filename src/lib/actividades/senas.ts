import { barajar, crearAzar, elegir, entero, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «Las señas»: una dirección al estilo tico («De la iglesia, 200 metros al
// sur y 100 al este. Casa verde de corredor.») y el pueblo visto desde
// arriba. La persona toca la casa a la que se llega. Cada cuadra son 100
// metros. El norte siempre arriba: el mapa no gira.

export const COLUMNAS = 6;
export const FILAS = 5;

export type Rumbo = "norte" | "sur" | "este" | "oeste";
const MOV: Record<Rumbo, [number, number]> = { norte: [0, -1], sur: [0, 1], este: [1, 0], oeste: [-1, 0] };

export interface Referencia {
  id: string;
  nombre: string;
  // «De la iglesia», «Del palo de mango».
  desde: string;
  col: number;
  fila: number;
}

// El pueblo (genérico, ver decisión abierta 6.5): fijo, para que se vuelva
// conocido de una sesión a otra.
export const REFERENCIAS: Referencia[] = [
  { id: "iglesia", nombre: "la iglesia", desde: "De la iglesia", col: 2, fila: 1 },
  { id: "plaza", nombre: "la plaza", desde: "De la plaza", col: 3, fila: 1 },
  { id: "escuela", nombre: "la escuela", desde: "De la escuela", col: 0, fila: 3 },
  { id: "pulperia", nombre: "la pulpería", desde: "De la pulpería", col: 4, fila: 3 },
  { id: "mango", nombre: "el palo de mango", desde: "Del palo de mango", col: 5, fila: 0 },
];

export const COLORES_CASA = [
  { id: "verde", nombre: "verde", color: "#6a969c" },
  { id: "amarilla", nombre: "amarilla", color: "#E2B13A" },
  { id: "rosada", nombre: "rosada", color: "#F2B8A0" },
  { id: "blanca", nombre: "blanca", color: "#F6F1E4" },
  { id: "anaranjada", nombre: "anaranjada", color: "#E2582A" },
  { id: "morada", nombre: "morada", color: "#8A4B9A" },
] as const;
export const DETALLES_CASA = [
  { id: "corredor", texto: "de corredor" },
  { id: "porton", texto: "de portón" },
  { id: "maceta", texto: "con macetas" },
  { id: "ventanas", texto: "de dos ventanas" },
  { id: "arbol", texto: "con un árbol" },
] as const;

export interface Casa {
  col: number;
  fila: number;
  color: number; // índice en COLORES_CASA
  detalle: number; // índice en DETALLES_CASA
}

export const descripcionCasa = (c: Pick<Casa, "color" | "detalle">) => `Casa ${COLORES_CASA[c.color].nombre} ${DETALLES_CASA[c.detalle].texto}`;

// Todas las cuadras que no son una referencia tienen una casa; cada casa con
// una combinación de color y detalle distinta (siempre las mismas).
export const CASAS: Casa[] = (() => {
  const combos = barajar(
    COLORES_CASA.flatMap((_, color) => DETALLES_CASA.map((_, detalle) => ({ color, detalle }))),
    crearAzar(2026),
  );
  const out: Casa[] = [];
  for (let fila = 0; fila < FILAS; fila++)
    for (let col = 0; col < COLUMNAS; col++) if (!REFERENCIAS.some((r) => r.col === col && r.fila === fila)) out.push({ col, fila, ...combos[out.length] });
  return out;
})();

export const casaEn = (col: number, fila: number) => CASAS.findIndex((c) => c.col === col && c.fila === fila);

export interface Tramo {
  rumbo: Rumbo;
  cuadras: number;
}

export interface EjercicioSenas {
  partida: string; // id de la referencia
  tramos: Tramo[];
  destino: number; // índice en CASAS
  sena: string;
}

export interface ConfigSenas {
  tramos: number;
  marcarPartida: boolean;
  casaDescrita: boolean;
  partidasVariadas: boolean;
  mostrarFlecha: boolean;
  leerEnVoz: boolean;
  semilla?: number;
}

export const metros = (cuadras: number) => `${cuadras * 100}`;

export function textoSena(partida: Referencia, tramos: Tramo[], destino: Casa | null): string {
  const partes = tramos.map((t, i) => (i === 0 ? `${metros(t.cuadras)} metros al ${t.rumbo}` : `${metros(t.cuadras)} al ${t.rumbo}`));
  const recorrido = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
  return `${partida.desde}, ${recorrido}.${destino ? ` ${descripcionCasa(destino)}.` : ""}`;
}

// Recorre los tramos desde la referencia (null si se sale del mapa).
export function recorrer(partida: Referencia, tramos: Tramo[]): { col: number; fila: number }[] | null {
  const camino = [{ col: partida.col, fila: partida.fila }];
  let { col, fila } = partida;
  for (const t of tramos)
    for (let k = 0; k < t.cuadras; k++) {
      col += MOV[t.rumbo][0];
      fila += MOV[t.rumbo][1];
      if (col < 0 || col >= COLUMNAS || fila < 0 || fila >= FILAS) return null;
      camino.push({ col, fila });
    }
  return camino;
}

const perpendiculares = (r: Rumbo): Rumbo[] => (r === "norte" || r === "sur" ? ["este", "oeste"] : ["norte", "sur"]);

export function generarSena(c: ConfigSenas, azar: Azar): EjercicioSenas {
  const partidas = c.partidasVariadas ? REFERENCIAS : REFERENCIAS.filter((r) => r.id === "iglesia");
  const maxCuadras = c.tramos === 1 ? 3 : 2;
  for (let intento = 0; intento < 400; intento++) {
    const partida = elegir(partidas, azar);
    const tramos: Tramo[] = [];
    let rumbo = elegir<Rumbo>(["norte", "sur", "este", "oeste"], azar);
    for (let k = 0; k < c.tramos; k++) {
      tramos.push({ rumbo, cuadras: entero(azar, 1, maxCuadras) });
      rumbo = elegir(perpendiculares(rumbo), azar);
    }
    const camino = recorrer(partida, tramos);
    if (!camino) continue;
    const fin = camino[camino.length - 1];
    const destino = casaEn(fin.col, fin.fila);
    // Ni una referencia ni el mismo punto de partida: una casa.
    if (destino < 0) continue;
    return { partida: partida.id, tramos, destino, sena: textoSena(partida, tramos, c.casaDescrita ? CASAS[destino] : null) };
  }
  // Siempre hay al menos una: una cuadra al sur de la iglesia.
  const iglesia = REFERENCIAS[0];
  const tramos: Tramo[] = [{ rumbo: "sur", cuadras: 1 }];
  const destino = casaEn(iglesia.col, iglesia.fila + 1);
  return { partida: "iglesia", tramos, destino, sena: textoSena(iglesia, tramos, c.casaDescrita ? CASAS[destino] : null) };
}

export const senas: DefActividad<ConfigSenas, EjercicioSenas> = {
  tipo: "senas",
  version: 1,
  nombre: "Las señas",
  area: "Orientación",
  funcion: "Orientación espacial",
  porNivel: {
    suave: { tramos: 1, marcarPartida: true, casaDescrita: true, partidasVariadas: false, mostrarFlecha: true, leerEnVoz: true },
    medio: { tramos: 2, marcarPartida: true, casaDescrita: true, partidasVariadas: false, mostrarFlecha: false, leerEnVoz: true },
    retador: { tramos: 3, marcarPartida: false, casaDescrita: false, partidasVariadas: true, mostrarFlecha: false, leerEnVoz: true },
  },
  campos: [
    { clave: "tramos", tipo: "numero", etiqueta: "Tramos de la seña", min: 1, max: 3 },
    { clave: "marcarPartida", tipo: "booleano", etiqueta: "Resaltar el punto de partida" },
    { clave: "casaDescrita", tipo: "booleano", etiqueta: "Decir el color y el detalle de la casa" },
    { clave: "partidasVariadas", tipo: "booleano", etiqueta: "Partir también de la plaza, la escuela, la pulpería o el palo de mango" },
    { clave: "mostrarFlecha", tipo: "booleano", etiqueta: "Mostrar flechas con cada dirección" },
    { clave: "leerEnVoz", tipo: "booleano", etiqueta: "Botón para escuchar la seña" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.tramos, 1, 3, "Tramos");
    return e;
  },
  generar: (c, n, { azar }) => {
    const out: EjercicioSenas[] = [];
    for (let i = 0; i < n; i++) {
      let ej = generarSena(c, azar);
      // No repetir la misma casa dos veces seguidas.
      for (let k = 0; k < 10 && out.length && out[out.length - 1].destino === ej.destino; k++) ej = generarSena(c, azar);
      out.push(ej);
    }
    return out;
  },
  consigna: () => "Leé la seña y tocá la casa a la que se llega. Cada cuadra son 100 metros, y el norte está arriba.",
  resumen: (c) =>
    `Señas de ${c.tramos} ${c.tramos === 1 ? "tramo" : "tramos"}${c.casaDescrita ? ", con el color de la casa" : ", sin describir la casa"}${c.partidasVariadas ? ", desde distintos puntos del pueblo" : ", desde la iglesia"}.`,
};
