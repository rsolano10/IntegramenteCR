import type { Escena, Guion, Opcion } from "../tipos";
import type { NombreIcono } from "../iconos";

// Reminiscencia (COG-001 a COG-006 y REM), música (MUS), sentidos (SEN),
// movimiento (MOV) y bienvenida (BIE). Fuente: los pasos, materiales y
// precauciones de cada recurso. La «adaptación» de los primeros recursos
// nombra rutas de la clínica («Motor Rojo»): acá se traduce en consejos
// para la familia, sin semáforos.

const o = (id: string, texto: string, icono: NombreIcono, dicho?: string): Opcion => ({ id, texto, icono, dicho });
const consigna = (titulo: string, texto: string, icono: NombreIcono, nota?: string): Escena => ({ tipo: "consigna", titulo, texto, icono, nota });
const decir = (titulo: string, frase: string, extra: Partial<Extract<Escena, { tipo: "decir" }>> = {}): Escena => ({ tipo: "decir", titulo, frase, ...extra });

function guion(g: Omit<Guion, "revisado" | "ayuda"> & { ayuda?: string[] }): Guion {
  return { revisado: true, ayuda: [], ...g };
}

const categorias = [
  o("animales", "Animales", "perro", "animales"),
  o("frutas", "Frutas", "fruta", "frutas"),
  o("colores", "Colores", "flor", "colores"),
  o("nombres", "Nombres de la familia", "foto", "nombres de la familia"),
];

const salidaEjercicio: Escena[] = [
  { tipo: "sentir", titulo: "¿Cómo se siente ahora?" },
];

// ─── Bienvenida ───

export const bie001 = guion({
  codigo: "BIE-001",
  frase: "Un saludo del equipo y lo que vas a encontrar en estas semanas.",
  icono: "corazon",
  etiquetas: ["3 minutos", "Un video"],
  escenas: [
    consigna("Un momento tranquilo", "Buscá un momento tranquilo para verlo.", "silla"),
    { tipo: "video", titulo: "El saludo del equipo" },
    { tipo: "cierre", texto: "Conocer el programa ayuda a empezar con confianza." },
  ],
});

export const bie002 = guion({
  codigo: "BIE-002",
  frase: "Las personas que preparan y revisan tu plan.",
  icono: "conversar",
  etiquetas: ["4 minutos", "Un video"],
  escenas: [
    { tipo: "video", titulo: "Nuestro equipo" },
    consigna("Quién acompaña cada área", "Cognición, movimiento y nutrición tienen su profesional.", "corazon"),
    { tipo: "cierre", texto: "Saber quién está detrás de cada actividad genera confianza." },
  ],
});

export const bie003 = guion({
  codigo: "BIE-003",
  frase: "Un recorrido corto: ver la actividad del día, seguirla y contarnos cómo les fue.",
  icono: "celular",
  etiquetas: ["5 minutos", "Paso a paso"],
  escenas: [
    { tipo: "consigna", paso: { n: 1, de: 4 }, titulo: "Hoy", texto: "En la pestaña Hoy está la actividad del día.", icono: "calendario" },
    { tipo: "consigna", paso: { n: 2, de: 4 }, titulo: "Empezar", texto: "Tocá Empezar y seguila paso a paso, como ahora.", icono: "estrella" },
    { tipo: "consigna", paso: { n: 3, de: 4 }, titulo: "Contarnos", texto: "Al terminar, contanos cómo les fue con un toque.", icono: "lista" },
    { tipo: "consigna", paso: { n: 4, de: 4 }, titulo: "Mi semana", texto: "En Mi semana ven todas las actividades.", icono: "calendario" },
    { tipo: "cierre", texto: "Practicar con una actividad real es la forma más fácil de aprender." },
  ],
});

// ─── Reminiscencia (COG-001 a COG-006) ───

export const cog001 = guion({
  codigo: "COG-001",
  frase: "Recorrer de memoria el camino a un lugar conocido, sin salir de casa.",
  icono: "mapa",
  etiquetas: ["10 a 15 minutos", "Una foto, si tienen", "Para conversar"],
  escenas: [
    {
      tipo: "elegir",
      clave: "lugar",
      titulo: "¿A qué lugar vamos?",
      nota: "Uno que conozca bien. Si tienen una foto, úsenla.",
      opciones: [o("iglesia", "La iglesia", "iglesia", "la iglesia"), o("parque", "El parque", "parque", "el parque"), o("super", "El súper", "mercado", "el súper")],
      libre: "Otro lugar",
    },
    decir("Para empezar", "¿Cómo llegaríamos desde la casa hasta {lugar}?", { icono: "mapa", nota: "No hace falta describirlo exacto." }),
    decir("En el camino", "¿Por dónde empezamos?", {
      otras: ["¿Qué veríamos en el camino?", "¿Hacia dónde seguimos después?"],
      pista: "Dale dos opciones: «¿Pasaríamos por el parque o por la escuela?».",
    }),
    {
      tipo: "lista",
      clave: "camino",
      titulo: "Lo que vemos al pasar",
      nota: "Tocá lo que vaya nombrando.",
      minimo: 1,
      sugerencias: [
        o("casas", "Casas", "casa"),
        o("pulperia", "La pulpería", "mercado"),
        o("parada", "La parada", "bus"),
        o("escuela", "La escuela", "libro"),
        o("arboles", "Árboles", "parque"),
        o("iglesia", "La iglesia", "iglesia"),
      ],
      libre: "Otro lugar",
    },
    consigna("Si les gusta", "Dibujen juntos el camino y marquen los lugares.", "lapiz"),
    {
      tipo: "repaso",
      titulo: "Nuestro camino",
      partes: [
        { etiqueta: "Hasta", clave: "lugar" },
        { etiqueta: "Pasamos por", clave: "camino" },
      ],
    },
    { tipo: "cierre", texto: "Lo importante es compartir el camino, no recordarlo exacto." },
  ],
});

export const cog002 = guion({
  codigo: "COG-002",
  frase: "Recordar un lugar donde vivió y compartir sus historias.",
  icono: "casa",
  etiquetas: ["10 a 15 minutos", "Fotos, si tienen", "Para conversar"],
  escenas: [
    decir("El lugar", "¿Cómo era el lugar donde vivías?", {
      icono: "casa",
      otras: ["¿Qué había cerca de tu casa?", "¿Qué te gustaba de ese lugar?"],
      nota: "Elijan un barrio o comunidad que haya sido importante.",
    }),
    consigna("Las fotos", "Si tienen fotos, mírenlas juntos.", "foto", "Conversen sobre lo que reconoce."),
    decir("Antes y ahora", "¿Qué ha cambiado?", { otras: ["¿Qué sigue parecido?"], nota: "Si no lo sabe, sigan con los recuerdos." }),
    consigna("Para cerrar", "Vuelvan a un detalle que disfrutó contar.", "corazon"),
    { tipo: "cierre", texto: "Los lugares siguen vivos en las historias que contamos." },
  ],
});

