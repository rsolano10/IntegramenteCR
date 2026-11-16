import type { TourStep } from "../components/ui/ProductTour";

export const familiarTourSteps: TourStep[] = [
  {
    title: "Te damos la bienvenida a IntegraMente en Casa",
    body: "Este es tu espacio para acompañar a tu familiar día a día. Te mostramos rápido dónde está cada cosa: son solo tres lugares.",
  },
  {
    title: "Hoy",
    body: "Las actividades del día. Tocá una para ver de qué se trata y empezarla. Al terminar, la app les pregunta cómo les fue.",
  },
  {
    title: "Mi semana",
    body: "El plan completo de la semana, la evaluación cuando termina (tres preguntas rápidas) y más actividades elegidas según el perfil para los días con ganas de más.",
  },
  {
    title: "Ayuda",
    body: "Clara, la asistente de IntegraMente: le podés escribir o hablar para resolver dudas de la app. Si algo necesita a un profesional, nuestro equipo te atiende por WhatsApp.",
  },
  {
    title: "Tu cuenta",
    body: "Arriba a la derecha, en el menú con tu nombre, están tu cuenta, el perfil de tu familiar y los avisos en tu teléfono.",
  },
];

export const participanteTourSteps: TourStep[] = [
  {
    title: "Te damos la bienvenida a IntegraMente en Casa",
    body: "Este es tu espacio. Acá vas a ver las actividades que preparamos para vos, un día a la vez.",
  },
  {
    title: "Hoy",
    body: "Tocá una actividad para ver de qué se trata y empezarla. Al terminar, la app te pregunta cómo te fue: así tu equipo lo sabe.",
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
    body: "Esta tarjeta agrupa lo pendiente en cuatro listas: pacientes por evaluar, conversaciones del asistente para revisar, semanas esperando tu revisión, y pacientes esperando que les asignes la próxima semana. Tocá cualquier fila para abrir el detalle. Con las familias se habla por WhatsApp, desde la ficha de cada paciente.",
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
    body: "Eso es todo por ahora. Cualquier paciente pendiente lo vas a ver reflejado acá mismo.",
  },
];
