import type { Guion, Opcion } from "../tipos";

// Cognición (COG-007 a COG-035). Fuente: el manual cognitivo (pasos,
// materiales, «Si necesita ayuda» y adaptación por etapa). La ayuda validada
// de cada recurso y su adaptación por etapa se muestran en «Ayuda» desde la
// ficha; acá van solo los consejos cortos que la ficha no trae.
// Las frases para decirle a la persona van en voseo.

const o = (id: string, texto: string, icono: Opcion["icono"], dicho?: string): Opcion => ({ id, texto, icono, dicho });

export const cog007: Guion = {
  codigo: "COG-007",
  revisado: true,
  frase: "Buscar alrededor cosas por su color, su forma o para qué sirven.",
  icono: "lupa",
  etiquetas: ["10 a 15 minutos", "Sin materiales", "Desde donde están"],
  ayuda: ["Orientá la búsqueda: «Miremos hacia la mesa» o «Busquemos cerca de la ventana»."],
  escenas: [
    {
      tipo: "elegir",
      clave: "pista",
      titulo: "¿Qué buscamos?",
      nota: "Elegí una pista con respuestas a la vista.",
      opciones: [o("color", "Un color", "flor"), o("forma", "Una forma", "pelota"), o("uso", "Para qué sirve", "silla")],
    },
    {
      tipo: "decir",
      si: { clave: "pista", es: ["color"] },
      titulo: "¿Lo ves?",
      frase: "¿Ves algo de color rojo?",
      otras: ["¿Y algo de color blanco?", "¿Algo verde?", "¿Algo azul?", "¿Algo amarillo?"],
      contar: "¡Lo encontró!",
      nota: "Puede señalarlo, nombrarlo o describirlo. No hace falta levantarse.",
    },
    {
      tipo: "decir",
      si: { clave: "pista", es: ["forma"] },
      titulo: "¿Lo ves?",
      frase: "¿Qué cosa tiene forma redonda?",
      otras: ["¿Y algo cuadrado?", "¿Algo largo?", "¿Algo que brille?"],
      contar: "¡Lo encontró!",
      nota: "Puede señalarlo, nombrarlo o describirlo. No hace falta levantarse.",
    },
    {
      tipo: "decir",
      si: { clave: "pista", es: ["uso"] },
      titulo: "¿Lo ves?",
      frase: "¿Qué sirve para sentarse?",
      otras: ["¿Qué sirve para tomar agua?", "¿Qué sirve para ver la hora?", "¿Qué sirve para guardar cosas?"],
      contar: "¡Lo encontró!",
      nota: "Puede señalarlo, nombrarlo o describirlo. No hace falta levantarse.",
    },
    { tipo: "cierre", texto: "Mirar con atención lo de siempre también es descubrir." },
  ],
};

export const cog008: Guion = {
  codigo: "COG-008",
  revisado: true,
  frase: "Separar objetos de la casa en grupos y descubrir qué tienen en común.",
  icono: "cajas",
  etiquetas: ["5 a 15 minutos", "Objetos de la casa", "En la mesa"],
  ayuda: ["Mostrá un ejemplo y dejá que siga colocando o señalando."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Busquemos los objetos",
      nota: "Limpios y fáciles de reconocer. Nada cortante, ni medicinas, ni piezas pequeñas.",
      items: [
        { icono: "ropa", texto: "Prendas de vestir" },
        { icono: "fruta", texto: "Frutas o verduras" },
        { icono: "cuchara", texto: "Utensilios seguros" },
      ],
    },
    {
      tipo: "elegir",
      clave: "regla",
      titulo: "¿Cómo los separamos?",
      opciones: [
        o("tipo", "Por lo que son", "cajas", "los alimentos de este lado y la ropa de este otro"),
        o("lugar", "Por dónde se guardan", "casa", "cada cosa según dónde la guardamos"),
        o("uso", "Por para qué sirven", "cuchara", "juntas las cosas que sirven para lo mismo"),
      ],
    },
    { tipo: "decir", titulo: "Contale la regla", frase: "Vamos a poner {regla}.", nota: "Mostrá un ejemplo si hace falta." },
    { tipo: "consigna", titulo: "A ordenar", texto: "Que vaya colocando o señalando cada objeto.", icono: "cajas", nota: "Sin apuro. Si se equivoca, no pasa nada." },
    {
      tipo: "decir",
      titulo: "Miremos los grupos",
      frase: "¿Qué tienen en común?",
      otras: ["¿Por qué van juntas?", "¿Se te ocurre otra manera de ordenarlas?"],
      nota: "Si fue fácil, cambien la regla y vuelvan a ordenar.",
    },
    { tipo: "cierre", texto: "Ordenar juntos también es pensar juntos." },
  ],
};

