import type { Escena, Guion, Item, Opcion, Si } from "../tipos";
import type { NombreIcono } from "../iconos";

// Nutrición preventiva (PRE). Cada ficha se vuelve una receta guiada: lo que
// se elige, los cuidados antes de cocinar, los pasos de a uno y la misión de
// la semana (que se sigue marcando desde la pantalla de la actividad).
// Fuente: las fichas PRE (Tu actividad, Tené en cuenta, Para cerrar). Los
// cuidados resumen «Tené en cuenta»; el texto completo queda en la ficha.

const o = (id: string, texto: string, icono: NombreIcono, dicho?: string): Opcion => ({ id, texto, icono, dicho });
const paso = (titulo: string, texto: string, icono: NombreIcono, extra: { nota?: string; si?: Si } = {}): Escena => ({ tipo: "consigna", titulo, texto, icono, ...extra });
const elegir = (clave: string, titulo: string, opciones: Opcion[], nota?: string, libre?: string): Escena => ({ tipo: "elegir", clave, titulo, nota, opciones, libre });

interface Receta {
  codigo: string;
  frase: string;
  icono: NombreIcono;
  etiquetas: string[];
  cuidado?: string;
  ayuda?: string[];
  elegir?: Escena[];
  cuidados?: Item[];
  pasos: Escena[];
  mision?: { texto: string; veces: number };
  // Las marcas de la misión llevan el dibujo de lo elegido (la fruta, la
  // hoja); si no, el de la receta.
  marcaElegida?: boolean;
  cierre: string;
}

function receta(r: Receta): Guion {
  return {
    codigo: r.codigo,
    revisado: false,
    frase: r.frase,
    icono: r.icono,
    etiquetas: r.etiquetas,
    cuidado: r.cuidado,
    ayuda: r.ayuda ?? [],
    escenas: [
      ...(r.elegir ?? []),
      ...(r.cuidados?.length ? [{ tipo: "cuidados", titulo: "Antes de empezar", nota: "Solo si le aplica a tu familiar.", items: r.cuidados } as Escena] : []),
      ...r.pasos,
      ...(r.mision
        ? [
            {
              tipo: "mision",
              clave: "veces",
              titulo: "La misión de la semana",
              texto: r.mision.texto,
              veces: r.mision.veces,
              icono: r.marcaElegida ? undefined : r.icono,
              nota: r.mision.veces > 1 ? "Marcá cada vez que lo hagan. Podés volver a marcar cualquier día de esta semana." : "Marcalo cuando lo hagan, hoy o cualquier día de esta semana.",
            } as Escena,
          ]
        : []),
      { tipo: "cierre", texto: r.cierre, dato: true },
    ],
  };
}

// Cuidados que se repiten en muchas fichas.
const tragar: Item = { icono: "cuchara", texto: "Si le cuesta masticar o tragar, la textura que indicó su equipo." };
const alergiaPescado: Item = { icono: "pescado", texto: "Con alergia al pescado, no lo ofrezcás." };
const renalPescado: Item = { icono: "rinon", texto: "Con gota, enfermedad renal o disfagia, adaptá tipo, cantidad y textura." };
const lavarFruta = (texto = "Lavá bien la fruta antes de cortarla."): Escena => paso("Primero, lavar", texto, "lavar");
const coccion = [o("horno", "Al horno", "sarten"), o("plancha", "A la plancha", "sarten"), o("guisado", "Guisado", "sopa")];

export const pre001 = receta({
  codigo: "PRE-001",
  frase: "Un gallo pinto con más sabor y menos sal, en tres desayunos.",
  icono: "frijol",
  etiquetas: ["3 desayunos", "Esta semana", "En la cocina"],
  pasos: [
    paso("Los olores", "Prepará el pinto con cebolla, culantro y chile dulce.", "cebolla"),
    paso("La grasa", "Usá aceite de oliva o canola en lugar de manteca.", "aceite"),
    paso("La sal", "Probá antes de agregar sal.", "cuchara"),
  ],
  mision: { texto: "Pinto con olores en 3 desayunos.", veces: 3 },
  cierre: "Los cambios pequeños también cuentan.",
});

export const pre002 = receta({
  codigo: "PRE-002",
  marcaElegida: true,
  frase: "Sumar moras o fresas a dos meriendas de la semana.",
  icono: "fresa",
  etiquetas: ["2 meriendas", "Media taza", "Esta semana"],
  elegir: [
    elegir("fruta", "¿Moras o fresas?", [o("moras", "Moras", "fruta"), o("fresas", "Fresas", "fresa")], "La que consigan o la que más le guste."),
    elegir("forma", "¿Cómo se la damos?", [o("sola", "Sola", "fresa"), o("yogur", "Con yogur natural sin azúcar", "yogur")], "El yogur, solo si lo tolera."),
  ],
  cuidados: [{ icono: "cuchara", texto: "Si le cuesta tragar, solo la textura que indicó su equipo." }],
  pasos: [
    lavarFruta("Lavá bien la fruta."),
    paso("La porción", "Serví media taza, entera o picada, como le quede mejor.", "taza"),
    paso("Lo que sobra", "La fruta que no vayás a usar pronto, congelala.", "frasco"),
  ],
  mision: { texto: "Moras o fresas en 2 meriendas.", veces: 2 },
  cierre: "Una merienda conocida también puede traer sabores nuevos.",
});

export const pre003 = receta({
  codigo: "PRE-003",
  frase: "Agua con un toque de sabor, para que tome un poco más.",
  icono: "jarra",
  etiquetas: ["Todos los días", "Sin azúcar", "Una jarra"],
  cuidado: "Si tiene restricción de líquidos o le cuesta tragar, seguí lo que indicó su equipo.",
  elegir: [
    elegir(
      "sabor",
      "¿Qué sabor le damos?",
      [o("pepino", "Pepino", "hoja", "el pepino"), o("limon", "Limón", "limon", "el limón"), o("hierbabuena", "Hierbabuena", "hoja", "la hierbabuena")],
      "Prueben cuál le gusta más.",
    ),
  ],
  pasos: [
    paso("A la jarra", "Lavá {sabor} y echá unas rodajas u hojitas en una jarra de agua.", "jarra", { nota: "Agua potable y sin azúcar." }),
    paso("A la refri", "Guardala tapada y prepará una nueva cada día.", "frasco"),
    paso("Poquito y seguido", "Ofrecele pequeñas cantidades, sin esperar a que pida.", "vaso", { nota: "Probá qué temperatura prefiere, sin insistir." }),
  ],
  cierre: "Acompañar la hidratación también empieza por descubrir qué le gusta.",
});

