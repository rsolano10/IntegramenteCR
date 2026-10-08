import type { TourStep } from "../components/ui/ProductTour";

export const familiarTourSteps: TourStep[] = [
  {
    title: "¡Bienvenida a IntegraMente en Casa!",
    body: "Este es tu espacio para acompañar a tu familiar día a día. Te mostramos rápido dónde está cada cosa — son solo tres lugares.",
  },
  {
    title: "Hoy",
    body: "Las actividades del día. Tocá una para verla paso a paso y marcala como realizada cuando la terminen juntos.",
  },
  {
    title: "Mi semana",
    body: "El plan completo de la semana, la evaluación cuando termina (tres preguntas rápidas) y más actividades elegidas según el perfil para los días con ganas de más.",
  },
  {
    title: "Ayuda",
    body: "Respuestas rápidas a las dudas más comunes del cuidado y, si tu programa lo incluye, la conversación con tu profesional. Un número rojo te avisa si te escribieron.",
  },
  {
    title: "SOS, siempre a mano",
    body: "Arriba a la derecha está el botón SOS: te orienta según lo que esté pasando y tiene los teléfonos de ayuda. Tu cuenta y el perfil de tu familiar están en el menú con tu nombre.",
  },
];

export const participanteTourSteps: TourStep[] = [
  {
    title: "¡Bienvenido a IntegraMente en Casa!",
    body: "Este es tu espacio. Acá vas a ver las actividades que preparamos para vos, un día a la vez.",
  },
  {
    title: "Hoy toca",
    body: "Tocá una actividad para empezarla. Cuando termines, marcala como realizada — así tu equipo sabe cómo te fue.",
  },
  {
    title: "Tu foto y tu cuenta",
    body: "Arriba a la derecha está tu círculo de perfil. Tocalo si querés cambiar tu foto o cerrar sesión.",
  },
  {
    title: "Ya podés empezar",
    body: "Eso es todo. Cuando quieras, tocá la primera actividad de hoy.",
  },
];

export const profesionalTourSteps: TourStep[] = [
  {
    title: "Bienvenida al panel clínico",
    body: "Este es el panel de IntegraMente en Casa. Te mostramos rápido cómo está organizado — son solo unos segundos.",
  },
  {
    title: "Lo que necesita atención hoy",
    body: "Esta tarjeta agrupa lo pendiente en cuatro listas: pacientes por evaluar, mensajes sin responder, semanas esperando tu revisión, y pacientes esperando que les asignes la próxima semana. Tocá cualquier fila para abrir el detalle.",
  },
  {
    title: "El programa en conjunto",
    body: "Acá ves un resumen general: cuántos pacientes están activos, la distribución de los 4 ejes clínicos (cognitivo, físico, funcional y nutricional — siempre por separado, nunca combinados) y la adherencia al plan.",
  },
  {
    title: "Usuarios y Biblioteca",
    body: "En el menú, Usuarios tiene la lista completa de pacientes y cuentas vinculadas, y Biblioteca es el catálogo de recursos y actividades disponibles para armar los planes.",
  },
  {
    title: "Ya podés empezar",
    body: "Eso es todo por ahora. Cualquier paciente o mensaje pendiente lo vas a ver reflejado acá mismo.",
  },
];
