import type { Escena, Guion, Item } from "../tipos";
import type { NombreIcono } from "../iconos";

// Gerontogimnasia: todas las sesiones siguen el mismo arco (cuándo parar →
// preparar → video → consignas → el trabajo → descanso → cómo se siente →
// cierre), con su preparación, sus consignas, su dosis y sus recordatorios.
// Fuente: las fichas GER del manual de gerontogimnasia (Tu actividad, Dosis,
// Si necesita una adaptación, Tené en cuenta, Para cerrar).

interface Ejercicio {
  codigo: string;
  frase: string;
  icono: NombreIcono;
  etiquetas: string[];
  cuidado: string;
  ayuda: string[];
  antes?: Escena[];
  preparar: Item[];
  consignas: { titulo: string; texto: string; icono: NombreIcono }[];
  trabajo: Escena;
  descanso: number;
  cierre: string;
}

const consejoBase = "Hacé el movimiento vos primero y esperá. No hace falta que lo recuerde.";

function ejercicio(e: Ejercicio): Guion {
  return {
    codigo: e.codigo,
    revisado: false,
    frase: e.frase,
    icono: e.icono,
    etiquetas: e.etiquetas,
    cuidado: e.cuidado,
    ejercicio: true,
    ayuda: [consejoBase, ...e.ayuda],
    escenas: [
      { tipo: "seguridad" },
      ...(e.antes ?? []),
      { tipo: "preparar", titulo: "Preparemos el lugar", nota: "Tocá cada cosa cuando esté lista.", items: e.preparar },
      { tipo: "video", titulo: "Mírenlo juntos", nota: "Pueden verlo las veces que quieran." },
      ...e.consignas.map((c, i): Escena => ({ tipo: "consigna", paso: { n: i + 1, de: e.consignas.length }, ...c })),
      e.trabajo,
      { tipo: "descanso", titulo: e.descanso >= 60 ? "Un minuto de descanso" : "Un descanso corto", segundos: e.descanso, texto: "Sentados, respirando tranquilos." },
      { tipo: "sentir", titulo: "¿Cómo se siente ahora?" },
      { tipo: "cierre", texto: e.cierre, dato: true },
    ],
  };
}

const calzado: Item = { icono: "zapato", texto: "Calzado firme" };
const suelo: Item = { icono: "suelo", texto: "Suelo despejado" };
const sillaDescanso: Item = { icono: "silla", texto: "Una silla para descansar" };
const respirar = "Respirá con normalidad.";

export const ger001 = ejercicio({
  codigo: "GER-001",
  frase: "Fuerza en los muslos, sentado y con calma.",
  icono: "figura-rodilla",
  etiquetas: ["5 por pierna", "Sentado", "Silla con respaldo"],
  cuidado: "Si la rodilla duele o tuvo una cirugía, sigan lo que les indicaron.",
  ayuda: ["Puede hacer un movimiento más corto, sin peso."],
  preparar: [
    { icono: "silla", texto: "Silla firme con respaldo" },
    { icono: "zapato", texto: "Pies apoyados en el suelo" },
    { icono: "luz", texto: "Buena luz" },
  ],
  consignas: [
    { titulo: "Sentarse cómodo", texto: "Sentate con la espalda cómoda.", icono: "figura-sentada" },
    { titulo: "Estirar", texto: "Estirá una rodilla sin trabarla ni levantar el muslo.", icono: "figura-rodilla" },
    { titulo: "Bajar", texto: "Bajá despacio y cambiá de pierna.", icono: "figura-sentada" },
  ],
  trabajo: {
    tipo: "repeticiones",
    titulo: "5 veces con cada pierna",
    nota: "Tocá el círculo cada vez que estire y baje.",
    min: 5,
    max: 5,
    lados: true,
    recordatorios: ["Sin trabar la rodilla.", "Bajá despacio.", respirar, "Si duele, paramos."],
  },
  descanso: 45,
  cierre: "Un movimiento cómodo y controlado es un buen comienzo.",
});

