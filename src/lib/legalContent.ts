// Textos legales oficiales de IntegraMente en Casa (Condiciones de uso y
// Política de privacidad). Al cambiar algo de fondo en estos textos o en
// los consentimientos, subir VERSION_LEGAL en src/lib/versionLegal.ts:
// todas las cuentas vuelven a aceptar al entrar.
//
// Los datos del responsable que todavía no están cargados (cédula jurídica,
// domicilio) quedan en null y no se muestran.

import { FECHA_LEGAL, VERSION_LEGAL } from "./versionLegal";

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const RESPONSABLE = {
  nombre: "IntegraMente",
  servicio: "IntegraMente en Casa",
  cedulaJuridica: null as string | null,
  domicilio: null as string | null,
  correo: "programas.integramente@gmail.com",
  whatsapp: "+506 8346 4703",
};

const identificacion = [
  `${RESPONSABLE.nombre}`,
  RESPONSABLE.cedulaJuridica ? `cédula jurídica ${RESPONSABLE.cedulaJuridica}` : null,
  RESPONSABLE.domicilio ? `con domicilio en ${RESPONSABLE.domicilio}` : null,
]
  .filter(Boolean)
  .join(", ");

const vigencia = `Vigente desde el ${FECHA_LEGAL} · versión ${VERSION_LEGAL}`;

