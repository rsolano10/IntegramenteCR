import type { NombreIcono } from "../iconos";
import type { Categoria, Escena, Guion, Item, Opcion } from "../tipos";

// Gerontogimnasia 11 a 30 (business/claude_code_recursos_gerontogimnasia_11_30.md).
// Mismo arco que los primeros diez (cuándo parar → preparar → video →
// consignas → el trabajo → descanso → cómo se siente → cierre), con lo que
// estos recursos suman: series con descanso guiado entre una y otra, el
// reto cognitivo opcional en pantalla (categorías y secuencias), y juegos
// propios donde el ejercicio lo pide: colores (12, 14, 26), orientación
// (25), memoria de objetos (24) y reacción (27, 30).
// Textos cortos derivados de las fichas: pendientes de revisión clínica.

interface Ejercicio {
  codigo: string;
  frase: string;
  icono: NombreIcono;
  etiquetas: string[];
  cuidado: string;
  ayuda: string[];
  // Antes de preparar (por ejemplo, elegir la variante de hoy).
  antes?: Escena[];
  preparar: Item[];
  consignas: { titulo: string; texto: string; icono: NombreIcono; si?: Escena["si"] }[];
  trabajo: Escena[];
  reto?: Escena;
  descanso: number;
  cierre: string;
}

const consejoBase = "Hacé el movimiento vos primero y esperá. No hace falta que lo recuerde.";

function ejercicio(e: Ejercicio): Guion {
  // Con consignas que dependen de la variante, sin «paso 1 de 3» (no siempre se ven todas).
  const numerar = !e.consignas.some((c) => c.si);
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
      ...e.consignas.map(({ si, ...c }, i): Escena => ({ tipo: "consigna", ...(numerar ? { paso: { n: i + 1, de: e.consignas.length } } : {}), ...c, ...(si ? { si } : {}) })),
      ...e.trabajo,
      ...(e.reto ? [e.reto] : []),
      { tipo: "descanso", titulo: e.descanso >= 60 ? "Un minuto de descanso" : "Un descanso corto", segundos: e.descanso, texto: "Sentados, respirando tranquilos." },
      { tipo: "sentir", titulo: "¿Cómo se siente ahora?" },
      { tipo: "cierre", texto: e.cierre, dato: true },
    ],
  };
}

// ─── Para el reto cognitivo ───
const CAT: Record<string, Categoria> = {
  frutas: { id: "frutas", texto: "Frutas", icono: "fruta", ejemplos: ["mango", "piña", "banano", "papaya", "sandía", "naranja", "guayaba"] },
  animales: { id: "animales", texto: "Animales", icono: "perro", ejemplos: ["perro", "gato", "vaca", "gallina", "caballo", "mono", "perico"] },
  cocina: { id: "cocina", texto: "Cosas de la cocina", icono: "sarten", ejemplos: ["cuchara", "olla", "sartén", "plato", "taza", "colador", "tenedor"] },
  ropa: { id: "ropa", texto: "Ropa", icono: "ropa", ejemplos: ["camisa", "pantalón", "medias", "suéter", "zapatos", "sombrero", "faja"] },
  transporte: { id: "transporte", texto: "Medios de transporte", icono: "bus", ejemplos: ["bus", "carro", "tren", "bicicleta", "moto", "avión", "barco"] },
  casa: { id: "casa", texto: "Cosas de la casa", icono: "casa", ejemplos: ["silla", "mesa", "cama", "lámpara", "escoba", "ventana", "sillón"] },
  paises: { id: "paises", texto: "Países o ciudades", icono: "mapa", ejemplos: ["Costa Rica", "España", "México", "Italia", "Panamá", "Perú", "Japón"] },
  farmacia: { id: "farmacia", texto: "Cosas de la farmacia", icono: "pastillas", ejemplos: ["algodón", "vendas", "termómetro", "jabón", "curitas", "alcohol", "crema"] },
};

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
const DE_DOS = ["2", "4", "6", "8", "10", "12", "14", "16", "18", "20"];
const ATRAS = ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
const PASOS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const reto = (cada: string, x: { categorias?: Categoria[]; secuencia?: string[]; titulo?: string; nota?: string }): Escena => ({
  tipo: "reto",
  titulo: x.titulo ?? "Sumale un reto",
  cada,
  ...(x.nota ? { nota: x.nota } : {}),
  ...(x.categorias ? { categorias: x.categorias } : {}),
  ...(x.secuencia ? { secuencia: x.secuencia } : {}),
});

const respirar = "Respirá con normalidad.";
const calzado: Item = { icono: "zapato", texto: "Calzado firme y antideslizante" };
const suelo: Item = { icono: "suelo", texto: "Espacio libre de obstáculos" };
const sillaFirme: Item = { icono: "silla", texto: "Silla firme, sin ruedas" };
const sillaRespaldo: Item = { icono: "silla", texto: "Silla firme con respaldo, sin ruedas" };
const apoyoFirme: Item = { icono: "apoyo", texto: "Barra o mostrador firme al alcance" };
const acompanante: Item = { icono: "conversar", texto: "Alguien que acompañe toda la actividad" };

