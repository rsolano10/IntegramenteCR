import type { Guion } from "../tipos";

// GER-003 «Sentarse y levantarse de una silla». Fuente: ficha GER-003 del
// manual de gerontogimnasia (Tu actividad, Dosis, Si necesita una
// adaptación, Tené en cuenta, Para cerrar) y los bloques generales.
export const ger003: Guion = {
  codigo: "GER-003",
  revisado: true,
  frase: "Fuerza en las piernas para levantarse de la silla con seguridad.",
  icono: "figura-de-pie",
  etiquetas: ["3 a 5 veces", "1 minuto de descanso", "Silla firme"],
  cuidado: "Si hoy hay mareo o no se siente firme, déjenlo para otro día.",
  ejercicio: true,
  ayuda: [
    "Hacé el movimiento vos primero y esperá. No hace falta que lo recuerde.",
    "Puede doblar menos las rodillas y sostenerse del apoyo fijo.",
    "No tirés de sus brazos para levantarle.",
  ],
  escenas: [
    { tipo: "seguridad" },
    {
      tipo: "preparar",
      titulo: "Preparemos el lugar",
      nota: "Tocá cada cosa cuando esté lista.",
      items: [
        { icono: "silla", texto: "Silla firme, sin ruedas" },
        { icono: "apoyo", texto: "Apoyo fijo delante, si se lo indicaron" },
        { icono: "zapato", texto: "Calzado firme" },
        { icono: "suelo", texto: "Suelo despejado" },
        { icono: "luz", texto: "Buena luz" },
        { icono: "baston", texto: "Su bastón o andador cerca" },
      ],
    },
    { tipo: "video", titulo: "Mírenlo juntos", nota: "Pueden verlo las veces que quieran." },
    {
      tipo: "consigna",
      paso: { n: 1, de: 3 },
      titulo: "Sentarse bien",
      texto: "Sentate con los pies apoyados y un poco separados.",
      icono: "figura-sentada",
    },
    {
      tipo: "consigna",
      paso: { n: 2, de: 3 },
      titulo: "Levantarse",
      texto: "Inclinate un poco hacia adelante y levantate con tus apoyos.",
      icono: "figura-inclinada",
    },
    {
      tipo: "consigna",
      paso: { n: 3, de: 3 },
      titulo: "Volver a sentarse",
      texto: "Sentate despacio hasta tocar el asiento, sin dejarte caer.",
      icono: "figura-sentada",
    },
    {
      tipo: "repeticiones",
      titulo: "Ahora, de 3 a 5 veces",
      nota: "Tocá el círculo cada vez que se levante y se siente.",
      min: 3,
      max: 5,
      recordatorios: ["Despacio al sentarse.", "Los pies bien apoyados.", "Respirá con normalidad.", "Usá el apoyo cuando lo necesités.", "Si duele o marea, paramos."],
    },
    { tipo: "descanso", titulo: "Un minuto de descanso", segundos: 60, texto: "Sentados, respirando tranquilos." },
    { tipo: "sentir", titulo: "¿Cómo se siente ahora?" },
    { tipo: "cierre", texto: "Levantarse y sentarse con control, con la ayuda de siempre.", dato: true },
  ],
};
