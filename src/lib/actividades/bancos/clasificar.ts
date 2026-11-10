// Banco de «Cada cosa en su lugar». Contenido de Costa Rica.
// `revisado: false` hasta que el equipo clínico lo apruebe.
// Un elemento puede ir en más de un grupo (por ejemplo, el tomate).

export interface GrupoBanco {
  id: string;
  nombre: string;
}
export interface ElementoBanco {
  texto: string;
  grupos: string[];
}
export interface PaqueteBanco {
  id: string;
  nombre: string;
  revisado: boolean;
  grupos: GrupoBanco[];
  elementos: ElementoBanco[];
}

const el = (grupos: string, ...textos: string[]): ElementoBanco[] => textos.map((texto) => ({ texto, grupos: grupos.split("|") }));

export const PAQUETES: PaqueteBanco[] = [
  {
    id: "cocina",
    nombre: "La cocina",
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
    nombre: "Reciclaje",
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