// ─── 11 a 30 ───

export const ger011 = ejercicio({
  codigo: "GER-011",
  frase: "Caminar dando toques suaves a un globo, sin perder el equilibrio.",
  icono: "globo",
  etiquetas: ["3 series de 20 a 30 s", "Un globo", "Espacio despejado"],
  cuidado: "No persigan el globo si se aleja ni dejen sus ayudas para caminar.",
  ayuda: ["Puede caminar con el globo en las dos manos, sin darle toques.", "Si necesita las manos para levantarse, que se apoye antes de tomar el globo."],
  preparar: [sillaFirme, { icono: "globo", texto: "Un globo inflado" }, suelo, calzado],
  consignas: [
    { titulo: "Levantarse", texto: "Levantate con el globo en las dos manos y quedate firme.", icono: "figura-de-pie" },
    { titulo: "Caminar", texto: "Caminá despacio dando toques suaves al globo, alternando las manos.", icono: "figura-camina" },
    { titulo: "Terminar", texto: "Sujetá el globo y sentate con calma.", icono: "figura-sentada" },
  ],
  trabajo: [
    {
      tipo: "tiempo",
      modo: "recorrido",
      titulo: "3 series caminando",
      nota: "De 20 a 30 segundos cada una. Tocá el círculo al terminar.",
      segundos: 30,
      minimo: 20,
      intentos: 3,
      descansoEntre: 45,
      recordatorios: ["Ritmo cómodo.", "La estabilidad antes que la velocidad.", "Si el globo se aleja, dejalo ir."],
    },
  ],
  reto: reto("mientras camina", { categorias: [CAT.frutas, CAT.animales] }),
  descanso: 60,
  cierre: "Así practican llevar cosas mientras caminan por la casa.",
});

export const ger012 = ejercicio({
  codigo: "GER-012",
  frase: "Tocar marcas de colores con la punta del pie, con un apoyo firme.",
  icono: "marcas",
  etiquetas: ["2 series", "6 a 8 por pie", "Con apoyo"],
  cuidado: "Siempre al menos una mano en un apoyo firme. Marcas bien pegadas al suelo.",
  ayuda: ["Usen solo dos marcas, más cerca de los pies, con las dos manos apoyadas."],
  preparar: [{ icono: "apoyo", texto: "Barra, mostrador o pared firme" }, { icono: "marcas", texto: "Marcas de colores bien pegadas al suelo" }, calzado],
  consignas: [
    { titulo: "Agarrarse", texto: "Una mano en el apoyo y los dos pies firmes.", icono: "figura-de-pie" },
    { titulo: "Tocar", texto: "Llevá un pie hacia una marca y tocala suavemente.", icono: "figura-un-pie" },
    { titulo: "Volver", texto: "Volvé al centro despacio antes del siguiente toque.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "6 a 8 toques con cada pie",
      nota: "Tocá el círculo en cada toque y vuelta al centro.",
      min: 6,
      max: 8,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Lento y preciso.", "Volvé al centro cada vez.", "Bien agarrado.", respirar],
    },
    {
      tipo: "colores",
      titulo: "Desafío: una secuencia de colores",
      nota: "Si ya lo dominan: toquen las marcas en este orden, volviendo al centro cada vez.",
      colores: ["verde", "rojo", "naranja", "negro"],
      largo: 3,
      maxLargo: 4,
      accion: "Tocá cada marca con el pie y volvé al centro.",
    },
  ],
  reto: reto("con cada toque", { categorias: [CAT.cocina, CAT.casa] }),
  descanso: 60,
  cierre: "Pasos precisos para esquivar objetos y moverse con seguridad.",
});

export const ger013 = ejercicio({
  codigo: "GER-013",
  frase: "Girar el tronco despacio, con los pies firmes, para ganar estabilidad.",
  icono: "figura-gira",
  etiquetas: ["2 series", "6 a 8 giros por lado", "Sentado"],
  cuidado: "Con osteoporosis o problemas de columna, consulten antes de girar con peso.",
  ayuda: ["En una silla firme, sin peso y con los brazos cerca del cuerpo.", "El balón grande, solo con experiencia y alguien al lado."],
  preparar: [sillaFirme, { icono: "pesa", texto: "Mancuerna liviana o botella pequeña de agua" }, { icono: "pelota", texto: "Balón grande, solo si ya lo usan con experiencia" }],
  consignas: [
    { titulo: "Pies firmes", texto: "Sentate con los pies apoyados y un poco separados.", icono: "figura-sentada" },
    { titulo: "Girar", texto: "Con el peso al frente, girá el tronco despacio hacia un lado.", icono: "figura-gira" },
    { titulo: "Al centro", texto: "Volvé al centro y girá hacia el otro lado.", icono: "figura-gira" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "6 a 8 giros por lado",
      nota: "Tocá el círculo en cada giro y vuelta al centro.",
      min: 6,
      max: 8,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Los pies siempre apoyados.", "Despacio, sin forzar.", respirar, "Empezá sin peso o con poco."],
    },
  ],
  reto: reto("con cada giro", { secuencia: DIAS, titulo: "Sumale un reto: los días" }),
  descanso: 60,
  cierre: "Girar con control ayuda a alcanzar cosas, vestirse y conversar.",
});

