// Generador de rosetones de carreta de Sarchí: a partir de unos pocos
// parámetros devuelve las formas de un ornamento radial simétrico (en un
// lienzo de 100 × 100 con centro en 50, 50). Función pura: los mismos
// parámetros dan el mismo rosetón. Lo usan la rueda de progreso, las ruedas
// del taller de carretas (buscar iguales) y las baldosas del piso de mosaico.

export type FormaPetalo = "gota" | "punta" | "redonda";

export interface ParamsRoseton {
  petalos: number; // por anillo, 4 a 16
  anillos: number; // 1 a 3
  forma: FormaPetalo;
  colores: string[]; // se recorren por anillo; el último va al centro
  // Gira el anillo exterior medio pétalo (cambia el dibujo sin cambiar colores).
  desfase?: boolean;
  // Puntos entre los pétalos del anillo exterior.
  puntos?: boolean;
}

export interface FormaRoseton {
  d: string;
  fill: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const polar = (r: number, ang: number) => `${r2(50 + r * Math.cos(ang))} ${r2(50 + r * Math.sin(ang))}`;

function petalo(forma: FormaPetalo, r0: number, r1: number, ang: number, ancho: number): string {
  const p = (r: number, da: number) => polar(r, ang + da);
  const largo = r1 - r0;
  switch (forma) {
    case "gota":
      return `M${p(r0, 0)} C${p(r0 + largo * 0.35, -ancho * 1.5)} ${p(r1, -ancho * 0.55)} ${p(r1, 0)} C${p(r1, ancho * 0.55)} ${p(r0 + largo * 0.35, ancho * 1.5)} ${p(r0, 0)}Z`;
    case "punta":
      return `M${p(r0, 0)} L${p(r0 + largo * 0.45, -ancho)} L${p(r1, 0)} L${p(r0 + largo * 0.45, ancho)}Z`;
    case "redonda": {
      // Círculo en la mitad de la banda.
      const rm = (r0 + r1) / 2;
      const rad = Math.min(largo / 2, rm * Math.sin(ancho)) * 0.95;
      const [cx, cy] = polar(rm, ang).split(" ").map(Number);
      return `M${r2(cx - rad)} ${r2(cy)}a${r2(rad)} ${r2(rad)} 0 1 0 ${r2(rad * 2)} 0a${r2(rad)} ${r2(rad)} 0 1 0 ${r2(-rad * 2)} 0Z`;
    }
  }
}

const circulo = (r: number) => `M${50 - r} 50a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

export function roseton(p: ParamsRoseton): FormaRoseton[] {
  const petalos = Math.min(16, Math.max(4, Math.round(p.petalos)));
  const anillos = Math.min(3, Math.max(1, Math.round(p.anillos)));
  const colores = p.colores.length ? p.colores : ["#E2582A"];
  const color = (i: number) => colores[i % colores.length];
  const formas: FormaRoseton[] = [];
  const centro = 9;
  const banda = (46 - centro) / anillos;
  const paso = (2 * Math.PI) / petalos;
  // De afuera hacia adentro, para que los de adentro queden encima.
  for (let k = anillos - 1; k >= 0; k--) {
    const r0 = centro + banda * k;
    const r1 = r0 + banda + (k < anillos - 1 ? banda * 0.25 : 0);
    const giro = (k % 2 === 1) !== !!(p.desfase && k === anillos - 1) ? paso / 2 : 0;
    const ancho = (paso / 2) * 0.82;
    const d = Array.from({ length: petalos }, (_, i) => petalo(p.forma, r0, r1, -Math.PI / 2 + giro + i * paso, ancho)).join("");
    formas.push({ d, fill: color(k) });
    if (k === anillos - 1 && p.puntos) {
      const rp = r0 + banda * 0.78;
      const dots = Array.from({ length: petalos }, (_, i) => {
        const [cx, cy] = polar(rp, -Math.PI / 2 + giro + paso / 2 + i * paso).split(" ").map(Number);
        return `M${r2(cx - 2.2)} ${r2(cy)}a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0Z`;
      }).join("");
      formas.push({ d: dots, fill: color(k + 1) });
    }
  }
  formas.push({ d: circulo(centro), fill: color(anillos) });
  formas.push({ d: circulo(centro * 0.42), fill: color(anillos + 1) });
  return formas;
}

// Clave estable de un rosetón (para comparar «iguales»).
export const claveRoseton = (p: ParamsRoseton) => `${p.petalos}|${p.anillos}|${p.forma}|${p.colores.join(",")}|${!!p.desfase}|${!!p.puntos}`;
