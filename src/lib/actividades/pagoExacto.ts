import { entero, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «Pagar justo»: armar un monto en colones tocando monedas y billetes.
// Cualquier combinación que sume el monto vale (no se exige la mínima).

export const DENOMINACIONES = [5, 10, 25, 50, 100, 500, 1000, 2000, 5000, 10000, 20000] as const;
export const esBillete = (d: number) => d >= 1000;

export interface ConfigPagoExacto {
  montoMin: number;
  montoMax: number;
  denominaciones: number[];
  multiploDe: number;
  mostrarSuma: boolean;
  semilla?: number;
}

export interface EjercicioPago {
  monto: number;
  denominaciones: number[];
}

// «₡1 350»: espacio fino duro entre miles, como en los precios del súper.
export function colones(n: number): string {
  return "₡" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ¿Se puede pagar exacto con estas denominaciones (sin límite de unidades)?
export function alcanzable(monto: number, denominaciones: number[]): boolean {
  return combinacion(monto, denominaciones) !== null;
}

// Una combinación válida (para la pista): la de menos piezas.
export function combinacion(monto: number, denominaciones: number[]): number[] | null {
  if (monto <= 0 || !Number.isInteger(monto)) return null;
  const ds = [...new Set(denominaciones)].filter((d) => d > 0).sort((a, b) => b - a);
  const g = ds.reduce((a, b) => mcd(a, b), 0);
  if (!g || monto % g) return null;
  const m = monto / g;
  const unidades = ds.map((d) => d / g);
  const mejor = new Array<number>(m + 1).fill(Infinity);
  const ultima = new Array<number>(m + 1).fill(-1);
  mejor[0] = 0;
  for (let v = 1; v <= m; v++)
    for (const u of unidades)
      if (u <= v && mejor[v - u] + 1 < mejor[v]) {
        mejor[v] = mejor[v - u] + 1;
        ultima[v] = u;
      }
  if (!Number.isFinite(mejor[m])) return null;
  const out: number[] = [];
  for (let v = m; v > 0; v -= ultima[v]) out.push(ultima[v] * g);
  return out.sort((a, b) => b - a);
}

function mcd(a: number, b: number): number {
  return b ? mcd(b, a % b) : a;
}

export function generarPago(c: ConfigPagoExacto, azar: Azar): EjercicioPago {
  const desde = Math.ceil(c.montoMin / c.multiploDe);
  const hasta = Math.floor(c.montoMax / c.multiploDe);
  for (let i = 0; i < 50; i++) {
    const monto = entero(azar, desde, hasta) * c.multiploDe;
    if (alcanzable(monto, c.denominaciones)) return { monto, denominaciones: [...c.denominaciones].sort((a, b) => a - b) };
  }
  // validar() garantiza que al menos el primer múltiplo es alcanzable.
  for (let k = desde; k <= hasta; k++)
    if (alcanzable(k * c.multiploDe, c.denominaciones)) return { monto: k * c.multiploDe, denominaciones: [...c.denominaciones].sort((a, b) => a - b) };
  return { monto: c.denominaciones[0], denominaciones: c.denominaciones };
}

export type ResultadoPago = "justo" | "falta" | "sobra";
export function revisarPago(monto: number, piezas: number[]): ResultadoPago {
  const suma = piezas.reduce((s, x) => s + x, 0);
  return suma === monto ? "justo" : suma < monto ? "falta" : "sobra";
}

export const pagoExacto: DefActividad<ConfigPagoExacto, EjercicioPago> = {
  tipo: "pago-exacto",
  version: 1,
  nombre: "La pulpería",
  area: "Funciones ejecutivas",
  funcion: "Memoria de trabajo (cálculo)",
  porNivel: {
    suave: { montoMin: 100, montoMax: 1000, denominaciones: [100, 500], multiploDe: 100, mostrarSuma: true },
    medio: { montoMin: 500, montoMax: 5000, denominaciones: [50, 100, 500, 1000, 2000], multiploDe: 50, mostrarSuma: true },
    retador: { montoMin: 1000, montoMax: 20000, denominaciones: [...DENOMINACIONES], multiploDe: 5, mostrarSuma: false },
  },
  campos: [
    { clave: "montoMin", tipo: "numero", etiqueta: "Monto mínimo (₡)", min: 5, max: 50000 },
    { clave: "montoMax", tipo: "numero", etiqueta: "Monto máximo (₡)", min: 5, max: 50000 },
    { clave: "multiploDe", tipo: "numero", etiqueta: "Múltiplo de (₡)", min: 5, max: 5000, ayuda: "Por ejemplo 100, para evitar montos incómodos." },
    { clave: "denominaciones", tipo: "multiple", etiqueta: "Monedas y billetes", opciones: DENOMINACIONES.map((d) => ({ valor: String(d), etiqueta: colones(d) })) },
    { clave: "mostrarSuma", tipo: "booleano", etiqueta: "Mostrar cuánto lleva mientras arma el pago" },
  ],
  validar(c) {
    const e: string[] = [];
    enRango(e, c.montoMin, 5, 50000, "El monto mínimo");
    enRango(e, c.montoMax, 5, 50000, "El monto máximo");
    enRango(e, c.multiploDe, 5, 5000, "El múltiplo");
    if (c.montoMin > c.montoMax) e.push("El monto mínimo no puede ser mayor que el máximo.");
    const ds = (c.denominaciones ?? []).map(Number);
    if (!ds.length) e.push("Elegí al menos una moneda o billete.");
    if (ds.some((d) => !(DENOMINACIONES as readonly number[]).includes(d))) e.push("Hay una denominación que no existe.");
    if (!e.length) {
      let alguno = false;
      for (let k = Math.ceil(c.montoMin / c.multiploDe); k <= Math.floor(c.montoMax / c.multiploDe) && !alguno; k++) alguno = alcanzable(k * c.multiploDe, ds);
      if (!alguno) e.push("Con esas monedas y billetes no se puede pagar justo ningún monto del rango.");
    }
    return e;
  },
  generar: (c, n, { azar }) => {
    const cc = { ...c, denominaciones: c.denominaciones.map(Number) };
    return Array.from({ length: n }, () => generarPago(cc, azar));
  },
  consigna: () => "En la pulpería: tocá la plata hasta pagar justo la cuenta. Después tocá «Listo».",
  resumen: (c) => `Cuentas de ${colones(c.montoMin)} a ${colones(c.montoMax)}, con ${c.denominaciones.length} monedas y billetes${c.mostrarSuma ? "; muestra cuánto lleva" : ""}.`,
};
