// Juego «Clasificar números por valor» (extras.modo = "clasificar").
// Lógica pura —configuración, reglas, generación de números y estado del
// juego— con pruebas en clasificarNumeros.test.ts. La pantalla vive en
// components/actividades/ClasificarNumeros.tsx.

// Reglas de las cajas. Abiertas a variantes: «par»/«impar» no usan la
// referencia.
export type Regla = "menor" | "mayor" | "par" | "impar";

export interface CajaClasificar {
  etiqueta: string;
  regla: Regla;
}

export interface ExtrasClasificar {
  modo: "clasificar";
  titulo?: string;
  consigna?: string;
  referencia?: number;
  cajas?: CajaClasificar[];
  numeros?: number[];
  rango?: { min: number; max: number };
  cantidad?: number;
  rondas?: number;
  mezclar?: boolean;
  mostrarEjemplo?: boolean;
}

export interface ConfigClasificar {
  titulo: string;
  consigna: string;
  referencia: number;
  cajas: CajaClasificar[];
  numeros: number[] | null;
  rango: { min: number; max: number };
  cantidad: number;
  rondas: number;
  mezclar: boolean;
  mostrarEjemplo: boolean;
}

export const MIN_POR_CAJA = 2;

// Recursos con un juego en pantalla (para marcarlos como «Interactivo»).
// Hoy el único modo interactivo es "clasificar"; los futuros se suman acá.
export const MODOS_INTERACTIVOS = ["clasificar"] as const;
export function esInteractivo(extras: { modo?: string } | null | undefined): boolean {
  return !!extras?.modo && (MODOS_INTERACTIVOS as readonly string[]).includes(extras.modo);
}

// Completa lo que falte con valores por defecto razonables.
export function normalizarConfig(ex: ExtrasClasificar): ConfigClasificar {
  const referencia = Number.isFinite(ex.referencia) ? Number(ex.referencia) : 20;
  const cajas =
    ex.cajas && ex.cajas.length >= 2
      ? ex.cajas
      : [
          { etiqueta: `Menores que ${referencia}`, regla: "menor" as const },
          { etiqueta: `Mayores que ${referencia}`, regla: "mayor" as const },
        ];
  const min = ex.rango?.min ?? Math.max(1, referencia - 20);
  const max = ex.rango?.max ?? referencia + 20;
  return {
    titulo: ex.titulo?.trim() || "Clasificar números por valor",
    consigna: ex.consigna?.trim() || "Clasificá los siguientes números.",
    referencia,
    cajas,
    numeros: ex.numeros && ex.numeros.length ? ex.numeros : null,
    rango: { min: Math.min(min, max), max: Math.max(min, max) },
    cantidad: Math.min(12, Math.max(4, ex.cantidad ?? 8)),
    rondas: Math.min(20, Math.max(1, ex.rondas ?? 5)),
    mezclar: ex.mezclar ?? true,
    mostrarEjemplo: ex.mostrarEjemplo ?? true,
  };
}

export function cumpleRegla(n: number, regla: Regla, referencia: number): boolean {
  switch (regla) {
    case "menor":
      return n < referencia;
    case "mayor":
      return n > referencia;
    case "par":
      return n % 2 === 0;
    case "impar":
      return n % 2 !== 0;
  }
}

// Índice de la caja que le corresponde al número (-1 si ninguna).
export function cajaCorrecta(n: number, config: Pick<ConfigClasificar, "cajas" | "referencia">): number {
  return config.cajas.findIndex((c) => cumpleRegla(n, c.regla, config.referencia));
}

// Símbolo que acompaña a la etiqueta («Menores que 40 (<)»).
export function simboloRegla(regla: Regla): string | null {
  return regla === "menor" ? "<" : regla === "mayor" ? ">" : null;
}

export type Azar = () => number;

