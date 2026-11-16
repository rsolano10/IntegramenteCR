import { entero, type Azar } from "./azar";
import { enRango, type DefActividad } from "./contrato";

// «Pagar justo»: armar un monto en colones tocando monedas y billetes.
// Cualquier combinación que sume el monto vale (no se exige la mínima).
// Modo «vuelto»: la cuenta ya está pagada con un billete y hay que armar el
// vuelto con la plata de la gaveta (monedas y billetes menores al billete).

export const DENOMINACIONES = [5, 10, 25, 50, 100, 500, 1000, 2000, 5000, 10000, 20000] as const;
export const esBillete = (d: number) => d >= 1000;

export type ModoPago = "pagar" | "vuelto" | "mixto";

export interface ConfigPagoExacto {
  montoMin: number;
  montoMax: number;
  denominaciones: number[];
  multiploDe: number;
  mostrarSuma: boolean;
  modo: ModoPago;
  // Modo vuelto: el vuelto más grande y de cuánto en cuánto.
  vueltoMax: number;
  vueltoMultiplo: number;
  semilla?: number;
}

export interface EjercicioPago {
  // Lo que hay que armar: la cuenta (pagar) o el vuelto.
  monto: number;
  denominaciones: number[];
  modo?: "pagar" | "vuelto";
  // Modo vuelto: la cuenta y el billete con que pagaron.
  cuenta?: number;
  pagaCon?: number;
}

const BILLETES_PAGO = [1000, 2000, 5000, 10000, 20000];

