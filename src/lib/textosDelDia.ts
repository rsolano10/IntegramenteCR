// Los textos de Hoy, con la concordancia bien hecha y la persona según
// quién mira: el familiar lee «les espera», el participante «te espera».
import type { SiguienteDia } from "./siguienteDia";

export type Quien = "familia" | "participante";

const actividades = (n: number) => `${n} ${n === 1 ? "actividad" : "actividades"}`;
const nuevas = (n: number) => `${actividades(n)} ${n === 1 ? "nueva" : "nuevas"}`;

// La caja de avance de Hoy. `hechas` = enteras o en parte; `pendientes` =
// las que todavía no tienen registro.
// El desglose de lo registrado, con las mismas palabras de los estados:
// «Las 2 hechas», «1 hecha y 1 en parte», «1 hecha, 1 en parte y 1 que no se hizo».
export function desglose({ enteras, enParte, no }: { enteras: number; enParte: number; no: number }): string {
  const total = enteras + enParte + no;
  if (total > 0 && enteras === total) return total === 1 ? "Hecha." : `Las ${total} hechas.`;
  const partes = [
    enteras ? `${enteras} ${enteras === 1 ? "hecha" : "hechas"}` : null,
    enParte ? `${enParte} en parte` : null,
    no ? `${no} que no se ${no === 1 ? "hizo" : "hicieron"}` : null,
  ].filter((x): x is string => !!x);
  if (!partes.length) return "";
  const frase = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
  return `${frase.charAt(0).toUpperCase()}${frase.slice(1)}.`;
}

// La caja de avance de Hoy: un resumen sobrio de lo que pasó. La
// celebración («¡Listo por hoy!») queda una sola vez, abajo, en el cierre.
export function mensajeDelDia(
  { hechas, pendientes, total, enteras = hechas, enParte = 0, no = 0 }: { hechas: number; pendientes: number; total: number; enteras?: number; enParte?: number; no?: number },
  quien: Quien,
  nombre: string | null,
): { titulo: string; detalle: string } {
  const participante = quien === "participante";
  if (total === 0) return { titulo: "Hoy es un día libre", detalle: "No hay actividades programadas." };
  if (pendientes === 0) {
    const cuales = total === 1 ? "la actividad" : `las ${total} actividades`;
    return { titulo: `${participante ? "Registraste" : "Registraron"} ${cuales} de hoy`, detalle: desglose({ enteras, enParte, no }) };
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
