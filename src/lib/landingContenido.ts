// Contenido editable del home (Landing.tsx). Todo lo que depende de
// material real del negocio vive acá: las secciones que se alimentan de
// una lista vacía NO se muestran — nunca se publican testimonios, fotos o
// biografías inventadas en un sitio de salud.

import { WHATSAPP_EQUIPO, waLink } from "./whatsapp";

export const contacto = {
  telefono: "+506 8343 5772",
  // Número de WhatsApp en formato internacional sin "+" (para wa.me).
  whatsapp: WHATSAPP_EQUIPO,
  instagram: "https://instagram.com/integramentecr",
  correo: "info@integramente.com",
};

// Guía para profesionales de la salud (GuiaProfesionales.tsx). Se abre en
// otra pestaña y se puede imprimir o guardar como PDF.
export const guiaProfesionales = "/guia-profesionales";

// Precio de la valoración neuropsicológica cuando se hace con IntegraMente.
// Se contrata aparte: nunca se muestra como precio del programa.
export const precioValoracion = "₡170.000";

// Cada botón de WhatsApp del home abre el chat con su mensaje ya escrito.
export const whatsappHome = {
  general: waLink(WHATSAPP_EQUIPO, "Hola, quiero información sobre IntegraMente en Casa."),
  programaSesiones: waLink(
    WHATSAPP_EQUIPO,
    "Hola, me interesa el programa con sesiones profesionales. Quisiera conocer las opciones, los costos y cómo presentar mi valoración neuropsicológica.",
  ),
  profesional: waLink(
    WHATSAPP_EQUIPO,
    "Hola, soy profesional de la salud y me gustaría conocer más sobre IntegraMente en Casa para recomendarlo a mis pacientes.",
  ),
  accesoPaciente: waLink(WHATSAPP_EQUIPO, "Hola, ya soy paciente de IntegraMente y quisiera saber cómo acceder a mi cuenta."),
};

export interface MiembroEquipo {
  nombre: string;
  // Cargo dentro del programa, si lo tiene (ej. "Directora clínica del programa").
  cargo?: string;
  area: string;
  descripcion: string;
  // Foto en public/equipo/, en webp con respaldo jpg. Sin foto se muestra
  // un retrato provisional con el color del área.
  foto: FotoEquipo | null;
}

export interface FotoEquipo {
  webp: string;
  jpg: string;
  // Tamaño real del archivo, para reservar el espacio y evitar saltos.
  ancho: number;
  alto: number;
}

// Todas las fotos del equipo son horizontales, de 1600 × 1067.
const foto = (archivo: string): FotoEquipo => ({
  webp: `/equipo/${archivo}.webp`,
  jpg: `/equipo/${archivo}.jpg`,
  ancho: 1600,
  alto: 1067,
});

// Nombres, grados y áreas tal como los indicó IntegraMente. El orden es el
// orden en que aparecen.
export const equipo: MiembroEquipo[] = [
  {
    nombre: "MSc. Guiselle Solano Asenjo",
    cargo: "Directora clínica del programa",
    area: "Neuropsicología",
    descripcion: "Dirige el enfoque clínico del programa y participa en la valoración y la intervención neuropsicológica.",
    foto: foto("guiselle-solano-asenjo"),
  },
  {
    nombre: "Nancy Navarro Araya",
    area: "Neuropsicología",
    descripcion: "Participa en las valoraciones neuropsicológicas y en la orientación de los objetivos de intervención.",
    foto: foto("nancy-navarro-araya"),
  },
  {
    nombre: "Silvia Obregón",
    area: "Nutrición",
    descripcion: "Desarrolla orientaciones de alimentación e hidratación para personas mayores.",
    foto: foto("silvia-obregon"),
  },
  {
    nombre: "Pablo Jiménez Meza",
    area: "Gerontogimnasia y fisioterapia",
    descripcion: "Desarrolla propuestas de movimiento y ejercicios de doble tarea, que combinan actividad física y retos cognitivos.",
    foto: foto("pablo-jimenez-meza"),
  },
  {
    // Apellidos pendientes de confirmar con IntegraMente.
    nombre: "María Laura",
    area: "Facilitadora de estimulación cognitiva",
    descripcion: "Acompaña la realización de actividades de estimulación cognitiva.",
    foto: foto("maria-laura"),
  },
];

export interface Testimonio {
  cita: string;
  nombre: string;
  relacion: string; // ej. "Hija de doña Rosa, 78 años"
}

// Vacío hasta tener testimonios reales con permiso de publicarlos.
export const testimonios: Testimonio[] = [];