export const cog010: Guion = {
  codigo: "COG-010",
  revisado: true,
  frase: "Ubicar palabras en lugares de la casa con escenas divertidas, para recordarlas.",
  icono: "casa",
  etiquetas: ["10 a 15 minutos", "Sin materiales", "Con imaginación"],
  ayuda: ["Si necesita ayuda, contá parte de la escena y armenla juntos."],
  escenas: [
    {
      tipo: "ordenar",
      clave: "lugares",
      titulo: "Elijan el recorrido",
      nota: "Dos o tres lugares de una casa que conozca bien, en orden.",
      minimo: 2,
      items: [
        o("puerta", "La puerta", "puerta"),
        o("sala", "La sala", "silla"),
        o("cocina", "La cocina", "sarten"),
        o("cuarto", "El cuarto", "casa"),
        o("patio", "El patio", "parque"),
      ],
    },
    { tipo: "material", titulo: "Las palabras", nota: "Usen dos o tres, una en cada lugar." },
    {
      tipo: "consigna",
      titulo: "Una escena exagerada",
      texto: "Imaginen cada palabra en su lugar: enorme, moviéndose o haciendo ruido.",
      icono: "estrella",
      nota: "Por ejemplo, una naranja del tamaño del sillón.",
    },
    { tipo: "consigna", titulo: "Repasar", texto: "Recorran juntos los lugares y sus escenas, en el mismo orden.", icono: "casa" },
    {
      tipo: "decir",
      titulo: "Recorramos la casa",
      frase: "¿Qué habíamos imaginado en el primer lugar?",
      otras: ["¿Y en el segundo?", "¿Y en el último?"],
      nota: "Con calma, en su imaginación.",
    },
    { tipo: "repaso", titulo: "Nuestro recorrido", partes: [{ etiqueta: "Los lugares", clave: "lugares" }] },
    { tipo: "cierre", texto: "Una escena exagerada es difícil de olvidar." },
  ],
};

export const cog012: Guion = {
  codigo: "COG-012",
  revisado: true,
  frase: "Imaginar una situación y pensar juntos qué nos serviría llevar.",
  icono: "sombrilla",
  etiquetas: ["5 a 10 minutos", "Sin materiales", "Para conversar"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "situacion",
      titulo: "¿Qué imaginamos?",
      nota: "Una situación que le resulte conocida.",
      opciones: [
        o("lluvia", "Salir con lluvia", "lluvia", "salimos y está lloviendo"),
        o("playa", "Ir a la playa", "sol", "vamos a la playa"),
        o("frio", "Un día de frío", "sueter", "hace mucho frío"),
        o("medico", "Ir al médico", "doctor", "vamos al médico"),
      ],
    },
    {
      tipo: "decir",
      titulo: "Preguntale",
      frase: "Si {situacion}, ¿qué podríamos llevar?",
      nota: "Dale tiempo. Toda idea útil vale.",
      pista: "Dale dos opciones: «¿Una sombrilla o una toalla de baño?».",
    },
    { tipo: "material", titulo: "Opciones para ofrecer", nota: "Si necesita ayuda, ofrecé las dos de la columna de apoyo." },
    {
      tipo: "decir",
      titulo: "¿Para qué sirve?",
      frase: "¿Para qué nos serviría eso?",
      otras: ["¿Qué más llevaríamos?"],
      nota: "Comentá su elección: «Sí, eso nos ayuda».",
    },
    { tipo: "cierre", texto: "Pensar en lo que vamos a necesitar nos prepara para salir." },
  ],
};

export const cog013: Guion = {
  codigo: "COG-013",
  revisado: true,
  frase: "Escuchar el inicio de un refrán y recordar cómo sigue.",
  icono: "conversar",
  etiquetas: ["5 a 15 minutos", "Tarjetas en la app", "No hace falta hacerlas todas"],
  ayuda: ["Si no aparece, mostrá la frase completa y léanla juntos."],
  escenas: [
    { tipo: "material", titulo: "Los refranes", nota: "Leé el inicio y preguntá: «¿Cómo seguía?»." },
    {
      tipo: "decir",
      titulo: "Conversemos",
      frase: "¿Qué creés que significa?",
      otras: ["¿En qué situación lo usarías?", "¿Lo habías escuchado antes?", "¿Quién acostumbraba decirlo?"],
      nota: "Si surge un recuerdo, dejá que lo cuente.",
    },
    { tipo: "cierre", texto: "Los refranes guardan historias. Gracias por compartirlas." },
  ],
};

export const cog014: Guion = {
  codigo: "COG-014",
  revisado: true,
  frase: "Anotar un pendiente y revisarlo cada día, para no olvidarlo.",
  icono: "libreta",
  etiquetas: ["5 a 10 minutos", "Libreta o agenda", "Un poquito cada día"],
  ayuda: ["Acompañá la escritura, pero que participe."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Busquemos dónde anotar",
      nota: "Elijan un solo lugar para anotar.",
      items: [
        { icono: "libreta", texto: "Una libreta o agenda" },
        { icono: "lapiz", texto: "Un lápiz" },
        { icono: "celular", texto: "O el calendario del celular" },
      ],
    },
    { tipo: "decir", titulo: "Algo que se pasó", frase: "¿Hubo algo que querías hacer y se te pasó?", nota: "Elijan un solo ejemplo." },
    {
      tipo: "consigna",
      titulo: "Anotarlo",
      texto: "Escríbanlo en una frase corta, con cuándo hacerlo.",
      icono: "libreta",
      nota: "Por ejemplo: «Mañana, después del desayuno, llamar a mi hermana».",
    },
    {
      tipo: "elegir",
      clave: "momento",
      titulo: "¿Cuándo la revisamos?",
      nota: "Un momento fijo de cada día.",
      opciones: [o("desayuno", "Después del desayuno", "taza"), o("almuerzo", "Después del almuerzo", "plato"), o("noche", "Antes de dormir", "luna")],
    },
    { tipo: "consigna", titulo: "A la vista", texto: "Dejen la agenda en un lugar visible.", icono: "libreta", nota: "Al hacer el pendiente, márquenlo." },
    { tipo: "consigna", titulo: "En unos días", texto: "Conversen: ¿nos ayudó tenerlo anotado?", icono: "conversar" },
    { tipo: "cierre", texto: "Anotar y revisar nos ayuda a organizarnos." },
  ],
};