// Un vuelto armable: el billete con que pagan es mayor que el vuelto, y la
// gaveta tiene la plata menor a ese billete que es múltiplo del vuelto.
export function generarVuelto(c: Pick<ConfigPagoExacto, "vueltoMax" | "vueltoMultiplo">, azar: Azar): EjercicioPago {
  const m = c.vueltoMultiplo;
  for (let i = 0; i < 80; i++) {
    const vuelto = entero(azar, 1, Math.max(1, Math.floor(c.vueltoMax / m))) * m;
    const billetes = BILLETES_PAGO.filter((b) => b > vuelto);
    if (!billetes.length) continue;
    // El billete con que pagan: de los dos más chicos que alcanzan (lo usual).
    const pagaCon = billetes[entero(azar, 0, Math.min(1, billetes.length - 1))];
    const denominaciones = DENOMINACIONES.filter((d) => d < pagaCon && d % m === 0);
    if (!alcanzable(vuelto, denominaciones)) continue;
    return { modo: "vuelto", monto: vuelto, cuenta: pagaCon - vuelto, pagaCon, denominaciones };
  }
  return { modo: "vuelto", monto: 500, cuenta: 500, pagaCon: 1000, denominaciones: [50, 100, 500] };
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
    suave: { montoMin: 100, montoMax: 1000, denominaciones: [100, 500], multiploDe: 100, mostrarSuma: true, modo: "pagar", vueltoMax: 450, vueltoMultiplo: 50 },
    medio: { montoMin: 500, montoMax: 5000, denominaciones: [50, 100, 500, 1000, 2000], multiploDe: 50, mostrarSuma: true, modo: "pagar", vueltoMax: 5000, vueltoMultiplo: 50 },
    retador: { montoMin: 1000, montoMax: 20000, denominaciones: [...DENOMINACIONES], multiploDe: 5, mostrarSuma: false, modo: "pagar", vueltoMax: 10000, vueltoMultiplo: 5 },
  },
  campos: [
    { clave: "montoMin", tipo: "numero", etiqueta: "Monto mínimo (₡)", min: 5, max: 50000 },
    { clave: "montoMax", tipo: "numero", etiqueta: "Monto máximo (₡)", min: 5, max: 50000 },
    { clave: "multiploDe", tipo: "numero", etiqueta: "Múltiplo de (₡)", min: 5, max: 5000, ayuda: "Por ejemplo 100, para evitar montos incómodos." },
    { clave: "denominaciones", tipo: "multiple", etiqueta: "Monedas y billetes", opciones: DENOMINACIONES.map((d) => ({ valor: String(d), etiqueta: colones(d) })) },
    { clave: "mostrarSuma", tipo: "booleano", etiqueta: "Mostrar cuánto lleva mientras arma el pago" },
    {
      clave: "modo",
      tipo: "opcion",
      etiqueta: "Qué se hace",
      opciones: [
        { valor: "pagar", etiqueta: "Pagar la cuenta justa" },
        { valor: "vuelto", etiqueta: "Dar el vuelto" },
        { valor: "mixto", etiqueta: "Las dos cosas, alternadas" },
      ],
    },
    { clave: "vueltoMax", tipo: "numero", etiqueta: "Vuelto más grande (₡)", min: 50, max: 19000, ayuda: "Solo en el modo vuelto." },
    { clave: "vueltoMultiplo", tipo: "numero", etiqueta: "Vuelto múltiplo de (₡)", min: 5, max: 1000, ayuda: "Solo en el modo vuelto. Por ejemplo 50." },
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
    const modo = c.modo ?? "pagar";
    if (!["pagar", "vuelto", "mixto"].includes(modo)) e.push("Elegí qué se hace: pagar, dar el vuelto o las dos.");
    if (modo !== "pagar") {
      enRango(e, c.vueltoMax, 50, 19000, "El vuelto más grande");
      enRango(e, c.vueltoMultiplo, 5, 1000, "El múltiplo del vuelto");
      if (typeof c.vueltoMax === "number" && typeof c.vueltoMultiplo === "number" && c.vueltoMultiplo > c.vueltoMax) e.push("El múltiplo del vuelto no puede ser mayor que el vuelto más grande.");
    }
    if (!e.length && modo !== "vuelto") {
      let alguno = false;
      for (let k = Math.ceil(c.montoMin / c.multiploDe); k <= Math.floor(c.montoMax / c.multiploDe) && !alguno; k++) alguno = alcanzable(k * c.multiploDe, ds);
      if (!alguno) e.push("Con esas monedas y billetes no se puede pagar justo ningún monto del rango.");
    }
    return e;
  },
  generar: (c, n, { azar }) => {
    const cc = { ...c, denominaciones: c.denominaciones.map(Number) };
    const modo = c.modo ?? "pagar";
    // Mixto: alterna, empezando al azar.
    const inicio = modo === "mixto" && azar() < 0.5 ? 1 : 0;
    return Array.from({ length: n }, (_, i) => {
      const vuelto = modo === "vuelto" || (modo === "mixto" && (i + inicio) % 2 === 1);
      return vuelto ? generarVuelto(cc, azar) : { ...generarPago(cc, azar), modo: "pagar" as const };
    });
  },
  consigna: (c) =>
    c.modo === "vuelto"
      ? "En la pulpería ya pagaron la cuenta con un billete: armá el vuelto justo con la plata de la gaveta. Después tocá «Listo»."
      : c.modo === "mixto"
        ? "En la pulpería: a veces hay que pagar la cuenta justa y a veces dar el vuelto. Tocá la plata y después «Listo»."
        : "En la pulpería: tocá la plata hasta pagar justo la cuenta. Después tocá «Listo».",
  resumen: (c) =>
    c.modo === "vuelto"
      ? `Dar el vuelto: hasta ${colones(c.vueltoMax)}, de ${colones(c.vueltoMultiplo)} en ${colones(c.vueltoMultiplo)}${c.mostrarSuma ? "; muestra cuánto lleva" : ""}.`
      : `Cuentas de ${colones(c.montoMin)} a ${colones(c.montoMax)}, con ${c.denominaciones.length} monedas y billetes${c.modo === "mixto" ? `; también dar vueltos hasta ${colones(c.vueltoMax)}` : ""}${c.mostrarSuma ? "; muestra cuánto lleva" : ""}.`,
};