export const ger002 = ejercicio({
  codigo: "GER-002",
  frase: "Levantar la rodilla, como al empezar a caminar.",
  icono: "figura-rodilla-arriba",
  etiquetas: ["5 por lado", "Sentado", "Silla firme"],
  cuidado: "Si siente dolor en la ingle o tiene cuidados de cadera, no lo hagan.",
  ayuda: ["Basta con despegar apenas el pie del suelo, sin peso."],
  preparar: [
    { icono: "silla", texto: "Silla firme" },
    { icono: "zapato", texto: "Los dos pies en el suelo" },
    { icono: "luz", texto: "Buena luz" },
  ],
  consignas: [
    { titulo: "Tronco firme", texto: "Mantené el tronco firme.", icono: "figura-sentada" },
    { titulo: "Levantar", texto: "Levantá un poco una rodilla, sin echarte hacia atrás.", icono: "figura-rodilla-arriba" },
    { titulo: "Cambiar", texto: "Apoyá el pie y cambiá de lado.", icono: "figura-sentada" },
  ],
  trabajo: {
    tipo: "repeticiones",
    titulo: "5 veces de cada lado",
    nota: "Tocá el círculo cada vez que suba y apoye.",
    min: 5,
    max: 5,
    lados: true,
    recordatorios: ["El tronco derecho.", "Solo un poco hacia arriba.", respirar, "Sin apuro."],
  },
  descanso: 45,
  cierre: "Acompañá el movimiento sin apurarlo.",
});

export const ger004 = ejercicio({
  codigo: "GER-004",
  frase: "Fuerza y equilibrio para subir una grada con seguridad.",
  icono: "figura-escalon",
  etiquetas: ["2 a 3 subidas", "Con pasamanos", "De pie"],
  cuidado: "Solo con un escalón fijo y pasamanos. Nunca un banquito suelto.",
  ayuda: ["Si así lo autorizaron, pueden practicar junto al escalón sin subir."],
  preparar: [
    { icono: "escalon", texto: "Escalón fijo y antideslizante" },
    { icono: "apoyo", texto: "Pasamanos firme" },
    calzado,
    suelo,
  ],
  consignas: [
    { titulo: "Acercarse", texto: "Acercá los pies al escalón y tomá el pasamanos.", icono: "figura-de-pie" },
    { titulo: "Subir", texto: "Subí un pie y después el otro.", icono: "figura-escalon" },
    { titulo: "Bajar", texto: "Bajá como te enseñaron en fisioterapia.", icono: "figura-de-pie" },
  ],
  trabajo: {
    tipo: "repeticiones",
    titulo: "De 2 a 3 subidas",
    nota: "Tocá el círculo en cada subida. Descansen después de cada una.",
    min: 2,
    max: 3,
    recordatorios: ["Primero, la estabilidad.", "Bien agarrado del pasamanos.", "Despacio al bajar.", "Descansen antes de la siguiente."],
  },
  descanso: 60,
  cierre: "En cada cambio de nivel, la estabilidad va primero.",
});

export const ger005 = ejercicio({
  codigo: "GER-005",
  frase: "Equilibrio sobre una pierna, siempre bien agarrado.",
  icono: "figura-un-pie",
  etiquetas: ["3 a 5 segundos", "2 por lado", "Con baranda"],
  cuidado: "Con los ojos abiertos, sin distracciones y con un apoyo firme.",
  ayuda: ["Puede dejar la punta del pie apoyada en el suelo."],
  preparar: [{ icono: "apoyo", texto: "Baranda fija" }, sillaDescanso, calzado, suelo],
  consignas: [
    { titulo: "Agarrarse", texto: "Sostenete con las dos manos del apoyo.", icono: "figura-de-pie" },
    { titulo: "Despegar", texto: "Despegá un pie apenas del suelo.", icono: "figura-un-pie" },
    { titulo: "Cambiar", texto: "Apoyalo y cambiá de lado.", icono: "figura-de-pie" },
  ],
  trabajo: {
    tipo: "tiempo",
    modo: "sostener",
    titulo: "Dos veces de cada lado",
    nota: "Sostengan de 3 a 5 segundos. Puede bajar el pie antes.",
    segundos: 5,
    intentos: 2,
    lados: true,
    recordatorios: ["Bien agarrado.", "Mirá al frente.", respirar],
  },
  descanso: 60,
  cierre: "Un apoyo adecuado forma parte del ejercicio.",
});