export const cog003 = guion({
  codigo: "COG-003",
  frase: "Recordar un día de trabajo y ordenar sus tareas.",
  icono: "martillo",
  etiquetas: ["10 a 15 minutos", "Tarjetas, si quieren", "Sin exigir detalles"],
  escenas: [
    {
      tipo: "elegir",
      clave: "oficio",
      titulo: "¿Qué trabajo recordamos?",
      nota: "Un trabajo, oficio o responsabilidad de todos los días.",
      opciones: [
        o("casa", "La casa y la familia", "casa"),
        o("campo", "El campo", "hoja"),
        o("taller", "Un taller u oficio", "martillo"),
        o("comercio", "Un comercio", "mercado"),
        o("oficina", "Una oficina", "lapiz"),
      ],
      libre: "Otro trabajo",
    },
    {
      tipo: "lista",
      clave: "tareas",
      titulo: "Las tareas de un día",
      nota: "Escribí de tres a cinco. Pueden pasarlas a tarjetas.",
      minimo: 2,
      sugerencias: [],
      libre: "Una tarea",
    },
    { tipo: "ordenar", clave: "orden", titulo: "¿Qué hacía primero?", nota: "Tocalas en el orden en que las hacía.", minimo: 2, items: [], desde: "tareas" },
    decir("Lo que más le gustaba", "¿Qué parte de ese trabajo disfrutabas más?", { nota: "Si quiere contarlo." }),
    {
      tipo: "repaso",
      titulo: "Un día de trabajo",
      partes: [
        { etiqueta: "En", clave: "oficio" },
        { etiqueta: "El día", clave: "orden" },
      ],
    },
    { tipo: "cierre", texto: "Cada oficio guarda saberes que vale la pena contar." },
  ],
});

export const cog004 = guion({
  codigo: "COG-004",
  frase: "Recordar palabras y dichos de antes, y lo que significaban.",
  icono: "conversar",
  etiquetas: ["10 a 15 minutos", "Una lista de dichos", "Para conversar"],
  escenas: [
    {
      tipo: "elegir",
      clave: "expresion",
      titulo: "¿Con qué expresión empezamos?",
      nota: "Una de su comunidad o su época.",
      opciones: [o("chiva", "¡Qué chiva!", "estrella", "qué chiva"), o("pura", "Pura vida", "sol", "pura vida"), o("tuanis", "Tuanis", "corazon", "tuanis")],
      libre: "Otra expresión",
    },
    decir("¿La conocés?", "¿Habías escuchado «{expresion}»? ¿Qué significa?", { nota: "Leela en voz alta si hace falta." }),
    decir("¿Quién la decía?", "¿Quién la decía?", { otras: ["¿En qué momento se usaba?"], nota: "Sin exigir que recuerde a alguien en particular." }),
    decir("Un refrán", "Camarón que se duerme…", {
      otras: ["Al que madruga…", "Más vale pájaro en mano…", "Perro que ladra…"],
      nota: "Que lo complete, o que elija entre dos finales.",
    }),
    decir("Para cerrar", "¿Hay otra palabra de antes que quieras compartir?"),
    { tipo: "cierre", texto: "Las palabras de antes guardan la forma de ver el mundo." },
  ],
});

export const cog006 = guion({
  codigo: "COG-006",
  frase: "Conversar sobre cómo se hacían las compras en otra época.",
  icono: "bolso",
  etiquetas: ["10 a 15 minutos", "Fotos o dibujos, si tienen", "Sin plata real"],
  escenas: [
    {
      tipo: "elegir",
      clave: "lugar",
      titulo: "¿Dónde hacías las compras?",
      opciones: [
        o("pulperia", "La pulpería", "mercado", "la pulpería"),
        o("feria", "La feria", "fruta", "la feria"),
        o("mercado", "El mercado", "bolso", "el mercado"),
        o("super", "El súper", "lista", "el súper"),
      ],
      libre: "Otro lugar",
    },
    {
      tipo: "lista",
      clave: "canasta",
      titulo: "¿Qué comprabas en {lugar}?",
      nota: "Tocá lo que vaya nombrando.",
      minimo: 1,
      sugerencias: [
        o("frijoles", "Frijoles", "frijol"),
        o("arroz", "Arroz", "plato"),
        o("cafe", "Café", "taza"),
        o("pan", "Pan", "pan"),
        o("huevos", "Huevos", "huevo"),
        o("azucar", "Azúcar", "cuchara"),
      ],
      libre: "Otra cosa",
    },
    decir("Cómo era", "¿Cómo llevabas las compras a la casa?", { otras: ["¿Quién te acompañaba?", "¿Qué necesitabas cada semana?"] }),
    decir("Antes y ahora", "¿Y ahora, en qué ha cambiado?", { nota: "Con respeto, sin fechas ni precios." }),
    {
      tipo: "repaso",
      titulo: "La compra de antes",
      partes: [
        { etiqueta: "En", clave: "lugar" },
        { etiqueta: "La canasta", clave: "canasta" },
      ],
    },
    { tipo: "cierre", texto: "Las costumbres de antes también cuentan quiénes somos." },
  ],
});

// ─── Movimiento (MOV) ───

export const mov001 = guion({
  codigo: "MOV-001",
  frase: "Caminar a un ritmo cómodo mientras nombran palabras de una categoría.",
  icono: "figura-camina",
  etiquetas: ["10 a 15 minutos", "Espacio despejado", "Sin competir"],
  cuidado: "Primero, la marcha segura. Si hablar le cambia el paso, paren de nombrar.",
  ejercicio: true,
  ayuda: ["Si le cuesta caminar, háganlo sentado: marcar el paso alternando los pies.", "Acompañalo de cerca."],
  escenas: [
    { tipo: "seguridad" },
    {
      tipo: "preparar",
      titulo: "Preparemos el lugar",
      nota: "Tocá cada cosa cuando esté lista.",
      items: [
        { icono: "suelo", texto: "Espacio despejado" },
        { icono: "zapato", texto: "Calzado firme" },
        { icono: "marcas", texto: "Conos o marcas, si tienen" },
      ],
    },
    { tipo: "elegir", clave: "categoria", titulo: "¿Qué nombramos?", opciones: categorias },
    consigna("Caminar", "Caminen a un ritmo cómodo.", "figura-camina"),
    decir("Mientras caminan", "Nombremos {categoria} mientras caminamos.", { contar: "Dijo una palabra", nota: "Si la marcha se vuelve insegura, paren de nombrar y sigan caminando." }),
    ...salidaEjercicio,
    { tipo: "cierre", texto: "Caminar y pensar juntos, sin apuro." },
  ],
});

export const mov002 = guion({
  codigo: "MOV-002",
  frase: "Palmas y cruces de manos a las rodillas, con una señal para cambiar.",
  icono: "palmas",
  etiquetas: ["10 a 15 minutos", "Sin materiales", "Despacio"],
  ayuda: ["Háganlo frente a frente, para que imite.", "Si le cuesta estar de pie, toda la secuencia sentado."],
  escenas: [
    { tipo: "consigna", paso: { n: 1, de: 3 }, titulo: "Una palmada", texto: "Una palmada.", icono: "palmas" },
    { tipo: "consigna", paso: { n: 2, de: 3 }, titulo: "El cruce", texto: "Mano derecha a la rodilla izquierda; después, al revés.", icono: "figura-sentada" },
    { tipo: "consigna", paso: { n: 3, de: 3 }, titulo: "La señal", texto: "Cuando escuche «cambio», inviertan el orden.", icono: "conversar" },
    decir("¡A practicar!", "¡Cambio!", { nota: "Decilo cuando quieras. Despacio antes que rápido.", contar: "Le salió bien" }),
    { tipo: "cierre", texto: "La coordinación se gana con calma, no con velocidad." },
  ],
});

