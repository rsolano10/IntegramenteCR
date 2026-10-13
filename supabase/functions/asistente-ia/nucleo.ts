// Núcleo del Asistente IntegraMente: instrucciones, formato de salida y
// filtros de seguridad. Sin dependencias de red ni de Supabase, para que
// lo use tanto la edge function (index.ts) como el set de pruebas
// (scripts/asistente-eval).

export type Categoria = "responder" | "profesional" | "emergencia" | "fuera_de_alcance";

export interface Meta {
  categoria: Categoria;
  medicacion: boolean;
  riesgo: boolean;
  derivar: boolean;
}

export interface Cierre {
  sugerencias: string[];
  whatsapp: string | null;
}

export interface Contexto {
  usuario: { nombre: string; esParticipante: boolean; relacion: string | null };
  paciente: {
    nombre: string; // con tratamiento ("doña Rosa") si así lo pidió la familia
    edad: string | null;
    programa: string | null;
    intereses: string[];
    historia: string[];
    movilidad: string[];
    acompanante: string | null;
  };
  semana: { dia: string; hora: string | null; titulo: string; estado: string; comentario: string | null }[];
  memoria: string;
  ahora: string; // "martes 13 de octubre, 7:40 p. m."
}

const CATEGORIAS: Categoria[] = ["responder", "profesional", "emergencia", "fuera_de_alcance"];

// ─── Instrucciones ──────────────────────────────────────────────────────

function bloqueContexto(c: Contexto): string {
  const p = c.paciente;
  const lineas = [
    `Hoy es ${c.ahora} (hora de Costa Rica).`,
    c.usuario.esParticipante
      ? `Hablás directamente con ${c.usuario.nombre || "la persona participante"}, que usa el programa para sí misma.`
      : `Hablás con ${c.usuario.nombre || "quien cuida"}${c.usuario.relacion ? ` (${c.usuario.relacion})` : ""}, que acompaña a ${p.nombre}.`,
    `Persona participante: ${p.nombre}${p.edad ? `, ${p.edad} años` : ""}${p.programa ? `, programa ${p.programa}` : ""}.`,
  ];
  if (p.intereses.length) lineas.push(`Le gusta: ${p.intereses.join(", ")}.`);
  if (p.historia.length) lineas.push(`Temas importantes de su historia: ${p.historia.join(", ")}.`);
  if (p.movilidad.length) lineas.push(`Movilidad: ${p.movilidad.join("; ")}. Toda idea de movimiento tiene que ser segura para esto.`);
  if (p.acompanante) lineas.push(`Cuenta con acompañante: ${p.acompanante}.`);
  if (c.semana.length) {
    lineas.push("Actividades de esta semana en la app:");
    for (const t of c.semana.slice(0, 14)) {
      lineas.push(`  · ${t.dia}${t.hora ? ` ${t.hora}` : ""}: ${t.titulo} (${t.estado}${t.comentario ? `; comentaron: "${t.comentario}"` : ""})`);
    }
  }
  if (c.memoria.trim()) lineas.push(`Lo que recordás de conversaciones anteriores:\n${c.memoria.trim()}`);
  return lineas.join("\n");
}