export function mezclar<T>(xs: T[], azar: Azar = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// `cantidad` números distintos dentro del rango, sin la referencia y con al
// menos MIN_POR_CAJA para cada caja (ninguna queda vacía).
export function generarNumeros(config: ConfigClasificar, azar: Azar = Math.random): number[] {
  const candidatos: number[] = [];
  for (let n = config.rango.min; n <= config.rango.max; n++) {
    if (n !== config.referencia && cajaCorrecta(n, config) >= 0) candidatos.push(n);
  }
  const porCaja = config.cajas.map((_, i) => mezclar(candidatos.filter((n) => cajaCorrecta(n, config) === i), azar));
  const elegidos: number[] = [];
  // Primero el mínimo de cada caja…
  for (const lista of porCaja) elegidos.push(...lista.slice(0, MIN_POR_CAJA));
  // …y el resto, al azar entre todos los que quedan.
  const resto = mezclar(
    candidatos.filter((n) => !elegidos.includes(n)),
    azar,
  );
  elegidos.push(...resto.slice(0, Math.max(0, config.cantidad - elegidos.length)));
  return mezclar(elegidos.slice(0, Math.max(config.cantidad, MIN_POR_CAJA * config.cajas.length)), azar);
}

// Números de una ronda: la lista fija solo en la primera; después, al azar.
export function numerosDeRonda(config: ConfigClasificar, ronda: number, azar: Azar = Math.random): number[] {
  if (ronda === 0 && config.numeros) return config.mezclar ? mezclar(config.numeros, azar) : [...config.numeros];
  return generarNumeros(config, azar);
}

// ─── Estado del juego ───

export type Fase = "inicio" | "juego" | "pausa" | "fin";

export interface EstadoJuego {
  fase: Fase;
  ronda: number;
  numeros: number[];
  // índice de tarjeta → caja donde quedó (solo los aciertos)
  clasificados: Record<number, number>;
  seleccion: number | null;
  // Error en curso: la tarjeta está un momento en la caja equivocada.
  error: { tarjeta: number; caja: number } | null;
  rondaTerminada: boolean;
  intentos: number;
  errores: number;
  rondasCompletas: number;
  rondasSaltadas: number;
}

export type Accion =
  | { tipo: "empezar" }
  | { tipo: "seleccionar"; tarjeta: number }
  | { tipo: "cancelar" }
  | { tipo: "soltar"; caja: number; tarjeta?: number }
  | { tipo: "devolver" }
  | { tipo: "siguiente" }
  | { tipo: "saltar" }
  | { tipo: "pausar" }
  | { tipo: "continuar" }
  | { tipo: "reiniciar" };

export function estadoInicial(config: ConfigClasificar, azar: Azar = Math.random): EstadoJuego {
  return {
    fase: "inicio",
    ronda: 0,
    numeros: numerosDeRonda(config, 0, azar),
    clasificados: {},
    seleccion: null,
    error: null,
    rondaTerminada: false,
    intentos: 0,
    errores: 0,
    rondasCompletas: 0,
    rondasSaltadas: 0,
  };
}

export const rondaCompleta = (e: EstadoJuego) => e.numeros.length > 0 && Object.keys(e.clasificados).length === e.numeros.length;

function avanzar(e: EstadoJuego, config: ConfigClasificar, azar: Azar, saltada: boolean): EstadoJuego {
  const conteo = saltada ? { rondasSaltadas: e.rondasSaltadas + 1 } : {};
  if (e.ronda + 1 >= config.rondas) return { ...e, ...conteo, fase: "fin", seleccion: null, error: null, rondaTerminada: false };
  return {
    ...e,
    ...conteo,
    ronda: e.ronda + 1,
    numeros: numerosDeRonda(config, e.ronda + 1, azar),
    clasificados: {},
    seleccion: null,
    error: null,
    rondaTerminada: false,
  };
}

export function reducirJuego(e: EstadoJuego, a: Accion, config: ConfigClasificar, azar: Azar = Math.random): EstadoJuego {
  switch (a.tipo) {
    case "empezar":
      return { ...e, fase: "juego" };
    case "seleccionar":
      if (e.fase !== "juego" || e.error || e.rondaTerminada || e.clasificados[a.tarjeta] !== undefined) return e;
      return { ...e, seleccion: e.seleccion === a.tarjeta ? null : a.tarjeta };
    case "cancelar":
      return { ...e, seleccion: null };
    case "soltar": {
      const tarjeta = a.tarjeta ?? e.seleccion;
      if (e.fase !== "juego" || e.error || tarjeta === null || e.clasificados[tarjeta] !== undefined) return e;
      const ok = cajaCorrecta(e.numeros[tarjeta], config) === a.caja;
      if (!ok) return { ...e, seleccion: null, error: { tarjeta, caja: a.caja }, intentos: e.intentos + 1, errores: e.errores + 1 };
      const sig = { ...e, seleccion: null, clasificados: { ...e.clasificados, [tarjeta]: a.caja }, intentos: e.intentos + 1 };
      if (!rondaCompleta(sig)) return sig;
      const completas = sig.rondasCompletas + 1;
      if (sig.ronda + 1 >= config.rondas) return { ...sig, rondasCompletas: completas, fase: "fin" };
      return { ...sig, rondasCompletas: completas, rondaTerminada: true };
    }
    case "devolver":
      // Después del error, la tarjeta vuelve a su lugar, disponible.
      return { ...e, error: null };
    case "siguiente":
      return e.rondaTerminada ? avanzar(e, config, azar, false) : e;
    case "saltar":
      return e.fase === "juego" ? avanzar(e, config, azar, true) : e;
    case "pausar":
      return e.fase === "juego" ? { ...e, fase: "pausa", seleccion: null } : e;
    case "continuar":
      return e.fase === "pausa" ? { ...e, fase: "juego" } : e;
    case "reiniciar":
      return { ...estadoInicial(config, azar), fase: "juego" };
  }
}