export const ger014 = ejercicio({
  codigo: "GER-014",
  frase: "Caminar pisando referencias de colores, una por paso.",
  icono: "marcas",
  etiquetas: ["4 a 6 recorridos", "Colores en el suelo", "Ritmo cómodo"],
  cuidado: "Nada que se deslice. Plataformas altas, solo con acompañamiento capacitado.",
  ayuda: ["Usen hojas de colores pegadas al suelo, sin desniveles y a una distancia cómoda."],
  preparar: [{ icono: "marcas", texto: "Seis hojas o plataformas de colores, bien fijas" }, { icono: "suelo", texto: "Espacio amplio y despejado" }, { icono: "apoyo", texto: "Un apoyo firme, si lo necesita" }, calzado],
  consignas: [
    { titulo: "Mirar el camino", texto: "Miren juntos el recorrido de colores antes de empezar.", icono: "marcas" },
    { titulo: "Pisar", texto: "Poné un pie sobre cada color, a un ritmo cómodo.", icono: "figura-camina" },
    { titulo: "Llegar", texto: "Al final, los dos pies firmes antes de volver.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "colores",
      titulo: "El camino de colores",
      nota: "Descansen cada dos recorridos. Reto: que diga cada color antes de pisarlo.",
      colores: ["rojo", "celeste", "azul", "verde", "naranja", "amarillo"],
      fijas: [{ etiqueta: "Como en el video", colores: ["rojo", "celeste", "azul", "verde", "naranja", "amarillo"] }],
      largo: 6,
      accion: "Pisá cada color en este orden.",
      meta: 6,
    },
  ],
  descanso: 60,
  cierre: "Mirar dónde va cada pie ayuda a esquivar obstáculos y desniveles.",
});

export const ger015 = ejercicio({
  codigo: "GER-015",
  frase: "Rodar una pelota con un pie, con el peso firme en la otra pierna.",
  icono: "figura-pelota",
  etiquetas: ["2 series por pie", "20 a 30 segundos", "Con apoyo"],
  cuidado: "No carguen peso sobre la pelota. Si se aleja, no la persigan en un pie.",
  ayuda: ["Puede hacerlo sentado en una silla firme, rodando la pelota con cada pie."],
  preparar: [apoyoFirme, { icono: "pelota", texto: "Pelota pequeña, liviana y fácil de controlar" }, { icono: "silla", texto: "Silla firme, para la versión sentada" }],
  consignas: [
    { titulo: "Agarrarse", texto: "Una mano en el apoyo y el peso en una pierna.", icono: "figura-de-pie" },
    { titulo: "Rodar", texto: "Con el otro pie, rodá la pelota adelante y atrás, despacio.", icono: "figura-pelota" },
    { titulo: "Cambiar", texto: "Apoyá los dos pies antes de cambiar de pierna.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "tiempo",
      modo: "recorrido",
      titulo: "2 series con cada pie",
      nota: "De 20 a 30 segundos rodando la pelota. Tocá el círculo al terminar.",
      segundos: 30,
      minimo: 20,
      intentos: 2,
      lados: true,
      descansoEntre: 45,
      recordatorios: ["Despacio.", "Sin cargar peso en la pelota.", "Bien agarrado.", respirar],
    },
  ],
  reto: reto("mientras rueda la pelota", { categorias: [CAT.ropa, CAT.frutas] }),
  descanso: 60,
  cierre: "Sostenerse en una pierna es parte de cada paso que damos.",
});

export const ger016 = ejercicio({
  codigo: "GER-016",
  frase: "Tocar conos con el pie, del mismo lado y del contrario, bien agarrado.",
  icono: "cono",
  etiquetas: ["2 series", "4 a 6 por pie", "Dos manos en el apoyo"],
  cuidado: "Conos bajos y flexibles. Sin cruzar de más las piernas ni apoyarse en los conos.",
  ayuda: ["Usen marcas planas y toquen solo hacia el mismo lado, sin cruzar."],
  preparar: [apoyoFirme, { icono: "cono", texto: "Dos conos bajos o marcas de colores" }, calzado],
  consignas: [
    { titulo: "Agarrarse", texto: "Las dos manos en el apoyo, un cono a cada lado.", icono: "figura-de-pie" },
    { titulo: "Mismo lado", texto: "Tocá con el pie el cono de su mismo lado y volvé.", icono: "figura-un-pie" },
    { titulo: "Lado contrario", texto: "Ahora tocá el cono del otro lado y volvé al centro.", icono: "figura-lado" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "4 a 6 secuencias por pie",
      nota: "Una secuencia es un toque del mismo lado y uno del contrario. Tocá el círculo en cada una.",
      min: 4,
      max: 6,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Levantá y bajá el pie despacio.", "Volvé al centro cada vez.", "Las dos manos en el apoyo.", respirar],
    },
  ],
  reto: reto("con cada toque", { categorias: [CAT.transporte, CAT.animales] }),
  descanso: 60,
  cierre: "Levantar bien los pies ayuda a pasar umbrales y evitar tropiezos.",
});

