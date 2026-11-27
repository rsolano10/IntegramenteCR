// Lógica de las escenas interactivas de gerontogimnasia (recursos 11 a 30):
// secuencias de colores, giros para la orientación espacial, el cambio de
// objetos de la memoria y el orden de las manos en los pases. Funciones
// puras (el azar entra como parámetro) para poder probarlas.

export const COLORES = {
  rojo: { nombre: "Rojo", hex: "#d64541" },
  verde: { nombre: "Verde", hex: "#3f9a59" },
  azul: { nombre: "Azul", hex: "#2f5aa8" },
  amarillo: { nombre: "Amarillo", hex: "#f0c02f" },
  naranja: { nombre: "Naranja", hex: "#ee8433" },
  morado: { nombre: "Morado", hex: "#8a55b8" },
  celeste: { nombre: "Celeste", hex: "#5bbce4" },
  negro: { nombre: "Negro", hex: "#2b2b2b" },
} as const;

export type ColorId = keyof typeof COLORES;

export type Azar = () => number;

// Una secuencia al azar, sin el mismo color dos veces seguidas.
export function secuenciaAlAzar(colores: ColorId[], largo: number, azar: Azar = Math.random): ColorId[] {
  const out: ColorId[] = [];
  for (let i = 0; i < largo; i++) {
    const posibles = colores.filter((c) => c !== out[i - 1]);
    out.push(posibles[Math.floor(azar() * posibles.length) % posibles.length]);
  }
  return out;
}

// ─── Orientación (GER-025) ───
// Las marcas quedan quietas y la persona gira. Posiciones en el sentido de
// las agujas del reloj: 0 frente, 1 derecha, 2 atrás, 3 izquierda.
export const POSICIONES = ["Al frente", "A la derecha", "Atrás", "A la izquierda"] as const;

export type Giro = "derecha" | "izquierda" | "media";
export const GIROS: Record<Giro, { texto: string; pasos: number }> = {
  derecha: { texto: "Girá un cuarto de vuelta a la derecha", pasos: 1 },
  izquierda: { texto: "Girá un cuarto de vuelta a la izquierda", pasos: 3 },
  media: { texto: "Dá media vuelta", pasos: 2 },
};

// Hacia qué marca mira después de girar (0 = la que estaba al frente).
export const girar = (mira: number, g: Giro) => (mira + GIROS[g].pasos) % 4;

// Sentado: la cabeza se orienta hacia una de las marcas de la mesa.
export const MIRADAS = [
  { pos: 3, texto: "Mirá suavemente hacia la izquierda" },
  { pos: 0, texto: "Mirá al frente" },
  { pos: 1, texto: "Mirá suavemente hacia la derecha" },
] as const;

export function giroAlAzar(anterior: Giro | null, azar: Azar = Math.random): Giro {
  const posibles: Giro[] = (["derecha", "izquierda", "media"] as Giro[]).filter((g) => g !== anterior);
  return posibles[Math.floor(azar() * posibles.length) % posibles.length];
}

// ─── Memoria de objetos (GER-024) ───
export type Cambio = { tipo: "falta"; objeto: string } | { tipo: "cambio"; a: string; b: string };

// Mientras la persona está de espaldas: sacar uno, o (en el desafío)
// cambiar dos de lugar.
export function cambioAlAzar(objetos: string[], intercambiar: boolean, azar: Azar = Math.random): Cambio {
  const i = Math.floor(azar() * objetos.length) % objetos.length;
  if (!intercambiar || objetos.length < 2) return { tipo: "falta", objeto: objetos[i] };
  const j = (i + 1 + (Math.floor(azar() * (objetos.length - 1)) % (objetos.length - 1))) % objetos.length;
  return { tipo: "cambio", a: objetos[i], b: objetos[j] };
}

// Cómo queda la mesa después del cambio.
export function mesaDespues(objetos: string[], c: Cambio): string[] {
  if (c.tipo === "falta") return objetos.filter((o) => o !== c.objeto);
  return objetos.map((o) => (o === c.a ? c.b : o === c.b ? c.a : o));
}

// ─── Pases con las manos (GER-027) ───
export type Mano = "derecha" | "izquierda";
export type ModoManos = "alternar" | "azar" | "numeros";

export function siguienteMano(modo: ModoManos, anterior: Mano | null, azar: Azar = Math.random): Mano {
  if (modo === "alternar") return anterior === "derecha" ? "izquierda" : "derecha";
  return azar() < 0.5 ? "derecha" : "izquierda";
}