export const cog015: Guion = {
  codigo: "COG-015",
  revisado: true,
  frase: "Unir un pendiente con algo que hacemos todos los días.",
  icono: "nota",
  etiquetas: ["5 a 10 minutos", "Sin materiales", "Para la rutina"],
  ayuda: ["Practiquen con un solo pendiente a la vez."],
  escenas: [
    {
      tipo: "elegir",
      clave: "pendiente",
      titulo: "¿Qué queremos recordar?",
      nota: "Algo sencillo.",
      opciones: [
        o("libro", "Devolver un libro", "libro", "pongo el libro junto a mi bolso"),
        o("llamar", "Hacer una llamada", "telefono", "hago la llamada"),
        o("plantas", "Regar las plantas", "flor", "riego las plantas"),
      ],
      libre: "Otro pendiente",
    },
    {
      tipo: "elegir",
      clave: "momento",
      titulo: "¿Con qué momento lo unimos?",
      opciones: [
        o("desayuno", "Al terminar el desayuno", "taza", "termine de desayunar"),
        o("almuerzo", "Al terminar el almuerzo", "plato", "termine de almorzar"),
        o("cafe", "Con el café de la tarde", "taza", "tome el café de la tarde"),
      ],
    },
    { tipo: "decir", titulo: "Digámoslo juntos", frase: "Cuando {momento}, {pendiente}.", nota: "Repítanlo juntos una o dos veces." },
    { tipo: "consigna", titulo: "Imaginarlo", texto: "Imaginen ese momento y el pendiente, paso a paso.", icono: "estrella" },
    { tipo: "consigna", titulo: "Una nota", texto: "Si ayuda, dejen una nota visible con el pendiente.", icono: "nota" },
    { tipo: "cierre", texto: "Cuando llegue ese momento, pruébenlo. Después, conversen si ayudó." },
  ],
};

export const cog016: Guion = {
  codigo: "COG-016",
  revisado: true,
  frase: "Aprender un dato nuevo y recordarlo después de pequeñas pausas.",
  icono: "reloj",
  etiquetas: ["5 a 10 minutos", "Un dato nuevo", "Sin presión"],
  ayuda: ["Si no lo recuerda, decíselo con naturalidad y vuelvan con una pausa más corta."],
  escenas: [
    { tipo: "decir", titulo: "El dato", frase: "La persona se llama Elena. Digámoslo juntos: Elena.", nota: "Es un ejemplo. Puede ser otro dato útil." },
    { tipo: "consigna", titulo: "Una pausa", texto: "Conversen de otra cosa unos 30 segundos.", icono: "conversar" },
    { tipo: "decir", titulo: "¿Te acordás?", frase: "¿Cómo se llama la persona?", nota: "Si lo recuerda, la próxima pausa es más larga: 1 minuto, después 2." },
    { tipo: "material", titulo: "Para medir las pausas", nota: "Opcional. Nunca muestra puntaje." },
    { tipo: "cierre", texto: "Repasar con calma ayuda a que el dato se quede." },
  ],
};

export const cog017: Guion = {
  codigo: "COG-017",
  revisado: true,
  frase: "Elegir un lugar fijo para un objeto de todos los días y practicar guardarlo.",
  icono: "bandeja",
  etiquetas: ["5 a 10 minutos", "Un objeto y una bandeja", "Todos los días"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "objeto",
      titulo: "¿Qué objeto?",
      nota: "Algo que use todos los días.",
      opciones: [o("lentes", "Los lentes", "lentes", "los lentes"), o("control", "El control remoto", "control", "el control"), o("llaves", "Las llaves", "llaves", "las llaves")],
      libre: "Otro objeto",
    },
    {
      tipo: "preparar",
      titulo: "El lugar",
      nota: "Visible, a mano y cerca de donde lo usa.",
      items: [
        { icono: "bandeja", texto: "Una bandeja o recipiente" },
        { icono: "foto", texto: "Una foto del objeto, si ayuda" },
      ],
    },
    { tipo: "decir", titulo: "Guardémoslo", frase: "Vamos a guardar {objeto} en esta bandeja.", nota: "Mostrá la acción mientras lo decís." },
    { tipo: "consigna", titulo: "Su turno", texto: "Que ponga el objeto en la bandeja.", icono: "bandeja", nota: "Si puede, que lo diga en voz alta." },
    { tipo: "decir", titulo: "Después de un rato", frase: "Vamos a buscar {objeto}.", nota: "Si necesita ayuda, señalá la bandeja o acompañale." },
    { tipo: "cierre", texto: "Un lugar fijo para cada cosa ahorra búsquedas." },
  ],
};

