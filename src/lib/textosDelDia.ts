// Los textos de Hoy, con la concordancia bien hecha y la persona según
// quién mira: el familiar lee «les espera», el participante «te espera».
import type { SiguienteDia } from "./siguienteDia";

export type Quien = "familia" | "participante";

const actividades = (n: number) => `${n} ${n === 1 ? "actividad" : "actividades"}`;
const nuevas = (n: number) => `${actividades(n)} ${n === 1 ? "nueva" : "nuevas"}`;

// La caja de avance de Hoy. `hechas` = enteras o en parte; `pendientes` =
// las que todavía no tienen registro.
export function mensajeDelDia(
  { hechas, pendientes, total }: { hechas: number; pendientes: number; total: number },
  quien: Quien,
  nombre: string | null,
): { titulo: string; detalle: string } {
  const participante = quien === "participante";
  if (total === 0) return { titulo: "Hoy es un día libre", detalle: "No hay actividades programadas." };
  if (pendientes === 0 && hechas === total) {
    return { titulo: "¡Día completo!", detalle: participante ? "Hiciste todo lo de hoy." : "Hicieron todas las actividades de hoy." };
  }
  if (pendientes === 0) {
    // Alguna quedó en «No se hizo»: sin tono de fracaso.
    return { titulo: "Listo por hoy", detalle: participante ? "Ya contaste cómo te fue en todo." : "Ya contaron cómo les fue en todo." };
  }
  if (pendientes === total) {
    const con = nombre && !participante ? ` con ${nombre}` : "";
    return {
      titulo: participante ? `Hoy ${total === 1 ? "toca 1 actividad" : `tocan ${actividades(total)}`}` : `${actividades(total)} para hoy${con}`,
      detalle: "Un paso a la vez, sin apuro.",
    };
  }
  return {
    titulo: pendientes === 1 ? "Falta solo una" : `Faltan ${pendientes}`,
    detalle: participante ? "¡Vas muy bien! Seguí a tu ritmo." : "¡Van muy bien! Sigan a su ritmo.",
  };
}

// El cierre al final de la lista del día.
export function cierreDelDia(
  pendientes: number,
  siguiente: SiguienteDia | null,
  quien: Quien,
): { titulo: string; detalle: string; icono: "sol" | "luna" | "bandera" } {
  const participante = quien === "participante";
  if (!siguiente) {
    return pendientes > 0
      ? {
          titulo: "Último día de la semana",
          detalle: participante ? "Con estas actividades termina la semana." : "Con estas actividades termina la semana. Después, contanos cómo les fue.",
          icono: "bandera",
        }
      : { titulo: participante ? "¡Terminaste la semana!" : "¡Terminaron la semana!", detalle: "El equipo está preparando la próxima.", icono: "bandera" };
  }
  const n = siguiente.cantidad;
  const cuando = siguiente.esManana ? "Mañana" : `El ${siguiente.dia.toLowerCase()}`;
  const espera = `${participante ? "te" : "les"} ${n === 1 ? "espera" : "esperan"}`;
  return pendientes > 0
    ? { titulo: "Eso es todo por hoy", detalle: `${cuando} ${espera} ${nuevas(n)}.`, icono: "sol" }
    : { titulo: "¡Listo por hoy!", detalle: `A descansar. ${cuando} hay ${nuevas(n)}.`, icono: "luna" };
}
