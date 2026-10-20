// Datos de los programas (nombre, precio, qué incluye). Sin dependencias del
// motor clínico, para que el home público lo use liviano.
import { planTiers } from "./mockData";

export type ProgramaId = "autoguiado" | "orientado";

export interface Programa {
  id: ProgramaId;
  nombre: string;
  lema: string;
  descripcion: string;
  // Con sesiones no tiene precio fijo: `precio` es el texto del presupuesto,
  // `periodo` queda vacío y `notaPrecio` lo explica.
  precio: string;
  periodo: string;
  notaPrecio?: string;
  idealSi: string[];
  incluye: string[];
  // Lo que el programa no incluye, dicho sin rodeos.
  aclaracion?: string;
  // Condición para ingresar, visible antes de elegir.
  requisito?: string;
}

// Precios: la misma fuente que la sección "Planes" del landing (planTiers en
// mockData.ts) — cambiarlos ahí los cambia en los dos lugares. Siguen
// siendo valores provisionales hasta que el negocio defina los definitivos.
function precioDe(id: ProgramaId) {
  const tier = planTiers.find((t) => t.id === id)!;
  return { precio: tier.precio, periodo: tier.periodo };
}

// Mismos textos que el home (landingContenido.ts / programasHome). El
// Autoguiado da acceso a los recursos que selecciona el equipo; el programa
// con sesiones suma sesiones en línea o presenciales, objetivos
// individualizados a partir de una valoración neuropsicológica (requisito
// de ingreso, se contrata aparte) y seguimiento, según el plan contratado.
// No prometer acá servicios que todavía no estén definidos (ajustes
// semanales, recordatorios por WhatsApp, áreas fijas de profesionales).
// El id "orientado" se mantiene: es el valor guardado en la base.
export const programas: Programa[] = [
  {
    id: "autoguiado",
    nombre: "Autoguiado",
    lema: "Actividades para hacer en casa, a tu ritmo.",
    descripcion: "Un plan semanal con recursos seleccionados por nuestro equipo a partir de las respuestas sobre vos o tu ser querido.",
    ...precioDe("autoguiado"),
    idealSi: [
      "Tienen tiempo y confianza para organizar las actividades en casa",
      "Buscan mantener y estimular, sin cambios recientes importantes",
      "Prefieren un costo más bajo",
    ],
    incluye: [
      "Plan semanal de actividades",
      "Recursos de estimulación cognitiva, movimiento y orientaciones de nutrición",
      "Instrucciones paso a paso, videos y materiales",
      "Registro de las actividades realizadas",
    ],
    aclaracion: "No incluye sesiones profesionales ni valoración neuropsicológica.",
  },
  {
    id: "orientado",
    nombre: "Con sesiones profesionales",
    lema: "Objetivos individualizados a partir de una valoración.",
    descripcion:
      "Un programa de intervención que integra sesiones profesionales y actividades para el hogar, orientado por los resultados de una valoración neuropsicológica y las necesidades de cada persona.",
    precio: "Presupuesto según tu plan",
    periodo: "",
    notaPrecio: "El costo depende de las sesiones y los servicios que se definan para tu programa.",
    idealSi: [
      "Han notado cambios recientes en la memoria, el ánimo o la movilidad",
      "Quieren sesiones con profesionales, además de las actividades en casa",
      "Buscan objetivos individualizados y seguimiento de la evolución",
    ],
    incluye: [
      "Acceso a los recursos de la aplicación",
      "Objetivos de intervención individualizados",
      "Sesiones en línea o presenciales, según el plan contratado",
      "Seguimiento de la evolución y ajustes del programa",
    ],
    requisito:
      "Valoración neuropsicológica de los últimos 12 meses, de IntegraMente o de otro profesional. Podés elegir el programa sin tenerla: te indicamos cómo compartirla. Si la hacés con IntegraMente, se paga aparte.",
  },
];

// Fila por fila, para la tabla "Compará en detalle". `true` = incluido,
// `false` = no incluido, texto = incluido con matiz.
export const comparacion: { aspecto: string; autoguiado: boolean | string; orientado: boolean | string }[] = [
  { aspecto: "Plan semanal de actividades", autoguiado: true, orientado: true },
  { aspecto: "Recursos seleccionados por nuestro equipo", autoguiado: true, orientado: true },
  { aspecto: "Instrucciones paso a paso, videos y materiales", autoguiado: true, orientado: true },
  { aspecto: "Objetivos de intervención individualizados", autoguiado: false, orientado: true },
  { aspecto: "Sesiones en línea o presenciales", autoguiado: false, orientado: "Según el plan contratado" },
  { aspecto: "Seguimiento de la evolución y ajustes", autoguiado: false, orientado: true },
  { aspecto: "Valoración neuropsicológica (últimos 12 meses)", autoguiado: "No se requiere", orientado: "Requisito de ingreso" },
];
