import type { Guion } from "./tipos";

// Los juegos en pantalla («Un día en el pueblo») corren dentro de la misma
// sesión guiada que el resto: la portada de siempre, el juego como una
// escena con su cuadro, y el cierre de siempre (¿Pudieron hacerla?).
export function guionDeJuego(t: { codigo?: string | null; intro?: string | null; detalle?: string | null; ayuda?: string | null }): Guion {
  return {
    codigo: t.codigo ?? "juego",
    revisado: true,
    frase: t.intro ?? t.detalle ?? "Un juego en pantalla, ejercicio por ejercicio.",
    icono: "estrella",
    etiquetas: [],
    ayuda: ["Lean juntos la consigna. Después de dos intentos aparece «Pista».", "No hay apuro: se puede terminar por hoy cuando quieran."],
    escenas: [{ tipo: "juego" }, { tipo: "cierre", texto: "Jugar también es pensar." }],
  };
}