export const ger006 = ejercicio({
  codigo: "GER-006",
  frase: "Equilibrio con un pie adelante, sin que los pies se toquen.",
  icono: "figura-tandem",
  etiquetas: ["5 segundos", "2 intentos", "Con baranda"],
  cuidado: "No caminen ni suelten el apoyo, aunque salga fácil.",
  ayuda: ["Pueden dejar los pies más separados."],
  preparar: [{ icono: "apoyo", texto: "Baranda fija" }, { icono: "suelo", texto: "Espacio despejado" }, calzado, sillaDescanso],
  consignas: [
    { titulo: "Agarrarse", texto: "Sujetá el apoyo con las dos manos.", icono: "figura-de-pie" },
    { titulo: "Adelantar", texto: "Adelantá un pie, con los pies un poco separados.", icono: "figura-tandem" },
    { titulo: "Volver", texto: "Sostené la posición y volvé a abrir los pies.", icono: "figura-de-pie" },
  ],
  trabajo: {
    tipo: "tiempo",
    modo: "sostener",
    titulo: "Dos veces con cada pie adelante",
    nota: "Sostengan 5 segundos. Pueden volver antes.",
    segundos: 5,
    intentos: 2,
    lados: true,
    recordatorios: ["Bien agarrado.", "Los pies no tienen que tocarse.", respirar],
  },
  descanso: 60,
  cierre: "La posición más estrecha no es siempre la más adecuada.",
});

export const ger007 = ejercicio({
  codigo: "GER-007",
  frase: "Caminar rodeando marcas, con giros amplios.",
  icono: "figura-camina",
  etiquetas: ["30 a 60 segundos", "1 recorrido", "Espacio amplio"],
  cuidado: "Las marcas van fuera del camino, nunca debajo de los pies.",
  ayuda: ["Pueden hacer menos giros y dejar más espacio.", "Caminá a su lado y mostrale el camino."],
  preparar: [
    { icono: "marcas", texto: "Marcas visibles, fuera del camino" },
    { icono: "suelo", texto: "Recorrido amplio y plano" },
    calzado,
    { icono: "baston", texto: "Su bastón o andador, si lo usa" },
  ],
  consignas: [
    { titulo: "Mirar el camino", texto: "Miren juntos dónde empieza y dónde termina.", icono: "marcas" },
    { titulo: "Caminar", texto: "Caminá rodeando las marcas, con giros amplios.", icono: "figura-camina" },
    { titulo: "Descansar", texto: "Al terminar, descansá antes de repetir.", icono: "silla" },
  ],
  trabajo: {
    tipo: "tiempo",
    modo: "recorrido",
    titulo: "Un recorrido",
    nota: "De 30 a 60 segundos. Tocá el círculo al llegar.",
    segundos: 60,
    minimo: 30,
    intentos: 1,
    recordatorios: ["Giros amplios.", "Sin apuro.", "Mirá el camino."],
  },
  descanso: 60,
  cierre: "Un recorrido claro permite concentrarse en caminar.",
});

export const ger008 = ejercicio({
  codigo: "GER-008",
  frase: "Fuerza a los lados de la cadera, para caminar más firme.",
  icono: "figura-lado",
  etiquetas: ["5 por lado", "Con apoyo", "Banda si se la indicaron"],
  cuidado: "Usen la banda solo si se la indicaron. Si le quita equilibrio, sin banda.",
  ayuda: ["Pueden hacerlo sin banda y con un movimiento corto."],
  preparar: [{ icono: "apoyo", texto: "Apoyo fijo" }, { icono: "banda", texto: "Banda, solo si se la indicaron" }, calzado, suelo],
  consignas: [
    { titulo: "Agarrarse", texto: "Sujetá el apoyo y mantené el tronco derecho.", icono: "figura-de-pie" },
    { titulo: "Separar", texto: "Separá un poco una pierna, sin inclinarte.", icono: "figura-lado" },
    { titulo: "Volver", texto: "Volvé despacio y cambiá de lado.", icono: "figura-de-pie" },
  ],
  trabajo: {
    tipo: "repeticiones",
    titulo: "5 veces de cada lado",
    nota: "Tocá el círculo cada vez que separe y vuelva.",
    min: 5,
    max: 5,
    lados: true,
    recordatorios: ["El tronco derecho.", "Solo un poco hacia el lado.", "Volvé despacio.", respirar],
  },
  descanso: 60,
  cierre: "La resistencia se elige según la persona, no según el color de la banda.",
});

