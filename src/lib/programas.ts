import { planTiers } from "./mockData";
import { computeProfiles } from "./clinicalEngine";
import { computeActiveAlerts } from "./alertsEngine";
import type { Answers } from "./onboardingSchema";

export type ProgramaId = "autoguiado" | "orientado";

export interface Programa {
  id: ProgramaId;
  nombre: string;
  lema: string;
  descripcion: string;
  precio: string;
  periodo: string;
  idealSi: string[];
  incluye: string[];
}

// Precios: la misma fuente que la sección "Planes" del landing (planTiers en
// mockData.ts) — cambiarlos ahí los cambia en los dos lugares. Siguen
// siendo valores provisionales hasta que el negocio defina los definitivos.
function precioDe(id: ProgramaId) {
  const tier = planTiers.find((t) => t.id === id)!;
  return { precio: tier.precio, periodo: tier.periodo };
}

export const programas: Programa[] = [
  {
    id: "autoguiado",
    nombre: "Autoguiado",
    lema: "Ustedes llevan el ritmo",
    descripcion:
      "Un plan semanal de actividades armado a partir del perfil que acabás de completar, para hacer en casa con total independencia.",
    ...precioDe("autoguiado"),
    idealSi: [
      "Tienen tiempo y confianza para organizar las actividades en casa",
      "Buscan mantener y estimular, sin cambios recientes importantes",
      "Prefieren un costo más bajo",
    ],
    incluye: [
      "Plan semanal personalizado según el perfil",
      "Actividades paso a paso con videos y materiales",
      "Recordatorios por WhatsApp y calendario",
      "Asistente para dudas frecuentes",
    ],
  },
  {
    id: "orientado",
    nombre: "Orientado",
    lema: "Con una profesional a su lado",
    descripcion:
      "Todo lo del autoguiado, más una profesional del equipo clínico que revisa cómo les va cada semana y ajusta el plan con ustedes.",
    ...precioDe("orientado"),
    idealSi: [
      "Han notado cambios recientes en la memoria, el ánimo o la movilidad",
      "Quieren a alguien con quien consultar dudas sobre el cuidado",
      "Es su primera vez acompañando un proceso así",
    ],
    incluye: [
      "Todo lo del programa Autoguiado",
      "Profesional asignada que revisa cada semana",
      "Ajustes del plan según cómo les fue",
      "Mensajes directos con tu profesional",
      "Consulta inicial de orientación",
    ],
  },
];

// Fila por fila, para la tabla "Compará en detalle". `true` = incluido,
// `false` = no incluido, texto = incluido con matiz.
export const comparacion: { aspecto: string; autoguiado: boolean | string; orientado: boolean | string }[] = [
  { aspecto: "Plan semanal personalizado", autoguiado: true, orientado: true },
  { aspecto: "Biblioteca de actividades filtrada por perfil", autoguiado: true, orientado: true },
  { aspecto: "Recordatorios por WhatsApp y calendario", autoguiado: true, orientado: true },
  { aspecto: "Revisión de cómo les fue cada semana", autoguiado: "Automática", orientado: "Por tu profesional" },
  { aspecto: "Ajustes al plan", autoguiado: "Según tus evaluaciones", orientado: "Hechos por el equipo clínico" },
  { aspecto: "Mensajes con una profesional", autoguiado: false, orientado: true },
  { aspecto: "Consulta inicial de orientación", autoguiado: false, orientado: true },
];

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
      motivo: "Por lo que nos contaste, creemos que tener una profesional revisando el avance cada semana les va a ayudar más.",
    };
  }
  return {
    id: "autoguiado",
    motivo: "Por lo que nos contaste, el programa autoguiado puede ser un muy buen punto de partida.",
  };
}
