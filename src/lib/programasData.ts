// Datos de los programas (nombre, precio, qué incluye). Sin dependencias del
// motor clínico, para que el home público lo use liviano.
import { planTiers } from "./mockData";

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

// Los dos programas incluyen la revisión y el ajuste de las actividades por
// el equipo de salud (neuropsicología, nutrición, fisioterapia). La
// diferencia real es que Orientado suma sesiones en vivo —presenciales o
// virtuales— con esos profesionales y el acompañamiento cercano de un
// experto del programa que da seguimiento a los resultados.
export const programas: Programa[] = [
  {
    id: "autoguiado",
    nombre: "Autoguiado",
    lema: "Ustedes llevan el ritmo",
    descripcion:
      "Un plan semanal de actividades para hacer en casa, preparado y ajustado por nuestro equipo de salud a partir del perfil que completaste.",
    ...precioDe("autoguiado"),
    idealSi: [
      "Tienen tiempo y confianza para organizar las actividades en casa",
      "Buscan mantener y estimular, sin cambios recientes importantes",
      "Prefieren un costo más bajo",
    ],
    incluye: [
      "Plan semanal personalizado según el perfil",
      "Actividades revisadas y ajustadas por profesionales de la salud",
      "Actividades paso a paso con videos y materiales",
      "Recordatorios por WhatsApp y calendario",
    ],
  },
  {
    id: "orientado",
    nombre: "Orientado",
    lema: "Con el equipo de salud a su lado",
    descripcion:
      "Todo lo del Autoguiado, más sesiones en vivo con nuestros profesionales de la salud y el acompañamiento cercano de un experto del programa.",
    ...precioDe("orientado"),
    idealSi: [
      "Han notado cambios recientes en la memoria, el ánimo o la movilidad",
      "Quieren sesiones con profesionales, además de las actividades en casa",
      "Buscan un seguimiento cercano de los resultados",
    ],
    incluye: [
      "Todo lo del programa Autoguiado",
      "Sesiones en vivo, presenciales o virtuales",
      "Con profesionales en neuropsicología, nutrición y fisioterapia",
      "Acompañamiento cercano de un experto del programa",
      "Seguimiento de los resultados",
    ],
  },
];

// Fila por fila, para la tabla "Compará en detalle". `true` = incluido,
// `false` = no incluido, texto = incluido con matiz.
export const comparacion: { aspecto: string; autoguiado: boolean | string; orientado: boolean | string }[] = [
  { aspecto: "Plan semanal personalizado", autoguiado: true, orientado: true },
  { aspecto: "Revisión y ajuste por profesionales de la salud", autoguiado: true, orientado: true },
  { aspecto: "Actividades paso a paso y recordatorios", autoguiado: true, orientado: true },
  { aspecto: "Sesiones en vivo (presenciales o virtuales)", autoguiado: false, orientado: true },
  { aspecto: "Neuropsicología, nutrición y fisioterapia", autoguiado: "En la revisión del plan", orientado: "También en sesiones en vivo" },
  { aspecto: "Acompañamiento cercano de un experto", autoguiado: false, orientado: true },
];