export const mov003 = guion({
  codigo: "MOV-003",
  frase: "Pasarse una pelota blanda y decir una palabra al recibirla.",
  icono: "pelota",
  etiquetas: ["10 a 15 minutos", "Pelota blanda", "Entre dos"],
  ayuda: ["Si está sentado, rueden la pelota sobre la mesa.", "Decí vos la categoría y ofrecé dos opciones."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Preparemos",
      items: [
        { icono: "pelota", texto: "Una pelota blanda y liviana" },
        { icono: "suelo", texto: "Espacio sin obstáculos" },
      ],
    },
    {
      tipo: "elegir",
      clave: "categoria",
      titulo: "¿Qué decimos?",
      opciones: [
        o("animales", "Animales", "perro", "un animal"),
        o("frutas", "Frutas", "fruta", "una fruta"),
        o("colores", "Colores", "flor", "un color"),
        o("nombres", "Nombres de la familia", "foto", "un nombre de la familia"),
      ],
    },
    decir("¡A jugar!", "Cuando recibas la pelota, decí {categoria}.", { icono: "pelota", contar: "Dijo una palabra", nota: "Si repite una, dale una pista y sigan." }),
    { tipo: "cierre", texto: "Jugar también es pensar." },
  ],
});

export const mov004 = guion({
  codigo: "MOV-004",
  frase: "Imitar una secuencia de movimientos en el mismo orden.",
  icono: "palmas",
  etiquetas: ["10 a 15 minutos", "Sin materiales", "De a poco"],
  ayuda: ["Mantengan uno o dos movimientos y que imite sin equivocarse.", "Si se complica, vuelvan a la última que salió bien."],
  escenas: [
    {
      tipo: "ordenar",
      clave: "secuencia",
      titulo: "Armen la secuencia",
      nota: "Empiecen con dos movimientos. Tocá en orden.",
      minimo: 2,
      items: [
        o("palma", "Palmada", "palmas"),
        o("hombros", "Tocar los hombros", "figura-de-pie"),
        o("rodillas", "Tocar las rodillas", "figura-sentada"),
        o("brazos", "Brazos arriba", "figura-un-pie"),
        o("cabeza", "Tocar la cabeza", "bien"),
      ],
    },
    consigna("Mostrala", "Hacé la secuencia y que la imite en el mismo orden.", "palmas"),
    consigna("Un poco más", "Si le sale bien, agreguen un movimiento.", "estrella", "Si se complica, vuelvan a la anterior."),
    { tipo: "repaso", titulo: "Nuestra secuencia", partes: [{ etiqueta: "En orden", clave: "secuencia" }] },
    { tipo: "cierre", texto: "Repetir con calma ayuda a que el cuerpo aprenda." },
  ],
});

export const mov005 = guion({
  codigo: "MOV-005",
  frase: "Recordar dos o tres cosas mientras se sienta y se levanta.",
  icono: "figura-de-pie",
  etiquetas: ["3 a 5 veces", "Silla firme", "Dos o tres palabras"],
  cuidado: "Si hoy hay mareo o no se siente firme, déjenlo para otro día.",
  ejercicio: true,
  ayuda: ["Si lo necesita, que se ayude con los brazos, con vos al lado.", "Si no puede levantarse, que estire las rodillas sentado y después recuerden."],
  escenas: [
    { tipo: "seguridad" },
    {
      tipo: "preparar",
      titulo: "Preparemos",
      items: [
        { icono: "silla", texto: "Silla firme con respaldo, contra la pared" },
        { icono: "zapato", texto: "Calzado firme" },
      ],
    },
    {
      tipo: "lista",
      clave: "palabras",
      titulo: "Dos o tres para recordar",
      nota: "Mostráselas o decíselas.",
      minimo: 2,
      sugerencias: [
        o("taza", "Taza", "taza"),
        o("llaves", "Llaves", "llaves"),
        o("sombrero", "Sombrero", "sombrero"),
        o("libro", "Libro", "libro"),
        o("flor", "Flor", "flor"),
        o("sol", "Sol", "sol"),
      ],
    },
    decir("Acordate", "Acordate de estas cosas: te las pregunto después."),
    {
      tipo: "repeticiones",
      titulo: "Ahora, de 3 a 5 veces",
      nota: "Despacio. Tocá el círculo cada vez que se levante y se siente.",
      min: 3,
      max: 5,
      recordatorios: ["Despacio al sentarse.", "Los pies bien apoyados.", "Respirá con normalidad."],
    },
    decir("¿Qué cosas eran?", "¿Te acordás de las cosas que te dije?", { pista: "Dale una pista de cada una: «Una era para tomar café…»." }),
    ...salidaEjercicio,
    { tipo: "cierre", texto: "Cuerpo y memoria trabajando juntos." },
  ],
});

export const mov006 = guion({
  codigo: "MOV-006",
  frase: "Seguir un recorrido de dos o tres puntos de la casa.",
  icono: "mapa",
  etiquetas: ["10 a 15 minutos", "Ruta conocida", "Con luz"],
  cuidado: "Solo rutas conocidas, con luz y sin desniveles.",
  ejercicio: true,
  ayuda: ["Una instrucción a la vez, con gestos."],
  escenas: [
    { tipo: "seguridad" },
    {
      tipo: "ordenar",
      clave: "ruta",
      titulo: "Elijan la ruta",
      nota: "Dos puntos seguros de la casa, en orden.",
      minimo: 2,
      items: [o("mesa", "La mesa", "plato"), o("puerta", "La puerta", "puerta"), o("sillon", "El sillón", "silla"), o("cocina", "La cocina", "sarten"), o("ventana", "La ventana", "casa")],
    },
    decir("La instrucción", "Andá a la mesa y luego a la puerta.", { nota: "Es un ejemplo: usá los puntos que eligieron." }),
    consigna("Un punto más", "Si la completa, agreguen un tercer punto.", "estrella"),
    decir("¿Por dónde fuiste?", "¿Me contás por dónde fuiste?"),
    { tipo: "repaso", titulo: "La ruta", partes: [{ etiqueta: "En orden", clave: "ruta" }] },
    ...salidaEjercicio,
    { tipo: "cierre", texto: "Planear el camino y recorrerlo: dos cosas a la vez." },
  ],
});