export const ger009 = ejercicio({
  codigo: "GER-009",
  frase: "Tocar la pelota con un pie, coordinando la vista y el equilibrio.",
  icono: "figura-pelota",
  etiquetas: ["3 por pie", "Soporte fijo", "Con alguien entrenado"],
  cuidado: "Solo con el montaje del profesional y alguien entrenado al lado.",
  ayuda: ["Acerquen la pelota y hagan menos toques.", "Mostrale un pie a la vez.", "Si no controla la pelota, usen una marca plana, según su plan."],
  antes: [
    {
      tipo: "cuidados",
      titulo: "Antes de este ejercicio",
      nota: "Este ejercicio no se hace por cuenta propia.",
      items: [
        { icono: "apoyo", texto: "Se aprende en persona y se hace con alguien entrenado al lado." },
        { icono: "pelota", texto: "No se apoya peso sobre la pelota ni se hace rodar." },
        { icono: "silla", texto: "Nunca una silla con ruedas como soporte." },
        { icono: "rechazo", texto: "Si el material se mueve, paren." },
      ],
    },
  ],
  preparar: [
    { icono: "apoyo", texto: "Soporte fijo revisado por fisioterapia" },
    { icono: "pelota", texto: "Pelota sujeta por el profesional" },
    { icono: "suelo", texto: "Suelo antideslizante" },
  ],
  consignas: [
    { titulo: "El montaje", texto: "Usá el soporte fijo y la pelota que preparó el profesional.", icono: "figura-de-pie" },
    { titulo: "Tocar", texto: "Un pie firme; con el otro, tocá la pelota suavemente.", icono: "figura-pelota" },
    { titulo: "Cambiar", texto: "Apoyá los dos pies antes de cambiar. Sin hacer círculos.", icono: "figura-de-pie" },
  ],
  trabajo: {
    tipo: "repeticiones",
    titulo: "3 toques con cada pie",
    nota: "Tocá el círculo en cada toque. Paren antes si hace falta.",
    min: 3,
    max: 3,
    lados: true,
    recordatorios: ["Sin cargar peso en la pelota.", "Despacio.", "Los dos pies antes de cambiar."],
  },
  descanso: 60,
  cierre: "La superficie y el apoyo se revisan antes de empezar.",
});

// La introducción no es un ejercicio: es el video para ver juntos.
export const ger010: Guion = {
  codigo: "GER-010",
  revisado: false,
  frase: "Conozcan qué es la gerontogimnasia antes de empezar los ejercicios.",
  icono: "corazon",
  etiquetas: ["Un video", "Sin ejercicios", "Para ver juntos"],
  ayuda: ["Pausá el video y explicá una idea a la vez.", "Podés verlo vos primero y contarle lo principal, sin pedirle que lo recuerde."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Preparemos el momento",
      nota: "Tocá cada cosa cuando esté lista.",
      items: [
        { icono: "silla", texto: "Un lugar cómodo" },
        { icono: "luz", texto: "Buena luz" },
        { icono: "volumen", texto: "Volumen para escuchar bien" },
      ],
    },
    { tipo: "video", titulo: "Veámoslo juntos", nota: "Pueden pausarlo cuando quieran." },
    {
      tipo: "cuidados",
      titulo: "Lo importante",
      items: [
        { icono: "corazon", texto: "El cuerpo y la mente trabajan juntos." },
        { icono: "figura-sentada", texto: "Cada ejercicio se adapta a cada persona." },
        { icono: "apoyo", texto: "Siempre con los apoyos que les indicaron." },
      ],
    },
    { tipo: "cierre", texto: "Cada persona tiene su ritmo. Avanzamos paso a paso.", dato: true },
  ],
};
