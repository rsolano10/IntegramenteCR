// Contenido editable del home (Landing.tsx). Todo lo que depende de
// material real del negocio vive acá: las secciones que se alimentan de
// una lista vacía NO se muestran — nunca se publican testimonios, fotos o
// biografías inventadas en un sitio de salud.

export const contacto = {
  telefono: "+506 8343 5772",
  // Número de WhatsApp en formato internacional sin "+" (para wa.me).
  whatsapp: "50683464703",
  instagram: "https://instagram.com/integramentecr",
  correo: "info@integramente.com",
};

export interface MiembroEquipo {
  nombre: string;
  rol: string;
  bio: string | null;
  // Ruta pública de la foto (ej. "/equipo/guiselle.jpg" dentro de public/).
  // Sin foto se muestran las iniciales.
  foto: string | null;
}

export const equipo: MiembroEquipo[] = [
  {
    nombre: "Dra. Guiselle Solano",
    rol: "Neuropsicología",
    bio: null,
    foto: null,
  },
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
    descripcion: "Un plan semanal de actividades preparado según el perfil de su familiar, para realizar en casa con total independencia.",
    incluye: [
      "Plan semanal personalizado",
      "Actividades paso a paso, con videos y materiales",
      "Recordatorios por WhatsApp y en su calendario",
      "Respuestas rápidas para las dudas más frecuentes",
    ],
  },
  orientado: {
    lema: "Con una profesional a su lado",
    descripcion: "Todo lo del programa Autoguiado, más una profesional que revisa cómo les fue cada semana y ajusta el plan junto con ustedes.",
    incluye: [
      "Todo lo del programa Autoguiado",
      "Una profesional que revisa cada semana",
      "Ajustes al plan según cómo les fue",
      "Mensajes directos con su profesional",
      "Consulta inicial de orientación",
    ],
  },
};

export const preguntas: { p: string; r: string }[] = [
  {
    p: "¿Cuánto cuesta?",
    r: "Crear el perfil y completar el cuestionario es gratis. Al terminar, usted ve los dos programas con su precio, Autoguiado y Orientado, y elige el que más le convenga. No se cobra nada sin avisarle antes.",
  },
  {
    p: "¿Necesito un diagnóstico?",
    r: "No. El programa sirve si hay un diagnóstico, si solo ha notado algunos cambios o si desea cuidar la memoria de forma preventiva. IntegraMente no diagnostica: si algo en el cuestionario lo amerita, le recomendamos una valoración profesional.",
  },
  {
    p: "¿Sirve si mi familiar no usa celular?",
    r: "Sí. La aplicación la usa la persona que acompaña: ahí ve las actividades del día, cómo realizarlas y registra cómo les fue. Si su familiar sí usa celular, puede tener su propia vista sencilla, con letra grande y una cosa a la vez.",
  },
  {
    p: "¿Quién prepara el plan?",
    r: "Una profesional de nuestro equipo clínico revisa el perfil y prepara la semana con actividades de nuestra biblioteca, elegidas según los gustos de su familiar y lo que es seguro para su movilidad. En el programa Orientado, además, revisa cada semana cómo les fue y ajusta el plan.",
  },
  {
    p: "¿Qué pasa si hay una emergencia?",
    r: "Ante una emergencia médica, llame al 9-1-1. Dentro de la aplicación, el botón SOS le orienta según lo que esté pasando (una caída, un cambio repentino, si no encuentra a su familiar) y le permite avisar a su profesional de inmediato.",
  },
  {
    p: "¿Quién ve mi información?",
    r: "Solamente su familia vinculada y el equipo clínico de IntegraMente. La información se usa para preparar y ajustar el plan. Puede leer el detalle en Privacidad y datos.",
  },
  {
    p: "¿Puedo cambiar de programa?",
    r: "Sí. Escríbanos desde la aplicación o a info@integramente.com y con gusto lo coordinamos.",
  },
];