export const mov007 = guion({
  codigo: "MOV-007",
  frase: "Sostener una postura segura mientras nombran palabras.",
  icono: "figura-de-pie",
  etiquetas: ["20 a 30 segundos", "Con apoyo", "Dos veces"],
  cuidado: "Si hay duda sobre su equilibrio, háganlo sentado.",
  ejercicio: true,
  ayuda: ["Que mantenga la mano en el apoyo.", "Sentado: que suba talones y puntas mientras nombra."],
  escenas: [
    { tipo: "seguridad" },
    {
      tipo: "preparar",
      titulo: "Preparemos",
      items: [
        { icono: "apoyo", texto: "Respaldo de silla o baranda" },
        { icono: "suelo", texto: "Superficie firme" },
        { icono: "zapato", texto: "Calzado firme" },
      ],
    },
    { tipo: "elegir", clave: "categoria", titulo: "¿Qué nombramos?", opciones: categorias },
    consigna("La postura", "De pie, con los pies juntos y el apoyo a mano.", "figura-de-pie"),
    {
      tipo: "tiempo",
      modo: "sostener",
      titulo: "Nombrar de pie",
      nota: "Nombren palabras de la categoría durante 20 a 30 segundos.",
      segundos: 30,
      intentos: 2,
      recordatorios: ["Primero, el equilibrio.", "Bien agarrado.", "Otra palabra…"],
    },
    { tipo: "descanso", titulo: "Un descanso corto", segundos: 45, texto: "Sentados, respirando tranquilos." },
    ...salidaEjercicio,
    { tipo: "cierre", texto: "El equilibrio primero; las palabras, después." },
  ],
});

export const mov008 = guion({
  codigo: "MOV-008",
  frase: "Hacer una tarea de la casa sumando un pequeño reto mental.",
  icono: "servilleta",
  etiquetas: ["10 a 15 minutos", "Una tarea segura", "Juntos"],
  ayuda: ["Una regla a la vez, mostrándola vos primero.", "Si cuesta, quédense solo con la tarea."],
  escenas: [
    {
      tipo: "elegir",
      clave: "tarea",
      titulo: "¿Qué tarea hacemos?",
      nota: "Nada con fuego, cuchillos, escaleras o riesgo de caída.",
      opciones: [
        o("panos", "Doblar paños", "servilleta"),
        o("cubiertos", "Ordenar cubiertos sin filo", "cuchara"),
        o("plantas", "Regar las plantas", "flor"),
        o("guardar", "Guardar objetos", "cajas"),
      ],
    },
    {
      tipo: "elegir",
      clave: "reto",
      titulo: "¿Qué reto le sumamos?",
      opciones: [o("conversar", "Conversar de un tema", "conversar"), o("recordar", "Recordar dos cosas", "nota"), o("regla", "Seguir una regla", "lista")],
    },
    consigna("¡A hacerla!", "Hagan la tarea con el reto.", "estrella"),
    consigna("Observá", "Si la tarea se descuida o hay frustración, bajen el reto.", "lupa"),
    { tipo: "cierre", texto: "Las tareas de siempre también pueden ser un buen ejercicio." },
  ],
});

// ─── Música (MUS) ───

export const mus001 = guion({
  codigo: "MUS-001",
  frase: "Escuchar una canción querida y ver qué historias trae.",
  icono: "musica",
  etiquetas: ["8 a 10 minutos", "Una canción suya", "Para conversar"],
  ayuda: ["Hacé preguntas de sí o no, o comentá vos.", "Cantar, moverse o sonreír también es responder."],
  escenas: [
    consigna("La canción", "Pongan un pedacito de una canción que le guste de verdad.", "musica", "No basta con que sea «de su época»."),
    decir("Primero, sentir", "¿Qué sentís al escucharla?", { nota: "Primero la sensación, después los recuerdos." }),
    decir("Los recuerdos", "¿Dónde la escuchabas?", { otras: ["¿Con quién?", "¿Qué hacías en esa época?"] }),
    consigna("Sin exigir", "Si no recuerda, contale vos y sigan escuchando.", "corazon"),
    { tipo: "cierre", texto: "Una canción puede abrir la puerta a una historia." },
  ],
});

export const mus002 = guion({
  codigo: "MUS-002",
  frase: "Cantar una canción conocida y dejar que complete una parte.",
  icono: "musica",
  etiquetas: ["8 a 10 minutos", "Una canción conocida", "Sin corregir"],
  ayuda: ["Dejá solo la última palabra para que la complete.", "Si no quiere completar, simplemente canten juntos."],
  escenas: [
    consigna("Cantar", "Canten juntos una canción muy conocida.", "musica"),
    consigna("Una pausa", "Paren justo antes de una palabra conocida.", "rechazo", "Sin mostrar la letra."),
    decir("¿Cómo sigue?", "¿Cómo sigue?", { nota: "Dale tiempo. Si no aparece, completala vos y sigan cantando.", contar: "Completó la canción" }),
    { tipo: "cierre", texto: "Cantar juntos vale más que acertar la letra." },
  ],
});

export const mus003 = guion({
  codigo: "MUS-003",
  frase: "Escuchar un ritmo de palmas y repetirlo.",
  icono: "palmas",
  etiquetas: ["8 a 10 minutos", "Manos o un tambor", "Volumen bajo"],
  ayuda: ["Mantengan uno o dos golpes y háganlos al mismo tiempo.", "Si se acelera o se agita, vuelvan a un ritmo simple."],
  escenas: [
    consigna("Preparemos", "Con las manos o un tambor, a volumen bajo.", "tambor"),
    {
      tipo: "ritmo",
      titulo: "Imitá el ritmo",
      nota: "Hacelo vos con palmas y que lo imite. La raya es una pausa.",
      patrones: ["x x", "x x x", "x - x x", "x x - x", "x - x - x"],
    },
    { tipo: "cierre", texto: "Escuchar y repetir: el ritmo ordena la atención." },
  ],
});

export const mus004 = guion({
  codigo: "MUS-004",
  frase: "Moverse al pulso de la música y parar cuando se detiene.",
  icono: "musica",
  etiquetas: ["8 a 10 minutos", "Música con pulso claro", "Sentados o de pie"],
  ayuda: ["Si le cuesta estar de pie, todo sentado.", "Que imite al mismo tiempo que vos."],
  escenas: [
    consigna("La música", "Pongan música con un pulso claro, a volumen moderado.", "volumen"),
    { tipo: "consigna", paso: { n: 1, de: 3 }, titulo: "El pulso", texto: "Marquen el pulso con palmas o pies.", icono: "palmas" },
    { tipo: "consigna", paso: { n: 2, de: 3 }, titulo: "Los brazos", texto: "Sumen los brazos, uno y otro.", icono: "figura-de-pie" },
    { tipo: "consigna", paso: { n: 3, de: 3 }, titulo: "¡Alto!", texto: "Cuando pare la música, paren. Cuando vuelva, sigan.", icono: "rechazo" },
    { tipo: "cierre", texto: "Escuchar y moverse al mismo tiempo es un gran ejercicio." },
  ],
});

export const mus005 = guion({
  codigo: "MUS-005",
  frase: "Decir palabras de una categoría al ritmo de un pulso lento.",
  icono: "reloj",
  etiquetas: ["8 a 10 minutos", "Un pulso suave", "Sin apuro"],
  ayuda: ["Alternen: una palabra cada uno.", "Si se queda en blanco, dale una pista."],
  escenas: [
    { tipo: "elegir", clave: "categoria", titulo: "¿Qué categoría?", opciones: categorias },
    {
      tipo: "ritmo",
      titulo: "Al compás",
      nota: "Una palabra cada dos o cuatro golpes. El ritmo ayuda, no presiona.",
      patrones: ["x x x x"],
      pulso: true,
    },
    consigna("Cambiar", "Después de un rato, cambien de categoría.", "estrella"),
    { tipo: "cierre", texto: "El ritmo puede ordenar las palabras." },
  ],
});