export const ger017 = ejercicio({
  codigo: "GER-017",
  frase: "Mantenerse firme sobre una superficie que se mueve un poco, bien agarrado.",
  icono: "balancin",
  etiquetas: ["3 series", "15 a 20 segundos", "Con apoyo"],
  cuidado: "Las dos manos siempre en el apoyo, sin cerrar los ojos. Con cojín, alguien al lado.",
  ayuda: ["Háganlo en el suelo, con los pies al ancho de la cadera."],
  antes: [
    {
      tipo: "elegir",
      clave: "superficie",
      titulo: "¿Sobre qué lo hacen hoy?",
      nota: "Con caídas previas o poco equilibrio, en el suelo.",
      opciones: [
        { id: "suelo", texto: "En el suelo", icono: "suelo" },
        { id: "cojin", texto: "Cojín firme o balancín", icono: "balancin" },
      ],
    },
  ],
  preparar: [{ icono: "apoyo", texto: "Barra o superficie fija y resistente" }, { icono: "balancin", texto: "Cojín firme y delgado o balancín, que no se deslice" }, calzado],
  consignas: [
    { titulo: "Agarrarse", texto: "Las dos manos en el apoyo, pies al ancho de la cadera.", icono: "figura-de-pie" },
    { titulo: "Subir", texto: "Subí al cojín un pie a la vez, con alguien al lado.", icono: "balancin", si: { clave: "superficie", es: ["cojin"] } },
    { titulo: "Quedarse firme", texto: "Rodillas un poco flojas y la mirada al frente.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "tiempo",
      modo: "sostener",
      titulo: "3 series de 15 a 20 segundos",
      nota: "Sostengan hasta 20 segundos. Pueden bajar antes.",
      segundos: 20,
      intentos: 3,
      descansoEntre: 45,
      recordatorios: ["Bien agarrado.", "Mirá al frente.", respirar],
    },
  ],
  reto: reto("mientras se sostiene", { secuencia: ATRAS, titulo: "Sumale un reto: del 10 al 1", nota: "Primero en el suelo firme. Si le quita estabilidad, dejen el reto." }),
  descanso: 60,
  cierre: "Adaptarse a superficies distintas ayuda a vestirse y caminar seguro.",
});

export const ger018 = ejercicio({
  codigo: "GER-018",
  frase: "Pasar una pelota de una mano a la otra, sentado y con calma.",
  icono: "pelota",
  etiquetas: ["3 series", "30 a 45 segundos", "Sentado"],
  cuidado: "Si la pelota cae, no se agache de golpe: pidan ayuda para recogerla.",
  ayuda: ["Una pelota suave y un poco más grande, pasándola lento y cerca del cuerpo."],
  preparar: [sillaFirme, { icono: "pelota", texto: "Pelota liviana o medias enrolladas" }],
  consignas: [
    { titulo: "Sentarse", texto: "Sentate cómodo, con los dos pies apoyados.", icono: "figura-sentada" },
    { titulo: "Pasar", texto: "Pasá la pelota de una mano a la otra, frente al cuerpo.", icono: "pelota" },
    { titulo: "Desafío", texto: "Si sale fácil, un lanzamiento corto de mano a mano.", icono: "mano" },
  ],
  trabajo: [
    {
      tipo: "tiempo",
      modo: "recorrido",
      titulo: "3 series pasando la pelota",
      nota: "De 30 a 45 segundos cada una. Tocá el círculo al terminar.",
      segundos: 45,
      minimo: 30,
      intentos: 3,
      descansoEntre: 45,
      recordatorios: ["Movimiento fluido.", "Sin subir mucho los brazos.", respirar],
    },
  ],
  reto: reto("con cada pase", { secuencia: DE_DOS, titulo: "Sumale un reto: de dos en dos" }),
  descanso: 60,
  cierre: "Manos coordinadas para vestirse, cocinar y doblar la ropa.",
});

export const ger019 = ejercicio({
  codigo: "GER-019",
  frase: "Pasar la pelota por debajo de las piernas, dibujando un ocho.",
  icono: "figura-rodilla-arriba",
  etiquetas: ["2 series", "6 a 8 por pierna", "Sentado"],
  cuidado: "Siempre un pie en el suelo, sin inclinarse de más hacia adelante.",
  ayuda: ["Pasen la pelota por encima de los muslos, de un lado al otro."],
  preparar: [{ icono: "silla", texto: "Silla firme con respaldo, contra la pared" }, { icono: "pelota", texto: "Pelota liviana o medias enrolladas" }],
  consignas: [
    { titulo: "Sentarse", texto: "Sentate con los dos pies apoyados.", icono: "figura-sentada" },
    { titulo: "Por debajo", texto: "Levantá un poco una pierna y pasá la pelota por debajo.", icono: "figura-rodilla-arriba" },
    { titulo: "El ocho", texto: "Alterná las piernas, como dibujando un ocho.", icono: "pelota" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "6 a 8 pases por pierna",
      nota: "Tocá el círculo en cada pase por debajo.",
      min: 6,
      max: 8,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Despacio, sin lanzar.", "Sin despegarse del asiento.", "Un pie siempre en el suelo.", respirar],
    },
  ],
  reto: reto("con cada pase", { secuencia: MESES, titulo: "Sumale un reto: los meses" }),
  descanso: 60,
  cierre: "Brazos y piernas juntos, como al ponerse el pantalón o las medias.",
});

