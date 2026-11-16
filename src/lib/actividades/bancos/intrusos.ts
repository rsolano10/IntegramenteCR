// Banco de «La olla de carne» (el que no va). Contenido de Costa Rica.
// `revisado: false` hasta que el equipo clínico lo apruebe. Cada conjunto
// tiene un único intruso defendible: todo lo de `van` cumple el criterio y
// nada de `intrusos` lo cumple. Si el equipo marca un conjunto como
// ambiguo, sale del banco.

import type { DibujoProducto } from "./clasificar";

export type Sutileza = "evidente" | "categoria" | "propiedad";

export interface Cosa {
  texto: string;
  dibujo?: DibujoProducto;
}

export interface ConjuntoIntruso {
  id: string;
  sutileza: Sutileza;
  // Lo que dice la escena arriba de la mesa («Para la olla de carne»).
  titulo: string;
  // Por qué no va, en una línea (se muestra después de acertar). {x} es el intruso.
  criterio: string;
  van: Cosa[];
  intrusos: Cosa[];
  revisado: boolean;
}

const NAR = "#E2582A", GRA = "#A8232B", AMA = "#E2B13A", VER = "#6a969c", VEO = "#3f6a70", TIE = "#8A5A36", CRE = "#D9A66B", MOS = "#f4d096";
const c = (texto: string, forma?: DibujoProducto["forma"], color?: string): Cosa => (forma && color ? { texto, dibujo: { forma, color } } : { texto });

export const CONJUNTOS: ConjuntoIntruso[] = [
  // ─── Evidente: algo que no es comida, o no es de ese lugar ───
  {
    id: "olla-evidente",
    sutileza: "evidente",
    titulo: "Para la olla de carne",
    criterio: "Todo lo demás va en la olla de carne; {x} no se come.",
    van: [c("Yuca", "raiz", CRE), c("Elote", "alargada", AMA), c("Chayote", "redonda", VER), c("Zanahoria", "alargada", NAR), c("Papa", "redonda", TIE), c("Ayote", "redonda", NAR), c("Plátano verde", "alargada", VEO), c("Culantro", "manojo", VEO), c("Carne de res")],
    intrusos: [c("Jabón"), c("Escoba"), c("Zapato"), c("Peine"), c("Vela")],
    revisado: false,
  },
  {
    id: "cafe-evidente",
    sutileza: "evidente",
    titulo: "Para chorrear el café",
    criterio: "Todo lo demás sirve para chorrear el café; {x} no.",
    van: [c("Café molido"), c("Agua caliente"), c("Chorreador"), c("Bolsita de tela"), c("Taza"), c("Tapa de dulce"), c("Jarra")],
    intrusos: [c("Martillo"), c("Clavos"), c("Manguera"), c("Machete")],
    revisado: false,
  },
  {
    id: "patio-evidente",
    sutileza: "evidente",
    titulo: "Para trabajar en el patio",
    criterio: "Todo lo demás se usa en el patio; {x} no.",
    van: [c("Machete"), c("Pala"), c("Rastrillo"), c("Manguera"), c("Regadera"), c("Carretillo"), c("Tijeras de podar")],
    intrusos: [c("Almohada"), c("Cuchara"), c("Taza"), c("Cepillo de dientes")],
    revisado: false,
  },
  {
    id: "domingo-evidente",
    sutileza: "evidente",
    titulo: "La ropa de domingo",
    criterio: "Todo lo demás es ropa para ir a misa; {x} no se viste.",
    van: [c("Camisa planchada"), c("Pantalón de tela"), c("Sombrero"), c("Zapatos lustrados"), c("Enagua"), c("Rebozo"), c("Faja")],
    intrusos: [c("Sartén"), c("Pala"), c("Olla")],
    revisado: false,
  },

  // ─── Categoría cercana ───
  {
    id: "olla-fruta",
    sutileza: "categoria",
    titulo: "Para la olla de carne",
    criterio: "Lo demás son verduras y raíces para la olla; {x} es una fruta.",
    van: [c("Yuca", "raiz", CRE), c("Chayote", "redonda", VER), c("Zanahoria", "alargada", NAR), c("Papa", "redonda", TIE), c("Ayote", "redonda", NAR), c("Elote", "alargada", AMA), c("Tiquizque", "raiz", TIE)],
    intrusos: [c("Mango", "redonda", AMA), c("Piña", "redonda", AMA), c("Papaya", "alargada", NAR), c("Sandía", "redonda", VEO)],
    revisado: false,
  },
  {
    id: "pinto",
    sutileza: "categoria",
    titulo: "Para el gallo pinto",
    criterio: "Lo demás va en el gallo pinto; {x} es para algo dulce.",
    van: [c("Arroz"), c("Frijoles negros"), c("Cebolla", "redonda", MOS), c("Chile dulce", "redonda", GRA), c("Culantro", "manojo", VEO), c("Salsa inglesa")],
    intrusos: [c("Leche condensada"), c("Canela"), c("Mermelada")],
    revisado: false,
  },
  {
    id: "cocina-patio",
    sutileza: "categoria",
    titulo: "Para la cocina",
    criterio: "Lo demás es de la cocina; {x} es del patio.",
    van: [c("Cuchara de palo"), c("Olla"), c("Sartén"), c("Cucharón"), c("Colador"), c("Comal")],
    intrusos: [c("Rastrillo"), c("Pala"), c("Machete")],
    revisado: false,
  },

  // ─── Por una propiedad ───
  {
    id: "verdes",
    sutileza: "propiedad",
    titulo: "Todos son verdes",
    criterio: "Todos son verdes menos {x}.",
    van: [c("Chayote", "redonda", VER), c("Limón ácido", "redonda", VEO), c("Pepino", "alargada", VEO), c("Culantro", "manojo", VEO), c("Aguacate", "redonda", VEO), c("Vainica", "alargada", VER)],
    intrusos: [c("Zanahoria", "alargada", NAR), c("Remolacha", "redonda", GRA), c("Elote", "alargada", AMA)],
    revisado: false,
  },
  {
    id: "crudos",
    sutileza: "propiedad",
    titulo: "Se comen sin cocinar",
    criterio: "Todos se pueden comer crudos menos {x}, que hay que cocinarla.",
    van: [c("Mango", "redonda", AMA), c("Papaya", "alargada", NAR), c("Pepino", "alargada", VEO), c("Lechuga", "manojo", VER), c("Tomate", "redonda", GRA), c("Banano", "alargada", AMA)],
    intrusos: [c("Yuca", "raiz", CRE), c("Papa", "redonda", TIE)],
    revisado: false,
  },
  {
    id: "maiz",
    sutileza: "propiedad",
    titulo: "Todos llevan maíz",
    criterio: "Todos llevan maíz menos {x}.",
    van: [c("Tortilla"), c("Tamal"), c("Chorreada"), c("Elote asado", "alargada", AMA), c("Atol de maíz"), c("Palomitas")],
    intrusos: [c("Arroz con leche"), c("Plátano maduro", "alargada", AMA)],
    revisado: false,
  },
  {
    id: "dulces",
    sutileza: "propiedad",
    titulo: "Todos son dulces",
    criterio: "Todos son dulces menos {x}.",
    van: [c("Cajeta"), c("Tapa de dulce"), c("Melcocha"), c("Arroz con leche"), c("Queque"), c("Miel")],
    intrusos: [c("Chilero"), c("Sal"), c("Limón ácido", "redonda", VEO)],
    revisado: false,
  },
];
