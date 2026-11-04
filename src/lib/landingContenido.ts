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
export const guiaProfesionales = "/medicos";

// Videos del home (y del correo de bienvenida). youtubeId null = todavía no
// está grabado: se muestra la miniatura y, al tocarla, "muy pronto".
// TODO(IntegraMente): cargar el id de YouTube de cada video cuando esté listo
// (lo que va después de "watch?v=" en el enlace).
export const videos = {
  introduccion: { youtubeId: null as string | null, titulo: "Conocé IntegraMente en Casa" },
  asiDeFacil: { youtubeId: null as string | null, titulo: "Así de fácil se usa" },
  profesionales: { youtubeId: null as string | null, titulo: "Conocé a nuestro equipo" },
};

// Prueba social. Solo datos verificables: un valor null NO se publica (en
// desarrollo se ve marcado como TODO para saber dónde va).
export const pruebaSocial: { valor: string | null; etiqueta: string }[] = [
  // TODO(IntegraMente): cantidad real de personas atendidas por el equipo.
  { valor: null, etiqueta: "personas atendidas por nuestro equipo" },
  // TODO(IntegraMente): años de trabajo clínico del equipo.
  { valor: null, etiqueta: "años de experiencia clínica" },
  // TODO(IntegraMente): programa o canal de la aparición en TV nacional (ej. "Teletica, Buen Día").
  { valor: null, etiqueta: "Visto en televisión nacional" },
];

// Fotos reales de las sesiones (abril 2026), en public/sesiones/ en webp con
// respaldo jpg. Vacío = la galería no se muestra.
// TODO(IntegraMente): pasar las fotos de las sesiones de abril 2026.
export const fotosSesiones: { webp: string; jpg: string; alt: string }[] = [];

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
  // Cargo adicional, si hace falta mostrarlo aparte del área.
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
    area: "Directora clínica",
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
    area: "Coordinadora del programa",
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
// Cada tarjeta lleva una imagen (las de IntegraMente, assets/img-home/) con
// el color del área encima en degradé translúcido: casi sólido detrás del
// título (contraste ≥ 3:1 en el peor caso) y más transparente arriba, para
// que se vea la imagen.
export interface FotoArea {
  webp: string;
  jpg: string;
  alt: string;
}

export const areas: {
  icono: string;
  t: string;
  destacado?: string;
  frase: string;
  tituloEtiquetas: string;
  etiquetas: string[];
  fondo: string;
  tinta: string;
  chip: string;
  foto: FotoArea;
}[] = [
  {
    icono: "cerebro",
    t: "Estimulación cognitiva",
    frase: "Actividades para trabajar distintas capacidades cognitivas y conectarlas con la vida cotidiana.",
    tituloEtiquetas: "Trabaja",
    etiquetas: ["Atención", "Memoria", "Lenguaje", "Planificación", "Orientación", "Habilidades visoespaciales"],
    fondo: "#3f6a70",
    tinta: "#ffffff",
    chip: "#dce8e9",
    foto: {
      webp: "/areas/estimulacion-cognitiva.webp",
      jpg: "/areas/estimulacion-cognitiva.jpg",
      alt: "Una señora arma un rompecabezas de piezas de colores sobre la mesa.",
    },
  },
  {
    icono: "equilibrio",
    t: "Gerontogimnasia",
    frase: "Ejercicios que combinan movimiento y retos cognitivos, según las capacidades de cada persona.",
    tituloEtiquetas: "Trabaja",
    etiquetas: ["Fuerza", "Equilibrio", "Coordinación", "Sentado o de pie"],
    fondo: "#f4d096",
    tinta: "#1f3338",
    chip: "#f9e6c2",
    foto: {
      webp: "/areas/gerontogimnasia.webp",
      jpg: "/areas/gerontogimnasia.jpg",
      alt: "Una señora estira el brazo durante una clase de movimiento, con otras personas mayores detrás.",
    },
  },
  {
    icono: "manzana",
    t: "Nutrición para personas mayores",
    frase: "Orientaciones prácticas sobre alimentación e hidratación para la vida cotidiana.",
    tituloEtiquetas: "Incluye",
    etiquetas: ["Alimentación variada", "Hábitos cotidianos", "Organización de comidas", "Hidratación"],
    fondo: "#ebe6ce",
    tinta: "#1f3338",
    chip: "#ece5cb",
    foto: {
      webp: "/areas/nutricion.webp",
      jpg: "/areas/nutricion.jpg",
      alt: "Una señora con delantal corta verduras frescas en su cocina, junto a su plan de nutrición.",
    },
  },
];

// Texto literal de IntegraMente. Los párrafos de una respuesta van separados
// por \n (la tarjeta los respeta).
// `video`: la respuesta lleva un botón que reproduce ese video del home.
// Las cinco primeras responden la duda principal (si es fácil de usar);
// las demás son el texto literal de IntegraMente.
export const preguntas: { p: string; r: string; video?: "video-asi-de-facil" }[] = [
  {
    p: "¿Es difícil de usar para mí o mi familiar?",
    r: "No. Cada día ves qué actividad toca y la seguís paso a paso, con una consigna por pantalla.",
    video: "video-asi-de-facil",
  },
  {
    p: "¿Necesito saber de tecnología?",
    r: "No. Si usás WhatsApp, podés usar IntegraMente en Casa. Todo se hace tocando botones grandes y claros.",
  },
  {
    p: "¿Puede ayudarme un familiar?",
    r: "Sí. Un familiar puede crear la cuenta, responder el cuestionario y acompañar cada actividad. También puede invitarte para que tengas tu propio acceso.",
  },
  {
    p: "¿Funciona en el celular?",
    r: "Sí. Funciona en el celular, la tablet y la computadora, desde el navegador. No hace falta descargar nada.",
  },
  {
    p: "¿Qué pasa después de la semana gratis?",
    r: "La semana gratis empieza cuando nuestro equipo aprueba tu cuenta. Al terminar, te escribimos por WhatsApp para contarte las opciones y que decidas si querés seguir. No hay cobros automáticos.",
  },
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
