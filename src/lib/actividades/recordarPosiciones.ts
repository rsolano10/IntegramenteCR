import { barajar, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «Ventanas encendidas»: memorizar qué ventanas tienen luz; la persona
// decide cuándo («Ya lo memoricé»), se apagan y toca las que estaban
// encendidas.

export interface ConfigRecordarPosiciones {
  filas: number;
  columnas: number;
  encendidas: number;
  permitirVerDeNuevo: boolean;
  semilla?: number;
}

export interface EjercicioPosiciones {
  filas: number;
  columnas: number;
  encendidas: number[]; // índices de casilla
}

export function generarPosiciones(c: ConfigRecordarPosiciones, azar: Azar): EjercicioPosiciones {
  const total = c.filas * c.columnas;
  const encendidas = barajar(
    Array.from({ length: total }, (_, i) => i),
    azar,
  )
    .slice(0, c.encendidas)
    .sort((a, b) => a - b);
  return { filas: c.filas, columnas: c.columnas, encendidas };
}

export interface RevisionPosiciones {
  correcto: boolean;
  aciertos: number[];
  sobran: number[];
  faltan: number;
}

export function revisarPosiciones(ej: EjercicioPosiciones, marcadas: number[]): RevisionPosiciones {
  const aciertos = marcadas.filter((i) => ej.encendidas.includes(i));
  const sobran = marcadas.filter((i) => !ej.encendidas.includes(i));
  const faltan = ej.encendidas.length - aciertos.length;
  return { correcto: !sobran.length && !faltan, aciertos, sobran, faltan };
}

export const recordarPosiciones: DefActividad<ConfigRecordarPosiciones, EjercicioPosiciones> = {
  tipo: "recordar-posiciones",
  version: 1,
  nombre: "Ventanas encendidas",
  area: "Memoria",
  funcion: "Memoria episódica (visoespacial)",
  porNivel: {
    suave: { filas: 2, columnas: 3, encendidas: 2, permitirVerDeNuevo: true },
    medio: { filas: 3, columnas: 4, encendidas: 4, permitirVerDeNuevo: true },
    retador: { filas: 4, columnas: 4, encendidas: 6, permitirVerDeNuevo: false },
  },
  campos: [
    { clave: "filas", tipo: "numero", etiqueta: "Pisos (filas)", min: 2, max: 4 },
    { clave: "columnas", tipo: "numero", etiqueta: "Ventanas por piso (columnas)", min: 2, max: 4 },
    { clave: "encendidas", tipo: "numero", etiqueta: "Ventanas encendidas", min: 1, max: 8 },
    { clave: "permitirVerDeNuevo", tipo: "booleano", etiqueta: "Permitir ver las ventanas de nuevo" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.filas, 2, 4, "Los pisos");
    enRango(e, c.columnas, 2, 4, "Las ventanas por piso");
    enRango(e, c.encendidas, 1, 8, "Las ventanas encendidas");
    if (!e.length && c.encendidas >= c.filas * c.columnas) e.push("Tiene que quedar al menos una ventana apagada.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarPosiciones(c, azar)),
  consigna: () => "Mirá qué ventanas tienen la luz encendida. Cuando las tengás en mente, tocá «Ya lo memoricé» y después tocá las que estaban encendidas.",
};
