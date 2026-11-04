// Presentación del cuestionario por categorías (Fase 2.1). Solo
// presentación: ícono, color y una línea de qué se va a conversar en cada
// módulo de onboardingSchema.ts. No cambia preguntas, orden ni opciones
// (la batería puntúa de forma determinista).

export interface CategoriaCuestionario {
  icono: "persona" | "corazon" | "estetoscopio" | "cerebro" | "luna" | "brujula" | "casa" | "mano" | "equilibrio" | "manzana" | "reloj" | "estrella";
  color: string; // fondo del ícono (paleta oficial)
  tinta: string; // color del ícono sobre ese fondo
  linea: string;
}

export const categorias: Record<string, CategoriaCuestionario> = {
  "Conozcamos a la persona": { icono: "persona", color: "#6a969c", tinta: "#ffffff", linea: "Quién es y cómo es su día a día." },
  "Salud general": { icono: "corazon", color: "#e8b5a1", tinta: "#1f3338", linea: "Antecedentes de salud y cambios recientes." },
  Diagnóstico: { icono: "estetoscopio", color: "#3f6a70", tinta: "#ffffff", linea: "Si hay un diagnóstico y desde cuándo." },
  "Cognición y comunicación": { icono: "cerebro", color: "#6a969c", tinta: "#ffffff", linea: "Memoria, atención y comunicación en lo cotidiano." },
  "Ánimo y descanso": { icono: "luna", color: "#ebe6ce", tinta: "#3f6a70", linea: "Cómo se ha sentido y cómo descansa." },
  "Cambios en la conducta": { icono: "brujula", color: "#f4d096", tinta: "#1f3338", linea: "Cambios de conducta que hayan notado." },
  "Actividades cotidianas": { icono: "casa", color: "#3f6a70", tinta: "#ffffff", linea: "Tareas de la casa, compras y organización." },
  "Cuidado personal": { icono: "mano", color: "#e8b5a1", tinta: "#1f3338", linea: "Baño, vestido y alimentación." },
  "Movimiento y seguridad": { icono: "equilibrio", color: "#f4d096", tinta: "#1f3338", linea: "Equilibrio, caídas y movilidad." },
  "Alimentación e hidratación": { icono: "manzana", color: "#ebe6ce", tinta: "#3f6a70", linea: "Qué come, cuánto bebe y cómo." },
  "Rutina y vida social": { icono: "reloj", color: "#6a969c", tinta: "#ffffff", linea: "Su rutina y su compañía." },
  "Gustos e intereses": { icono: "estrella", color: "#f4d096", tinta: "#1f3338", linea: "Lo que disfruta, para elegir sus actividades." },
};

const respaldo: CategoriaCuestionario = { icono: "persona", color: "#6a969c", tinta: "#ffffff", linea: "" };

export function categoriaDe(modulo: string | undefined): CategoriaCuestionario {
  return (modulo && categorias[modulo]) || respaldo;
}

// Mensajes breves de ánimo al empezar una categoría nueva (según cuántas
// ya se completaron).
export function mensajeDeAnimo(completadas: number, total: number): string | null {
  if (completadas === 0) return null;
  const faltan = total - completadas;
  if (faltan === 1) return "¡Última parte! Ya casi terminamos.";
  if (completadas / total >= 0.5) return `¡Vas muy bien! Ya pasaste la mitad.`;
  const frases = ["¡Gracias! Cada respuesta nos ayuda a elegir mejor.", "¡Muy bien! Seguimos.", "Vas a tu ritmo, y se guarda solo."];
  return frases[(completadas - 1) % frases.length];
}
