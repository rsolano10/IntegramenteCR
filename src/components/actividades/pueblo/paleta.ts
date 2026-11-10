// Colores de «Un día en el pueblo».
// La INTERFAZ (botones, texto, marcos) usa solo los tokens de marca.
// Las ILUSTRACIONES usan la marca más esta paleta extendida (propuesta a
// validar con Rodolfo). Cielos nunca celestes. Cada escena usa como mucho 5
// colores dominantes; `tierra` reemplaza al negro en líneas y sombras.
export const P = {
  // Marca
  serenidad: "#6a969c",
  profundo: "#3f6a70",
  mostaza: "#f4d096",
  beige: "#ebe6ce",
  tinta: "#1f3338",
  // Extendida (ilustración)
  naranja: "#E2582A", // carreta
  grano: "#A8232B", // cereza de café madura
  guaria: "#8A4B9A", // guaria morada
  rosa: "#F2B8A0", // cielo de tarde
  cal: "#F6F1E4", // pared encalada
  tierra: "#33241C", // líneas y sombras
  // Maderas (variaciones de tierra para muebles)
  madera: "#8A5A36",
  maderaClara: "#D9A66B",
  maderaOscura: "#5E3B22",
} as const;

// Dinero: única excepción de color, para que se reconozca (serie 2009-2010;
// confirmar contra billetes reales). Ilustración estilizada, no el arte real.
export const BILLETES: Record<number, { fondo: string; sombra: string }> = {
  1000: { fondo: "#C8483C", sombra: "#8E2E25" },
  2000: { fondo: "#3E6FA8", sombra: "#284C77" },
  5000: { fondo: "#E2B13A", sombra: "#A37B1E" },
  10000: { fondo: "#4E8A57", sombra: "#32603A" },
  20000: { fondo: "#E07A2F", sombra: "#A4521A" },
};
export const MONEDA = { cara: "#D8B45C", canto: "#A5822E", brillo: "#EFD58E" };

// Sombra de papel recortado: corta, hacia abajo, sin desenfoque.
export const sombraPapel = (px = 3, color = "rgba(51,36,28,0.35)") => `0 ${px}px 0 ${color}`;