export const cog018: Guion = {
  codigo: "COG-018",
  revisado: true,
  frase: "Leer una noticia corta y conversar sobre lo principal.",
  icono: "periodico",
  etiquetas: ["5 a 10 minutos", "Una noticia positiva", "Para conversar"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "tema",
      titulo: "¿De qué tema?",
      nota: "Algo que disfrute.",
      opciones: [
        o("naturaleza", "Naturaleza", "flor", "la naturaleza"),
        o("deportes", "Deportes", "pelota", "deportes"),
        o("cultura", "Cultura", "libro", "cultura"),
        o("comunidad", "Nuestra comunidad", "casa", "nuestra comunidad"),
      ],
    },
    { tipo: "consigna", titulo: "Busquen la noticia", texto: "Tres o cuatro frases, con una idea clara.", icono: "periodico", nota: "En papel o contada." },
    { tipo: "decir", titulo: "Antes de leer", frase: "Te voy a leer una noticia sobre {tema}.", nota: "Después, leela despacio y hacé una pausa al terminar." },
    {
      tipo: "decir",
      titulo: "Conversemos",
      frase: "¿De qué trataba?",
      otras: ["¿Qué te llamó la atención?"],
      pista: "Dale dos opciones: «¿Hablaba de mariposas o de peces?».",
      nota: "Pueden volver a leerla si quiere.",
    },
    { tipo: "cierre", texto: "Una buena noticia compartida se disfruta dos veces." },
  ],
};

const objetosMesa: Opcion[] = [
  o("taza", "Una taza", "taza"),
  o("libro", "Un libro", "libro"),
  o("cuchara", "Una cuchara", "cuchara"),
  o("sombrero", "Un sombrero", "sombrero"),
  o("lentes", "Los lentes", "lentes"),
  o("llaves", "Las llaves", "llaves"),
];

export const cog019: Guion = {
  codigo: "COG-019",
  revisado: true,
  frase: "Unir dos objetos con una frase sencilla o una historia divertida.",
  icono: "taza",
  etiquetas: ["5 a 10 minutos", "Dos objetos de la casa", "Con imaginación"],
  ayuda: [],
  escenas: [
    { tipo: "lista", clave: "objetos", titulo: "Elijan dos objetos", nota: "Pónganlos sobre la mesa y nómbrenlos.", minimo: 2, sugerencias: objetosMesa, libre: "Otro objeto" },
    { tipo: "decir", titulo: "Una frase que los una", frase: "Me tomo un café mientras leo el libro.", nota: "Es un ejemplo. Inventá una con sus objetos." },
    { tipo: "decir", titulo: "Su turno", frase: "¿Se te ocurre otra historia con estos dos?", nota: "Vale una palabra, un gesto o señalar." },
    {
      tipo: "consigna",
      titulo: "Un reto",
      texto: "Si es cómodo, tapen uno y usen la frase como pista.",
      icono: "servilleta",
      nota: "Si no lo recuerda, destápenlo y armen juntos la relación.",
    },
    { tipo: "repaso", titulo: "Nuestros objetos", partes: [{ etiqueta: "Los objetos", clave: "objetos" }] },
    { tipo: "cierre", texto: "Una historia une lo que parecía suelto." },
  ],
};

export const cog020: Guion = {
  codigo: "COG-020",
  revisado: true,
  frase: "Escuchar un texto corto y hacer una señal cuando aparece una palabra.",
  icono: "oreja",
  etiquetas: ["3 a 8 minutos", "Un texto corto", "Una señal acordada"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "senal",
      titulo: "¿Qué señal hacemos?",
      nota: "Cuando escuche «café».",
      opciones: [o("senalar", "Señalar la taza", "senalar"), o("dedo", "Levantar la mano", "rechazo"), o("decir", "Decir «aquí»", "conversar")],
    },
    { tipo: "consigna", titulo: "Un ensayo", texto: "Prueben con una frase corta: «Preparé café».", icono: "taza" },
    {
      tipo: "leer",
      titulo: "Ahora, el texto",
      texto: "En la mañana preparé café. Abrí la ventana y puse la mesa. El café estaba listo.",
      resaltar: "café",
      icono: "taza",
      nota: "Si pierde la regla, recordala y sigan.",
    },
    { tipo: "decir", titulo: "Conversemos", frase: "¿Qué pasaba en la historia?", nota: "Sin contar errores." },
    { tipo: "cierre", texto: "Escuchar con atención es un regalo para quien habla." },
  ],
};