export const pre004 = receta({
  codigo: "PRE-004",
  frase: "Un almuerzo o una cena con pescado esta semana.",
  icono: "pescado",
  etiquetas: ["1 comida", "Lata o fresco", "Esta semana"],
  cuidado: "Con alergia al pescado, no lo ofrezcás.",
  elegir: [elegir("tipo", "¿Qué pescado?", [o("lata", "Sardinas o atún en lata", "lata"), o("fresco", "Pescado fresco", "pescado")])],
  cuidados: [alergiaPescado, tragar, { icono: "rinon", texto: "Con gota o enfermedad renal, consultá qué opciones y cuánto." }],
  pasos: [
    paso("Comparar", "Compará el sodio y elegí la lata con menos.", "etiqueta", { si: { clave: "tipo", es: ["lata"] } }),
    paso("Escurrir", "Escurrí el líquido y revisá que no queden espinas.", "lata", { si: { clave: "tipo", es: ["lata"] } }),
    paso("Cocinar", "Cocinalo bien: al horno, a la plancha o guisado.", "sarten", { si: { clave: "tipo", es: ["fresco"] } }),
    paso("Las espinas", "Revisá con cuidado que no queden espinas.", "lupa", { si: { clave: "tipo", es: ["fresco"] } }),
    paso("Acompañar", "Acompañalo con vegetales y arroz, papa o lo de siempre.", "plato", { nota: "Respetá las porciones de su plan." }),
  ],
  mision: { texto: "Pescado en un almuerzo o una cena.", veces: 1 },
  cierre: "Una comida conocida puede sumar variedad a la semana.",
});

export const pre006 = receta({
  codigo: "PRE-006",
  frase: "Un puñito de frutos secos en lugar de galletas, en dos meriendas.",
  icono: "nuez",
  etiquetas: ["2 meriendas", "Unos 30 g", "Sin sal"],
  cuidado: "Solo si mastica y traga con seguridad.",
  elegir: [elegir("fruto", "¿Cuáles le damos?", [o("nueces", "Nueces", "nuez"), o("almendras", "Almendras", "nuez"), o("maranon", "Semillas de marañón", "nuez")], "Sin sal.")],
  cuidados: [
    { icono: "cuchara", texto: "Con disfagia o problemas para masticar, nada de frutos secos enteros." },
    { icono: "rechazo", texto: "Con alergia, evitalos." },
    { icono: "rinon", texto: "Con restricciones renales, consultá la cantidad." },
  ],
  pasos: [
    paso("La porción", "Serví un puñito pequeño, unos 30 gramos, en un recipiente.", "taza"),
    paso("El paquete", "Guardá el paquete: lo servido es la merienda.", "frasco"),
  ],
  mision: { texto: "Frutos secos en 2 meriendas, en lugar de galletas.", veces: 2 },
  cierre: "Una porción servida facilita disfrutar la merienda.",
});

export const pre007 = receta({
  codigo: "PRE-007",
  frase: "Cambiar el pan blanco o las galletas por una opción integral.",
  icono: "pan",
  etiquetas: ["3 veces", "En la compra", "Esta semana"],
  elegir: [elegir("opcion", "¿Qué probamos?", [o("pan", "Pan integral", "pan"), o("avena", "Avena sin azúcar", "taza")])],
  cuidados: [
    { icono: "pan", texto: "Con celiaquía, productos aptos: el trigo integral tiene gluten." },
    { icono: "lista", texto: "Con diabetes, respetá los carbohidratos de su plan." },
    { icono: "cuchara", texto: "Adaptá la textura si hace falta." },
  ],
  pasos: [
    paso("En la compra", "Buscá pan cuyo primer ingrediente sea harina integral.", "etiqueta", { si: { clave: "opcion", es: ["pan"] } }),
    paso("En la compra", "Elegí avena sin azúcar añadida.", "etiqueta", { si: { clave: "opcion", es: ["avena"] } }),
    paso("En la mesa", "Ofrecela en lugar de pan blanco o galletas, en la porción de siempre.", "plato"),
  ],
  mision: { texto: "Una opción integral 3 veces.", veces: 3 },
  cierre: "Leer los ingredientes ayuda a elegir con más información.",
});

export const pre008 = receta({
  codigo: "PRE-008",
  frase: "Comparar el sodio de dos productos parecidos y elegir el de menos.",
  icono: "etiqueta",
  etiquetas: ["Un minuto", "Dos etiquetas", "En la despensa o el súper"],
  elegir: [
    elegir("producto", "¿Qué comparamos?", [
      o("atun", "Dos atunes", "lata"),
      o("galletas", "Dos galletas", "pan"),
      o("salsas", "Dos salsas", "botella"),
      o("quesos", "Dos quesos", "queso"),
    ]),
  ],
  cuidados: [
    { icono: "etiqueta", texto: "Miligramos y porcentaje del valor diario no son lo mismo." },
    { icono: "lista", texto: "Si tiene una indicación de sodio o líquidos, seguí ese plan." },
    { icono: "rechazo", texto: "El sodio bajo en sangre no se trata cambiando la sal por cuenta propia." },
  ],
  pasos: [
    paso("La porción", "Buscá en cada etiqueta cuánto es una porción.", "etiqueta"),
    paso("El sodio", "Compará el sodio para la misma cantidad.", "etiqueta"),
    paso("La compra", "Para la compra de siempre, preferí el de menos sodio.", "bolso", { nota: "Si se ajusta a sus indicaciones." }),
  ],
  cierre: "Un minuto frente a la etiqueta puede orientar una compra.",
});

export const pre009 = receta({
  codigo: "PRE-009",
  frase: "Probar media cucharadita menos de azúcar en sus bebidas.",
  icono: "cuchara",
  etiquetas: ["Esta semana", "Media cucharadita", "Sin imponer"],
  elegir: [elegir("hoy", "¿Le pone azúcar a sus bebidas?", [o("si", "Sí, le pone", "cuchara"), o("no", "Ya las toma sin azúcar", "estrella")])],
  cuidados: [
    { icono: "rechazo", texto: "Respetá sus gustos: no impongás el cambio." },
    { icono: "plato", texto: "Con bajo peso o poco apetito, consultá antes de reducir." },
    { icono: "pastillas", texto: "Con diabetes, mantené su plan y no cambiés medicamentos." },
  ],
  pasos: [
    paso("¡Qué bien!", "No hace falta cambiar nada.", "estrella", { si: { clave: "hoy", es: ["no"] } }),
    { tipo: "decir", si: { clave: "hoy", es: ["si"] }, titulo: "Conversalo", frase: "¿Probamos con un poquito menos de azúcar esta semana?", nota: "Respetá lo que prefiera." },
    paso("Media cucharadita", "Usá media cucharadita menos de lo habitual.", "cuchara", { si: { clave: "hoy", es: ["si"] }, nota: "Si le gusta, probá con canela." }),
  ],
  cierre: "Los cambios que se disfrutan son más fáciles de sostener.",
});

