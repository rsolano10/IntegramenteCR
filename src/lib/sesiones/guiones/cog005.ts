import type { Guion, Opcion } from "../tipos";

// COG-005 «Organicemos una salida conocida». Fuente: el recurso COG-005 del
// manual cognitivo (pasos, materiales y la indicación por etapa de «¿Para
// quién?»).

const general: Opcion[] = [
  { id: "llaves", texto: "Las llaves", icono: "llaves" },
  { id: "plata", texto: "Plata para el pasaje", icono: "plata" },
  { id: "celular", texto: "El celular", icono: "celular" },
  { id: "sueter", texto: "Un suéter", icono: "sueter" },
  { id: "lentes", texto: "Los lentes", icono: "lentes" },
  { id: "sombrilla", texto: "La sombrilla", icono: "sombrilla" },
];

export const cog005: Guion = {
  codigo: "COG-005",
  revisado: true,
  frase: "Imaginamos juntos una salida y organizamos los pasos, sin salir de casa.",
  icono: "mapa",
  etiquetas: ["10 a 15 minutos", "Sin materiales", "Para conversar"],
  ayuda: ["Hacé preguntas cortas, de una en una.", "Si no se le ocurre nada, dale dos opciones para elegir.", "No corrijás: lo importante es conversar."],
  ayudaPorEtapa: {
    preventivo: "Pedile que proponga más pasos o más cosas para llevar.",
    dcl: "Pedile que proponga más pasos o más cosas para llevar.",
    leve: "Preguntas breves y tu guía en cada paso.",
    moderada: "Acompañá de cerca. Si el tema le angustia, cambien de salida o de tema.",
  },
  escenas: [
    {
      tipo: "elegir",
      clave: "salida",
      titulo: "¿A dónde vamos?",
      nota: "Elijan juntos una salida conocida, que le guste.",
      opciones: [
        { id: "familiar", texto: "Visitar a un familiar", icono: "casa", dicho: "visitar a un familiar" },
        { id: "parque", texto: "Ir al parque", icono: "parque", dicho: "ir al parque" },
        { id: "iglesia", texto: "Ir a la iglesia", icono: "iglesia", dicho: "ir a la iglesia" },
        { id: "feria", texto: "Ir a la feria", icono: "mercado", dicho: "ir a la feria" },
        { id: "cita", texto: "Una cita médica", icono: "doctor", dicho: "ir a una cita médica" },
      ],
      libre: "Otra salida",
    },
    {
      tipo: "decir",
      titulo: "Para empezar",
      frase: "Pensemos que vamos a {salida}. ¿Qué prepararíamos antes de salir?",
      icono: "conversar",
      nota: "Con calma. No hay apuro ni respuestas malas.",
    },
    {
      tipo: "lista",
      clave: "llevar",
      titulo: "¿Qué llevaríamos?",
      nota: "Tocá lo que vaya diciendo. Si no se le ocurre, mostrale las opciones.",
      segun: "salida",
      minimo: 1,
      pista: "Dale dos opciones: «¿Llevamos la sombrilla o el suéter?».",
      libre: "Otra cosa",
      sugerencias: {
        familiar: [
          { id: "regalo", texto: "Un detalle para regalar", icono: "regalo" },
          { id: "llaves", texto: "Las llaves", icono: "llaves" },
          { id: "plata", texto: "Plata para el pasaje", icono: "plata" },
          { id: "celular", texto: "El celular", icono: "celular" },
          { id: "sueter", texto: "Un suéter", icono: "sueter" },
          { id: "lentes", texto: "Los lentes", icono: "lentes" },
        ],
        parque: [
          { id: "sombrero", texto: "Un sombrero", icono: "sombrero" },
          { id: "botella", texto: "Agua", icono: "botella" },
          { id: "pan", texto: "Algo de comer", icono: "pan" },
          { id: "sombrilla", texto: "La sombrilla", icono: "sombrilla" },
          { id: "llaves", texto: "Las llaves", icono: "llaves" },
          { id: "celular", texto: "El celular", icono: "celular" },
        ],
        iglesia: [
          { id: "biblia", texto: "La Biblia o el rosario", icono: "biblia" },
          { id: "plata", texto: "Plata para la ofrenda", icono: "plata" },
          { id: "sueter", texto: "Un suéter", icono: "sueter" },
          { id: "lentes", texto: "Los lentes", icono: "lentes" },
          { id: "llaves", texto: "Las llaves", icono: "llaves" },
          { id: "sombrilla", texto: "La sombrilla", icono: "sombrilla" },
        ],
        feria: [
          { id: "bolso", texto: "Bolsas para las compras", icono: "bolso" },
          { id: "plata", texto: "Plata", icono: "plata" },
          { id: "sombrero", texto: "Un sombrero", icono: "sombrero" },
          { id: "botella", texto: "Agua", icono: "botella" },
          { id: "llaves", texto: "Las llaves", icono: "llaves" },
          { id: "celular", texto: "El celular", icono: "celular" },
        ],
        cita: [
          { id: "cedula", texto: "La cédula", icono: "cedula" },
          { id: "pastillas", texto: "Sus medicinas", icono: "pastillas" },
          { id: "lentes", texto: "Los lentes", icono: "lentes" },
          { id: "plata", texto: "Plata para el pasaje", icono: "plata" },
          { id: "celular", texto: "El celular", icono: "celular" },
          { id: "sueter", texto: "Un suéter", icono: "sueter" },
        ],
        otra: general,
      },
    },
    {
      tipo: "ordenar",
      clave: "pasos",
      titulo: "¿Qué haríamos primero?",
      frase: "¿Qué haríamos primero? ¿Y qué seguiría después?",
      nota: "Tocá los pasos en el orden que diga. Con dos o tres alcanza.",
      minimo: 2,
      pista: "«Podríamos empezar por vestirnos. ¿Qué haríamos después?»",
      items: [
        { id: "vestirnos", texto: "Vestirnos", icono: "ropa" },
        { id: "arreglarnos", texto: "Arreglarnos", icono: "peine" },
        { id: "alistar", texto: "Alistar lo que llevamos", icono: "bolso" },
        { id: "avisar", texto: "Avisar que vamos", icono: "telefono" },
        { id: "cerrar", texto: "Cerrar la casa", icono: "puerta" },
        { id: "bus", texto: "Ir a la parada", icono: "bus" },
      ],
    },
    {
      tipo: "decir",
      titulo: "¿Y si cambia algo?",
      frase: "¿Y si estuviera lloviendo? ¿Qué cambiaría?",
      icono: "lluvia",
      otras: ["¿Y si hiciera mucho sol?", "¿Y si fuéramos de noche?", "¿Y si fuéramos con alguien más?"],
      nota: "Conversen sobre lo que cambiaría. Cualquier idea vale.",
    },
    {
      tipo: "repaso",
      titulo: "Nuestro plan",
      nota: "Repásenlo juntos. No hace falta que lo recuerde después.",
      partes: [
        { etiqueta: "Vamos a", clave: "salida" },
        { etiqueta: "Llevamos", clave: "llevar" },
        { etiqueta: "Los pasos", clave: "pasos" },
      ],
    },
    { tipo: "cierre", texto: "Planear juntos, con calma, también es salir un poco." },
  ],
};
