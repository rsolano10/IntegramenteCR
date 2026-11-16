import type { Guion } from "../tipos";

// PRE-005 «Agregá hojas verdes a una comida». Fuente: la ficha PRE-005 de
// nutrición preventiva (Tu actividad, Tené en cuenta, Para cerrar). La
// sesión arma la misión de la semana: hojas verdes en tres comidas.
export const pre005: Guion = {
  codigo: "PRE-005",
  revisado: false,
  frase: "Sumar hojas verdes a tres comidas de esta semana.",
  icono: "hoja",
  etiquetas: ["Toda la semana", "3 comidas", "En la cocina"],
  cuidado: "Si toma warfarina o le cuesta tragar, mirá los cuidados al final.",
  ayuda: ["Picalas finito y mezclalas con algo que ya le guste.", "Empezá con poquito y vean cómo le cae."],
  escenas: [
    {
      tipo: "elegir",
      clave: "hoja",
      titulo: "¿Qué hoja verde usamos?",
      nota: "La que consigan o la que más le guste.",
      opciones: [
        { id: "espinaca", texto: "Espinaca", icono: "hoja", dicho: "la espinaca" },
        { id: "acelga", texto: "Acelga", icono: "acelga", dicho: "la acelga" },
        { id: "mostaza", texto: "Mostaza", icono: "mostaza", dicho: "la mostaza" },
        { id: "lechuga", texto: "Lechuga", icono: "lechuga", dicho: "la lechuga" },
      ],
    },
    { tipo: "consigna", titulo: "Primero, lavarla", texto: "Lavá bien {hoja}, hoja por hoja.", icono: "lavar" },
    {
      tipo: "elegir",
      clave: "forma",
      titulo: "¿Cómo se la damos?",
      nota: "Según la textura que le va bien.",
      opciones: [
        { id: "cocida", texto: "Cocida: media taza", icono: "sarten", dicho: "media taza cocida" },
        { id: "cruda", texto: "Cruda: una taza", icono: "taza", dicho: "una taza cruda" },
      ],
    },
    {
      tipo: "elegir",
      clave: "comida",
      titulo: "¿En qué comida la ponemos?",
      nota: "Mejor en algo que ya conoce.",
      opciones: [
        { id: "huevo", texto: "En un huevo", icono: "huevo", dicho: "un huevo" },
        { id: "picadillo", texto: "En un picadillo", icono: "sarten", dicho: "un picadillo" },
      ],
      libre: "Otra comida de siempre",
    },
    {
      tipo: "mision",
      clave: "comidas",
      titulo: "La misión de la semana",
      texto: "Hojas verdes en 3 comidas.",
      veces: 3,
      nota: "Marcá cada comida cuando la sirvan. Podés volver a marcarla cualquier día de esta semana.",
    },
    {
      tipo: "cuidados",
      titulo: "Antes de cocinar",
      nota: "Solo si le aplica a tu familiar.",
      items: [
        { icono: "pastillas", texto: "Si toma warfarina, coordiná con su equipo cuánta hoja come. No hace falta quitarla." },
        { icono: "rinon", texto: "Con restricción de potasio o cálculos, consultá qué hojas y cuánto." },
        { icono: "cuchara", texto: "Si le cuesta tragar, seguí la textura que le indicaron." },
      ],
    },
    { tipo: "cierre", texto: "Un ingrediente conocido puede darle variedad a una comida de siempre.", dato: true },
  ],
};
