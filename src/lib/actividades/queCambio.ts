import { barajar, elegir, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «El corredor»: mirar el corredor de una casa de adobe y, después, tocar
// lo que cambió (algo que desapareció, que cambió de color o de lugar).

export type TipoCambio = "quitar" | "color" | "mover";
export const TIPOS_CAMBIO: TipoCambio[] = ["quitar", "color", "mover"];
const ETIQUETA_TIPO: Record<TipoCambio, string> = { quitar: "Algo desaparece", color: "Algo cambia de color", mover: "Algo cambia de lugar" };

// Lugares del corredor: 10 en la pared (dos filas de 5) y 5 en el piso.
export const LUGARES = 15;
export const lugarEsPiso = (i: number) => i >= 10;

export interface ObjetoCorredor {
  id: string;
  nombre: string;
  piso: boolean;
  // Variantes de color bien distintas entre sí (nunca un matiz).
  colores: string[];
}

const NAR = "#E2582A", GRA = "#A8232B", MOS = "#E2B13A", VEO = "#3f6a70", GUA = "#8A4B9A", CAL = "#F6F1E4", TIE = "#5E3B22";

export const OBJETOS: ObjetoCorredor[] = [
  // Pared
  { id: "jaula", nombre: "la jaula", piso: false, colores: [CAL, MOS, VEO] },
  { id: "sombrero", nombre: "el sombrero", piso: false, colores: [MOS, TIE, GRA] },
  { id: "farol", nombre: "el farol", piso: false, colores: [NAR, VEO, GUA] },
  { id: "reloj", nombre: "el reloj", piso: false, colores: [VEO, GRA, MOS] },
  { id: "helecho", nombre: "el helecho", piso: false, colores: [NAR, VEO, GUA] },
  { id: "plato", nombre: "el plato pintado", piso: false, colores: [NAR, VEO, GRA] },
  { id: "canasta", nombre: "la canasta", piso: false, colores: [MOS, GRA, VEO] },
  { id: "almanaque", nombre: "el almanaque", piso: false, colores: [GRA, VEO, GUA] },
  { id: "ristra", nombre: "la ristra de cebollas", piso: false, colores: [MOS, GUA, CAL] },
  // Piso
  { id: "mecedora", nombre: "la mecedora", piso: true, colores: [TIE, VEO, NAR] },
  { id: "banca", nombre: "la banca", piso: true, colores: [VEO, NAR, GRA] },
  { id: "lata", nombre: "la lata con flores", piso: true, colores: [GRA, MOS, GUA] },
  { id: "tinaja", nombre: "la tinaja", piso: true, colores: [NAR, VEO, GUA] },
  { id: "regadera", nombre: "la regadera", piso: true, colores: [VEO, NAR, MOS] },
  { id: "botas", nombre: "las botas de hule", piso: true, colores: [TIE, MOS, GRA] },
];

export interface Puesto {
  objeto: string;
  color: string;
}

export interface Cambio {
  tipo: TipoCambio;
  objeto: string;
  // Lugares que cuentan como «tocar lo que cambió» (mover: el de antes y el de ahora).
  lugares: number[];
}

export interface EjercicioCorredor {
  antes: (Puesto | null)[];
  despues: (Puesto | null)[];
  cambios: Cambio[];
}

export interface ConfigQueCambio {
  objetos: number;
  cambios: number;
  tiposDeCambio: TipoCambio[];
  permitirVerDeNuevo: boolean;
  semilla?: number;
}

const lugaresDe = (piso: boolean) => Array.from({ length: LUGARES }, (_, i) => i).filter((i) => lugarEsPiso(i) === piso);

export function generarCorredor(c: ConfigQueCambio, azar: Azar): EjercicioCorredor {
  const tipos = c.tiposDeCambio.length ? c.tiposDeCambio : (["quitar"] as TipoCambio[]);
  // Los objetos, sin pasarse de los lugares de pared y de piso.
  const pared = barajar(OBJETOS.filter((o) => !o.piso), azar);
  const piso = barajar(OBJETOS.filter((o) => o.piso), azar);
  const nPiso = Math.min(piso.length, lugaresDe(true).length - 1, Math.max(1, Math.round(c.objetos * 0.4)));
  const elegidos = [...piso.slice(0, nPiso), ...pared.slice(0, c.objetos - nPiso)];
  const antes: (Puesto | null)[] = Array(LUGARES).fill(null);
  const libresPared = barajar(lugaresDe(false), azar);
  const libresPiso = barajar(lugaresDe(true), azar);
  for (const o of elegidos) {
    const lugar = (o.piso ? libresPiso : libresPared).shift()!;
    antes[lugar] = { objeto: o.id, color: elegir(o.colores, azar) };
  }

  // Los cambios: cada uno en un objeto distinto; con varios tipos, al menos
  // uno de cada tipo si alcanza.
  const despues = [...antes];
  const cambios: Cambio[] = [];
  const ocupados = antes.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const candidatos = barajar(ocupados, azar);
  const orden = barajar(tipos, azar);
  const usados = new Set<number>();
  for (let k = 0; k < c.cambios; k++) {
    let hecho = false;
    for (let t = 0; t < orden.length && !hecho; t++) {
      const tipo = orden[(k + t) % orden.length];
      for (const lugar of candidatos) {
        if (usados.has(lugar)) continue;
        const p = antes[lugar]!;
        const o = OBJETOS.find((x) => x.id === p.objeto)!;
        if (tipo === "quitar") {
          despues[lugar] = null;
          cambios.push({ tipo, objeto: o.id, lugares: [lugar] });
          usados.add(lugar);
        } else if (tipo === "color") {
          const otro = elegir(o.colores.filter((x) => x !== p.color), azar);
          despues[lugar] = { objeto: o.id, color: otro };
          cambios.push({ tipo, objeto: o.id, lugares: [lugar] });
          usados.add(lugar);
        } else {
          // Mover a un lugar libre del mismo tipo (pared o piso) que no se use para otro cambio.
          const libres = lugaresDe(o.piso).filter((i) => antes[i] === null && despues[i] === null && !usados.has(i));
          if (!libres.length) continue;
          const destino = elegir(libres, azar);
          despues[lugar] = null;
          despues[destino] = p;
          cambios.push({ tipo, objeto: o.id, lugares: [lugar, destino] });
          usados.add(lugar);
          usados.add(destino);
        }
        hecho = true;
        break;
      }
    }
  }
  return { antes, despues, cambios };
}

export interface RevisionCorredor {
  completo: boolean;
  // Lugares tocados que no son un cambio (vuelven con suavidad).
  sobran: number[];
  // Cambios que todavía no se tocaron.
  faltan: number;
}

export function revisarCorredor(ej: EjercicioCorredor, tocados: number[]): RevisionCorredor {
  const validos = new Set(ej.cambios.flatMap((c) => c.lugares));
  const sobran = tocados.filter((i) => !validos.has(i));
  const faltan = ej.cambios.filter((c) => !c.lugares.some((i) => tocados.includes(i))).length;
  return { completo: !sobran.length && !faltan, sobran, faltan };
}

export const queCambio: DefActividad<ConfigQueCambio, EjercicioCorredor> = {
  tipo: "que-cambio",
  version: 1,
  nombre: "El corredor",
  area: "Atención",
  funcion: "Atención selectiva (memoria visual de la escena)",
  porNivel: {
    suave: { objetos: 6, cambios: 1, tiposDeCambio: ["quitar"], permitirVerDeNuevo: true },
    medio: { objetos: 9, cambios: 2, tiposDeCambio: ["quitar", "color"], permitirVerDeNuevo: true },
    retador: { objetos: 12, cambios: 3, tiposDeCambio: ["quitar", "color", "mover"], permitirVerDeNuevo: false },
  },
  campos: [
    { clave: "objetos", tipo: "numero", etiqueta: "Cosas en el corredor", min: 5, max: 12 },
    { clave: "cambios", tipo: "numero", etiqueta: "Cambios", min: 1, max: 3 },
    { clave: "tiposDeCambio", tipo: "multiple", etiqueta: "Qué puede cambiar", opciones: TIPOS_CAMBIO.map((t) => ({ valor: t, etiqueta: ETIQUETA_TIPO[t] })) },
    { clave: "permitirVerDeNuevo", tipo: "booleano", etiqueta: "Permitir volver a ver el corredor antes de responder" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.objetos, 5, 12, "Cosas en el corredor");
    enRango(e, c.cambios, 1, 3, "Cambios");
    const tipos = c.tiposDeCambio ?? [];
    if (!tipos.length) e.push("Elegí al menos una forma de cambiar.");
    if (tipos.some((t) => !TIPOS_CAMBIO.includes(t))) e.push("Hay una forma de cambiar que no existe.");
    if (typeof c.cambios === "number" && typeof c.objetos === "number" && c.cambios > c.objetos) e.push("No puede haber más cambios que cosas.");
    return e;
  },
  generar: (c, n, { azar }) => Array.from({ length: n }, () => generarCorredor(c, azar)),
  consigna: (c) => (c.cambios === 1 ? "Mirá bien el corredor. Después va a cambiar una cosa: tocá lo que cambió." : `Mirá bien el corredor. Después van a cambiar ${c.cambios} cosas: tocá las que cambiaron.`),
  resumen: (c) =>
    `${c.objetos} cosas y ${c.cambios} ${c.cambios === 1 ? "cambio" : "cambios"} (${c.tiposDeCambio.map((t) => ETIQUETA_TIPO[t].toLowerCase()).join(", ")})${c.permitirVerDeNuevo ? "; se puede volver a mirar" : ""}.`,
};