export const mus006 = guion({
  codigo: "MUS-006",
  frase: "Tocar secuencias cortas con dos sonidos distintos.",
  icono: "maracas",
  etiquetas: ["8 a 10 minutos", "Maracas o tambor", "Volumen bajo"],
  ayuda: ["Toquen al mismo tiempo, sin pedir que la recuerde."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Los instrumentos",
      nota: "Livianos, seguros y no muy ruidosos.",
      items: [
        { icono: "maracas", texto: "Maracas" },
        { icono: "tambor", texto: "Un tambor pequeño" },
        { icono: "palmas", texto: "O las manos sobre la mesa" },
      ],
    },
    consigna("Dos sonidos", "Elijan dos sonidos distintos: uno es A y el otro, B.", "maracas"),
    { tipo: "ritmo", titulo: "La secuencia", nota: "Tocala vos y que la imite. Después cambien.", patrones: ["A B A", "A A B", "B A B", "A B B A"] },
    { tipo: "cierre", texto: "Escuchar, recordar y tocar: tres cosas a la vez." },
  ],
});

const respuestasMusica = [
  o("calma", "Calma", "luna"),
  o("activacion", "Más energía", "sol"),
  o("canto", "Cantó", "musica"),
  o("interaccion", "Conversó o se acercó", "conversar"),
  o("malestar", "Malestar", "molestia"),
];

export const mus007 = guion({
  codigo: "MUS-007",
  frase: "Armar una lista de sus canciones preferidas y ver cómo le hacen sentir.",
  icono: "volumen",
  etiquetas: ["10 a 15 minutos", "3 a 5 canciones", "Las que prefiere"],
  ayuda: ["Una canción alegre para vos puede no serlo para tu familiar.", "Si hay incomodidad, paren."],
  escenas: [
    {
      tipo: "lista",
      clave: "canciones",
      titulo: "Sus canciones",
      nota: "De tres a cinco que de verdad prefiera.",
      minimo: 1,
      sugerencias: [],
      libre: "Nombre de la canción",
    },
    {
      tipo: "elegir",
      clave: "para",
      titulo: "¿Para qué la usamos hoy?",
      opciones: [
        o("conexion", "Conectar", "corazon", "conectar"),
        o("calma", "Un rato tranquilo", "luna", "un rato tranquilo"),
        o("cambio", "Pasar a otra actividad", "reloj", "pasar a otra actividad"),
      ],
    },
    consigna("Escuchar", "Pongan una y observá antes, durante y después.", "lupa"),
    { tipo: "elegir", clave: "efecto", titulo: "¿Qué notaste?", nota: "Queda guardado para su equipo.", opciones: respuestasMusica },
    {
      tipo: "repaso",
      titulo: "Su lista",
      partes: [
        { etiqueta: "Canciones", clave: "canciones" },
        { etiqueta: "Para", clave: "para" },
        { etiqueta: "Notamos", clave: "efecto" },
      ],
    },
    { tipo: "cierre", texto: "La música preferida puede acompañar distintos momentos del día." },
  ],
});

export const mus008 = guion({
  codigo: "MUS-008",
  frase: "Escuchar dos canciones distintas y conversar sobre cuál prefiere.",
  icono: "musica",
  etiquetas: ["8 a 10 minutos", "Dos canciones", "Para elegir"],
  ayuda: ["Aceptá sí o no, un gesto o una sonrisa.", "Respetá el silencio y el rechazo."],
  escenas: [
    consigna("La primera", "Escuchen un pedacito de la primera canción.", "musica"),
    decir("Preguntale", "¿Te gusta? ¿Te da calma o energía?"),
    consigna("La segunda", "Ahora, un pedacito de la segunda.", "musica"),
    decir("Comparar", "¿Cuál elegirías para bailar?", { otras: ["¿Y para descansar?", "¿Para un viaje?", "¿Para celebrar?"] }),
    {
      tipo: "elegir",
      clave: "preferida",
      titulo: "¿Cuál prefirió?",
      nota: "Queda guardado para elegir mejor la próxima vez.",
      opciones: [o("primera", "La primera", "musica"), o("segunda", "La segunda", "musica"), o("ninguna", "Ninguna", "rechazo")],
    },
    { tipo: "cierre", texto: "Conocer sus gustos ayuda a acompañarle mejor." },
  ],
});

// ─── Reminiscencia (REM) ───

export const rem001 = guion({
  codigo: "REM-001",
  frase: "Recorrer una etapa de la vida con fotos y recuerdos.",
  icono: "foto",
  etiquetas: ["10 a 15 minutos", "Fotos u objetos", "Sin fechas exactas"],
  cuidado: "Si aparece angustia, cambien de tema con calma.",
  ayuda: ["Una foto a la vez; aportá vos nombres y contexto.", "No corrijás detalles que no importan."],
  escenas: [
    {
      tipo: "elegir",
      clave: "etapa",
      titulo: "¿Qué etapa recordamos?",
      opciones: [
        o("infancia", "La infancia", "pelota", "la infancia"),
        o("juventud", "La juventud", "musica", "la juventud"),
        o("trabajo", "El trabajo", "martillo", "el trabajo"),
        o("familia", "La familia", "casa", "la familia"),
        o("hoy", "Hoy", "corazon", "hoy"),
      ],
    },
    consigna("Los recuerdos", "Muestren de una a tres fotos u objetos de esa etapa.", "foto"),
    decir("Conversemos", "¿Quiénes estaban?", { otras: ["¿Dónde era?", "¿Qué hacían?", "¿Cómo te sentías?"], nota: "Sin pedir fechas exactas." }),
    consigna("Para cerrar", "Resuman juntos algo lindo que haya surgido.", "corazon"),
    { tipo: "cierre", texto: "Cada etapa tiene algo que vale la pena recordar." },
  ],
});

export const rem002 = guion({
  codigo: "REM-002",
  frase: "Una fotografía querida como punto de partida para conversar.",
  icono: "foto",
  etiquetas: ["10 a 15 minutos", "Una foto", "Para conversar"],
  ayuda: ["Si no la reconoce, no insistás: contá vos y dejá que reaccione."],
  escenas: [
    consigna("La foto", "Elijan una foto familiar o de un lugar querido.", "foto"),
    decir("Presentala", "Esta es Ana, tu hermana, en el paseo al río.", { nota: "Es un ejemplo. Evitá empezar con «¿quién es?»." }),
    decir("Conversemos", "¿Qué hacían ese día?", { otras: ["¿Cómo era ese lugar?", "¿Qué costumbres tenían?"], nota: "Un gesto o una sonrisa también es una respuesta." }),
    decir("Para cerrar", "Qué bonito recordar este paseo juntos."),
    { tipo: "cierre", texto: "Una foto compartida es un momento compartido." },
  ],
});