export const pre010 = receta({
  codigo: "PRE-010",
  frase: "Compartir una comida juntos, con calma y sin distracciones.",
  icono: "plato",
  etiquetas: ["1 comida", "Juntos", "A su ritmo"],
  elegir: [elegir("comida", "¿Qué comida compartimos?", [o("desayuno", "Desayuno", "taza"), o("almuerzo", "Almuerzo", "plato"), o("cena", "Cena", "luna")])],
  cuidados: [
    { icono: "cuchara", texto: "Si le cuesta tragar, no le hablés mientras mastica." },
    { icono: "casa", texto: "Si vive solo, busquen una compañía posible, sin volverla obligación." },
  ],
  pasos: [
    paso("Juntos", "Siéntense juntos, con pocas distracciones.", "silla"),
    paso("Conversar", "Conversen de algo que disfrute, sin poner a prueba su memoria.", "conversar"),
    paso("A su ritmo", "Acompañalo a su ritmo. Si necesita concentrarse, hacé pausas.", "reloj"),
  ],
  mision: { texto: "Una comida compartida.", veces: 1 },
  cierre: "A veces, acompañar empieza por sentarse a la mesa.",
});

export const pre011 = receta({
  codigo: "PRE-011",
  frase: "Volver a la sopa negra, las lentejas o los garbanzos.",
  icono: "frijol",
  etiquetas: ["1 comida", "Leguminosas", "Esta semana"],
  elegir: [elegir("legumbre", "¿Cuál preparamos?", [o("sopa", "Sopa negra", "sopa"), o("lentejas", "Lentejas", "frijol"), o("garbanzos", "Garbanzos", "frijol")])],
  cuidados: [
    { icono: "rinon", texto: "Con restricciones renales o molestias digestivas, adaptá la cantidad." },
    { icono: "cuchara", texto: "Con disfagia, la sopa con trozos puede no servir: la consistencia indicada." },
  ],
  pasos: [
    paso("Remojar", "Si usás granos secos, remojalos en la refri.", "frijol"),
    paso("Cocinar", "Botá esa agua y cocinalos bien en agua nueva.", "sopa"),
    paso("Un acompañante", "La sopa negra puede llevar huevo bien cocido.", "huevo", { si: { clave: "legumbre", es: ["sopa"] } }),
  ],
  mision: { texto: "Una comida con leguminosas.", veces: 1 },
  cierre: "La cocina de casa ofrece muchas formas de variar.",
});

export const pre012 = receta({
  codigo: "PRE-012",
  frase: "Aderezar los vegetales con aceite de oliva y limón.",
  icono: "aceite",
  etiquetas: ["2 comidas", "Aceite de oliva", "Esta semana"],
  cuidados: [
    { icono: "aceite", texto: "Si debe comer con menos grasa, confirmá la cantidad." },
    { icono: "limon", texto: "Si el limón le molesta, sin limón." },
    { icono: "frasco", texto: "Guardá el aceite tapado, lejos de la luz y el calor." },
  ],
  pasos: [
    paso("El aceite", "Aderezá los vegetales con aceite de oliva extra virgen.", "aceite", { nota: "En lugar del aderezo de siempre." }),
    paso("El limón", "Unas gotas de limón, si le gusta y le cae bien.", "limon"),
    paso("La cantidad", "La de su plan, sin sumarla a otra grasa ya servida.", "cuchara"),
  ],
  mision: { texto: "Aderezo casero en 2 comidas.", veces: 2 },
  cierre: "Una preparación sencilla también puede dar buen sabor.",
});

export const pre013 = receta({
  codigo: "PRE-013",
  frase: "Dar sabor con olores frescos en lugar del cubito.",
  icono: "cebolla",
  etiquetas: ["1 receta", "Sin cubito", "Juntos en la cocina"],
  elegir: [
    elegir("receta", "¿Qué receta de siempre?", [o("arroz", "Arroz", "plato"), o("picadillo", "Picadillo", "sarten"), o("sopa", "Sopa", "sopa")], "Una que ya disfrute.", "Otra receta"),
    {
      tipo: "lista",
      clave: "olores",
      titulo: "¿Qué olores usamos?",
      nota: "Si puede y quiere, que elija uno.",
      minimo: 1,
      sugerencias: [o("cebolla", "Cebolla", "cebolla"), o("culantro", "Culantro", "hoja"), o("ajo", "Ajo", "cebolla"), o("chile", "Chile dulce", "chile")],
      libre: "Otra hierba",
    },
  ],
  cuidados: [
    { icono: "rechazo", texto: "Si algo le cae mal, cambialo por otro." },
    { icono: "lista", texto: "Respetá su indicación de sodio." },
    { icono: "sarten", texto: "Acompañalo con cuchillos y calor cuando lo necesite." },
  ],
  pasos: [
    paso("Sin cubito", "Usá los olores en lugar del cubito o el consomé.", "cebolla"),
    paso("La sal", "Probá antes de agregar sal.", "cuchara"),
  ],
  cierre: "Conservar el sabor facilita probar un cambio.",
});

export const pre014 = receta({
  codigo: "PRE-014",
  marcaElegida: true,
  frase: "Pollo sin piel o pescado bien cocido en tres comidas.",
  icono: "pollo",
  etiquetas: ["3 comidas", "Proteína", "Esta semana"],
  elegir: [
    elegir("proteina", "¿Qué preparamos?", [o("pollo", "Pollo sin piel", "pollo"), o("pescado", "Pescado bien cocido", "pescado")]),
    elegir("coccion", "¿Cómo lo cocinamos?", coccion),
  ],
  cuidados: [
    { icono: "plato", texto: "La cantidad se ajusta a lo que necesita." },
    { icono: "rinon", texto: "Con enfermedad renal o del hígado, no reduzcás la proteína por cuenta propia." },
    { icono: "cuchara", texto: "Adaptá por alergias y si le cuesta masticar o tragar." },
  ],
  pasos: [
    paso("La ensalada", "Una ensalada sola no reemplaza la proteína.", "lechuga"),
    paso("Otros días", "Podés variar con huevo o leguminosas, según su plan.", "huevo"),
  ],
  mision: { texto: "Pollo o pescado en 3 comidas.", veces: 3 },
  cierre: "Una comida variada también debe aportar lo que necesita.",
});

