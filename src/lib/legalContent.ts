// Placeholder legal copy — first draft only, to be reviewed and replaced
// with real legal/clinical-governance text before launch.

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

export const legalContent: Record<"condiciones" | "privacidad" | "emergencias", LegalDoc> = {
  condiciones: {
    title: "Condiciones de uso",
    updated: "Borrador · agosto 2026",
    intro:
      "Estas condiciones describen cómo IntegraMente en Casa puede usarse. Es un primer borrador y todavía no ha sido revisado por asesoría legal.",
    sections: [
      {
        heading: "Qué es el servicio",
        body: [
          "IntegraMente en Casa es un servicio de educación, organización del cuidado y estimulación cognitiva adaptada, con acompañamiento profesional opcional según el plan contratado.",
          "No sustituye la consulta médica ni la valoración neuropsicológica presencial. No diagnostica, no interpreta pruebas clínicas y no indica ni modifica tratamientos o medicamentos.",
        ],
      },
      {
        heading: "Cuentas y roles",
        body: [
          "Cada cuenta pertenece a una persona (familiar administrador, persona participante o profesional) y su acceso se ajusta a lo que ese rol puede ver y hacer dentro de la plataforma.",
          "El familiar administrador es responsable de la exactitud de la información que ingresa sobre la persona participante.",
        ],
      },
      {
        heading: "Uso aceptable",
        body: [
          "La plataforma no debe usarse para reportar una emergencia médica: ante una urgencia, comunicate con los servicios de emergencia de tu país (ver la sección Emergencias).",
          "El contenido (planes, videos, estrategias) es de uso personal para el cuidado de la persona participante asociada a la cuenta.",
        ],
      },
      {
        heading: "Cambios en el servicio",
        body: [
          "Podemos ajustar funciones, precios o disponibilidad de modalidades con aviso previo razonable a las cuentas activas.",
        ],
      },
    ],
  },
  privacidad: {
    title: "Privacidad y datos",
    updated: "Borrador · agosto 2026",
    intro:
      "Cómo tratamos la información que ingresás. Este también es un borrador inicial, pendiente de revisión legal y de cumplimiento normativo.",
    sections: [
      {
        heading: "Qué datos recopilamos",
        body: [
          "Datos de la cuenta (nombre, correo), del perfil funcional de la persona participante (autonomía, movilidad, comprensión, intereses) y del uso del plan (registros de actividad, respuestas del asistente, alertas generadas).",
        ],
      },
      {
        heading: "Para qué los usamos",
        body: [
          "Para generar y ajustar el plan semanal, evaluar el filtro de seguridad, y — cuando corresponde según tu modalidad — compartir la información relevante con la profesional asignada.",
          "No vendemos datos personales a terceros ni los usamos para publicidad.",
        ],
      },
      {
        heading: "Con quién se comparte",
        body: [
          "Con la profesional asignada, solo si tu modalidad incluye seguimiento clínico o activaste el aviso automático en una alerta.",
          "Toda edición de plan, perfil o alerta queda registrada con autor, fecha y versión (bitácora de auditoría), visible para el equipo clínico responsable.",
        ],
      },
      {
        heading: "Tus opciones",
        body: [
          "Podés pedir una copia de tus datos o su eliminación escribiendo a info@integramente.com. La eliminación de datos clínicos activos puede requerir coordinación con tu profesional tratante.",
        ],
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