export const legalContent: Record<"condiciones" | "privacidad" | "emergencias", LegalDoc> = {
  condiciones: {
    title: "Condiciones de uso",
    updated: vigencia,
    intro: `Estas condiciones regulan el uso de ${RESPONSABLE.servicio}, el servicio digital de ${identificacion} (en adelante, «IntegraMente»). Al crear una cuenta y aceptarlas, las aceptás en tu nombre y, si sos familiar o persona cuidadora, en el marco del apoyo que le das a la persona participante.`,
    sections: [
      {
        heading: "1. Qué es el servicio",
        body: [
          "IntegraMente en Casa es un programa de estimulación cognitiva, física y funcional en el hogar para personas mayores, con contenido educativo, actividades guiadas, un plan semanal y, según el programa contratado, acompañamiento de un equipo profesional.",
          "No es un servicio de diagnóstico ni de emergencias. No sustituye la consulta médica, la valoración neuropsicológica presencial ni ningún tratamiento. No indica, cambia ni suspende medicamentos. Ante una urgencia, llamá al 9-1-1.",
          "Las clasificaciones y sugerencias que muestra la plataforma (por ejemplo, el nivel de las actividades) son herramientas de apoyo para el equipo profesional, que es quien decide. No son un diagnóstico.",
        ],
      },
      {
        heading: "2. Quién puede usarlo",
        body: [
          "El servicio es para personas mayores de 18 años. Hay tres tipos de cuenta: familiar o persona cuidadora (administra el programa de la persona participante), persona participante (la persona mayor, con acceso a sus actividades) y profesional (integrantes del equipo de IntegraMente).",
          "Si sos familiar o persona cuidadora, declarás que contás con el acuerdo de la persona participante o que la representás o apoyás legalmente, y que vas a respetar su voluntad. Las personas con discapacidad, incluidas las que viven con deterioro cognitivo, conservan su capacidad jurídica (Ley 9379): siempre que sea posible, la persona participante decide sobre su participación.",
          "Sos responsable de que la información que ingresás sea veraz y esté actualizada.",
        ],
      },
      {
        heading: "3. Tu cuenta",
        body: [
          "Tu cuenta es personal. No compartas tu contraseña; si sospechás que alguien más la usa, cambiala y avisanos.",
          "Podemos suspender o desactivar una cuenta que se use en contra de estas condiciones, que ponga en riesgo a otras personas o a la plataforma, o cuando lo pidas. Una cuenta sin actividad durante el plazo que fija la clínica pasa a estado inactivo y se puede reactivar.",
        ],
      },
      {
        heading: "4. Programas, prueba y pagos",
        body: [
          "Ofrecemos distintos programas (por ejemplo, Autoguiado y programas con sesiones profesionales). Las características y precios vigentes se informan en el sitio y por WhatsApp antes de contratar.",
          "La semana de prueba gratis empieza cuando el equipo aprueba la cuenta. Al terminar, te contactamos para que decidas si querés seguir. No hay cobros automáticos ni renovaciones sin tu confirmación.",
          "La valoración neuropsicológica se contrata aparte y tiene su propio precio.",
          "Tus derechos como persona consumidora (Ley 7472) se mantienen en todo momento, incluido el derecho a recibir información clara antes de pagar.",
        ],
      },
      {
        heading: "5. Uso de inteligencia artificial",
        body: [
          "Algunas funciones usan inteligencia artificial: Clara, la asistente que responde por texto y voz; la voz natural que lee las actividades; y herramientas que ayudan al equipo a resumir el caso y ajustar el plan. Cada una se activa solo con tu autorización, que podés retirar en Mis datos y permisos.",
          "Clara es un programa, no una persona. Puede equivocarse, no da diagnósticos ni indica medicamentos, y ante señales de riesgo muestra la guía de emergencia y deriva al equipo. Lo que genera la IA para el equipo siempre lo revisa una persona antes de usarse.",
        ],
      },
      {
        heading: "6. Uso aceptable y contenido",
        body: [
          "Las actividades, videos, guiones, juegos e ilustraciones son de IntegraMente o de sus autores y se ofrecen para el uso personal en el cuidado de la persona participante. No se pueden copiar, vender ni distribuir fuera de la plataforma.",
          "No uses la plataforma para fines ilegales, para dañar a otras personas o para intentar acceder a información de otras cuentas.",
        ],
      },
      {
        heading: "7. Responsabilidad",
        body: [
          "Las actividades están pensadas para hacerse con seguridad en casa, respetando las indicaciones de cada una (cuándo parar, supervisión necesaria, adaptaciones). La familia o persona cuidadora es responsable de la supervisión durante las actividades.",
          "El equipo profesional responde por sus decisiones clínicas conforme a las normas de su colegio profesional. IntegraMente no responde por daños derivados de usar el servicio en contra de estas condiciones o de las indicaciones de seguridad, ni por fallas de servicios de terceros (internet, WhatsApp, el teléfono), sin perjuicio de los derechos que la ley te reconoce.",
        ],
      },
      {
        heading: "8. Privacidad",
        body: ["El tratamiento de tus datos se rige por la Política de privacidad, que forma parte de estas condiciones."],
      },
      {
        heading: "9. Cambios",
        body: [
          "Si cambiamos estas condiciones de forma relevante, te lo vamos a mostrar al entrar a la app y vas a tener que aceptarlas de nuevo para seguir usándola. Si no estás de acuerdo, podés cerrar tu cuenta.",
        ],
      },
      {
        heading: "10. Ley aplicable y contacto",
        body: [
          "Estas condiciones se rigen por las leyes de la República de Costa Rica. Cualquier diferencia se intentará resolver primero de forma directa y amistosa; si no es posible, la resolverán los tribunales competentes de Costa Rica.",
          `Contacto: ${RESPONSABLE.correo} · WhatsApp ${RESPONSABLE.whatsapp}.`,
        ],
      },
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    updated: vigencia,
    intro:
      "Cuidamos información sensible de personas mayores y de sus familias. Esta política explica qué datos tratamos, para qué, con quién los compartimos, cuánto tiempo los guardamos y cómo ejercer tus derechos, conforme a la Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley 8968) y su reglamento.",
    sections: [
      {
        heading: "1. Responsable",
        body: [
          `El responsable de la base de datos es ${identificacion}. Para cualquier consulta sobre tus datos: ${RESPONSABLE.correo} o WhatsApp ${RESPONSABLE.whatsapp}.`,
        ],
      },
      {
        heading: "2. Qué datos tratamos",
        body: [
          "De la cuenta: nombre, correo electrónico, teléfono de WhatsApp (si lo das), tipo de cuenta y las autorizaciones que diste.",
          "De la persona participante: nombre, edad, forma de trato preferida, intereses e historia de vida que la familia decida contar, y las respuestas del cuestionario sobre memoria, ánimo, comunicación, movilidad, alimentación y autonomía.",
          "Del programa: el plan semanal, el registro de cada actividad, las evaluaciones semanales, los mensajes, los pedidos de ayuda y los avisos de riesgo.",
          "De las funciones de inteligencia artificial, solo si las autorizás: las conversaciones con Clara y un resumen breve para recordar lo importante.",
          "Datos técnicos mínimos para la seguridad: fecha y hora de acceso, navegador o dispositivo usado al aceptar, y la bitácora de cambios.",
          "Los datos de salud son datos sensibles. Nadie está obligado a darlos, pero sin ellos no podemos armar un plan seguro y adaptado.",
        ],
      },
      {
        heading: "3. Para qué los usamos y con qué base",
        body: [
          "Para prestar el programa: armar, ajustar y dar seguimiento al plan, mostrar las actividades, enviar recordatorios y detectar señales de riesgo para mostrar la guía de emergencia. Base: tu consentimiento expreso y el servicio que contrataste.",
          "Para que el equipo profesional acompañe el caso, bajo secreto profesional. Base: tu consentimiento expreso.",
          "Para la seguridad de la plataforma y para cumplir obligaciones legales, como conservar el expediente de salud. Base: obligación legal.",
          "Para mejorar el programa con estadísticas agregadas que no identifican a nadie.",
          "No vendemos datos personales, no los usamos para publicidad y no se usan para entrenar modelos de inteligencia artificial.",
        ],
      },
      {
        heading: "4. Tus autorizaciones",
        body: [
          "Te pedimos cada autorización por separado y guardamos la prueba de cada una (fecha, versión y texto aceptado). Son necesarias: aceptar estas condiciones, el tratamiento de los datos de salud, el uso de los proveedores tecnológicos y, para la familia, la declaración sobre su rol.",
          "Son opcionales y las podés activar o retirar cuando quieras en Mis datos y permisos: Clara (asistente con IA), la IA para el equipo, la voz natural y los recordatorios por WhatsApp. Retirar una autorización no afecta lo hecho antes, y el programa sigue funcionando sin ellas.",
        ],
      },
      {
        heading: "5. Inteligencia artificial",
        body: [
          "Clara (ElevenLabs): responde dudas por texto o voz. Recibe tu nombre, la actividad que estás haciendo y un resumen de conversaciones anteriores. Es un programa, no una persona; no diagnostica ni indica medicamentos y tiene reglas de seguridad para derivar al equipo ante cualquier riesgo.",
          "IA para el equipo (Google Gemini): ayuda a preparar el resumen del cuestionario, el panorama del caso y ajustes del plan. Recibe los datos mínimos necesarios, sin el nombre completo ni números de identificación. Siempre una persona del equipo revisa y decide; la IA no toma decisiones por sí sola.",
          "Voz natural (ElevenLabs): recibe solo el texto de la consigna que se va a leer.",
          "Lo que genera la IA para el equipo queda identificado como generado con IA.",
        ],
      },
      {
        heading: "6. Con quién se comparten",
        body: [
          "Con el equipo profesional de IntegraMente asignado al caso. Cada persona del equipo firmó un compromiso de confidencialidad y accede solo a lo que necesita según su rol.",
          "Entre las cuentas del mismo caso: la familia administradora y la persona participante ven el plan y las actividades. La familia nunca ve las notas internas ni las clasificaciones del equipo.",
          "El equipo puede leer las conversaciones con el asistente marcadas para revisión: cuando se derivó algo al equipo, ante señales de riesgo, cuando el filtro de seguridad reemplazó una respuesta o cuando calificaste una respuesta como que no te sirvió.",
          "Con proveedores que tratan datos por cuenta nuestra, solo para prestar el servicio y con obligación de confidencialidad: Supabase (base de datos y archivos, Estados Unidos), Vercel (sitio web, Estados Unidos), Resend (correos, Estados Unidos) y, si los autorizás, ElevenLabs (Clara y voz, Estados Unidos), Google (Gemini, Estados Unidos) y Meta (WhatsApp, Estados Unidos). Estas transferencias fuera de Costa Rica se hacen con tu consentimiento.",
          "Con autoridades, solo cuando una ley o una orden judicial lo exija, o ante un riesgo grave para la vida o la integridad de una persona.",
        ],
      },
      {
        heading: "7. Cuánto tiempo los guardamos",
        body: [
          "Expediente de salud (cuestionario, planes, registros, notas del equipo): mientras la cuenta esté activa y después durante el plazo que exige la normativa de salud aplicable.",
          "Mensajes del programa: 1 año. Conversaciones con el asistente: 2 años. Registro de recordatorios de WhatsApp y mensajes recibidos: 1 año. Borradores del cuestionario sin terminar: 6 meses. Datos enviados a la IA para ajustar planes: se vacían a los 2 años.",
          "Pruebas de consentimiento y bitácora de cambios: se conservan como respaldo legal, incluso después de cerrar la cuenta.",
          "Al vencer cada plazo, los datos se eliminan de forma automática.",
        ],
      },
      {
        heading: "8. Tus derechos",
        body: [
          "Tenés derecho a acceder a tus datos, a corregirlos, a pedir que se eliminen y a oponerte a un uso determinado. También podés retirar tus autorizaciones en cualquier momento.",
          "Podés descargar una copia de tus datos y enviar tus solicitudes desde Mis datos y permisos, o escribir a " + RESPONSABLE.correo + ". Respondemos en un máximo de 5 días hábiles.",
          "Al pedir la eliminación, borramos lo que no forma parte del expediente de salud (conversaciones, memoria del asistente, teléfono, avisos) y, si lo pedís, cerramos la cuenta. El expediente se conserva bloqueado durante el plazo legal y después se elimina.",
          "Si considerás que no atendimos bien tu solicitud, podés acudir a la Agencia de Protección de Datos de los Habitantes (PRODHAB).",
        ],
      },
      {
        heading: "9. Seguridad",
        body: [
          "La información viaja cifrada, cada cuenta accede solo a lo que le corresponde según su rol (con reglas que se verifican en la base de datos), las claves de los proveedores nunca llegan al navegador y cada cambio en planes, perfiles y alertas queda en una bitácora con autor y fecha.",
          "Si ocurriera un incidente de seguridad que afecte tus datos, te lo vamos a comunicar junto con las medidas tomadas, y lo vamos a informar a la PRODHAB en los plazos que fija el reglamento.",
        ],
      },
      {
        heading: "10. Cambios en esta política",
        body: ["Si la cambiamos de forma relevante, te lo vamos a mostrar al entrar a la app y te vamos a pedir que la aceptes de nuevo."],
      },
    ],
  },
  emergencias: {
    title: "Emergencias",
    updated: "Borrador · agosto 2026",
    intro:
      "IntegraMente en Casa no es un servicio de emergencias. Estos son los mismos recursos que se muestran dentro de la aplicación cuando el filtro de seguridad detecta una señal de riesgo.",
    sections: [
      {
        heading: "Riesgo inmediato",
        body: ["Llamá al 9-1-1 ante cualquier emergencia médica, caída con signos de alarma, o riesgo inmediato para la persona."],
      },
      {
        heading: "Crisis emocional",
        body: [
          "1322 · Aquí Estoy — línea de apoyo emocional en crisis, gratuita y disponible las 24 horas en Costa Rica.",
        ],
      },
      {
        heading: "Maltrato o abandono",
        body: [
          "CONAPAM (Consejo Nacional de la Persona Adulta Mayor) — línea de denuncia y orientación para personas adultas mayores en Costa Rica.",
        ],
      },
      {
        heading: "Pendiente de validación",
        body: [
          "Los números y líneas anteriores deben verificarse con la Dirección Clínica antes de publicarse como definitivos: horarios de atención, cobertura y redacción exacta del texto de derivación siguen en revisión.",
        ],
      },
    ],
  },
};