export const pre015 = receta({
  codigo: "PRE-015",
  frase: "Fruta fresca en lugar de un jugo con azúcar.",
  icono: "fruta",
  etiquetas: ["1 merienda", "Papaya, sandía o melón", "Esta semana"],
  elegir: [elegir("fruta", "¿Cuál prefiere?", [o("papaya", "Papaya", "fruta"), o("sandia", "Sandía", "fruta"), o("melon", "Melón", "fruta")], "Preguntale a tu familiar.")],
  cuidados: [
    { icono: "vaso", texto: "La fruta ayuda, pero no reemplaza las bebidas." },
    { icono: "lista", texto: "Con restricción de líquidos o potasio, diabetes o problemas para tragar, ajustá cantidad y tipo." },
  ],
  pasos: [lavarFruta(), paso("La porción", "Serví la cantidad de sus indicaciones.", "plato"), paso("Lo que sobra", "Guardá el resto tapado en la refri.", "frasco")],
  mision: { texto: "Fruta fresca en una merienda.", veces: 1 },
  cierre: "Dar a elegir también forma parte del cuidado.",
});

export const pre016 = receta({
  codigo: "PRE-016",
  frase: "Avena en hojuelas sin azúcar en dos desayunos.",
  icono: "taza",
  etiquetas: ["2 desayunos", "Avena", "Esta semana"],
  elegir: [elegir("toque", "¿Con qué la acompañamos?", [o("canela", "Canela", "frasco"), o("fruta", "Fruta", "fruta"), o("sola", "Sola", "taza")], "Lo que le guste.")],
  cuidados: [
    { icono: "pan", texto: "Con celiaquía, solo avena certificada sin gluten, si lo autorizan." },
    { icono: "vaso", texto: "Revisá alergias, tolerancia a la leche, textura y porción." },
    { icono: "pastillas", texto: "No reemplaza el tratamiento del colesterol." },
  ],
  pasos: [
    paso("Prepararla", "Prepará avena sin azúcar, como dice el paquete.", "taza", { nota: "Con agua o leche, según lo que le va bien." }),
    paso("Una proteína", "Sumale una fuente de proteína adecuada.", "huevo"),
  ],
  mision: { texto: "Avena en 2 desayunos.", veces: 2 },
  cierre: "Variar el desayuno puede empezar con una receta sencilla.",
});

export const pre018 = receta({
  codigo: "PRE-018",
  frase: "Armar juntos la lista de compras de la semana.",
  icono: "lista",
  etiquetas: ["Antes de comprar", "Papel o teléfono", "Juntos"],
  cuidados: [
    { icono: "conversar", texto: "No es una prueba de memoria." },
    { icono: "senalar", texto: "Aunque no organice todo, puede elegir un alimento." },
    { icono: "plata", texto: "Tengan en cuenta el presupuesto." },
  ],
  pasos: [
    paso("Revisar", "Revisen juntos la despensa y la refri.", "frasco"),
    {
      tipo: "lista",
      clave: "compras",
      titulo: "¿Qué falta?",
      nota: "Tocá lo que vayan anotando.",
      minimo: 1,
      sugerencias: [
        o("fruta", "Fruta", "fruta"),
        o("verduras", "Verduras", "lechuga"),
        o("frijoles", "Frijoles", "frijol"),
        o("huevos", "Huevos", "huevo"),
        o("pan", "Pan", "pan"),
        o("queso", "Queso", "queso"),
        o("pollo", "Pollo", "pollo"),
        o("arroz", "Arroz", "plato"),
      ],
      libre: "Otra cosa",
    },
    { tipo: "decir", titulo: "Si le cuesta decidir", frase: "¿Papaya o melón?", nota: "Dale dos opciones concretas y respetá lo que elija." },
    { tipo: "repaso", titulo: "Nuestra lista", partes: [{ etiqueta: "Para comprar", clave: "compras" }] },
  ],
  cierre: "Organizar juntos puede hacer más sencilla la semana.",
});

export const pre019 = receta({
  codigo: "PRE-019",
  frase: "Comparar dos yogures o dos quesos y elegir el más conveniente.",
  icono: "queso",
  etiquetas: ["En la compra", "Dos etiquetas", "El que más le guste"],
  elegir: [elegir("lacteo", "¿Qué comparamos?", [o("yogur", "Dos yogures naturales", "yogur"), o("queso", "Dos quesos", "queso")])],
  cuidados: [
    { icono: "rechazo", texto: "Con alergia a la proteína de la leche, lo deslactosado no sirve." },
    { icono: "vaso", texto: "Con intolerancia a la lactosa, lo deslactosado puede servir." },
    { icono: "rinon", texto: "Con bajo peso o enfermedad renal, la elección es individual." },
  ],
  pasos: [
    paso("Comparar", "Compará los dos por la misma cantidad.", "etiqueta"),
    paso("El yogur", "Elegí el que no tenga azúcar añadida.", "yogur", { si: { clave: "lacteo", es: ["yogur"] } }),
    paso("El queso", "Elegí uno pasteurizado, con menos sodio y grasa saturada.", "queso", { si: { clave: "lacteo", es: ["queso"] } }),
    paso("Quedarse con uno", "Quédense con el que mejor tolere y disfrute.", "estrella"),
  ],
  cierre: "Elegir bien también es pensar en lo que le gusta y tolera.",
});

export const pre021 = receta({
  codigo: "PRE-021",
  frase: "Sumar la linaza molida que le indicaron a una preparación húmeda.",
  icono: "frasco",
  etiquetas: ["Solo si se la indicaron", "En yogur", "Con cuidado"],
  cuidado: "Si le cuesta tragar, no empiecen sin una valoración.",
  cuidados: [
    { icono: "cuchara", texto: "Con problemas para tragar, estrechez del esófago o del intestino, primero una valoración." },
    { icono: "vaso", texto: "Subí la fibra poco a poco y respetá su límite de líquidos." },
  ],
  pasos: [
    paso("Primero", "Solo si ya le indicaron linaza molida.", "lista"),
    paso("En algo húmedo", "Agregá la cantidad de su plan a algo húmedo, como yogur.", "yogur"),
    paso("Nunca chía seca", "Nunca chía seca, ni con un sorbo de agua.", "rechazo", { nota: "Para chía o chan, pidan a nutrición una receta con cantidades." }),
  ],
  cierre: "La forma de preparar un alimento también importa.",
});

