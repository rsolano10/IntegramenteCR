import type { NombreIcono } from "../../sesiones/iconos";

// Banco de «El mandado»: lo que se compra en el mercado, por tramo.
// Nombres de Costa Rica. Los dibujos son los de la sesión guiada.
// `revisado: false` hasta que el equipo lo apruebe.

export type Tramo = "verduras" | "lacteos" | "abarrotes" | "flores";

export const TRAMOS: Record<Tramo, { nombre: string; toldo: string }> = {
  verduras: { nombre: "Frutas y verduras", toldo: "#3f6a70" },
  lacteos: { nombre: "Carnes y lácteos", toldo: "#A8232B" },
  abarrotes: { nombre: "Abarrotes", toldo: "#8A5A36" },
  flores: { nombre: "Flores", toldo: "#8A4B9A" },
};

export interface Producto {
  id: string;
  nombre: string;
  tramo: Tramo;
  icono: NombreIcono;
  color: string;
}

const p = (tramo: Tramo, id: string, nombre: string, icono: NombreIcono, color: string): Producto => ({ id, nombre, tramo, icono, color });

export const PRODUCTOS: Producto[] = [
  p("verduras", "tomate", "Tomate", "fruta", "#E2582A"),
  p("verduras", "papa", "Papa", "tuberculo", "#D9A66B"),
  p("verduras", "zanahoria", "Zanahoria", "zanahoria", "#F2A253"),
  p("verduras", "cebolla", "Cebolla", "cebolla", "#E9C9A0"),
  p("verduras", "chile", "Chile dulce", "chile", "#E2582A"),
  p("verduras", "lechuga", "Lechuga", "lechuga", "#9CC48A"),
  p("verduras", "aguacate", "Aguacate", "aguacate", "#9CC48A"),
  p("verduras", "platano", "Plátano", "platano", "#E2B13A"),
  p("verduras", "limon", "Limón", "limon", "#9CC48A"),
  p("verduras", "culantro", "Culantro", "hoja", "#9CC48A"),
  p("lacteos", "pollo", "Pollo", "pollo", "#E9C9A0"),
  p("lacteos", "pescado", "Pescado", "pescado", "#9DB8BC"),
  p("lacteos", "huevos", "Huevos", "huevo", "#F4D096"),
  p("lacteos", "queso", "Queso", "queso", "#F4D096"),
  p("lacteos", "natilla", "Natilla", "yogur", "#F6F1E4"),
  p("lacteos", "leche", "Leche", "vaso", "#F6F1E4"),
  p("abarrotes", "arroz", "Arroz", "frasco", "#F6F1E4"),
  p("abarrotes", "frijoles", "Frijoles", "frijol", "#5E3B22"),
  p("abarrotes", "cafe", "Café", "taza", "#8A5A36"),
  p("abarrotes", "aceite", "Aceite", "aceite", "#E2B13A"),
  p("abarrotes", "pan", "Pan", "pan", "#D9A66B"),
  p("abarrotes", "azucar", "Azúcar", "cuchara", "#F6F1E4"),
  p("flores", "rosas", "Rosas", "flor", "#E2582A"),
  p("flores", "girasoles", "Girasoles", "flor", "#E2B13A"),
  p("flores", "claveles", "Claveles", "flor", "#F2B8A0"),
];

export const REVISADO = false;

export const productoDe = (id: string) => PRODUCTOS.find((x) => x.id === id)!;
