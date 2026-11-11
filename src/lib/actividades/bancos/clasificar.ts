// Banco de «Cada cosa en su lugar». Contenido de Costa Rica.
// `revisado: false` hasta que el equipo clínico lo apruebe.
// Un elemento puede ir en más de un grupo (por ejemplo, el tomate).

export interface GrupoBanco {
  id: string;
  nombre: string;
}
// Dibujo simple de un producto (la escena lo pinta con formas planas).
export interface DibujoProducto {
  forma: "redonda" | "alargada" | "manojo" | "racimo" | "raiz";
  color: string;
}
export interface ElementoBanco {
  texto: string;
  grupos: string[];
  dibujo?: DibujoProducto;
}
export interface PaqueteBanco {
  id: string;
  nombre: string;
  revisado: boolean;
  grupos: GrupoBanco[];
  elementos: ElementoBanco[];
}

const el = (grupos: string, ...textos: string[]): ElementoBanco[] => textos.map((texto) => ({ texto, grupos: grupos.split("|") }));
const pr = (grupos: string, texto: string, forma: DibujoProducto["forma"], color: string): ElementoBanco => ({ texto, grupos: grupos.split("|"), dibujo: { forma, color } });

// Colores de los productos (de la paleta de ilustración).
const NAR = "#E2582A", GRA = "#A8232B", MOS = "#f4d096", AMA = "#E2B13A", VER = "#6a969c", VEO = "#3f6a70", TIE = "#8A5A36", GUA = "#8A4B9A", CRE = "#D9A66B";

export const PAQUETES: PaqueteBanco[] = [
  {
    id: "feria",
    nombre: "La feria",
    revisado: false,
    grupos: [
      { id: "frutas", nombre: "Frutas" },
      { id: "verduras", nombre: "Verduras" },
      { id: "raices", nombre: "Raíces" },
      { id: "olores", nombre: "Olores" },
    ],
    elementos: [
      pr("frutas", "Mango", "redonda", AMA),
      pr("frutas", "Papaya", "alargada", NAR),
      pr("frutas", "Piña", "redonda", MOS),
      pr("frutas", "Banano", "alargada", MOS),
      pr("frutas", "Mamón chino", "racimo", GRA),
      pr("frutas", "Naranja", "redonda", NAR),
      pr("frutas", "Guayaba", "redonda", VER),
      pr("verduras", "Chayote", "redonda", VER),
      pr("verduras", "Zanahoria", "alargada", NAR),
      pr("verduras", "Vainica", "alargada", VEO),
      pr("verduras", "Chile dulce", "redonda", GRA),
      pr("verduras", "Ayote", "redonda", AMA),
      pr("verduras", "Repollo", "redonda", VER),
      pr("verduras|frutas", "Tomate", "redonda", GRA),
      pr("raices", "Yuca", "raiz", CRE),
      pr("raices", "Papa", "redonda", CRE),
      pr("raices", "Camote", "raiz", GUA),
      pr("raices", "Ñampí", "raiz", TIE),
      pr("raices", "Tiquizque", "raiz", TIE),
      pr("raices", "Malanga", "raiz", CRE),
      pr("olores", "Culantro", "manojo", VEO),
      pr("olores", "Cebollino", "manojo", VER),
      pr("olores", "Apio", "manojo", VER),
      pr("olores", "Hierbabuena", "manojo", VEO),
      pr("olores", "Orégano", "manojo", VEO),
      pr("olores", "Culantro de coyote", "manojo", VER),
    ],
  },
  {
    id: "cocina",
    nombre: "La cocina de la casa",
    revisado: false,
    grupos: [
      { id: "refri", nombre: "Refrigeradora" },
      { id: "alacena", nombre: "Alacena" },
      { id: "gaveta", nombre: "Gaveta" },
      { id: "fregadero", nombre: "Fregadero" },
    ],
    elementos: [
      ...el("refri", "Leche", "Natilla", "Queso tierno", "Huevos", "Mantequilla", "Pollo crudo", "Fresco de cas"),
      ...el("alacena", "Arroz", "Frijoles", "Azúcar", "Café molido", "Galletas", "Atún en lata", "Sal"),
      ...el("gaveta", "Cucharas", "Tenedores", "Cuchillos", "Abrelatas", "Cucharón", "Pelador"),
      ...el("fregadero", "Plato sucio", "Olla sucia", "Taza usada", "Esponja", "Jabón de platos", "Sartén sucio"),
      ...el("refri|alacena", "Tomate"),
    ],
  },
  {
    id: "casa",
    nombre: "La casa",
    revisado: false,
    grupos: [
      { id: "cocina", nombre: "Cocina" },
      { id: "bano", nombre: "Baño" },
      { id: "cuarto", nombre: "Cuarto" },
      { id: "sala", nombre: "Sala" },
    ],
    elementos: [
      ...el("cocina", "Olla", "Licuadora", "Cocina de gas", "Chorreador", "Tabla de picar", "Refrigeradora"),
      ...el("bano", "Cepillo de dientes", "Jabón", "Toalla", "Champú", "Papel higiénico", "Ducha"),
      ...el("cuarto", "Almohada", "Cobija", "Ropero", "Pijama", "Mesa de noche", "Despertador"),
      ...el("sala", "Sillón", "Televisor", "Control remoto", "Cojín", "Mesa de centro", "Florero"),
    ],
  },
  {
    id: "reciclaje",
    nombre: "El patio (reciclaje)",
    revisado: false,
    grupos: [
      { id: "organico", nombre: "Orgánico" },
      { id: "papel", nombre: "Papel y cartón" },
      { id: "plastico", nombre: "Plástico y envases" },
      { id: "vidrio", nombre: "Vidrio" },
    ],
    elementos: [
      ...el("organico", "Cáscara de banano", "Borra de café", "Cáscaras de huevo", "Restos de verdura", "Hojas secas", "Cáscara de papaya"),
      ...el("papel", "Periódico", "Caja de cartón", "Revista", "Bolsa de papel", "Cuaderno viejo", "Caja de cereal"),
      ...el("plastico", "Botella de refresco", "Envase de yogur", "Tapa plástica", "Bolsa plástica", "Lata de atún", "Envase de champú"),
      ...el("vidrio", "Frasco de mermelada", "Botella de vidrio", "Frasco de salsa", "Vaso quebrado", "Frasco de café", "Botella de vino"),
    ],
  },
  {
    id: "categorias",
    nombre: "Categorías",
    revisado: false,
    grupos: [
      { id: "frutas", nombre: "Frutas" },
      { id: "animales", nombre: "Animales" },
      { id: "ropa", nombre: "Ropa" },
      { id: "herramientas", nombre: "Herramientas" },
    ],
    elementos: [
      ...el("frutas", "Mango", "Piña", "Papaya", "Sandía", "Guayaba", "Mamón chino", "Banano"),
      ...el("animales", "Perro", "Gato", "Vaca", "Gallina", "Perezoso", "Tucán", "Caballo"),
      ...el("ropa", "Camisa", "Pantalón", "Enagua", "Medias", "Sombrero", "Suéter", "Zapatos"),
      ...el("herramientas", "Martillo", "Serrucho", "Alicate", "Desatornillador", "Machete", "Pala", "Cinta métrica"),
    ],
  },
];