export const cog021: Guion = {
  codigo: "COG-021",
  revisado: true,
  frase: "Preparar juntos un lugar en la mesa para la merienda.",
  icono: "plato",
  etiquetas: ["5 a 10 minutos", "Objetos seguros", "Una cosa a la vez"],
  ayuda: [],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Lo que vamos a usar",
      nota: "Pónganlo sobre la mesa.",
      items: [
        { icono: "plato", texto: "Mantel individual" },
        { icono: "servilleta", texto: "Servilleta" },
        { icono: "cuchara", texto: "Cuchara" },
        { icono: "vaso", texto: "Vaso plástico vacío" },
      ],
    },
    { tipo: "decir", titulo: "Contale el plan", frase: "Vamos a preparar este espacio para la merienda." },
    {
      tipo: "ordenar",
      clave: "puesto",
      titulo: "Uno por uno",
      nota: "Tocá cada cosa cuando la ponga en su lugar.",
      minimo: 1,
      items: [o("mantel", "El mantel", "plato"), o("servilleta", "La servilleta", "servilleta"), o("cuchara", "La cuchara", "cuchara"), o("vaso", "El vaso", "vaso")],
    },
    { tipo: "decir", titulo: "Revisemos", frase: "¡Mirá qué bien quedó! Gracias por ayudarme." },
    { tipo: "cierre", texto: "Hacer algo útil juntos se siente bien." },
  ],
};

export const cog022: Guion = {
  codigo: "COG-022",
  revisado: true,
  frase: "Dar pistas de un objeto, sin decir su nombre, para que el otro adivine.",
  icono: "conversar",
  etiquetas: ["5 a 10 minutos", "3 a 5 objetos", "Por turnos"],
  ayuda: [],
  escenas: [
    {
      tipo: "lista",
      clave: "objetos",
      titulo: "Elijan los objetos",
      nota: "De tres a cinco, a la vista.",
      minimo: 2,
      sugerencias: [o("peine", "Un peine", "peine"), o("taza", "Una taza", "taza"), o("zapato", "Un zapato", "zapato"), o("sombrero", "Un sombrero", "sombrero"), o("cuchara", "Una cuchara", "cuchara")],
      libre: "Otro objeto",
    },
    {
      tipo: "decir",
      titulo: "Empezá vos",
      frase: "Sirve para peinarse y puede tener un mango. ¿Qué es?",
      nota: "Es un ejemplo. Describí uno de sus objetos.",
      contar: "¡Adivinó!",
    },
    { tipo: "decir", titulo: "Su turno", frase: "¿Para qué lo usamos? ¿Cómo es?", nota: "Pueden turnarse para dar pistas. Aceptá gestos y decí el nombre con naturalidad.", contar: "¡Adiviné!" },
    { tipo: "cierre", texto: "Hay muchas maneras de decir lo mismo." },
  ],
};

export const cog023: Guion = {
  codigo: "COG-023",
  revisado: true,
  frase: "Ofrecer dos opciones y respetar lo que prefiere.",
  icono: "senalar",
  etiquetas: ["3 a 10 minutos", "Dos opciones reales", "Puede responder señalando"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "decision",
      titulo: "¿Qué vamos a elegir?",
      nota: "Algo que se pueda respetar de verdad.",
      opciones: [
        o("musica", "Qué música escuchar", "musica"),
        o("ropa", "Qué ropa ponerse", "ropa"),
        o("merienda", "Qué merendar", "pan"),
        o("actividad", "Qué hacer hoy", "estrella"),
      ],
    },
    { tipo: "decir", titulo: "Las dos opciones", frase: "¿Preferís esta o esta otra?", nota: "Mostrale las dos. Dale tiempo, sin repetir enseguida." },
    { tipo: "decir", titulo: "Confirmá", frase: "Entiendo que preferís esta. ¿La elegimos?", nota: "Si la respuesta no es clara, no supongás: probá de nuevo más tarde." },
    { tipo: "decir", titulo: "Si quiere conversar", frase: "¿Qué te gusta de esta?" },
    { tipo: "consigna", titulo: "¡A hacerlo!", texto: "Hagan lo que eligió, cuando sea posible.", icono: "estrella" },
    { tipo: "cierre", texto: "Elegir es una forma de decir quién soy." },
  ],
};

export const cog024: Guion = {
  codigo: "COG-024",
  revisado: true,
  frase: "Escuchar una indicación, hacerla y revisar juntos.",
  icono: "cuchara",
  etiquetas: ["5 a 10 minutos", "4 objetos seguros", "En la mesa"],
  ayuda: [],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Sobre la mesa",
      nota: "Al alcance de la persona.",
      items: [
        { icono: "servilleta", texto: "Una servilleta" },
        { icono: "cuchara", texto: "Una cuchara" },
        { icono: "vaso", texto: "Un vaso plástico" },
        { icono: "bandeja", texto: "Una bandeja" },
      ],
    },
    { tipo: "decir", titulo: "Una indicación", frase: "Poné la cuchara en la bandeja.", nota: "Antes de hacerlo, que lo repita o lo señale. Sin apuro." },
    { tipo: "decir", titulo: "Revisemos", frase: "La cuchara quedó en la bandeja.", nota: "Compruébenlo juntos." },
    {
      tipo: "decir",
      titulo: "Si fue fácil, dos",
      frase: "Poné la cuchara en la bandeja y después la servilleta junto al vaso.",
      otras: ["Poné el vaso en la bandeja y después la cuchara sobre la servilleta."],
      nota: "Solo si la primera resultó cómoda.",
    },
    { tipo: "cierre", texto: "Escuchar, hacer y revisar: tres pasos que ordenan." },
  ],
};