export const rem003 = guion({
  codigo: "REM-003",
  frase: "Un objeto de su historia para tocar, usar y conversar.",
  icono: "martillo",
  etiquetas: ["10 a 15 minutos", "Un objeto seguro", "Para conversar"],
  ayuda: ["Que lo toque y lo use; vos contá su historia."],
  escenas: [
    {
      tipo: "elegir",
      clave: "objeto",
      titulo: "¿Qué objeto?",
      nota: "Grande, limpio y seguro.",
      opciones: [
        o("cocina", "Un utensilio de cocina", "sarten"),
        o("herramienta", "Una herramienta", "martillo"),
        o("costura", "Algo de costura", "hilo"),
        o("cartera", "Una cartera", "bolso"),
        o("libro", "Un libro", "libro"),
      ],
      libre: "Otro objeto",
    },
    consigna("Explorar", "Dáselo y dejá que lo explore.", "senalar"),
    decir("¿Para qué?", "¿Para qué se usaba esto?", { nota: "Primero para qué, no cómo se llama. Si no aparece, mostrá el gesto." }),
    decir("Su historia", "¿Quién lo usaba?", { otras: ["¿Dónde?", "¿En qué época?"] }),
    decir("Reconocé su papel", "Vos cocinabas mucho para tu familia.", { nota: "Es un ejemplo. Adaptalo a lo que contó." }),
    { tipo: "cierre", texto: "Los objetos guardan las manos que los usaron." },
  ],
});

export const rem004 = guion({
  codigo: "REM-004",
  frase: "Recordar juntos una receta de la familia.",
  icono: "sopa",
  etiquetas: ["10 a 15 minutos", "Una foto o un aroma", "Sin exigir exactitud"],
  cuidado: "Sin probar comida si hay problemas para tragar, alergias o una dieta especial.",
  ayuda: ["Ofrecé opciones y cuenten la receta juntos."],
  escenas: [
    {
      tipo: "elegir",
      clave: "receta",
      titulo: "¿Qué receta?",
      opciones: [
        o("arroz", "Arroz con pollo", "pollo", "el arroz con pollo"),
        o("tamales", "Tamales", "regalo", "los tamales"),
        o("olla", "Olla de carne", "sopa", "la olla de carne"),
        o("pinto", "Gallo pinto", "frijol", "el gallo pinto"),
      ],
      libre: "Otra receta",
    },
    consigna("Para despertar recuerdos", "Muestren una foto de la comida o un aroma.", "nariz"),
    decir("¿Quién la hacía?", "¿Quién preparaba {receta}?", { otras: ["¿En qué ocasiones?"] }),
    { tipo: "lista", clave: "pasos", titulo: "¿Cómo se hacía?", nota: "Anotá los pasos que vaya contando.", minimo: 1, sugerencias: [], libre: "Un paso" },
    decir("La tradición", "¿Había alguna costumbre especial con esa comida?"),
    {
      tipo: "repaso",
      titulo: "La receta de la familia",
      partes: [
        { etiqueta: "Receta", clave: "receta" },
        { etiqueta: "Los pasos", clave: "pasos" },
      ],
    },
    { tipo: "cierre", texto: "Una receta de familia es una historia que se come." },
  ],
});

export const rem005 = guion({
  codigo: "REM-005",
  frase: "Una canción de una etapa conocida, para sentir y conversar.",
  icono: "musica",
  etiquetas: ["10 a 15 minutos", "Una o dos canciones", "Sin exigir relatos"],
  ayuda: ["Escuchen juntos, canten o muévanse, sin pedir que cuente."],
  escenas: [
    consigna("La canción", "Pongan una canción ligada a una etapa que conozca.", "musica"),
    decir("Primero, sentir", "¿Cómo te hace sentir?"),
    decir("Los recuerdos", "¿Te acordás de alguien o de algún lugar?"),
    { tipo: "elegir", clave: "efecto", titulo: "¿Qué notaste?", nota: "Queda guardado para su perfil musical.", opciones: respuestasMusica },
    { tipo: "cierre", texto: "La música conoce caminos que las palabras no." },
  ],
});

export const rem006 = guion({
  codigo: "REM-006",
  frase: "Volver a un recuerdo que le da calma.",
  icono: "corazon",
  etiquetas: ["10 a 15 minutos", "Una foto, objeto o canción", "Con calma"],
  cuidado: "Si aparece tristeza, no la neguemos. Si crece la angustia, paren.",
  ayuda: ["Contá vos la escena, breve, y mirá cómo responde."],
  escenas: [
    consigna("Antes de empezar", "Elegí un recuerdo que suele hacerle bien.", "corazon"),
    {
      tipo: "elegir",
      clave: "clave",
      titulo: "¿Con qué lo traemos?",
      nota: "Una sola cosa.",
      opciones: [o("foto", "Una foto", "foto"), o("objeto", "Un objeto", "regalo"), o("musica", "Una canción", "musica")],
    },
    decir("Sentir", "¿Qué sentís?"),
    decir("Los detalles", "¿Qué ves? ¿Qué escuchás?", { otras: ["¿Quién está ahí?"] }),
    decir("Volver al presente", "Estamos acá juntos. Podemos volver a esto cuando quieras."),
    { tipo: "cierre", texto: "Un buen recuerdo puede ser un lugar al que volver." },
  ],
});

export const rem007 = guion({
  codigo: "REM-007",
  frase: "Reunir fotos, audios y recuerdos importantes para conversar seguido.",
  icono: "foto",
  etiquetas: ["10 a 15 minutos", "5 a 10 recuerdos", "Pocos por vez"],
  cuidado: "Pidan permiso antes de guardar o compartir fotos e historias.",
  ayuda: ["Pasá vos las fotos, de a una."],
  escenas: [
    consigna("Reunir", "Junten de cinco a diez fotos, audios o recuerdos importantes.", "foto"),
    consigna("Contarlos", "Para cada uno: quién, dónde, cuándo y por qué importa.", "nota"),
    consigna("Pocos por vez", "Hoy, muestren solo algunos.", "foto"),
    decir("Conversemos", "¿Qué recordás de esta?", { nota: "Aportá vos pistas y contexto." }),
    { tipo: "cierre", texto: "Un álbum de vida invita a volver a conversar." },
  ],
});

export const rem008 = guion({
  codigo: "REM-008",
  frase: "Recordar cómo se celebraba una fiesta o tradición.",
  icono: "torta",
  etiquetas: ["10 a 15 minutos", "Fotos, música u objetos", "Para conversar"],
  ayuda: ["Cuenten juntos la historia, con pocos estímulos."],
  escenas: [
    {
      tipo: "elegir",
      clave: "fiesta",
      titulo: "¿Qué celebración?",
      nota: "Una que sea importante para su familia.",
      opciones: [
        o("navidad", "Navidad", "regalo"),
        o("cumple", "Un cumpleaños", "torta"),
        o("patronales", "Fiestas del pueblo", "musica"),
        o("religiosa", "Una fiesta religiosa", "iglesia"),
      ],
      libre: "Otra tradición",
    },
    consigna("Para recordar", "Muestren una foto, música u objeto de esa fiesta.", "foto"),
    decir("Conversemos", "¿Cómo se celebraba?", { otras: ["¿Con quién?", "¿Qué se hacía?", "¿Qué se comía?"] }),
    decir("Antes y ahora", "¿Y ahora, cómo es?", { nota: "Suave, sin exigir precisión." }),
    consigna("Si les gusta", "Hagan algo pequeño de esa fiesta.", "estrella"),
    { tipo: "cierre", texto: "Las tradiciones nos recuerdan de dónde venimos." },
  ],
});