export const pre022 = receta({
  codigo: "PRE-022",
  frase: "Un huevo bien cocido en lugar de salchichón o salchichas.",
  icono: "huevo",
  etiquetas: ["1 desayuno", "Bien cocido", "Esta semana"],
  cuidado: "Con alergia al huevo, no lo ofrezcás.",
  elegir: [elegir("forma", "¿Cómo lo preparamos?", [o("hervido", "Hervido", "huevo"), o("sarten", "En sartén, con poco aceite", "sarten")])],
  cuidados: [
    { icono: "huevo", texto: "Con alergia, evitalo." },
    { icono: "lista", texto: "No es un huevo diario para todos: depende de su salud." },
  ],
  pasos: [
    paso("Bien cocido", "Cocinalo hasta que la clara y la yema estén firmes.", "huevo"),
    paso("En lugar de", "Ofrecelo en lugar de salchichón o salchichas.", "plato"),
    paso("Acompañar", "Acompañalo con vegetales que le gusten.", "lechuga"),
  ],
  mision: { texto: "Un desayuno con huevo.", veces: 1 },
  cierre: "Una opción sencilla puede renovar un desayuno de siempre.",
});

export const pre023 = receta({
  codigo: "PRE-023",
  frase: "Una comida tranquila, a su ritmo y con comodidad.",
  icono: "silla",
  etiquetas: ["Hoy", "1 comida", "A su ritmo"],
  cuidado: "Si tose, se atraganta o se cansa, paren y consulten.",
  cuidados: [
    { icono: "urgente", texto: "Si aparece tos, atragantamiento o cansancio, paren y consulten." },
    { icono: "cuchara", texto: "Comer despacio no trata la dificultad para tragar." },
    { icono: "plato", texto: "Con bajo peso, las pausas no son para que coma menos." },
  ],
  pasos: [
    paso("Cómodo", "Ayudalo a sentarse con comodidad.", "silla"),
    paso("Sin distracciones", "Apaguen lo que distraiga.", "volumen"),
    paso("A su ritmo", "Que coma a su ritmo, con pausas si las necesita.", "reloj", { nota: "Sin contar masticadas." }),
    paso("Observar", "Fijate si está cómodo o se cansa.", "lupa"),
  ],
  mision: { texto: "Una comida tranquila.", veces: 1 },
  cierre: "Acompañá su ritmo y prestá atención a su comodidad.",
});

export const pre024 = receta({
  codigo: "PRE-024",
  marcaElegida: true,
  frase: "Banano o papaya en una mañana, en lugar de jugo.",
  icono: "platano",
  etiquetas: ["1 vez", "Fruta entera", "Esta semana"],
  elegir: [
    elegir("fruta", "¿Banano o papaya?", [o("banano", "Banano", "platano"), o("papaya", "Papaya", "fruta")], "Elíjanla juntos."),
    elegir("momento", "¿Cuándo?", [o("desayuno", "En el desayuno", "taza"), o("merienda", "En la merienda", "pan")]),
  ],
  cuidados: [
    { icono: "rinon", texto: "Con restricción de potasio o medicinas que lo suben, consultá antes." },
    { icono: "lista", texto: "Con diabetes, respetá las porciones; no hace falta prohibirla." },
    { icono: "cuchara", texto: "Adaptá la textura si lo necesita." },
  ],
  pasos: [
    paso("La porción", "Ofrecé la fruta en su porción, en lugar de jugo.", "plato"),
    paso("Para la semana", "Comprá algunas menos maduras para ir usando.", "bolso"),
  ],
  mision: { texto: "Fruta entera en una mañana.", veces: 1 },
  cierre: "Variar las frutas puede hacer más agradable la rutina.",
});

export const pre025 = receta({
  codigo: "PRE-025",
  frase: "Pejibaye en una merienda, en lugar de repostería.",
  icono: "fruta",
  etiquetas: ["1 merienda", "Bien cocido", "Si le gusta"],
  cuidado: "Con boca seca, problemas dentales o para tragar, solo con la adaptación indicada.",
  cuidados: [
    { icono: "cuchara", texto: "Con boca seca, problemas dentales o disfagia, solo con la adaptación indicada." },
    { icono: "lista", texto: "Ajustá la cantidad por diabetes, energía o sodio." },
  ],
  pasos: [
    paso("Prepararlo", "Ofrecelo bien cocido, pelado y sin semilla.", "sopa"),
    paso("En lugar de", "En una merienda, en lugar de repostería.", "pan"),
    paso("Con cuidado", "Poca mayonesa, y fijate si se cocinó con sal.", "botella"),
  ],
  mision: { texto: "Pejibaye en una merienda.", veces: 1 },
  cierre: "Respetar sus gustos también ayuda a cuidar la alimentación.",
});

export const pre026 = receta({
  codigo: "PRE-026",
  frase: "Aguacate majado en lugar de mantequilla o manteca.",
  icono: "aguacate",
  etiquetas: ["2 veces", "En pan o tortilla", "Esta semana"],
  elegir: [elegir("base", "¿En qué lo untamos?", [o("pan", "En pan", "pan"), o("tortilla", "En tortilla", "plato")])],
  cuidados: [
    { icono: "rinon", texto: "Con restricción de potasio, confirmá la porción." },
    { icono: "pastillas", texto: "Con warfarina, coordiná los cambios grandes de la dieta." },
    { icono: "cuchara", texto: "Adaptá el acompañamiento si le cuesta tragar." },
  ],
  pasos: [
    paso("Majar", "Majá el aguacate y untalo en lugar de mantequilla.", "aguacate"),
    paso("Un toque", "Si le gusta, un poco de limón u orégano.", "limon"),
    paso("La cantidad", "La de su plan: los aguacates varían mucho.", "cuchara"),
  ],
  mision: { texto: "Aguacate 2 veces esta semana.", veces: 2 },
  cierre: "Una sustitución pequeña puede conservar un sabor que disfruta.",
});