export const cog025: Guion = {
  codigo: "COG-025",
  revisado: true,
  frase: "Unir un nombre con algo conocido, para tener una pista.",
  icono: "foto",
  etiquetas: ["5 a 8 minutos", "Una foto", "Un nombre por vez"],
  ayuda: [],
  escenas: [
    { tipo: "decir", titulo: "Presentala", frase: "Ella se llama Rosa.", nota: "Con su foto o en persona. Rosa es un ejemplo." },
    { tipo: "decir", titulo: "Una conexión", frase: "Rosa, como las rosas del jardín.", icono: "flor", nota: "Busquen algo que tenga sentido para quien aprende." },
    { tipo: "decir", titulo: "En la conversación", frase: "Rosa viene a acompañarnos hoy.", nota: "Usen el nombre con naturalidad." },
    { tipo: "decir", titulo: "Después de un rato", frase: "Su nombre es como una flor del jardín…", nota: "Si no lo recuerda, decíselo y repitan la conexión." },
    { tipo: "cierre", texto: "Una buena pista convierte un nombre en un recuerdo." },
  ],
};

export const cog026: Guion = {
  codigo: "COG-026",
  revisado: true,
  frase: "Escuchar una descripción e imaginar cómo se vería.",
  icono: "parque",
  etiquetas: ["5 a 10 minutos", "Papel y lápiz, si quieren", "Con imaginación"],
  ayuda: [],
  escenas: [
    { tipo: "decir", titulo: "Un lugar tranquilo", frase: "Voy a describir un lugar para que lo imaginemos." },
    {
      tipo: "leer",
      titulo: "La escena",
      texto: "En un patio hay una mesa de madera. Encima de la mesa hay una taza azul. Junto a la mesa duerme un perro.",
      icono: "perro",
      nota: "Puede tener los ojos abiertos. Hacé una pausa al terminar.",
    },
    {
      tipo: "decir",
      titulo: "¿Cómo era?",
      frase: "¿Cómo era ese patio?",
      otras: ["¿Qué había sobre la mesa?", "¿Qué hacía el perro?"],
      nota: "Puede contarlo o dibujarlo. Repitan la descripción si hace falta.",
    },
    { tipo: "cierre", texto: "Cada quien imagina su propio patio, y todos valen." },
  ],
};

export const cog027: Guion = {
  codigo: "COG-027",
  revisado: true,
  frase: "Decir lo que vamos a buscar y tenerlo presente hasta hacerlo.",
  icono: "servilleta",
  etiquetas: ["3 a 8 minutos", "Un objeto a la vista", "Recorrido corto"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "objeto",
      titulo: "¿Qué vamos a buscar?",
      nota: "Al principio, cerca y a la vista.",
      opciones: [
        o("servilleta", "Una servilleta", "servilleta", "una servilleta para la mesa"),
        o("vaso", "Un vaso", "vaso", "un vaso para el agua"),
        o("libro", "Un libro", "libro", "el libro para leer"),
      ],
      libre: "Otra cosa",
    },
    { tipo: "decir", titulo: "Para qué vamos", frase: "Vamos a buscar {objeto}.", nota: "Que lo diga con sus palabras antes de salir." },
    {
      tipo: "consigna",
      titulo: "¡Vamos!",
      texto: "Vayan a buscarlo y vuelvan al punto de inicio.",
      icono: "figura-camina",
      nota: "Si olvida para qué iba, recordáselo con naturalidad.",
    },
    { tipo: "decir", titulo: "Comprobemos", frase: "Fuimos a buscar {objeto} y acá está." },
    { tipo: "cierre", texto: "Decir lo que vamos a hacer ayuda a no perderlo en el camino." },
  ],
};

export const cog028: Guion = {
  codigo: "COG-028",
  revisado: true,
  frase: "Elegir, entre varios objetos, los que sirven para una tarea.",
  icono: "lupa",
  etiquetas: ["5 a 10 minutos", "4 a 8 objetos", "En la mesa"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "mision",
      titulo: "¿Cuál es la misión?",
      nota: "Pongan los objetos separados sobre la mesa.",
      opciones: [
        o("mesa", "Poner la mesa", "plato", "poner la mesa"),
        o("salir", "Arreglarse para salir", "peine", "arreglarnos para salir"),
        o("leer", "Un rato de lectura", "libro", "un rato de lectura"),
      ],
    },
    { tipo: "decir", titulo: "La misión", frase: "Vamos a buscar lo que necesitamos para {mision}." },
    {
      tipo: "lista",
      clave: "elegidos",
      titulo: "¿Qué nos sirve?",
      nota: "Tocá lo que vaya eligiendo.",
      minimo: 1,
      sugerencias: [
        o("servilleta", "Servilleta", "servilleta"),
        o("cuchara", "Cuchara", "cuchara"),
        o("vaso", "Vaso", "vaso"),
        o("peine", "Peine", "peine"),
        o("libro", "Libro", "libro"),
        o("sombrero", "Sombrero", "sombrero"),
      ],
    },
    { tipo: "decir", titulo: "Conversemos", frase: "¿Cómo usaríamos esto?", nota: "Si tiene una explicación razonable, vale." },
    {
      tipo: "repaso",
      titulo: "Nuestra misión",
      partes: [
        { etiqueta: "Para", clave: "mision" },
        { etiqueta: "Elegimos", clave: "elegidos" },
      ],
    },
    { tipo: "cierre", texto: "Mirar con un propósito ayuda a encontrar." },
  ],
};