export const rem009 = guion({
  codigo: "REM-009",
  frase: "Recordar algo difícil que logró superar y la fortaleza que mostró.",
  icono: "estrella",
  etiquetas: ["10 a 15 minutos", "Un reto superado", "Para valorar"],
  ayuda: ["Preguntas concretas y fotos ayudan.", "Elijan un reto ya superado, no un conflicto doloroso."],
  escenas: [
    decir("Un reto", "¿Te acordás de algo difícil que lograste superar?"),
    decir("Cómo lo hiciste", "¿Qué hiciste? ¿Quién te ayudó?", { otras: ["¿Qué aprendiste?"] }),
    {
      tipo: "elegir",
      clave: "fortaleza",
      titulo: "¿Qué fortaleza aparece?",
      opciones: [
        o("paciencia", "Paciencia", "reloj", "paciencia"),
        o("valentia", "Valentía", "estrella", "valentía"),
        o("carino", "Cariño", "corazon", "cariño"),
        o("dedicacion", "Dedicación", "martillo", "dedicación"),
        o("fe", "Fe", "iglesia", "fe"),
      ],
      libre: "Otra fortaleza",
    },
    decir("Hoy", "Esa {fortaleza} también te acompaña hoy."),
    { tipo: "repaso", titulo: "Su fortaleza", partes: [{ etiqueta: "Una fortaleza de toda la vida", clave: "fortaleza" }] },
    { tipo: "cierre", texto: "Las fortalezas de toda la vida siguen ahí." },
  ],
});

export const rem010 = guion({
  codigo: "REM-010",
  frase: "Recordar juntos, contando también tus propios recuerdos.",
  icono: "conversar",
  etiquetas: ["10 a 15 minutos", "Una foto, canción u objeto", "Entre los dos"],
  ayuda: ["Llevá vos la historia y aceptá respuestas mínimas."],
  escenas: [
    {
      tipo: "elegir",
      clave: "clave",
      titulo: "¿Con qué empezamos?",
      opciones: [o("foto", "Una foto", "foto"), o("cancion", "Una canción", "musica"), o("objeto", "Un objeto", "regalo")],
    },
    decir("Empezá vos", "Yo me acuerdo de cuando…", { nota: "Contá tu recuerdo. Evitá «¿te acordás?»." }),
    consigna("Su ritmo", "Observá qué emoción aparece y seguí su ritmo.", "corazon"),
    consigna("Sin discutir", "Si recuerdan distinto, no discutan.", "conversar"),
    {
      tipo: "elegir",
      clave: "final",
      titulo: "Para terminar juntos",
      opciones: [o("escuchar", "Escuchar música", "musica"), o("fotos", "Mirar fotos", "foto"), o("cafe", "Tomar un café", "taza")],
    },
    { tipo: "cierre", texto: "Recordar juntos es encontrarse, no un examen." },
  ],
});

// ─── Sentidos (SEN) ───

const aromas = [o("cafe", "Café", "taza"), o("citrico", "Limón o naranja", "limon"), o("canela", "Canela", "frasco"), o("vainilla", "Vainilla", "flor")];

export const sen001 = guion({
  codigo: "SEN-001",
  frase: "Oler cuatro aromas conocidos, de a uno, y describirlos.",
  icono: "nariz",
  etiquetas: ["8 a 10 minutos", "Cuatro aromas", "Sin corregir"],
  ayuda: ["Con dos aromas alcanza; ofrecé opciones.", "Si no lo nombra, vale describirlo."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "Los aromas",
      nota: "Seguros y conocidos.",
      items: [
        { icono: "taza", texto: "Café" },
        { icono: "limon", texto: "Limón o naranja" },
        { icono: "frasco", texto: "Canela" },
        { icono: "flor", texto: "Vainilla" },
      ],
    },
    consigna("De a uno", "Ofrecé un aroma, sin acercarlo demasiado a la nariz.", "nariz"),
    decir("Describilo", "¿Es fuerte o suave? ¿Te gusta?", { otras: ["¿Te resulta conocido?"], nota: "Repitan con los cuatro. No corrijás enseguida." }),
    { tipo: "lista", clave: "reconocidos", titulo: "¿Cuáles reconoció?", nota: "Queda guardado para la próxima vez.", minimo: 0, sugerencias: aromas },
    { tipo: "cierre", texto: "La nariz también se entrena con calma." },
  ],
});

export const sen002 = guion({
  codigo: "SEN-002",
  frase: "Oler dos aromas y decir si son iguales o diferentes.",
  icono: "nariz",
  etiquetas: ["8 a 10 minutos", "Pares de aromas", "Ratos cortos"],
  ayuda: ["Usen aromas muy distintos y respuestas de sí o no."],
  escenas: [
    { tipo: "preparar", titulo: "Los recipientes", nota: "Sesiones cortas: la nariz se cansa.", items: [{ icono: "frasco", texto: "De dos a cuatro recipientes con aromas" }] },
    consigna("Dos aromas", "Ofrecé dos aromas, uno después del otro.", "nariz"),
    decir("¿Iguales?", "¿Son iguales o diferentes?", { otras: ["¿En qué se parecen?", "¿En qué se diferencian?"] }),
    consigna("Otra ronda", "Mezclen pares iguales y diferentes.", "frasco"),
    { tipo: "cierre", texto: "Comparar con atención afina los sentidos." },
  ],
});

export const sen003 = guion({
  codigo: "SEN-003",
  frase: "Oler un aroma sin verlo, describirlo y después nombrarlo.",
  icono: "nariz",
  etiquetas: ["8 a 10 minutos", "Aromas conocidos", "Sin apuro"],
  ayuda: ["Ofrecé dos opciones o una pista si no aparece la palabra."],
  escenas: [
    consigna("Sin mirar", "Ofrecé el aroma sin mostrar de dónde viene.", "nariz"),
    decir("Describirlo", "¿Te resulta conocido? ¿Cómo lo describirías?"),
    decir("Nombrarlo", "¿Qué es?", { nota: "Recién ahora el nombre. Reconocer no es lo mismo que nombrar." }),
    { tipo: "lista", clave: "palabras", titulo: "Tres palabras de ese aroma", nota: "Las que vaya diciendo.", minimo: 1, sugerencias: [], libre: "Una palabra" },
    { tipo: "repaso", titulo: "Lo que nos trajo", partes: [{ etiqueta: "Palabras", clave: "palabras" }] },
    { tipo: "cierre", texto: "Un aroma puede despertar muchas palabras." },
  ],
});

