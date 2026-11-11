// Figuras dibujadas a mano en SVG (components/actividades/interactivas/Figura.tsx).
// Acá solo los nombres, para la lógica y los lectores de pantalla.
// `revisado: false` hasta que el equipo clínico lo apruebe.

export interface FiguraBanco {
  id: string;
  nombre: string; // singular, con artículo para frases («la taza»)
  plural: string; // «las tazas»
  revisado: boolean;
}

const f = (id: string, nombre: string, plural: string): FiguraBanco => ({ id, nombre, plural, revisado: false });

// Objetos de la casa para «Encontrá las parejas» (ícono y nombre).
export const OBJETOS: FiguraBanco[] = [
  f("casa", "la casa", "las casas"),
  f("sol", "el sol", "los soles"),
  f("luna", "la luna", "las lunas"),
  f("taza", "la taza", "las tazas"),
  f("llave", "la llave", "las llaves"),
  f("flor", "la flor", "las flores"),
  f("arbol", "el árbol", "los árboles"),
  f("sombrilla", "la sombrilla", "las sombrillas"),
  f("pez", "el pez", "los peces"),
  f("corazon", "el corazón", "los corazones"),
];

// Formas simples (también para buscar iguales y contar).
export const FORMAS: FiguraBanco[] = [
  f("circulo", "el círculo", "los círculos"),
  f("cuadrado", "el cuadrado", "los cuadrados"),
  f("triangulo", "el triángulo", "los triángulos"),
  f("estrella", "la estrella", "las estrellas"),
  f("rombo", "el rombo", "los rombos"),
  f("cruz", "la cruz", "las cruces"),
];

// Escenas para «¿Cuántos hay?».
export const ESCENAS: Record<"canasto" | "mesa" | "frutas" | "figuras", FiguraBanco[]> = {
  // Frutas de acá, como se dicen en Costa Rica.
  canasto: [
    f("mango", "el mango", "los mangos"),
    f("jocote", "el jocote", "los jocotes"),
    f("pejibaye", "el pejibaye", "los pejibayes"),
    f("cas", "el cas", "los cases"),
    f("mamon", "el mamón chino", "los mamones chinos"),
  ],
  mesa: [f("cuchara", "la cuchara", "las cucharas"), f("tenedor", "el tenedor", "los tenedores"), f("plato", "el plato", "los platos"), f("vaso", "el vaso", "los vasos")],
  frutas: [f("manzana", "la manzana", "las manzanas"), f("banano", "el banano", "los bananos"), f("naranja", "la naranja", "las naranjas"), f("uvas", "el racimo de uvas", "los racimos de uvas")],
  figuras: FORMAS.slice(0, 4),
};

// Variantes de forma con dirección, para el parecido alto (rotadas).
export const FLECHAS = ["flecha-arriba", "flecha-abajo", "flecha-izquierda", "flecha-derecha"] as const;

export const nombreFigura = (id: string): FiguraBanco | undefined => [...OBJETOS, ...FORMAS, ...Object.values(ESCENAS).flat()].find((x) => x.id === id);

// Nombre para lectores de pantalla de figuras sin entrada en el banco.
export const nombreFlecha: Record<string, string> = {
  "flecha-arriba": "flecha hacia arriba",
  "flecha-abajo": "flecha hacia abajo",
  "flecha-izquierda": "flecha hacia la izquierda",
  "flecha-derecha": "flecha hacia la derecha",
};