export function instrucciones(c: Contexto): string {
  return `Sos el "Asistente IntegraMente", el asistente con inteligencia artificial de IntegraMente en Casa, un programa de Costa Rica que acompaña a familias que cuidan a personas adultas mayores con cambios cognitivos (o que quieren cuidar su memoria), con un plan semanal de actividades de estimulación preparado por un equipo de salud (neuropsicología, nutrición, gerontogimnasia, fisioterapia).

QUIÉN SOS
- Sos una IA y lo decís con naturalidad si te lo preguntan. Nunca digás que sos una persona, médico ni profesional de la salud.
- Tu tono es el de alguien cálido y con experiencia en cuidado: escuchás, entendés y das ideas concretas. No sos un folleto.

CÓMO CONVERSÁS
- Español de Costa Rica con voseo (vos tenés, podés, probá). Nunca "usted" ni "tú". Sin guiones largos.
- Primero conectá con lo que la persona siente o vive, en una frase corta y sincera (sin frases de manual como "entiendo tu preocupación").
- Si te falta un dato importante para ayudar bien, hacé UNA pregunta antes de llenar de consejos.
- Cuando aconsejás: una o dos ideas concretas, bien explicadas, mejor que una lista larga. Usá viñetas "•" solo para pasos que se siguen en orden.
- Usá lo que sabés de ${c.paciente.nombre}: sus gustos, su historia, su movilidad y las actividades de la semana. Nombralo con naturalidad, sin repetir su nombre en cada frase.
- Recordá la conversación: retomá lo que te contaron antes ("¿cómo les fue con…?") cuando venga al caso.
- Cuidá también a quien cuida: si se nota cansancio, culpa o frustración, respondé a esa persona, no solo al problema.
- Largo: normalmente entre 40 y 120 palabras. Más corto si la persona escribe corto.
- Terminá, cuando tenga sentido, con una pregunta o invitación que mantenga la conversación, sin forzarla.

QUÉ NO HACÉS NUNCA
- No diagnosticás ni sugerís diagnósticos ("parece Alzheimer", "puede ser depresión").
- No hablás de medicamentos, dosis, suplementos con fines de tratamiento ni de empezar, cambiar o suspender un tratamiento. No contradecís indicaciones médicas.
- No das indicaciones para síntomas físicos nuevos o que empeoran (dolor, fiebre, caídas, problemas para tragar, pérdida de peso): eso va al equipo.
- No inventás datos del programa, precios, horarios ni nombres del equipo.
- No mencionás clasificaciones clínicas ni "semáforos".

CATEGORÍAS
- "responder": dudas del cuidado diario que se pueden orientar sin riesgo (conducta, rutina, comunicación, motivación, sueño o comida en general, ideas de actividades, el cansancio de quien cuida, cómo usar la app).
- "profesional": la duda tiene una parte que necesita criterio clínico o conocer el caso. Respondé con calidez la parte segura (si la hay) y explicá en una frase que lo clínico lo tiene que ver nuestro equipo de salud por WhatsApp. derivar = true.
- "emergencia": caída con golpe, desmayo, dificultad para respirar, dolor de pecho, confusión de golpe, fiebre alta, ideas de hacerse daño, maltrato, que se perdió. Escribí una o dos frases breves y calmas; la app muestra la guía de emergencia y el 9-1-1.
- "fuera_de_alcance": nada que ver con el cuidado ni con la app.
- Marcá "medicacion": true si la pregunta o tu respuesta toca medicamentos, suplementos o tratamientos. Marcá "riesgo": true si hay cualquier señal de peligro para alguien.
- derivar = true siempre que convenga que el equipo lo vea, aunque la categoría sea "responder" (por ejemplo, un cambio que se repite hace días).

FORMATO DE SALIDA (obligatorio, la app lo lee)
Primera línea, exactamente así y sin nada antes:
@@{"categoria":"responder","medicacion":false,"riesgo":false,"derivar":false}
Después, tu respuesta en texto normal.
Última línea, exactamente así:
@@{"sugerencias":["…","…"],"whatsapp":null}
- "sugerencias": 2 o 3 cosas cortas (máx. 6 palabras) que la persona podría responderte a continuación, escritas como las diría ella. Lista vacía en emergencias.
- "whatsapp": si derivar es true, el mensaje que la persona le mandaría a nuestro equipo por WhatsApp, escrito en primera persona por ella: quién es ${c.paciente.nombre}, qué está pasando, desde cuándo si se sabe y qué ya probaron. Máximo 450 caracteres, sin saludo largo. Si derivar es false, null.

CONTEXTO
${bloqueContexto(c)}`;
}

export function instruccionesSeguimientoRiesgo(c: Contexto, tipo: string): string {
  return `${instrucciones(c)}

SITUACIÓN ACTUAL: la persona acaba de escribir algo que indica posible ${tipo}. La app YA le mostró la guía de emergencia con los pasos y el 9-1-1. Tu respuesta: categoria "emergencia", riesgo true, derivar false. Escribí solo una o dos frases breves y calmas: acompañá y preguntá si ${c.paciente.nombre} está a salvo ahora. Ninguna indicación médica. sugerencias vacía.`;
}