export const ger020 = ejercicio({
  codigo: "GER-020",
  frase: "Caminar por una escalerilla en el suelo, con los dos pies en cada cuadro.",
  icono: "escalerilla",
  etiquetas: ["4 a 6 recorridos", "Escalerilla o cinta", "Sin saltar"],
  cuidado: "La escalerilla bien extendida y fija. Sin saltar ni alargar los pasos.",
  ayuda: ["Cuatro cuadros amplios con cinta, junto a un apoyo firme."],
  preparar: [
    { icono: "escalerilla", texto: "Escalerilla, o 4 a 6 cuadros de cinta bien pegada" },
    { icono: "suelo", texto: "Espacio amplio y despejado" },
    calzado,
    { icono: "baston", texto: "Sus apoyos para caminar, si los usa" },
  ],
  consignas: [
    { titulo: "Mirar", texto: "Miren el recorrido y dónde termina.", icono: "escalerilla" },
    { titulo: "Cuadro a cuadro", texto: "Poné los dos pies dentro de cada cuadro antes de seguir.", icono: "figura-camina" },
    { titulo: "Girar", texto: "Al final, girá con calma para volver.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "De 4 a 6 recorridos",
      nota: "Tocá el círculo en cada recorrido completo. Descansen cada dos.",
      min: 4,
      max: 6,
      recordatorios: ["Despacio.", "Los dos pies en cada cuadro.", "Sin saltar.", "Girá con calma."],
    },
  ],
  reto: reto("en cada cuadro", { categorias: [CAT.casa, CAT.frutas] }),
  descanso: 60,
  cierre: "Calcular cada paso ayuda a moverse por espacios chicos.",
});

export const ger021 = ejercicio({
  codigo: "GER-021",
  frase: "Subir y bajar un step pasando de un color a otro, con apoyo.",
  icono: "figura-escalon",
  etiquetas: ["4 a 6 recorridos", "Step bajo", "Con apoyo"],
  cuidado: "Nunca cajas, libros ni bancos como step. Con alguien al lado.",
  ayuda: ["Sin step: tres marcas de colores en el suelo, con una pausa en cada una."],
  preparar: [
    { icono: "escalon", texto: "Step bajo, firme y antideslizante" },
    { icono: "aro", texto: "Dos aros o marcas de colores que no se deslicen" },
    { icono: "apoyo", texto: "Barra lateral o superficie fija" },
    calzado,
  ],
  consignas: [
    { titulo: "Empezar", texto: "Poné los dos pies dentro del primer color.", icono: "aro" },
    { titulo: "Subir", texto: "Agarrado del apoyo, subí al step un pie a la vez.", icono: "figura-escalon" },
    { titulo: "Bajar", texto: "Una pausa, mirá el otro color y bajá un pie a la vez.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "De 4 a 6 recorridos",
      nota: "Tocá el círculo en cada recorrido. Al terminar, giren con calma y vuelvan.",
      min: 4,
      max: 6,
      recordatorios: ["Bien agarrado al subir y al bajar.", "Una pausa arriba.", "Un pie a la vez.", "Sin apuro."],
    },
  ],
  reto: reto("con cada paso", { secuencia: PASOS, titulo: "Sumale un reto: contar los pasos", nota: "Primero en el suelo firme y después con el step." }),
  descanso: 60,
  cierre: "Mirar antes de bajar ayuda con escalones y desniveles.",
});

export const ger022 = ejercicio({
  codigo: "GER-022",
  frase: "Caminar de lado con una banda en los muslos, sin cruzar las piernas.",
  icono: "figura-lado",
  etiquetas: ["2 series", "6 a 8 pasos por lado", "Banda ligera"],
  cuidado: "Banda en buen estado y sobre las rodillas. Sin cruzar los pies.",
  ayuda: ["Sin banda, con pasos cortos y las dos manos en el apoyo."],
  preparar: [{ icono: "banda", texto: "Banda circular ligera, si la usan" }, apoyoFirme, { icono: "suelo", texto: "Espacio libre para caminar de lado" }, calzado],
  consignas: [
    { titulo: "La banda", texto: "Poné la banda sobre las rodillas y aflojá un poco las rodillas.", icono: "banda" },
    { titulo: "Paso al lado", texto: "Dá un paso hacia un lado y acercá el otro pie.", icono: "figura-lado" },
    { titulo: "Volver", texto: "Repetí hacia el otro lado, lento y sin cruzar.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "6 a 8 pasos hacia cada lado",
      nota: "Tocá el círculo en cada paso.",
      min: 6,
      max: 8,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Pies hacia adelante.", "Rodillas sin irse hacia adentro.", "Sin cruzar las piernas.", respirar],
    },
  ],
  reto: reto("con cada paso al lado", { categorias: [CAT.animales, CAT.frutas], nota: "Primero sin banda. Si le quita estabilidad, dejen el reto." }),
  descanso: 60,
  cierre: "Caderas fuertes para moverse entre los muebles con estabilidad.",
});