export const cog029: Guion = {
  codigo: "COG-029",
  revisado: true,
  frase: "Escuchar un mensaje y contarlo con nuestras palabras.",
  icono: "conversar",
  etiquetas: ["5 a 8 minutos", "Papel y lápiz, si quieren", "Para conversar"],
  ayuda: [],
  escenas: [
    { tipo: "decir", titulo: "Antes de empezar", frase: "Te voy a dar un mensaje para que después me cuentes lo importante." },
    { tipo: "leer", titulo: "El mensaje", texto: "Para la merienda de hoy vamos a poner el pan y las servilletas en la mesa.", icono: "pan" },
    { tipo: "decir", titulo: "Preguntale", frase: "¿Qué tenemos que preparar?", nota: "Con sus palabras. Pueden repetirlo juntos." },
    { tipo: "consigna", titulo: "Pasalo", texto: "Si hay alguien más, que le cuente el mensaje.", icono: "conversar", nota: "También pueden cambiar los papeles." },
    { tipo: "cierre", texto: "Un mensaje bien contado llega lejos." },
  ],
};

export const cog030: Guion = {
  codigo: "COG-030",
  revisado: true,
  frase: "Encadenar palabras: cada una nos hace pensar en la siguiente.",
  icono: "cadena",
  etiquetas: ["5 a 10 minutos", "Papel y lápiz", "Cada cadena es distinta"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "inicio",
      titulo: "¿Con qué palabra empezamos?",
      opciones: [o("lluvia", "Lluvia", "lluvia", "lluvia"), o("cafe", "Café", "taza", "café"), o("casa", "Casa", "casa", "casa"), o("sol", "Sol", "sol", "sol")],
    },
    {
      tipo: "decir",
      titulo: "La primera",
      frase: "¿En qué te hace pensar la palabra «{inicio}»?",
      nota: "Comentá la conexión: «Usamos el paraguas cuando llueve».",
    },
    {
      tipo: "lista",
      clave: "cadena",
      titulo: "Armemos la cadena",
      nota: "Escribí cada palabra nueva y sigan desde ella.",
      minimo: 2,
      sugerencias: [],
      libre: "Nueva palabra",
    },
    {
      tipo: "repaso",
      titulo: "Nuestra cadena",
      nota: "Léanla juntos y conversen sobre las conexiones.",
      partes: [
        { etiqueta: "Empezamos con", clave: "inicio" },
        { etiqueta: "Y siguió", clave: "cadena" },
      ],
    },
    { tipo: "cierre", texto: "Las ideas se conectan de maneras sorprendentes." },
  ],
};

export const cog031: Guion = {
  codigo: "COG-031",
  revisado: true,
  frase: "Conocer un objeto nuevo comparándolo con uno conocido.",
  icono: "batidor",
  etiquetas: ["5 a 10 minutos", "Dos objetos", "Para descubrir"],
  ayuda: [],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Los dos objetos",
      nota: "Por ejemplo, un batidor y un tenedor.",
      items: [
        { icono: "batidor", texto: "Uno poco conocido y seguro" },
        { icono: "tenedor", texto: "Otro conocido que se le parezca" },
      ],
    },
    { tipo: "consigna", titulo: "Presentalo", texto: "Decile su nombre y para qué sirve. Que lo mire y lo toque.", icono: "batidor" },
    { tipo: "decir", titulo: "Compararlos", frase: "¿En qué se parecen?", otras: ["¿Podemos usarlos para algo parecido?"], nota: "Mostrá también una diferencia importante." },
    { tipo: "decir", titulo: "Una frase", frase: "Este batidor se parece al tenedor: los dos nos ayudan a mezclar.", nota: "Armen la suya con sus objetos." },
    { tipo: "cierre", texto: "Lo nuevo se entiende mejor cuando lo unimos a lo conocido." },
  ],
};

export const cog032: Guion = {
  codigo: "COG-032",
  revisado: true,
  frase: "Practicar distintas maneras de pedir lo que necesitamos.",
  icono: "conversar",
  etiquetas: ["5 a 10 minutos", "Una manta o un vaso", "Palabras o gestos"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "situacion",
      titulo: "¿Qué practicamos?",
      opciones: [
        o("frio", "Tener frío", "manta", "tenemos frío"),
        o("sed", "Tener sed", "vaso", "tenemos sed"),
        o("alcanzar", "Alcanzar algo alto", "senalar", "necesitamos alcanzar algo"),
      ],
    },
    { tipo: "decir", titulo: "Imaginemos", frase: "Imaginemos que {situacion}. ¿Cómo lo pedimos?", nota: "Dale un ejemplo: «Tengo frío» o señalar la manta." },
    { tipo: "decir", titulo: "Otra manera", frase: "¿De qué otra forma lo podríamos decir?", nota: "Palabras, gestos o señalar: todo vale." },
    { tipo: "consigna", titulo: "Actuémoslo", texto: "Uno pide y el otro responde. Después cambien.", icono: "conversar" },
    { tipo: "cierre", texto: "Hay muchas formas de pedir, y todas merecen ser escuchadas." },
  ],
};