export const pre027 = receta({
  codigo: "PRE-027",
  frase: "Un vaso de agua para empezar el día, cinco mañanas.",
  icono: "vaso",
  etiquetas: ["5 mañanas", "Un vaso", "A su ritmo"],
  cuidado: "Solo si su plan de líquidos lo permite.",
  elegir: [elegir("momento", "¿Cuándo se lo ofrecemos?", [o("levantarse", "Al levantarse", "sol"), o("desayuno", "Al empezar el desayuno", "taza")])],
  cuidados: [
    { icono: "vaso", texto: "Cuenta dentro de todo lo que toma en el día." },
    { icono: "cuchara", texto: "Con restricción de líquidos, sodio bajo o problemas para tragar, lo que indicó su equipo." },
  ],
  pasos: [
    paso("El vaso", "Usá un vaso fácil de sostener.", "vaso"),
    paso("A su ritmo", "Que tome a su ritmo, sin obligarlo a terminar.", "reloj"),
    paso("Sin esperar", "No esperés solo a que la pida.", "jarra"),
  ],
  mision: { texto: "Un vaso de agua en 5 mañanas.", veces: 5 },
  cierre: "Un momento conocido puede ayudar a recordar la hidratación.",
});

export const pre028 = receta({
  codigo: "PRE-028",
  frase: "Vegetales al vapor en una comida de la semana.",
  icono: "zanahoria",
  etiquetas: ["1 comida", "Al vapor", "Esta semana"],
  cuidado: "Solo si no le indicaron otra forma de cocinarlos.",
  elegir: [
    {
      tipo: "lista",
      clave: "vegetales",
      titulo: "¿Qué vegetales?",
      nota: "Uno o varios.",
      minimo: 1,
      sugerencias: [o("chayote", "Chayote", "fruta"), o("zanahoria", "Zanahoria", "zanahoria"), o("vainicas", "Vainicas", "hoja")],
      libre: "Otro vegetal",
    },
  ],
  cuidados: [
    { icono: "rinon", texto: "Con restricción de potasio, confirmá la preparación y no reusés el agua." },
    { icono: "cuchara", texto: "Con disfagia, suave no alcanza: la textura indicada." },
  ],
  pasos: [
    paso("Preparar", "Lavá y cortá los vegetales.", "lavar"),
    paso("Al vapor", "En una rejilla sobre el agua, tapá y cociná.", "sopa", { nota: "Hasta la suavidad que necesita." }),
    paso("Con cuidado", "Cuidado con el vapor al destapar.", "urgente"),
  ],
  mision: { texto: "Vegetales al vapor en una comida.", veces: 1 },
  cierre: "La mejor preparación es la que se adapta a sus necesidades.",
});

export const pre029 = receta({
  codigo: "PRE-029",
  frase: "Plátano maduro asado, en lugar de repostería.",
  icono: "platano",
  etiquetas: ["1 merienda", "Algo dulce de casa", "Esta semana"],
  cuidados: [
    { icono: "lista", texto: "Con diabetes o restricción de potasio, ajustá la cantidad." },
    { icono: "cuchara", texto: "Adaptá la textura si hace falta." },
    { icono: "plato", texto: "Con bajo peso o poco apetito, no le quités energía." },
  ],
  pasos: [
    paso("El antojo", "Ofrecé plátano maduro asado, en su porción.", "platano"),
    paso("La temperatura", "Esperá a que esté tibio, cómodo para comer.", "reloj"),
    paso("Si no sabés", "Usá una receta completa y revisada.", "libreta"),
  ],
  mision: { texto: "Plátano maduro en una merienda.", veces: 1 },
  cierre: "Algo dulce también puede tener sabor a casa.",
});

export const pre030 = receta({
  codigo: "PRE-030",
  frase: "Organizar el plato del almuerzo como una guía flexible.",
  icono: "plato",
  etiquetas: ["1 almuerzo", "Una guía", "Esta semana"],
  cuidados: [
    { icono: "plato", texto: "Con bajo peso, poco apetito, desnutrición o enfermedad renal, puede cambiar." },
    { icono: "lechuga", texto: "No llenés el plato de vegetales a costa de lo que necesita." },
  ],
  pasos: [
    paso("La mitad", "Vegetales sin almidón.", "lechuga"),
    paso("Un cuarto", "Proteína.", "pollo"),
    paso("El otro cuarto", "Arroz, pasta, tortilla o tubérculo.", "tuberculo", { nota: "Las leguminosas, según su plan: aportan proteína y carbohidratos." }),
  ],
  mision: { texto: "Un almuerzo con el plato organizado.", veces: 1 },
  cierre: "Usá el plato como una guía flexible, no como una regla rígida.",
});

export const pre031 = receta({
  codigo: "PRE-031",
  frase: "Pitahaya de temporada, si le gusta.",
  icono: "fruta",
  etiquetas: ["1 vez", "De temporada", "Si le gusta"],
  cuidados: [
    { icono: "urgente", texto: "El color rojo no descarta un sangrado. Si dura o hay otros síntomas, consultá." },
    { icono: "urgente", texto: "Con dolor fuerte o mucha debilidad, buscá atención médica." },
    { icono: "cuchara", texto: "Adaptá porción y textura." },
  ],
  pasos: [
    paso("Prepararla", "Lavá la cáscara, abrila y serví la pulpa.", "lavar"),
    paso("La porción", "La de sus indicaciones.", "plato"),
    paso("Un aviso", "Puede poner roja la orina o las heces.", "lupa", { nota: "Si el cambio es dudoso o dura, consultá." }),
  ],
  mision: { texto: "Pitahaya en una merienda.", veces: 1 },
  cierre: "Aprovechá la temporada para variar las frutas que disfruta.",
});

export const pre034 = receta({
  codigo: "PRE-034",
  frase: "Comparar dos acompañamientos del café y elegir mejor.",
  icono: "taza",
  etiquetas: ["Para el café", "Dos etiquetas", "Sin perder el gusto"],
  cuidados: [
    { icono: "lista", texto: "Con diabetes, mirá los carbohidratos y la porción." },
    { icono: "nuez", texto: "Frutos secos enteros, solo si mastica y traga bien." },
    { icono: "pan", texto: "Las galletas no son todas del mismo tamaño." },
  ],
  pasos: [
    paso("Comparar", "Compará dos acompañamientos por la misma cantidad.", "etiqueta"),
    paso("Qué mirar", "Azúcares añadidos, carbohidratos, grasa saturada y sodio.", "etiqueta"),
    paso("Otra opción", "Fruta o frutos secos, si le sirven.", "fruta"),
  ],
  cierre: "El café puede seguir siendo un momento para disfrutar.",
});