export const ger023 = ejercicio({
  codigo: "GER-023",
  frase: "Dar un paso adelante y volver, sintiendo cada momento del paso.",
  icono: "figura-tandem",
  etiquetas: ["2 series", "6 a 8 por pierna", "Con apoyo"],
  cuidado: "Las dos manos siempre en el apoyo. Pasos cortos, sin movimientos bruscos.",
  ayuda: ["Pasos más cortos, sin forzar el tobillo ni el largo del paso."],
  preparar: [{ icono: "apoyo", texto: "Barras paralelas o mostrador firme" }, suelo, calzado],
  consignas: [
    { titulo: "Despegar", texto: "Elevá un poco el talón y despegá la punta del pie.", icono: "figura-un-pie" },
    { titulo: "Adelante", texto: "Llevá el pie adelante y apoyá primero el talón.", icono: "figura-tandem" },
    { titulo: "Regresar", texto: "Volvé despacio al inicio, sin cruzar los pies.", icono: "figura-de-pie" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "6 a 8 pasos con cada pierna",
      nota: "Tocá el círculo en cada ida y vuelta.",
      min: 6,
      max: 8,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Talón, punta, adelante, talón.", "Las manos en el apoyo.", "Sin apuro.", respirar],
    },
  ],
  reto: reto("con cada ida y vuelta", { categorias: [CAT.frutas, CAT.animales], nota: "Lo más importante es la calidad del movimiento. Si le quita estabilidad, dejen el reto." }),
  descanso: 60,
  cierre: "Pensar cada paso ayuda a caminar con más control.",
});

const OBJETOS: Opcion[] = [
  { id: "cuchara", texto: "Cuchara", icono: "cuchara" },
  { id: "peine", texto: "Peine", icono: "peine" },
  { id: "llaves", texto: "Llaves", icono: "llaves" },
  { id: "vaso", texto: "Vaso", icono: "vaso" },
  { id: "lentes", texto: "Lentes", icono: "lentes" },
  { id: "celular", texto: "Celular", icono: "celular" },
  { id: "taza", texto: "Taza", icono: "taza" },
  { id: "lapiz", texto: "Lápiz", icono: "lapiz" },
];

export const ger024 = ejercicio({
  codigo: "GER-024",
  frase: "Recordar los objetos de la mesa mientras se trabajan los brazos.",
  icono: "mesa",
  etiquetas: ["2 o 3 rondas", "10 extensiones", "Con acompañante"],
  cuidado: "Peso ligero, codos sin trabar y los brazos nunca por encima de los hombros.",
  ayuda: ["Sentado y con dos objetos: quien acompaña los tapa en vez de girar.", "Con ayudas para caminar o poco equilibrio, siempre la versión sentada."],
  preparar: [
    { icono: "mesa", texto: "Una mesa" },
    { icono: "llaves", texto: "Tres objetos pequeños de la casa" },
    { icono: "pelota", texto: "Pelota con peso ligero o botella con un poco de agua" },
    acompanante,
  ],
  consignas: [
    { titulo: "Mirar", texto: "Mirá los objetos y dónde está cada uno.", icono: "lupa" },
    { titulo: "Darse vuelta", texto: "Girá despacio, con pasos cortos, de espaldas a la mesa.", icono: "figura-de-pie" },
    { titulo: "Extender", texto: "Pelota al pecho: extendé los brazos adelante y volvé.", icono: "pelota" },
  ],
  trabajo: [{ tipo: "objetos", titulo: "¿Qué cambió en la mesa?", objetos: OBJETOS, cuantos: 3, repeticiones: 10, observar: 15, rondas: 3 }],
  descanso: 60,
  cierre: "Así practicamos recordar dónde dejamos las cosas.",
});

