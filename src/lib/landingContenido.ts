// Contenido editable del home (Landing.tsx). Todo lo que depende de
// material real del negocio vive acá: las secciones que se alimentan de
// una lista vacía NO se muestran — nunca se publican testimonios, fotos o
// biografías inventadas en un sitio de salud.

import { WHATSAPP_EQUIPO } from "./whatsapp";

export const contacto = {
  telefono: "+506 8343 5772",
  // Número de WhatsApp en formato internacional sin "+" (para wa.me).
  whatsapp: WHATSAPP_EQUIPO,
  instagram: "https://instagram.com/integramentecr",
  correo: "info@integramente.com",
};

export interface MiembroEquipo {
  // null mientras no tengamos el nombre: se muestra el área como título.
  nombre: string | null;
  rol: string;
  // Ruta pública de la foto (ej. "/equipo/guiselle.jpg" dentro de public/).
  // Sin foto se muestra un retrato provisional con el color del área.
  foto: string | null;
}

// Fotos y nombres provisionales: reemplazar `foto` (y `nombre`) por los
// reales cuando estén. El orden es el orden en que aparecen.
export const equipo: MiembroEquipo[] = [
  { nombre: "Dra. Guiselle Solano", rol: "Directora del programa", foto: null },
  { nombre: null, rol: "Neuropsicología", foto: null },
  { nombre: null, rol: "Nutrición", foto: null },
  { nombre: null, rol: "Gerontogimnasia", foto: null },
  { nombre: null, rol: "Fisioterapia", foto: null },
  { nombre: null, rol: "Experto del programa", foto: null },
];

export interface Testimonio {
  cita: string;
  nombre: string;
  relacion: string; // ej. "Hija de doña Rosa, 78 años"
}

// Vacío hasta tener testimonios reales con permiso de publicarlos.
export const testimonios: Testimonio[] = [];

// Textos de los programas para el home (los de la app hablan a quien ya
// completó el cuestionario; acá hablamos a quien todavía no empezó).
// El precio sale de programas.ts / planTiers, la misma fuente de la app.
export const programasHome: Record<"autoguiado" | "orientado", { lema: string; descripcion: string; incluye: string[] }> = {
  autoguiado: {
    lema: "A su propio ritmo",
    descripcion:
      "Un plan semanal de actividades para realizar en casa, preparado y ajustado por nuestros profesionales de la salud según el perfil de tu familiar.",
    incluye: [
      "Plan semanal personalizado",
      "Revisión y ajuste por profesionales de la salud",
      "Actividades paso a paso, con videos y materiales",
      "Recordatorios por WhatsApp y en tu calendario",
    ],
  },
  orientado: {
    lema: "Con el equipo de salud a su lado",
    descripcion:
      "Todo lo del Autoguiado, más una evaluación neuropsicológica, sesiones en vivo con nuestros profesionales y el acompañamiento cercano de un experto del programa.",
    incluye: [
      "Todo lo del programa Autoguiado",
      "Evaluación neuropsicológica profesional",
      "Sesiones en vivo, presenciales o virtuales",
      "Con profesionales en neuropsicología, nutrición y fisioterapia",
      "Acompañamiento cercano de un experto del programa",
      "Seguimiento de los resultados",
    ],
  },
};

// Las grandes áreas del programa (sección "Cuatro áreas…" del home).
export const areas: { icono: string; t: string; frase: string; ejemplos: string[]; from: string; to: string }[] = [
  {
    icono: "cerebro",
    t: "Neuropsicología",
    frase: "Estimulación de la memoria, la atención y el lenguaje.",
    ejemplos: ["Actividades de memoria y atención", "Reminiscencia y música"],
    from: "#89c0c6",
    to: "#3f6a70",
  },
  {
    icono: "manzana",
    t: "Nutrición",
    frase: "Una alimentación que cuida el cerebro y la energía del día.",
    ejemplos: ["Comidas sencillas y nutritivas", "Hidratación diaria"],
    from: "#e8b5a1",
    to: "#c0664f",
  },
  {
    icono: "fisio",
    t: "Gerontogimnasia",
    frase: "Ejercicio adaptado para mantenerse en movimiento.",
    ejemplos: ["Movilidad sentado", "Caminatas con música"],
    from: "#fadfa9",
    to: "#d9a441",
  },
  {
    icono: "equilibrio",
    t: "Fisioterapia",
    frase: "Fuerza, equilibrio y prevención de caídas.",
    ejemplos: ["Ejercicios de equilibrio", "Movilidad segura en casa"],
    from: "#ece3c4",
    to: "#b7a06d",
  },
];

export const preguntas: { p: string; r: string }[] = [
  {
    p: "¿Cuál es la diferencia entre los programas?",
    r: "En los dos, profesionales de la salud revisan y ajustan las actividades. El Orientado suma una evaluación neuropsicológica profesional, sesiones en vivo (presenciales o virtuales) con nuestro equipo y el acompañamiento cercano de un experto del programa que da seguimiento a los resultados.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "Crear el perfil y completar el cuestionario es gratis. El Autoguiado tiene un precio mensual fijo, que ves en la sección de programas. Para conocer el precio del Orientado, escribinos por WhatsApp y te contamos los detalles. No se cobra nada sin avisarte antes.",
  },
  {
    p: "¿Necesito un diagnóstico?",
    r: "No. El programa sirve si hay un diagnóstico, si solo notaste algunos cambios o si querés cuidar la memoria de forma preventiva. IntegraMente no diagnostica: si algo en el cuestionario lo amerita, te recomendamos una valoración profesional.",
  },
  {
    p: "¿Sirve si mi familiar no usa celular?",
    r: "Sí. La aplicación la usa la persona que acompaña: ahí ve las actividades del día, cómo realizarlas y registra cómo les fue. Si tu familiar sí usa celular, puede tener su propia vista sencilla, con letra grande y una cosa a la vez.",
  },
  {
    p: "¿Quién prepara el plan?",
    r: "Nuestro equipo de salud, con profesionales en neuropsicología, nutrición y fisioterapia, revisa el perfil y prepara la semana con actividades elegidas según los gustos de tu familiar y lo que es seguro para su movilidad. En los dos programas, el plan se revisa y ajusta según cómo les va.",
  },
  {
    p: "¿Qué pasa si hay una emergencia?",
    r: "Ante una emergencia médica, llamá al 9-1-1. Dentro de la aplicación, el botón SOS te orienta según lo que esté pasando (una caída, un cambio repentino, si no encontrás a tu familiar) y te permite avisarle al equipo de inmediato.",
  },
  {
    p: "¿Quién ve mi información?",
    r: "Solamente tu familia vinculada y el equipo clínico de IntegraMente. La información se usa para preparar y ajustar el plan. Podés leer el detalle en Privacidad y datos.",
  },
  {
    p: "¿Puedo cambiar de programa?",
    r: "Sí. Escribinos por WhatsApp o a info@integramente.com y con gusto lo coordinamos.",
  },
];