export const pre036 = receta({
  codigo: "PRE-036",
  marcaElegida: true,
  frase: "Mamón chino o jocotes de temporada, preparados con cuidado.",
  icono: "fruta",
  etiquetas: ["1 vez", "Sin semillas", "Si puede comerlos"],
  cuidado: "Solo si puede comerlos con seguridad.",
  elegir: [elegir("fruta", "¿Cuál le gusta?", [o("mamon", "Mamón chino", "fruta"), o("jocotes", "Jocotes", "fruta")])],
  cuidados: [
    { icono: "cuchara", texto: "Mucho cuidado si le cuesta tragar, masticar o sacar semillas." },
    { icono: "lista", texto: "Con diabetes o restricción de potasio, ajustá la cantidad." },
  ],
  pasos: [
    paso("Prepararla", "Lavala y sacá la pulpa, sin semillas ni huesos.", "lavar"),
    paso("Servir", "Serví la cantidad indicada en un tazón y guardá el resto.", "taza"),
    paso("Ayudar", "Ayudalo a pelar si lo necesita.", "senalar"),
  ],
  mision: { texto: "Fruta de temporada en una merienda.", veces: 1 },
  cierre: "La fruta de temporada también puede ser parte de su rutina.",
});

export const pre037 = receta({
  codigo: "PRE-037",
  frase: "Pescado bien cocido, preparado de una forma que ya conozcan.",
  icono: "pescado",
  etiquetas: ["1 comida", "Sin espinas", "Esta semana"],
  cuidado: "Con alergia al pescado, no lo ofrezcás.",
  elegir: [elegir("coccion", "¿Cómo lo preparamos?", coccion)],
  cuidados: [alergiaPescado, renalPescado],
  pasos: [
    paso("Cocinar", "Cocinalo bien, de la forma que ya sabés.", "pescado"),
    paso("Las espinas", "Revisá con cuidado que no queden espinas.", "lupa"),
    paso("Acompañar", "Acompañalo con lo que disfrute.", "plato"),
  ],
  mision: { texto: "Una comida con pescado.", veces: 1 },
  cierre: "Cambiar la preparación da variedad a un alimento conocido.",
});

export const pre038 = receta({
  codigo: "PRE-038",
  frase: "Una granadilla para la merienda, con cuchara.",
  icono: "fruta",
  etiquetas: ["2 meriendas", "Con cuchara", "Si le gusta"],
  cuidado: "Con disfagia o riesgo de atragantarse, solo adaptada.",
  cuidados: [
    { icono: "cuchara", texto: "Con disfagia o riesgo de atragantarse, no la ofrezcás sin adaptar." },
    { icono: "lista", texto: "Respetá si tiene una dieta baja en residuos." },
    { icono: "urgente", texto: "Estreñimiento que dura, dolor o sangrado: consultá." },
  ],
  pasos: [
    paso("Abrirla", "Lavá la cáscara y abrí la granadilla.", "lavar"),
    paso("Con cuchara", "Ofrecé la pulpa con cuchara.", "cuchara"),
    paso("Agua", "Ofrecé agua, si su plan lo permite.", "vaso"),
  ],
  mision: { texto: "Granadilla en 2 meriendas, si le gusta.", veces: 2 },
  cierre: "Variar la fruta puede empezar por una opción sencilla.",
});

export const pre039 = receta({
  codigo: "PRE-039",
  frase: "Aceite de oliva en lugar de otra grasa, en una comida de hoy.",
  icono: "aceite",
  etiquetas: ["Hoy", "1 comida", "Medido"],
  cuidados: [
    { icono: "aceite", texto: "Con indicación de menos grasa, confirmá la cantidad." },
    { icono: "lista", texto: "No sumés una cucharada diaria a lo que ya come." },
    { icono: "frasco", texto: "Guardalo tapado, lejos de la luz y el calor." },
  ],
  pasos: [
    paso("El cambio", "Usá aceite de oliva extra virgen en lugar de otra grasa.", "aceite"),
    paso("Medir", "Medí la cantidad de su plan antes de servir.", "cuchara"),
    paso("Dónde", "Podés ponerlo sobre los vegetales ya listos.", "lechuga"),
  ],
  mision: { texto: "Aceite de oliva en una comida.", veces: 1 },
  cierre: "Un cambio útil puede empezar por reemplazar una grasa.",
});

export const pre042 = receta({
  codigo: "PRE-042",
  marcaElegida: true,
  frase: "Probar otra hoja verde en tres comidas de la semana.",
  icono: "acelga",
  etiquetas: ["3 comidas", "Cocida", "Esta semana"],
  elegir: [
    elegir(
      "hoja",
      "¿Qué hoja probamos?",
      [o("espinaca", "Espinaca", "hoja", "la espinaca"), o("acelga", "Acelga", "acelga", "la acelga"), o("mostaza", "Mostaza", "mostaza", "la mostaza")],
      "Elíjanla juntos en la compra.",
    ),
    elegir("forma", "¿Cómo la preparamos?", [o("huevo", "En un huevo", "huevo"), o("picadillo", "En un picadillo", "sarten"), o("tapada", "Tapada, con poca agua", "sopa")]),
  ],
  cuidados: [
    { icono: "pastillas", texto: "Con warfarina, mantené una cantidad estable y coordiná los cambios." },
    { icono: "rinon", texto: "Con restricción de potasio o cálculos por oxalato, consultá qué hojas." },
    { icono: "cuchara", texto: "Adaptá la textura si le cuesta tragar." },
  ],
  pasos: [paso("Lavarla", "Lavá bien {hoja}.", "lavar"), paso("Cocinarla", "Cocinala hasta la textura que necesita.", "sarten")],
  mision: { texto: "Una hoja nueva en 3 comidas.", veces: 3 },
  cierre: "Una hoja diferente puede renovar una receta conocida.",
});

