// Azar con semilla para las actividades interactivas: la misma semilla da
// los mismos ejercicios (pruebas y sesiones reproducibles). Ningún
// componente usa Math.random(): reciben los ejercicios ya generados.

export type Azar = () => number;

// mulberry32: chico, rápido y suficiente para barajar tarjetas.
export function crearAzar(semilla: number): Azar {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Semilla nueva para cada sesión (fuera de la lógica pura).
export const nuevaSemilla = () => Math.floor(Math.random() * 2 ** 31);

export function entero(azar: Azar, min: number, max: number): number {
  return min + Math.floor(azar() * (max - min + 1));
}

export function barajar<T>(xs: readonly T[], azar: Azar): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function elegir<T>(xs: readonly T[], azar: Azar): T {
  return xs[Math.floor(azar() * xs.length)];
}

// Baraja sin dejar el orden original (o su reverso) cuando hay más de 2.
export function desordenar<T>(xs: readonly T[], azar: Azar): T[] {
  if (xs.length < 3) return [...xs].reverse();
  for (let i = 0; i < 20; i++) {
    const b = barajar(xs, azar);
    const igual = b.every((x, k) => x === xs[k]);
    const reverso = b.every((x, k) => x === xs[xs.length - 1 - k]);
    if (!igual && !reverso) return b;
  }
  return [...xs.slice(1), xs[0]];
}
