// Banco de «La pizarra de la cocina»: días completos, escritos a mano, sin
// medicamentos ni datos de salud. `hora`: si la tarea puede tener hora
// fija (el juego decide cuáles la muestran). Las reglas dicen qué va antes
// de qué. `revisado: false` hasta que el equipo lo apruebe.

export interface TareaDia {
  id: string;
  texto: string;
  hora?: number; // 7 a 19
}

export interface ReglaOrden {
  antes: string;
  despues: string;
  texto: string;
}

export interface DiaAgenda {
  id: string;
  titulo: string;
  tareas: TareaDia[];
  reglas: ReglaOrden[];
  revisado: boolean;
}

export const DIAS: DiaAgenda[] = [
  {
    id: "martes",
    titulo: "Un martes de vueltas",
    revisado: false,
    tareas: [
      { id: "cafe", texto: "Chorrear el café" },
      { id: "desayunar", texto: "Desayunar" },
      { id: "bus", texto: "Tomar el bus a San José", hora: 9 },
      { id: "banco", texto: "Ir al banco", hora: 11 },
      { id: "almorzar", texto: "Almorzar", hora: 12 },
      { id: "matas", texto: "Regar las matas" },
      { id: "novela", texto: "Ver la novela", hora: 19 },
      { id: "llamar", texto: "Llamar a la hermana" },
    ],
    reglas: [
      { antes: "cafe", despues: "desayunar", texto: "El café se chorrea antes de desayunar." },
      { antes: "desayunar", despues: "bus", texto: "Hay que desayunar antes de salir a tomar el bus." },
      { antes: "almorzar", despues: "llamar", texto: "La hermana trabaja en la mañana: se le llama después de almorzar." },
    ],
  },
  {
    id: "feria",
    titulo: "Un sábado de feria",
    revisado: false,
    tareas: [
      { id: "lista", texto: "Hacer la lista de la feria" },
      { id: "feria", texto: "Ir a la feria", hora: 8 },
      { id: "sopa", texto: "Hacer la sopa" },
      { id: "almorzar", texto: "Almorzar", hora: 12 },
      { id: "descansar", texto: "Descansar un rato" },
      { id: "vecina", texto: "Recibir a la vecina", hora: 16 },
      { id: "misa", texto: "Ir a misa", hora: 18 },
      { id: "ropa", texto: "Doblar la ropa" },
    ],
    reglas: [
      { antes: "lista", despues: "feria", texto: "La lista se hace antes de ir a la feria." },
      { antes: "feria", despues: "sopa", texto: "La sopa se hace con lo que se compra en la feria." },
      { antes: "sopa", despues: "almorzar", texto: "La sopa tiene que estar lista para el almuerzo." },
      { antes: "almorzar", despues: "descansar", texto: "El rato de descanso es después de almorzar." },
    ],
  },
  {
    id: "lavado",
    titulo: "Un día de lavar ropa",
    revisado: false,
    tareas: [
      { id: "lavar", texto: "Lavar la ropa" },
      { id: "tender", texto: "Tender la ropa" },
      { id: "recoger", texto: "Recoger la ropa" },
      { id: "pan", texto: "Comprar el pan", hora: 7 },
      { id: "almorzar", texto: "Almorzar", hora: 12 },
      { id: "nieto", texto: "Ir por el nieto a la escuela", hora: 14 },
      { id: "cafeTarde", texto: "Tomar el café de la tarde", hora: 16 },
      { id: "regar", texto: "Regar el jardín" },
    ],
    reglas: [
      { antes: "lavar", despues: "tender", texto: "Primero se lava y después se tiende." },
      { antes: "tender", despues: "recoger", texto: "La ropa se recoge cuando ya se tendió." },
      { antes: "pan", despues: "cafeTarde", texto: "Para el café de la tarde hace falta el pan." },
    ],
  },
  {
    id: "visita",
    titulo: "Viene la familia",
    revisado: false,
    tareas: [
      { id: "barrer", texto: "Barrer la sala" },
      { id: "flores", texto: "Poner flores en la mesa" },
      { id: "arroz", texto: "Hacer el arroz con pollo" },
      { id: "llegan", texto: "Llega la familia", hora: 11 },
      { id: "almorzar", texto: "Almorzar todos juntos", hora: 12 },
      { id: "fotos", texto: "Ver fotos con los nietos" },
      { id: "cafe", texto: "Tomar café con queque", hora: 15 },
      { id: "despedir", texto: "Despedir a la familia", hora: 17 },
    ],
    reglas: [
      { antes: "barrer", despues: "llegan", texto: "La sala se barre antes de que llegue la familia." },
      { antes: "barrer", despues: "flores", texto: "Las flores van cuando ya está barrido." },
      { antes: "arroz", despues: "almorzar", texto: "El arroz con pollo tiene que estar listo para el almuerzo." },
      { antes: "llegan", despues: "fotos", texto: "Las fotos se ven cuando ya llegaron los nietos." },
    ],
  },
];