export const pre043 = receta({
  codigo: "PRE-043",
  frase: "Preparar una mezcla de especias para usar en lugar de la sal.",
  icono: "frasco",
  etiquetas: ["Un frasco", "Sin sal", "Para varias comidas"],
  cuidados: [
    { icono: "rechazo", texto: "Si algo le cae mal, sacalo de la mezcla." },
    { icono: "lista", texto: "Respetá su indicación de sodio." },
    { icono: "rinon", texto: "No cambiés la sal por productos con potasio sin revisar riñones y medicinas." },
  ],
  pasos: [
    {
      tipo: "preparar",
      titulo: "Lo que necesitás",
      nota: "Ajo en polvo, no sal de ajo.",
      items: [
        { icono: "frasco", texto: "Un frasco limpio y seco" },
        { icono: "cebolla", texto: "2 cucharadas de ajo en polvo" },
        { icono: "hoja", texto: "1 de orégano seco" },
        { icono: "cuchara", texto: "1 de comino" },
        { icono: "chile", texto: "Una pizca de pimienta" },
      ],
    },
    paso("Mezclar", "Mezclá todo, tapá y guardá en un lugar seco.", "frasco"),
    paso("Probar", "Probá un poquito en una comida, en lugar de la sal.", "cuchara"),
  ],
  mision: { texto: "La mezcla en una comida.", veces: 1 },
  cierre: "Encontrar un sabor que le guste ayuda a sostener el cambio.",
});

export const pre044 = receta({
  codigo: "PRE-044",
  frase: "Una comida práctica con sardinas en lata.",
  icono: "lata",
  etiquetas: ["1 comida", "Lata", "Esta semana"],
  cuidado: "Con alergia al pescado, no las ofrezcás.",
  cuidados: [
    alergiaPescado,
    renalPescado,
    { icono: "estrella", texto: "Si ya hubo pescado esta semana, es una opción, no una obligación." },
  ],
  pasos: [
    paso("Comparar", "Compará el sodio y elegí la lata con menos.", "etiqueta"),
    paso("Escurrir", "Escurrilas y revisá espinas y textura.", "lata"),
    paso("Acompañar", "Acompañalas con vegetales y algo de siempre.", "plato"),
  ],
  mision: { texto: "Una comida con sardinas.", veces: 1 },
  cierre: "Tener una opción práctica facilita variar las comidas.",
});

export const pre046 = receta({
  codigo: "PRE-046",
  frase: "Fruta en la textura que le va bien, sentado y sin apuro.",
  icono: "fruta",
  etiquetas: ["1 merienda", "Textura adecuada", "Sin apuro"],
  cuidado: "Si tose o se atraganta, paren y consulten.",
  elegir: [
    elegir(
      "forma",
      "¿Cómo se la preparamos?",
      [o("pelada", "Pelada", "fruta"), o("trozos", "En trozos", "tenedor"), o("cocida", "Cocida", "sopa")],
      "Solo una forma que sea segura para tu familiar.",
    ),
  ],
  cuidados: [
    { icono: "cuchara", texto: "Con disfagia, la textura indicada: cocida no siempre es segura." },
    { icono: "urgente", texto: "Si tose o se atraganta, paren y consulten." },
    { icono: "molestia", texto: "Revisá si hay dolor dental o prótesis flojas." },
  ],
  pasos: [paso("Sentado", "Ofrecela sentado y sin apuro.", "silla"), paso("Sin exigir", "No hace falta que sea firme ni con cáscara.", "estrella")],
  mision: { texto: "Fruta a su ritmo en una merienda.", veces: 1 },
  cierre: "Adaptar la textura permite cuidar la comodidad al comer.",
});

export const pre048 = receta({
  codigo: "PRE-048",
  frase: "Una fuente de proteína en cinco desayunos.",
  icono: "huevo",
  etiquetas: ["5 desayunos", "Proteína", "Esta semana"],
  elegir: [
    {
      tipo: "lista",
      clave: "proteinas",
      titulo: "¿Qué proteínas usamos?",
      nota: "Las que se ajusten a sus indicaciones.",
      minimo: 1,
      sugerencias: [
        o("huevo", "Huevo bien cocido", "huevo"),
        o("frijoles", "Frijoles", "frijol"),
        o("yogur", "Yogur natural", "yogur"),
        o("queso", "Queso pasteurizado", "queso"),
      ],
    },
  ],
  cuidados: [
    { icono: "plato", texto: "No todas aportan lo mismo en cualquier cantidad." },
    { icono: "rinon", texto: "Con enfermedad renal u otra restricción, consultá porciones." },
    { icono: "cuchara", texto: "Adaptá por alergias y si le cuesta tragar." },
  ],
  pasos: [paso("El pinto", "El gallo pinto ya trae frijoles: revisá la cantidad.", "frijol")],
  mision: { texto: "Proteína en 5 desayunos.", veces: 5 },
  cierre: "Un desayuno suficiente también puede ser sencillo.",
});

export const pre049 = receta({
  codigo: "PRE-049",
  marcaElegida: true,
  frase: "Camote, yuca o tiquizque en lugar del arroz o la pasta.",
  icono: "tuberculo",
  etiquetas: ["1 comida", "Bien cocido", "Esta semana"],
  elegir: [
    elegir("tuberculo", "¿Cuál usamos?", [o("camote", "Camote", "tuberculo"), o("yuca", "Yuca", "tuberculo"), o("tiquizque", "Tiquizque", "tuberculo")]),
  ],
  cuidados: [
    { icono: "lista", texto: "Con diabetes o restricción de potasio, ajustá cantidad y preparación." },
    { icono: "plato", texto: "Los tubérculos no son iguales entre sí." },
    { icono: "cuchara", texto: "Con disfagia, la textura indicada." },
  ],
  pasos: [
    paso("Cocinar", "Pelalo y cocinalo por completo.", "sopa", { nota: "Nunca yuca cruda ni a medio cocinar." }),
    paso("En el plato", "Ponelo en lugar del arroz o la pasta, en su porción.", "plato"),
    paso("Acompañar", "Acompañalo con proteína y vegetales.", "pollo"),
  ],
  mision: { texto: "Un tubérculo en una comida.", veces: 1 },
  cierre: "Los alimentos de siempre también permiten una mesa variada.",
});

export const NUTRICION: Guion[] = [
  pre001,
  pre002,
  pre003,
  pre004,
  pre006,
  pre007,
  pre008,
  pre009,
  pre010,
  pre011,
  pre012,
  pre013,
  pre014,
  pre015,
  pre016,
  pre018,
  pre019,
  pre021,
  pre022,
  pre023,
  pre024,
  pre025,
  pre026,
  pre027,
  pre028,
  pre029,
  pre030,
  pre031,
  pre034,
  pre036,
  pre037,
  pre038,
  pre039,
  pre042,
  pre043,
  pre044,
  pre046,
  pre048,
  pre049,
];