export const ger025 = ejercicio({
  codigo: "GER-025",
  frase: "Recordar dónde está cada color y orientarse al cambiar de dirección.",
  icono: "marcas",
  etiquetas: ["2 series", "4 cambios", "Con acompañante"],
  cuidado: "Siempre acompañado. Los ojos vendados, solo si el equipo lo valoró antes.",
  ayuda: ["Empiecen sentados, con dos o tres colores en la mesa.", "Si cuesta distinguir colores, usen símbolos o figuras."],
  antes: [
    {
      tipo: "elegir",
      clave: "forma",
      titulo: "¿Cómo lo hacen hoy?",
      nota: "Con poco equilibrio, caídas o mareos: sentado.",
      opciones: [
        { id: "sentado", texto: "Sentado, en la mesa", icono: "figura-sentada" },
        { id: "pie", texto: "De pie, ojos abiertos", icono: "figura-de-pie" },
      ],
    },
  ],
  preparar: [{ icono: "marcas", texto: "Cuatro marcas planas de colores, bien fijas" }, sillaRespaldo, acompanante, calzado],
  consignas: [{ titulo: "Girar seguro", texto: "Pasos cortos al girar. Responder solo cuando esté quieto.", icono: "figura-de-pie", si: { clave: "forma", es: ["pie"] } }],
  trabajo: [
    { tipo: "orientacion", titulo: "¿Qué color quedó al frente?", colores: ["rojo", "azul", "amarillo", "verde"], cambios: 4, si: { clave: "forma", es: ["pie"] } },
    { tipo: "orientacion", titulo: "¿Qué color estaba ahí?", colores: ["rojo", "azul", "amarillo"], sentado: true, cambios: 4, si: { clave: "forma", es: ["sentado"] } },
  ],
  descanso: 60,
  cierre: "Así practicamos orientarnos al cambiar de dirección.",
});

export const ger026 = ejercicio({
  codigo: "GER-026",
  frase: "Alcanzar objetos de colores desde la silla, siguiendo una secuencia.",
  icono: "figura-alcance",
  etiquetas: ["2 series", "4 alcances por mano", "Sentado"],
  cuidado: "Pies y glúteos siempre apoyados. Nada tan lejos que obligue a levantarse.",
  ayuda: ["Dos objetos sobre una mesa, a una distancia cómoda, de a uno."],
  preparar: [
    { icono: "silla", texto: "Silla firme con respaldo, contra la pared" },
    { icono: "cono", texto: "Cuatro bolos o botellas: morado, celeste, rojo y verde" },
    { icono: "mesa", texto: "Una mesa firme, si cuesta alcanzar el suelo" },
  ],
  consignas: [
    { titulo: "Sentarse firme", texto: "Los dos pies bien apoyados en el suelo.", icono: "figura-sentada" },
    { titulo: "Alcanzar", texto: "Inclinate despacio desde la cadera y tocá el color.", icono: "figura-alcance" },
    { titulo: "Volver", texto: "Volvé derecho antes del siguiente color.", icono: "figura-sentada" },
  ],
  trabajo: [
    {
      tipo: "colores",
      titulo: "La secuencia de colores",
      nota: "Primero la derecha; después la izquierda, al revés. «De memoria»: recordar el orden sin mirar.",
      colores: ["morado", "celeste", "rojo", "verde"],
      fijas: [
        { etiqueta: "Mano derecha", colores: ["morado", "celeste", "rojo", "verde"] },
        { etiqueta: "Mano izquierda", colores: ["verde", "rojo", "celeste", "morado"] },
      ],
      memorizar: true,
      largo: 3,
      maxLargo: 4,
      accion: "Tocá cada color con la punta de los dedos.",
      meta: 4,
    },
  ],
  descanso: 60,
  cierre: "Alcanzar con equilibrio ayuda a tomar un vaso o vestirse.",
});

export const ger027 = ejercicio({
  codigo: "GER-027",
  frase: "Devolver el globo con la mano indicada, atentos a cada pase.",
  icono: "globo",
  etiquetas: ["3 series", "30 a 45 segundos", "Con acompañante"],
  cuidado: "Pases suaves y cerca. No persigan el globo. Con alergia al látex, usen otra pelota.",
  ayuda: ["Sentado, con pases lentos al frente y la mano más cómoda."],
  preparar: [{ icono: "globo", texto: "Un globo inflado o una pelota de playa" }, sillaRespaldo, { icono: "conversar", texto: "Alguien que le pase el globo" }, suelo],
  consignas: [
    { titulo: "Sentarse", texto: "Sentate con los dos pies bien apoyados.", icono: "figura-sentada" },
    { titulo: "Mirar", texto: "Seguí el globo con la mirada mientras viene.", icono: "globo" },
    { titulo: "Devolver", texto: "Devolvelo con un toque suave de la mano indicada.", icono: "mano" },
  ],
  trabajo: [{ tipo: "reaccion", modo: "manos", titulo: "Los pases", series: 3, min: 30, max: 45 }],
  descanso: 60,
  cierre: "Atentos y coordinados, para responder a lo inesperado.",
});

