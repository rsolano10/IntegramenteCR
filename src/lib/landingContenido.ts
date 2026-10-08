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

export const preguntas: { p: string; r: string }[] = [
  {
    p: "¿Cuánto cuesta?",
    r: "Crear el perfil y completar el cuestionario es gratis. Al terminar ves los dos programas con su precio — Autoguiado y Orientado — y elegís el que te sirva. No se cobra nada sin avisarte antes.",
  },
  {
    p: "¿Necesito un diagnóstico?",
    r: "No. El programa sirve tanto si hay un diagnóstico como si solo notaste cambios, o si querés cuidar la memoria de forma preventiva. IntegraMente no diagnostica: si algo en el cuestionario lo amerita, te recomendamos una valoración profesional.",
  },
  {
    p: "¿Sirve si mi familiar no usa celular?",
    r: "Sí. La app la usa quien acompaña: ahí ve las actividades del día, cómo hacerlas y registra cómo les fue. Si la persona sí usa celular, puede tener su propia vista simple, con letra grande y una cosa a la vez.",
  },
  {
    p: "¿Quién arma el plan?",
    r: "Una profesional del equipo clínico revisa el perfil y arma la semana con actividades de nuestra biblioteca, elegidas según sus intereses y lo que es seguro para su movilidad. En el programa Orientado, además, revisa cómo les fue cada semana y ajusta el plan.",
  },
  {
    p: "¿Qué pasa si hay una emergencia?",
    r: "Ante una urgencia médica, llamá al 9-1-1. Dentro de la app, el botón SOS te orienta según lo que esté pasando (una caída, un cambio repentino, si no la encontrás) y te permite avisarle a tu profesional al instante.",
  },
  {
    p: "¿Quién ve mi información?",
    r: "Solo tu familia vinculada y el equipo clínico de IntegraMente. Se usa para armar y ajustar el plan. Podés leer el detalle en Privacidad y datos.",
  },
  {
    p: "¿Puedo cambiar de programa?",
    r: "Sí. Escribinos desde la app o a info@integramente.com y lo coordinamos.",
  },
];