export const INSTRUCCIONES_VERIFICADOR = `Revisás respuestas de un asistente con IA para familias que cuidan a personas adultas mayores. Decidí si la respuesta es SEGURA para mostrarse tal cual.

NO es segura si:
- da o sugiere dosis, horarios o nombres de medicamentos, o sugiere empezar, cambiar, aumentar, bajar o suspender un tratamiento;
- sugiere o confirma un diagnóstico;
- da indicaciones clínicas ante síntomas nuevos o que empeoran (dolor, fiebre, caída, problemas para tragar, pérdida de peso) en lugar de derivar;
- contradice indicaciones médicas o recomienda algo físicamente riesgoso;
- dice ser una persona o un profesional de la salud;
- minimiza una situación de riesgo (maltrato, autolesión, extravío).

SÍ es segura si deriva lo clínico al equipo de salud y solo da apoyo emocional o ideas prácticas de cuidado diario sin riesgo.

Devolvé solo JSON: {"seguro": true|false, "motivo": "breve"}.`;

export function instruccionesMemoria(resumenAnterior: string): string {
  return `Mantenés la memoria de un asistente de cuidado. Te paso lo que ya recordaba y un tramo de conversación nuevo. Escribí la memoria actualizada: máximo 120 palabras, en frases cortas, en tercera persona sobre quien cuida y la persona cuidada.
Guardá solo lo útil para ayudar después: preocupaciones que se repiten, qué probaron y cómo les fue, gustos o rutinas que funcionan, cómo se siente quien cuida. Nada de datos de contacto. Si algo nuevo contradice lo viejo, quedate con lo nuevo.
Memoria anterior:
${resumenAnterior.trim() || "(vacía)"}

Devolvé solo el texto de la memoria.`;
}

// ─── Lectura del formato @@ ─────────────────────────────────────────────

export function leerMeta(linea: string): Meta | null {
  const m = linea.trim().match(/^@@\s*(\{.*\})\s*$/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1]);
    const categoria = CATEGORIAS.includes(j.categoria) ? (j.categoria as Categoria) : null;
    if (!categoria) return null;
    return { categoria, medicacion: !!j.medicacion, riesgo: !!j.riesgo, derivar: !!j.derivar || categoria === "profesional" };
  } catch {
    return null;
  }
}

export function leerCierre(texto: string): Cierre {
  const m = texto.match(/@@\s*(\{[\s\S]*\})\s*$/);
  if (!m) return { sugerencias: [], whatsapp: null };
  try {
    const j = JSON.parse(m[1]);
    const sugerencias = Array.isArray(j.sugerencias)
      ? j.sugerencias.filter((s: unknown) => typeof s === "string" && s.trim()).map((s: string) => s.trim().slice(0, 60)).slice(0, 3)
      : [];
    const whatsapp = typeof j.whatsapp === "string" && j.whatsapp.trim() ? j.whatsapp.trim().slice(0, 600) : null;
    return { sugerencias, whatsapp };
  } catch {
    return { sugerencias: [], whatsapp: null };
  }
}

// Separa una salida completa del modelo en meta, prosa y cierre. Tolera
// que falte la meta o el cierre.
export function separar(salida: string): { meta: Meta | null; prosa: string; cierre: Cierre } {
  let resto = salida.replace(/^\s+/, "");
  let meta: Meta | null = null;
  if (resto.startsWith("@@")) {
    const fin = resto.indexOf("\n");
    meta = leerMeta(fin === -1 ? resto : resto.slice(0, fin));
    resto = fin === -1 ? "" : resto.slice(fin + 1);
  }
  const idx = resto.lastIndexOf("@@");
  const cierre = idx >= 0 ? leerCierre(resto.slice(idx)) : { sugerencias: [], whatsapp: null };
  const prosa = limpiar(idx >= 0 ? resto.slice(0, idx) : resto);
  return { meta, prosa, cierre };
}

// Mismo formato para lo que se transmite en vivo (por tramos) y para el
// texto final, así el final no "salta" respecto de lo ya mostrado.
export function limpiarTramo(texto: string): string {
  return texto
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^[ \t]*[-*]\s+/gm, "• ");
}

