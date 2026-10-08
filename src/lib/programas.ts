import { computeProfiles } from "./clinicalEngine";
import { computeActiveAlerts } from "./alertsEngine";
import type { Answers } from "./onboardingSchema";
import type { ProgramaId } from "./programasData";

export { comparacion, programas } from "./programasData";
export type { Programa, ProgramaId } from "./programasData";

// Sugerencia, nunca imposición: si el perfil muestra alguna alerta o algún
// eje en amarillo/rojo, el acompañamiento profesional aporta más. El motivo
// se expresa en lenguaje cotidiano — la regla de no mostrar semáforos a la
// familia sigue en pie.
export function programaSugerido(a: Answers): { id: ProgramaId; motivo: string } {
  const perfiles = computeProfiles(a);
  const ejesAtencion = Object.values(perfiles).filter((t) => t !== "verde").length;
  const alertas = computeActiveAlerts(a).length;
  if (alertas > 0 || ejesAtencion > 0) {
    return {
      id: "orientado",
      motivo: "Por lo que nos contaste, creemos que las sesiones en vivo con nuestros profesionales y un acompañamiento cercano les van a ayudar más.",
    };
  }
  return {
    id: "autoguiado",
    motivo: "Por lo que nos contaste, el programa autoguiado puede ser un muy buen punto de partida.",
  };
}