export const cog033: Guion = {
  codigo: "COG-033",
  revisado: true,
  frase: "Hacer algo breve juntos y usar pistas para recordarlo.",
  icono: "lupa",
  etiquetas: ["5 a 8 minutos", "Una imagen y dos lápices", "Recordar juntos"],
  ayuda: [],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Lo que vamos a usar",
      items: [
        { icono: "foto", texto: "Una imagen, por ejemplo de un jardín" },
        { icono: "lapiz", texto: "Dos lápices de colores" },
      ],
    },
    { tipo: "consigna", titulo: "Elijan un color", texto: "Miren la imagen y elijan el color que combine.", icono: "flor" },
    { tipo: "consigna", titulo: "Un rato de charla", texto: "Conversen de otra cosa un momento.", icono: "conversar" },
    {
      tipo: "decir",
      titulo: "¿Te acordás?",
      frase: "Hace un momento elegimos un color. ¿Cuál fue?",
      pista: "«Estábamos mirando una imagen de un jardín.» Si hace falta, mostrá la imagen y los lápices.",
      nota: "Si no aparece, decíselo: «Elegimos el verde».",
    },
    { tipo: "cierre", texto: "Recordar juntos también es recordar." },
  ],
};

export const cog034: Guion = {
  codigo: "COG-034",
  revisado: true,
  frase: "Hacer una tarea sencilla y marcarla como hecha.",
  icono: "lista",
  etiquetas: ["5 a 8 minutos", "Una hoja y un lápiz", "Hacer y marcar"],
  ayuda: [],
  escenas: [
    {
      tipo: "elegir",
      clave: "tarea",
      titulo: "¿Qué tarea hacemos?",
      nota: "Una acción sin riesgo.",
      opciones: [
        o("revista", "Guardar una revista", "periodico", "guardar la revista"),
        o("servilleta", "Doblar una servilleta", "servilleta", "doblar la servilleta"),
        o("libro", "Guardar un libro", "libro", "guardar el libro"),
      ],
      libre: "Otra tarea",
    },
    { tipo: "consigna", titulo: "La hoja", texto: "Escriban la tarea en una hoja, con un cuadro para marcar.", icono: "lista" },
    { tipo: "consigna", titulo: "¡A hacerla!", texto: "Hagan la tarea: {tarea}.", icono: "estrella" },
    { tipo: "preparar", titulo: "Ahora, marcarla", nota: "Tocá el cuadro, como en la hoja.", items: [{ icono: "lista", texto: "¡Ya está hecha!" }] },
    { tipo: "decir", titulo: "Miremos la hoja", frase: "Acá podemos ver lo que ya hicimos.", nota: "Para otra práctica, usen una hoja nueva." },
    { tipo: "cierre", texto: "Marcar lo hecho nos deja ver lo logrado." },
  ],
};

export const cog035: Guion = {
  codigo: "COG-035",
  revisado: true,
  frase: "Elegir las palabras clave de un texto y usarlas para contarlo.",
  icono: "lapiz",
  etiquetas: ["5 a 10 minutos", "Papel y lápiz", "Palabras clave"],
  ayuda: [],
  escenas: [
    {
      tipo: "leer",
      titulo: "El texto",
      texto: "Para preparar una ensalada, primero lavamos los vegetales. Después los cortamos y los colocamos en un recipiente. Al final añadimos el aderezo.",
      icono: "lechuga",
    },
    { tipo: "decir", titulo: "Las importantes", frase: "¿Qué palabras nos ayudarían a explicar estos pasos?" },
    {
      tipo: "lista",
      clave: "claves",
      titulo: "Nuestras palabras",
      nota: "Tocá las que elijan o escribí otras. Escríbanlas también en papel.",
      minimo: 2,
      sugerencias: [o("lavar", "Lavar", "lavar"), o("cortar", "Cortar", "tenedor"), o("mezclar", "Mezclar", "cuchara"), o("aderezo", "Aderezo", "botella")],
      libre: "Otra palabra",
    },
    { tipo: "decir", titulo: "Ahora, contalo", frase: "Con estas palabras, ¿cómo se prepara la ensalada?", nota: "No hace falta repetirlo igual." },
    { tipo: "repaso", titulo: "Las palabras clave", partes: [{ etiqueta: "Nuestra guía", clave: "claves" }] },
    { tipo: "cierre", texto: "Pocas palabras bien elegidas ordenan una idea." },
  ],
};

export const COGNICION: Guion[] = [
  cog007,
  cog008,
  cog010,
  cog012,
  cog013,
  cog014,
  cog015,
  cog016,
  cog017,
  cog018,
  cog019,
  cog020,
  cog021,
  cog022,
  cog023,
  cog024,
  cog025,
  cog026,
  cog027,
  cog028,
  cog029,
  cog030,
  cog031,
  cog032,
  cog033,
  cog034,
  cog035,
];