export const ger028 = ejercicio({
  codigo: "GER-028",
  frase: "Pasos al costado para ganar fuerza y control al cambiar de nivel.",
  icono: "figura-escalon",
  etiquetas: ["2 series", "6 a 8 por pierna", "Con apoyo"],
  cuidado: "Nunca cajas ni bancos como step. No suban altura, peso y reto a la vez.",
  ayuda: ["En el suelo, frente al mostrador, con pasos cortos al costado.", "Las pesas en los tobillos son opcionales."],
  antes: [
    {
      tipo: "elegir",
      clave: "nivel",
      titulo: "¿En el suelo o con step?",
      nota: "El step, solo con valoración previa y alguien al lado.",
      opciones: [
        { id: "plano", texto: "En el suelo", icono: "suelo" },
        { id: "step", texto: "Con step y barras", icono: "escalon" },
      ],
    },
  ],
  preparar: [{ icono: "apoyo", texto: "Dos barras fijas o un mostrador firme" }, { icono: "escalon", texto: "Step bajo y antideslizante, si lo usan" }, acompanante, calzado],
  consignas: [
    { titulo: "Agarrarse", texto: "Las dos manos en el apoyo y los dos pies firmes.", icono: "figura-de-pie" },
    { titulo: "Paso al costado", texto: "Dá un paso corto al costado y volvé al centro.", icono: "figura-lado", si: { clave: "nivel", es: ["plano"] } },
    { titulo: "Bajar de lado", texto: "Bajá un pie de lado hasta el suelo y volvé a subirlo.", icono: "figura-escalon", si: { clave: "nivel", es: ["step"] } },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "6 a 8 con cada pierna",
      nota: "Tocá el círculo cada vez que vuelve a la posición inicial.",
      min: 6,
      max: 8,
      lados: true,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Lento al bajar y al subir.", "Rodillas en línea con los pies.", "Bien agarrado.", respirar],
    },
  ],
  reto: reto("al volver al centro", { categorias: [CAT.paises, CAT.frutas, CAT.transporte], nota: "Responder con los dos pies apoyados y estable." }),
  descanso: 60,
  cierre: "Fuerza y control para escalones y desniveles de todos los días.",
});

export const ger029 = ejercicio({
  codigo: "GER-029",
  frase: "Apretar un aro entre las rodillas para fortalecer el muslo.",
  icono: "aro",
  etiquetas: ["2 series", "8 a 10 veces", "3 segundos cada una"],
  cuidado: "Presión suave, sin aguantar el aire. Con cirugía reciente de cadera o rodilla, consulten.",
  ayuda: ["Un cojín o una pelota blanda, 6 a 8 veces, apretando 1 o 2 segundos."],
  preparar: [sillaRespaldo, { icono: "aro", texto: "Aro de resistencia, pelota blanda o cojín" }],
  consignas: [
    { titulo: "Sentarse", texto: "Espalda en el respaldo y los dos pies apoyados.", icono: "figura-sentada" },
    { titulo: "Apretar", texto: "Con el aro entre las rodillas, acercalas y apretá suave.", icono: "aro" },
    { titulo: "Aflojar", texto: "Aflojá despacio y relajá antes de la siguiente.", icono: "figura-sentada" },
  ],
  trabajo: [
    {
      tipo: "repeticiones",
      titulo: "8 a 10 veces",
      nota: "Apretá 3 segundos, aflojá y tocá el círculo.",
      min: 8,
      max: 10,
      series: 2,
      descansoEntre: 45,
      recordatorios: ["Apretá 3 segundos.", respirar, "Aflojá despacio.", "No hace falta apretar al máximo."],
    },
  ],
  reto: reto("cada vez que afloja", { categorias: [CAT.farmacia, CAT.cocina, CAT.ropa], nota: "Sin repetir respuestas y respirando con naturalidad." }),
  descanso: 60,
  cierre: "Piernas fuertes para levantarse, caminar y cambiar de posición.",
});

export const ger030 = ejercicio({
  codigo: "GER-030",
  frase: "Atrapar una pelota que se suelta sobre las manos, siempre sentado.",
  icono: "figura-atrapa",
  etiquetas: ["2 series", "8 a 10 intentos", "Con acompañante"],
  cuidado: "Siempre sentado. Si la pelota cae, la recoge quien acompaña.",
  ayuda: ["Una pelota más grande o medias, avisando antes y desde poca altura.", "Si cuesta, que la reciba directo en las manos."],
  preparar: [sillaRespaldo, { icono: "pelota", texto: "Pelota liviana y blanda, o medias enrolladas" }, { icono: "conversar", texto: "Alguien que suelte la pelota" }],
  consignas: [
    { titulo: "Manos listas", texto: "Manos abiertas frente al pecho, listas para recibir.", icono: "figura-atrapa" },
    { titulo: "La pelota", texto: "Quien acompaña la sostiene arriba de las manos, a la vista.", icono: "pelota" },
    { titulo: "Atrapar", texto: "Cuando la suelte, atrapala con las dos manos.", icono: "mano" },
  ],
  trabajo: [{ tipo: "reaccion", modo: "soltar", titulo: "A atrapar", series: 2, min: 8, max: 10, contarDeDos: true }],
  descanso: 60,
  cierre: "Lo importante es practicar, no hacerlo perfecto.",
});

export const GERONTOGIMNASIA_2: Guion[] = [
  ger011,
  ger012,
  ger013,
  ger014,
  ger015,
  ger016,
  ger017,
  ger018,
  ger019,
  ger020,
  ger021,
  ger022,
  ger023,
  ger024,
  ger025,
  ger026,
  ger027,
  ger028,
  ger029,
  ger030,
];
