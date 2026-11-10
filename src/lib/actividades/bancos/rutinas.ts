// Banco de «Ordenar los pasos»: rutinas cotidianas de Costa Rica, en orden.
// `intercambiables`: pares de pasos (índices) que se aceptan en cualquier
// orden, para no rechazar órdenes razonables.
// `revisado: false` hasta que el equipo clínico lo apruebe.

export interface Rutina {
  id: string;
  nombre: string;
  pasos: string[];
  intercambiables?: [number, number][];
  revisado: boolean;
}

export const RUTINAS: Rutina[] = [
  {
    id: "cafe",
    nombre: "Chorrear café",
    pasos: ["Poner a hervir el agua", "Poner la bolsita en el chorreador", "Echar el café molido en la bolsita", "Echar el agua caliente poco a poco", "Servir el café en la taza", "Agregar azúcar al gusto", "Lavar el chorreador"],
    intercambiables: [[0, 1]],
    revisado: false,
  },
  {
    id: "mesa",
    nombre: "Poner la mesa",
    pasos: ["Limpiar la mesa", "Poner el mantel", "Poner los platos", "Poner los cubiertos al lado de cada plato", "Poner los vasos", "Servir la comida", "Sentarse a comer"],
    intercambiables: [[3, 4]],
    revisado: false,
  },
  {
    id: "manos",
    nombre: "Lavarse las manos",
    pasos: ["Abrir el tubo", "Mojarse las manos", "Echarse jabón", "Frotarse las manos y entre los dedos", "Enjuagarse las manos", "Cerrar el tubo", "Secarse con la toalla"],
    intercambiables: [[5, 6]],
    revisado: false,
  },
  {
    id: "cama",
    nombre: "Tender la cama",
    pasos: ["Quitar las almohadas", "Estirar la sábana de abajo", "Estirar la sábana de arriba", "Acomodar la cobija", "Poner las almohadas", "Poner el cojín encima"],
    revisado: false,
  },
  {
    id: "gallo-pinto",
    nombre: "Preparar gallo pinto",
    pasos: ["Picar la cebolla y el chile", "Calentar el aceite en el sartén", "Sofreír la cebolla y el chile", "Agregar los frijoles con un poco de caldo", "Agregar el arroz", "Mezclar con salsa Lizano", "Servir con culantro picado"],
    revisado: false,
  },
  {
    id: "salir",
    nombre: "Salir de la casa",
    pasos: ["Vestirse", "Ponerse los zapatos", "Revisar que lleva las llaves y la cédula", "Apagar las luces", "Salir y cerrar la puerta con llave"],
    intercambiables: [[2, 3]],
    revisado: false,
  },
  {
    id: "dientes",
    nombre: "Cepillarse los dientes",
    pasos: ["Mojar el cepillo", "Ponerle pasta", "Cepillarse los dientes", "Escupir", "Enjuagarse la boca", "Lavar el cepillo y guardarlo"],
    revisado: false,
  },
  {
    id: "carta",
    nombre: "Mandar un mensaje por WhatsApp",
    pasos: ["Desbloquear el teléfono", "Abrir WhatsApp", "Buscar el nombre de la persona", "Escribir el mensaje", "Tocar el botón de enviar"],
    revisado: false,
  },
];