export const sen004 = guion({
  codigo: "SEN-004",
  frase: "Un aroma querido como puerta a un recuerdo.",
  icono: "nariz",
  etiquetas: ["8 a 10 minutos", "Un aroma suyo", "Para conversar"],
  cuidado: "Si trae una tristeza que no pasa, cambien a otro aroma.",
  ayuda: ["Preguntas concretas, una a la vez; aportá vos información."],
  escenas: [
    {
      tipo: "elegir",
      clave: "aroma",
      titulo: "¿Qué aroma?",
      opciones: [o("cafe", "Café", "taza"), o("jabon", "Jabón", "lavar"), o("perfume", "Un perfume", "flor"), o("especia", "Una especia", "frasco")],
      libre: "Otro aroma",
    },
    consigna("Sin adivinar", "Ofrecé el aroma sin pedir que lo adivine.", "nariz"),
    decir("Sentir", "¿Qué sentís?"),
    decir("Un recuerdo", "¿Te lleva a algún lugar o a alguien?", { pista: "«Este era el café que tomábamos en casa…»" }),
    consigna("Todo vale", "Un gesto, una emoción o una palabra también valen.", "corazon"),
    { tipo: "cierre", texto: "Los aromas guardan recuerdos que esperan ser contados." },
  ],
});

export const sen005 = guion({
  codigo: "SEN-005",
  frase: "Adivinar con la mano objetos escondidos en una bolsa.",
  icono: "bolso",
  etiquetas: ["8 a 10 minutos", "Una bolsa y objetos", "Por el tacto"],
  cuidado: "Si tiende a llevarse cosas a la boca, acompañá de cerca.",
  ayuda: ["Mostrá el objeto, hacé el gesto y preguntá por su uso."],
  escenas: [
    {
      tipo: "preparar",
      titulo: "La bolsa",
      nota: "Objetos grandes, limpios y sin filo.",
      items: [
        { icono: "bolso", texto: "Una bolsa que no deje ver" },
        { icono: "manta", texto: "Tela o algodón" },
        { icono: "cuchara", texto: "Cuchara de madera" },
        { icono: "servilleta", texto: "Una esponja" },
      ],
    },
    consigna("Sin mirar", "Que meta una mano en la bolsa, sin mirar.", "bolso"),
    decir("Sentir", "¿Cómo se siente?", { otras: ["¿Es suave o duro?", "¿Frío o tibio?"] }),
    decir("Adivinar", "¿Qué podrá ser? ¿Para qué servirá?"),
    consigna("Sacarlo", "Sáquenlo y conversen sobre lo que pensó.", "estrella"),
    { tipo: "cierre", texto: "Las manos también saben reconocer." },
  ],
});

export const sen006 = guion({
  codigo: "SEN-006",
  frase: "Un objeto de su historia: primero el gesto, después el recuerdo.",
  icono: "cuchara",
  etiquetas: ["8 a 10 minutos", "Un objeto seguro", "Para conversar"],
  ayuda: ["Si le cuesta hablar, quédense con el gesto y la emoción."],
  escenas: [
    {
      tipo: "elegir",
      clave: "objeto",
      titulo: "¿Qué objeto?",
      nota: "Ligado a su historia y seguro.",
      opciones: [o("cuchara", "Cuchara de madera", "cuchara"), o("peine", "Un peine", "peine"), o("cartera", "Una cartera", "bolso"), o("pano", "Un paño", "servilleta")],
      libre: "Otro objeto",
    },
    consigna("Explorar", "Dáselo y dejá que lo explore.", "senalar"),
    decir("El gesto", "¿Qué hacemos con esto?", { nota: "Antes que el nombre. Si no responde, mostrá el gesto." }),
    decir("Su historia", "¿Quién lo usaba en tu casa?", { otras: ["¿Dónde lo usabas?"] }),
    { tipo: "cierre", texto: "Aunque no aparezca el nombre, el recuerdo está." },
  ],
});

export const sen007 = guion({
  codigo: "SEN-007",
  frase: "Sumar de a uno la imagen, la lluvia, la taza y el café.",
  icono: "lluvia",
  etiquetas: ["8 a 10 minutos", "Cuatro estímulos", "De a uno"],
  cuidado: "Más no es mejor: de a uno, y paren si se satura.",
  ayuda: ["Con dos estímulos alcanza.", "Valen las respuestas con gestos o emociones."],
  escenas: [
    decir("La imagen", "¿Qué te sugiere esta cocina?", { icono: "foto", nota: "Mostrá solo una imagen de una cocina o mesa tradicional." }),
    consigna("La lluvia", "Sumen el sonido de lluvia.", "lluvia", "Observá qué cambia en lo que cuenta."),
    consigna("La taza", "Ahora, la taza en sus manos.", "taza"),
    consigna("El café", "Por último, el aroma del café.", "nariz"),
    decir("¿Qué aparece?", "¿Qué lugar o qué momento aparece ahora?"),
    { tipo: "cierre", texto: "Varios sentidos juntos pueden traer una escena entera." },
  ],
});

export const sen008 = guion({
  codigo: "SEN-008",
  frase: "Armar una escena con hasta tres estímulos de su historia.",
  icono: "flor",
  etiquetas: ["10 a 15 minutos", "Hasta 3 estímulos", "Sin exigir"],
  ayuda: ["Con uno o dos estímulos alcanza; voz calmada y tiempo."],
  escenas: [
    {
      tipo: "elegir",
      clave: "escena",
      titulo: "¿Qué escena?",
      nota: "Una significativa para tu familiar.",
      opciones: [o("jardin", "Un jardín", "flor"), o("cocina", "La cocina", "sarten"), o("playa", "La playa", "sol"), o("misa", "La misa", "iglesia"), o("trabajo", "El trabajo", "martillo")],
      libre: "Otra escena",
    },
    {
      tipo: "lista",
      clave: "estimulos",
      titulo: "Hasta tres estímulos",
      nota: "Que tengan que ver con la escena.",
      minimo: 1,
      sugerencias: [o("aroma", "Un aroma", "nariz"), o("sonido", "Un sonido", "volumen"), o("textura", "Una textura", "manta"), o("imagen", "Una imagen", "foto"), o("cancion", "Una canción", "musica")],
    },
    consigna("Despacio", "Preséntenlos de a uno y observá cómo responde.", "lupa"),
    decir("Nombrá lo que sienten", "Esto es olor a café…", { otras: ["Escuchá la lluvia…"], nota: "Nombrá vos lo que van sintiendo." }),
    consigna("Sin forzar", "Conversen solo si muestra interés.", "corazon"),
    { tipo: "cierre", texto: "A veces, solo estar juntos en una escena es suficiente." },
  ],
});

export const VIVENCIAS: Guion[] = [
  bie001,
  bie002,
  bie003,
  cog001,
  cog002,
  cog003,
  cog004,
  cog006,
  mov001,
  mov002,
  mov003,
  mov004,
  mov005,
  mov006,
  mov007,
  mov008,
  mus001,
  mus002,
  mus003,
  mus004,
  mus005,
  mus006,
  mus007,
  mus008,
  rem001,
  rem002,
  rem003,
  rem004,
  rem005,
  rem006,
  rem007,
  rem008,
  rem009,
  rem010,
  sen001,
  sen002,
  sen003,
  sen004,
  sen005,
  sen006,
  sen007,
  sen008,
];