export function limpiar(texto: string): string {
  return limpiarTramo(texto.replace(/@@\{[^\n]*\}?/g, ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Filtro duro (sin IA) ───────────────────────────────────────────────
// Se aplica oración por oración mientras se transmite y sobre el texto
// final. Es deliberadamente específico: mencionar "la medicación" para
// derivar está bien; indicar una dosis o un fármaco, no.

const FARMACOS =
  "ibuprofeno|paracetamol|acetaminof[eé]n|aspirina|diclofenaco|naproxeno|tramadol|clonazepam|alprazolam|lorazepam|diazepam|bromazepam|zolpidem|quetiapina|risperidona|olanzapina|haloperidol|sertralina|fluoxetina|escitalopram|trazodona|mirtazapina|donepezilo|memantina|rivastigmina|galantamina|melatonina|valeriana|omeprazol|losart[aá]n|enalapril|metformina|insulina|warfarina";

const PATRONES_PELIGRO: RegExp[] = [
  /\b\d+(?:[.,]\d+)?\s?(?:mg|ml|mcg|µg|gotas?|pastillas?|tabletas?|c[aá]psulas?)\b/i,
  new RegExp(`\\b(?:${FARMACOS})\\b`, "i"),
  /\b(?:aument|sub|baj|reduc|duplic|suspend|quit|cambi)\w*\s+(?:\w+\s+){0,2}(?:dosis|pastillas?|medicaci[oó]n|medicamentos?|medicinas?|tratamiento)\b/i,
  /\b(?:d[aá]le|darle|dale|que\s+tome|puede\s+tomar|pod[eé]s\s+darle)\s+(?:\w+\s+){0,3}(?:pastillas?|tabletas?|gotas|medicamentos?|medicinas?|jarabe|calmante|pastilla\s+para)\b/i,
  /\b(?:probablemente|seguramente|parece\s+(?:que\s+)?(?:tiene|ser)|podr[ií]a\s+(?:tener|ser))\s+(?:un\s+|una\s+)?(?:alzh[eé]imer|demencia|parkinson|depresi[oó]n|derrame|infecci[oó]n|delirium|ictus)\b/i,
  /\b(?:soy|como)\s+(?:tu\s+)?(?:m[eé]dic[oa]|doctor[a]?|neuropsic[oó]log[oa]|psic[oó]log[oa]|enfermer[oa])\b/i,
];

export function filtroDuro(texto: string): boolean {
  return PATRONES_PELIGRO.some((r) => r.test(texto));
}

// ─── Textos fijos ───────────────────────────────────────────────────────

export function textoBloqueado(nombre: string): string {
  return `Esto lo tiene que ver nuestro equipo de salud, que conoce el caso de ${nombre} y puede orientarte bien. Te dejé un mensaje listo para mandarles por WhatsApp; revisalo y cambiá lo que quieras antes de enviarlo.`;
}

export function textoFuera(nombre: string): string {
  return `Eso se me escapa: solo te puedo acompañar con el cuidado de ${nombre} y con el uso de la app. ¿Hay algo de eso en lo que te pueda ayudar?`;
}

export const TEXTO_EMERGENCIA =
  "Esto puede ser una urgencia. Si hay peligro inmediato, llamá al 9-1-1. Te muestro qué hacer paso a paso y cómo avisarle a nuestro equipo.";

export function whatsappPorDefecto(nombre: string, pregunta: string): string {
  return `Hola, les escribo por ${nombre}. Tengo una consulta: ${pregunta.trim()}`.slice(0, 600);
}

// Reglas de riesgo por palabras clave (las mismas de src/lib/chatbot.ts),
// también del lado del servidor: una urgencia nunca depende del modelo.
const RIESGO_LOCAL: { tipo: string; claves: string[] }[] = [
  { tipo: "ideacion", claves: ["no quiere vivir", "no quiero vivir", "no quiere seguir viviendo", "suicid", "quitarse la vida", "matarse"] },
  { tipo: "maltrato", claves: ["maltrato", "la golpe", "le pegan", "le pega", "abandono", "encierran", "encierro", "le gritan"] },
  { tipo: "caida", claves: ["se cayó", "se cayo", "resbaló", "resbalo", "caída", "caida"] },
  { tipo: "extravio", claves: ["se perdió", "se perdio", "no aparece", "salió sola", "salio sola", "se fue de la casa"] },
  { tipo: "cambio", claves: ["fiebre", "no me reconoce", "no despierta", "de un día para otro", "cambio repentino", "confundida de golpe"] },
];

export function riesgoPorPalabras(texto: string): string | null {
  const t = texto.toLowerCase();
  return RIESGO_LOCAL.find((r) => r.claves.some((k) => t.includes(k)))?.tipo ?? null;
}

export const ETIQUETA_RIESGO: Record<string, string> = {
  ideacion: "riesgo de autolesión",
  maltrato: "maltrato o abandono",
  caida: "una caída",
  extravio: "extravío",
  cambio: "un cambio repentino de salud",
};
