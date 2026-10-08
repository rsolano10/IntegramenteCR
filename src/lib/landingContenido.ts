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
      "Todo lo del Autoguiado, más sesiones en vivo con nuestros profesionales y el acompañamiento cercano de un experto del programa.",
    incluye: [
      "Todo lo del programa Autoguiado",
      "Sesiones en vivo, presenciales o virtuales",
      "Con profesionales en neuropsicología, nutrición y fisioterapia",
      "Acompañamiento cercano de un experto del programa",
      "Seguimiento de los resultados",
    ],
  },
};

export const preguntas: { p: string; r: string }[] = [
  {
    p: "¿Cuál es la diferencia entre los programas?",
    r: "En los dos, profesionales de la salud revisan y ajustan las actividades. El Orientado suma sesiones en vivo, presenciales o virtuales, con profesionales en neuropsicología, nutrición y fisioterapia, y el acompañamiento cercano de un experto del programa que da seguimiento a los resultados.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "Crear el perfil y completar el cuestionario es gratis. Al terminar ves los dos programas con su precio, Autoguiado y Orientado, y elegís el que más te convenga. No se cobra nada sin avisarte antes.",
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
    r: "Ante una emergencia médica, llamá al 9-1-1. Dentro de la aplicación, el botón SOS te orienta según lo que esté pasando (una caída, un cambio repentino, si no encontrás a tu familiar) y te permite avisar a tu profesional de inmediato.",
  },
  {
    p: "¿Quién ve mi información?",
    r: "Solamente tu familia vinculada y el equipo clínico de IntegraMente. La información se usa para preparar y ajustar el plan. Podés leer el detalle en Privacidad y datos.",
  },
  {
    p: "¿Puedo cambiar de programa?",
    r: "Sí. Escribinos desde la aplicación o a info@integramente.com y con gusto lo coordinamos.",
  },
];
