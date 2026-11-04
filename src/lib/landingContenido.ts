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
  // Pendiente de confirmar con IntegraMente: no había URL de Facebook en el repo.
  facebook: "https://www.facebook.com/integramentecr",
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
// orden en que aparecen: en computadora, Guiselle, Nancy y María Laura en la
// primera fila y Pablo y Silvia en la segunda.
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
    nombre: "María Laura Garita Quesada",
    area: "Facilitadora de estimulación cognitiva",
    descripcion: "Coordina las actividades y la comunicación con las familias, acompaña las sesiones de estimulación cognitiva.",
    foto: foto("maria-laura"),
  },
  {
    nombre: "Pablo Jiménez Meza",
    area: "Gerontogimnasia y fisioterapia",
    descripcion: "Desarrolla propuestas de movimiento y ejercicios de doble tarea, que combinan actividad física y retos cognitivos.",
    foto: foto("pablo-jimenez-meza"),
  },
  {
    nombre: "Silvia Obregón Aguilar",
    area: "Nutrición",
    descripcion: "Desarrolla orientaciones de alimentación e hidratación para personas mayores.",
    foto: foto("silvia-obregon"),
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

// Texto literal de IntegraMente. Los párrafos de una respuesta van separados
// por \n (la tarjeta los respeta).
export const preguntas: { p: string; r: string }[] = [
  {
    p: "¿Cuál es la diferencia entre los programas?",
    r: "El Autoguiado te ofrece actividades semanales explicadas paso a paso para saber qué hacer en casa.\nCon sesiones profesionales, además evaluamos qué capacidades necesita trabajar tu familiar, lo acompañamos en las sesiones y revisamos cómo evoluciona. Recibís un informe de seguimiento y ajustamos el programa según sus necesidades.",
  },
  {
    p: "¿Este programa es adecuado para mi familiar si tiene deterioro cognitivo o demencia?",
    r: "Sí. El Autoguiado ofrece actividades con recomendaciones para adaptarlas y acompañar a tu familiar en casa. Con sesiones profesionales, además definimos qué necesita trabajar y ajustamos el programa según su evolución.",
  },
  {
    p: "¿Y si no tiene un diagnóstico?",
    r: "También puede participar. IntegraMente en Casa ofrece actividades para quienes desean mantenerse activos y cuidar su salud cerebral. Podés usarla para vos o para acompañar a un familiar.",
  },
  {
    p: "¿Para qué necesita mi familiar una valoración neuropsicológica?",
    r: "Para saber cómo están su memoria, atención y otras habilidades que usa a diario. Así elegimos qué trabajar y cómo aprovechar lo que conserva para apoyar su autonomía. También nos permite comparar cómo evoluciona y ajustar el programa.\nPara el programa con sesiones, debe tener menos de un año. Aceptamos valoraciones de otros profesionales o podés contratarla con nosotros por separado.",
  },
  {
    p: "¿Cómo ayuda el cuestionario inicial a elegir mis actividades?",
    r: "Nos ayuda a conocerte: tus intereses, tu rutina y los apoyos que necesitás. Así orientamos las actividades para que se ajusten a vos o a tu familiar y ayuden a mantenerse activo y cuidar la salud cerebral.\nSi sos profesional, podés recomendar la aplicación a las familias como complemento del trabajo que realizás en consulta.",
  },
  {
    p: "¿Mi familiar necesita saber usar el celular?",
    r: "No. Vos podés abrir las actividades y acompañarlo siguiendo las instrucciones. Tu familiar participa sin tener que manejar la aplicación.",
  },
  {
    p: "¿Tengo que estar presente en todas las actividades?",
    r: "Depende de la autonomía de tu familiar y de la actividad. Algunas propuestas requieren acompañamiento o apoyos específicos. Revisá siempre las indicaciones antes de comenzar; en el programa con sesiones te orientamos según sus necesidades.",
  },
  {
    p: "Me recomiendan mantener activo mi cerebro o el de mi familiar. ¿Cómo me ayuda la aplicación?",
    r: "IntegraMente en Casa te ofrece actividades semanales basadas en neurociencia, con instrucciones sencillas para hacerlas en casa. Así podés crear una rutina para vos o tu familiar, sin tener que pensar cada día qué hacer.",
  },
  {
    p: "¿Qué hago si una actividad le cuesta o no quiere hacerla?",
    r: "Hacé una pausa y probá en otro momento, sin presionarlo. Podés consultar el asistente de la aplicación para recibir orientación general. Si necesitás apoyo profesional, escribinos: en el Autoguiado podés solicitar una consulta adicional con costo; en el programa con sesiones, lo revisamos durante el seguimiento.",
  },
  {
    p: "¿Cómo sabré cómo va mi familiar?",
    r: "En el Autoguiado podés registrar las actividades realizadas. Con sesiones profesionales, además revisamos su rendimiento y las dificultades que presenta, compartimos los resultados en informes de seguimiento y ajustamos los objetivos del programa.",
  },
];