// Textos de los programas para el home. Las dos tarjetas siguen el mismo
// orden: nombre, descripción, precio o presupuesto, beneficios, condiciones
// y botón. El precio del Autoguiado sale de programas.ts / planTiers, la
// misma fuente que usa la app.
export const programasHome = {
  autoguiado: {
    nombre: "Autoguiado",
    subtitulo: "Actividades para hacer en casa, a tu ritmo.",
    descripcion: "Un plan semanal con recursos seleccionados por nuestro equipo a partir de las respuestas sobre vos o tu ser querido.",
    incluye: [
      "Plan semanal de actividades.",
      "Recursos de estimulación cognitiva, movimiento y orientaciones de nutrición.",
      "Instrucciones paso a paso, videos y materiales.",
      "Registro de las actividades realizadas.",
    ],
    aclaracion: "No incluye sesiones profesionales ni valoración neuropsicológica.",
  },
  sesiones: {
    nombre: "Con sesiones profesionales",
    etiqueta: "En línea o presenciales",
    subtitulo: "Objetivos individualizados a partir de una valoración.",
    // Versión corta del texto del PO, para que la tarjeta mida lo mismo que
    // la del Autoguiado.
    descripcion: "Sesiones profesionales y actividades para el hogar, orientadas por una valoración neuropsicológica.",
    presupuesto: "Presupuesto según tu plan",
    incluye: [
      "Acceso a los recursos de la aplicación.",
      "Objetivos de intervención individualizados.",
      "Sesiones en línea o presenciales, según el plan contratado.",
      "Seguimiento de la evolución y ajustes del programa.",
    ],
  },
};

// Las áreas del programa (sección "Cuidamos la mente…" del home). Colores
// de la paleta oficial; `tinta` es el color del texto sobre ese fondo (nunca
// blanco sobre mostaza o beige).
export const areas: {
  icono: string;
  t: string;
  destacado?: string;
  frase: string;
  puntos: string[];
  fondo: string;
  tinta: string;
}[] = [
  {
    icono: "cerebro",
    t: "Estimulación cognitiva",
    frase: "Actividades para trabajar distintas capacidades cognitivas y conectarlas con la vida cotidiana.",
    puntos: ["Atención, memoria y lenguaje.", "Planificación, orientación y habilidades visoespaciales."],
    fondo: "#6a969c",
    tinta: "#ffffff",
  },
  {
    icono: "equilibrio",
    t: "Gerontogimnasia",
    frase: "Ejercicios que combinan movimiento y retos cognitivos, según las capacidades de cada persona.",
    puntos: ["Fuerza, equilibrio y coordinación.", "Propuestas sentadas o de pie, según corresponda."],
    fondo: "#f4d096",
    tinta: "#1f3338",
  },
  {
    icono: "manzana",
    t: "Nutrición para personas mayores",
    frase: "Orientaciones prácticas sobre alimentación e hidratación para la vida cotidiana.",
    puntos: ["Alimentación variada y hábitos cotidianos.", "Ideas para organizar comidas e hidratación."],
    fondo: "#ebe6ce",
    tinta: "#1f3338",
  },
];

export const preguntas: { p: string; r: string }[] = [
  {
    p: "¿Cuál es la diferencia entre los programas?",
    r: "El Autoguiado es un plan semanal de actividades para hacer en casa. El programa con sesiones suma encuentros profesionales, objetivos individualizados y seguimiento.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: `Crear tu cuenta es gratis. El Autoguiado tiene un precio mensual fijo y el programa con sesiones se presupuesta según tu plan. La valoración con IntegraMente cuesta ${precioValoracion} y se paga aparte.`,
  },
  {
    p: "¿El cuestionario inicial es una valoración neuropsicológica?",
    r: "No. Sirve para conocer el día a día y los intereses de la persona y elegir actividades. La valoración la hace un profesional y solo se pide para el programa con sesiones.",
  },
  {
    p: "¿Necesito un diagnóstico?",
    r: "No. La aplicación sirve con o sin diagnóstico. IntegraMente no diagnostica: si hace falta, te recomendamos una valoración.",
  },
  {
    p: "¿Sirve si mi familiar no usa celular?",
    r: "Sí. La aplicación la usa quien acompaña. Si tu familiar usa celular, también puede tener su propia vista, sencilla y con letra grande.",
  },
  {
    p: "¿Quién selecciona las actividades?",
    r: "Nuestro equipo, a partir de tus respuestas, intereses y necesidades.",
  },
  {
    p: "¿Qué pasa si hay una emergencia?",
    r: "Llamá al 9-1-1. En la aplicación, el botón SOS te orienta y te permite avisarle al equipo.",
  },
  {
    p: "¿Quién ve mi información?",
    r: "Solo tu familia vinculada y el equipo de IntegraMente. El detalle está en Privacidad y datos.",
  },
  {
    p: "¿Puedo cambiar de programa?",
    r: "Sí. Escribinos por WhatsApp y lo coordinamos.",
  },
];
