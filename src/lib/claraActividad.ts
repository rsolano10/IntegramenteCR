// Clara dentro de las actividades: cómo se le cuenta a Clara en qué
// actividad y en qué paso está la persona, para que responda la pregunta
// concreta con el contexto correcto. Lo usa la app (contexto en vivo, con
// sendContextualUpdate) y el script de la base de conocimiento
// (scripts/clara/generar-base.ts), así las dos hablan igual.
//
// Solo contenido público de la actividad: nunca las notas internas del
// equipo, ni la etapa con su nombre, ni semáforos o rutas clínicas.

import type { Escena, Guion, Respuestas } from "./sesiones/tipos";
import { opcionDe, opcionesSegun, plantilla, valorLista, valorUno, type PasoResumen } from "./sesiones";
import { cuandoParar } from "./bloquesGerontogimnasia";
import { moduloLabel, type ResourceModulo } from "./modulos";
import { COLORES, type ColorId } from "./sesiones/ger";

const limpio = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
const lista = (xs: string[]) => xs.filter(Boolean).join(", ");
const colorNombre = (c: ColorId) => COLORES[c].nombre.toLowerCase();
// «Título.» sin duplicar el signo: «¿Lo ves?» queda igual.
const p = (t: string) => (/[.?!:…»]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

// Una escena de la sesión guiada, en palabras: lo que la persona tiene
// delante (y lo que ya eligió o anotó, si corresponde).
export function describirEscena(e: Escena, g: Guion, r: Respuestas = {}): string {
  const tx = (t: string) => plantilla(t, g, r);
  const nota = "nota" in e && e.nota ? ` Nota en pantalla: ${tx(e.nota)}` : "";
  switch (e.tipo) {
    case "seguridad":
      return `Pantalla «Cuándo parar», antes del ejercicio. ${cuandoParar}`;
    case "preparar":
      return `Preparar: ${p(e.titulo)} Marcan lo que ya tienen: ${lista(e.items.map((i) => i.texto))}.${nota}`;
    case "video":
      return `Ver el video de cómo se hace el ejercicio.${nota}`;
    case "consigna":
      return `${e.paso ? `Consigna ${e.paso.n} de ${e.paso.de}` : "Consigna"}: ${p(e.titulo)} ${tx(e.texto)}${nota}`;
    case "pasos":
      return `${p(e.titulo)} Las consignas del ejercicio, juntas: ${e.pasos.map((x, i) => `${i + 1}. ${tx(x.texto)}`).join(" ")}${nota}`;
    case "decir": {
      const otras = e.otras?.length ? ` Otras frases posibles: ${e.otras.map((f) => `«${f}»`).join(", ")}.` : "";
      const pista = e.pista ? ` Pista: ${tx(e.pista)}` : "";
      return `${p(e.titulo)} Se le dice: «${tx(e.frase)}».${otras}${pista}${nota}`;
    }
    case "leer":
      return `${p(e.titulo)} Texto para leer en voz alta: «${tx(e.texto)}».${nota}`;
    case "material":
      return `${e.titulo}: el material de apoyo de la ficha (tabla o tarjetas).${nota}`;
    case "elegir": {
      const v = valorUno(r, e.clave);
      const elegida = v ? opcionDe(g, e.clave, v, r)?.texto : null;
      return `Elegir: ${p(tx(e.titulo))} Opciones: ${lista(e.opciones.map((o) => o.texto))}${e.libre ? `, o ${e.libre.toLowerCase()}` : ""}.${elegida ? ` Eligieron: ${elegida}.` : ""}${nota}`;
    }
    case "lista":
    case "ordenar": {
      const ops = e.tipo === "lista" ? opcionesSegun(e.sugerencias, e.segun, r) : opcionesSegun(e.items, e.segun, r);
      const hechas = valorLista(r, e.clave)
        .map((v) => opcionDe(g, e.clave, v, r)?.texto ?? v.replace(/^texto:/, ""))
        .filter(Boolean);
      const accion = e.tipo === "lista" ? `Arman una lista (al menos ${e.minimo})` : `Ordenan los pasos (al menos ${e.minimo})`;
      return `${accion}: ${p(tx(e.titulo))}${e.frase ? ` «${tx(e.frase)}»` : ""} Sugerencias en pantalla: ${lista(ops.map((o) => o.texto))}.${hechas.length ? ` Ya tienen: ${lista(hechas)}.` : ""}${"pista" in e && e.pista ? ` Pista: ${tx(e.pista)}` : ""}${nota}`;
    }
    case "ritmo":
      return `${e.titulo}: repetir ritmos con palmas.${nota}`;
    case "repeticiones":
      return `${e.titulo}: de ${e.min} a ${e.max} repeticiones${e.lados ? " por lado" : ""}. ${limpio(e.nota)} Recordatorios: ${lista(e.recordatorios)}.`;
    case "tiempo":
      return `${e.titulo}: ${e.modo === "sostener" ? "sostener la posición" : "hacer el recorrido"} unos ${e.segundos} segundos, ${e.intentos} ${e.intentos === 1 ? "intento" : "intentos"}${e.lados ? " por lado" : ""}. ${limpio(e.nota)} Recordatorios: ${lista(e.recordatorios)}.`;
    case "descanso":
      return `${e.titulo}: descanso de ${e.segundos} segundos. ${tx(e.texto)}`;
    case "sentir":
      return "Contar cómo se siente después del ejercicio: bien, con cansancio o con molestia.";
    case "repaso":
      return `${e.titulo}: repasan juntos lo que armaron.${nota}`;
    case "mision":
      return `${e.titulo}: la misión de la semana, ${e.veces} veces. ${tx(e.texto)}${nota}`;
    case "cuidados":
      return `${e.titulo}: ${lista(e.items.map((i) => i.texto))}.${nota}`;
    case "cierre":
      return "Pantalla final: cuentan si pudieron hacerla y si fue fácil de seguir.";
    case "reto": {
      const que = e.categorias?.length
        ? `nombrar cosas de una categoría (${lista(e.categorias.map((c) => c.texto.toLowerCase()))}), una ${e.cada}`
        : `decir en orden ${lista((e.secuencia ?? []).slice(0, 4))}…, uno ${e.cada}`;
      return `${p(e.titulo)} Reto cognitivo opcional mientras se mueve: ${que}. Si le quita estabilidad, se deja el reto.${nota}`;
    }
    case "colores":
      return `${p(e.titulo)} Secuencia de colores en pantalla (${lista(e.colores.map(colorNombre))}): ${tx(e.accion)}${e.memorizar ? " Se muestra unos segundos y se tapa, para recordarla." : ""}${nota}`;
    case "orientacion":
      return `${p(e.titulo)} ${e.sentado ? "Sentado, con marcas de colores en la mesa: mira hacia un lado y dice qué color estaba ahí." : "De pie entre cuatro marcas de colores: las observa, se tapan, gira con pasos cortos y, ya quieto, dice qué color quedó al frente."} Responde solo cuando esté quieto y estable.${nota}`;
    case "objetos":
      return `${p(e.titulo)} Memoria de objetos: observan ${e.cuantos} objetos en la mesa, se da vuelta y hace ${e.repeticiones} extensiones de brazos mientras el acompañante saca o cambia uno; después dice qué cambió.${nota}`;
    case "reaccion":
      return e.modo === "manos"
        ? `${p(e.titulo)} Pases con el globo: la pantalla le indica al acompañante con qué mano devolver cada pase (derecha o izquierda, o «uno» y «dos»).${nota}`
        : `${p(e.titulo)} Atrapar la pelota sentado: la pantalla le indica al acompañante cuándo soltarla (con aviso o sin aviso), y llevan la cuenta de los intentos.${nota}`;
    case "juego":
      return "Un juego en pantalla de «Un día en el pueblo»: siguen la consigna del juego, ejercicio por ejercicio, con una pista después de dos intentos. Al terminar se puede jugar otra vez o seguir.";
  }
}

export interface ContextoActividad {
  titulo: string;
  codigo?: string | null;
  modulo?: ResourceModulo | null;
  frase?: string | null;
  guion?: Guion | null;
  // En la sesión: la escena actual (null = la portada) y su número.
  escena?: Escena | null;
  paso?: { n: number; de: number } | null;
  respuestas?: Respuestas;
  // En el tablero: cómo va a ser, paso a paso.
  pasos?: PasoResumen[];
  aMano?: string[];
  quien: "familia" | "participante";
  nombrePaciente?: string | null;
  // Ayuda validada de la actividad y la de su etapa (sin el nombre de la etapa).
  ayuda?: string[];
  ayudaEtapa?: string[];
  notaEquipo?: string | null;
  indicacion?: string | null;
  precaucion?: string | null;
  porQue?: string | null;
  practica?: boolean;
}

// El contexto que la app le manda a Clara antes de cada pregunta.
export function contextoParaClara(c: ContextoActividad): string {
  const l: string[] = [];
  l.push("[Contexto de la app para Clara. No lo leas ni lo repitas textual: usalo para responder.]");
  l.push(
    c.quien === "participante"
      ? "Quien escribe es la persona mayor que está haciendo la actividad, sola o acompañada. Hablale de vos, con frases cortas, una idea por vez y sin palabras técnicas."
      : `Quien escribe es el familiar que acompaña${c.nombrePaciente ? ` a ${c.nombrePaciente}` : ""} en la actividad. Hablale de vos.`,
  );
  l.push(`Actividad: «${c.titulo}»${c.codigo ? ` (${c.codigo})` : ""}${c.modulo ? `, categoría ${moduloLabel[c.modulo]}` : ""}.${c.practica ? " Es una actividad extra, para practicar; no se registra." : ""}`);
  if (c.frase) l.push(`De qué se trata: ${limpio(c.frase)}`);
  if (c.porQue) l.push(`Por qué sirve: ${limpio(c.porQue)}`);
  if (c.guion && c.escena !== undefined) {
    l.push(
      c.escena
        ? `Dónde está ahora: pantalla ${c.paso?.n ?? "?"} de ${c.paso?.de ?? "?"} de la sesión guiada. ${describirEscena(c.escena, c.guion, c.respuestas ?? {})}`
        : "Dónde está ahora: en la portada de la sesión guiada, todavía no empezó.",
    );
  } else if (c.pasos?.length) {
    l.push(`Dónde está ahora: mirando la actividad antes de empezar. Así va a ser: ${c.pasos.map((p, i) => `${i + 1}) ${p.texto}${p.detalle ? `: ${limpio(p.detalle)}` : ""}${p.lista ? `: ${p.lista.join("; ")}` : ""}`).join(" ")}`);
  }
  if (c.aMano?.length) l.push(`Para tener a mano: ${lista(c.aMano)}.`);
  if (c.indicacion) l.push(`Indicación del equipo para esta persona (no la cambies): ${limpio(c.indicacion)}`);
  if (c.notaEquipo) l.push(`Mensaje del equipo para esta actividad: ${limpio(c.notaEquipo)}`);
  if (c.precaucion) l.push(`Cuidado: ${limpio(c.precaucion)}`);
  if (c.ayuda?.length) l.push(`Ayuda validada de la actividad: ${c.ayuda.map(limpio).join(" ")}`);
  if (c.ayudaEtapa?.length) l.push(`Cómo adaptarla para esta persona: ${c.ayudaEtapa.map(limpio).join(" ")}`);
  l.push(
    "Cómo responder: sobre esta actividad y este paso, en 2 a 4 frases concretas. Usá la ayuda validada y la base de conocimiento de actividades; no inventes ejercicios ni cambies la indicación del equipo (si piden más repeticiones, otro nivel o algo distinto, sugerí consultarlo con el equipo por WhatsApp). No nombres etapas, diagnósticos ni puntajes. Si hay dolor, mareo, falta de aire, caída o malestar: que paren; si es urgente, 9-1-1.",
  );
  return l.join("\n");
}

// ─── Clara ayuda a elegir una actividad extra ───

export interface OpcionExtra {
  codigo: string;
  titulo: string;
  modulo: ResourceModulo;
  duracion?: string | null;
  deQue?: string | null;
}

// La lista de actividades extra de esta persona, para que Clara recomiende
// solo entre ellas y las nombre con su código entre corchetes.
export function contextoParaElegir(opciones: OpcionExtra[], nombrePaciente: string | null): string {
  const l: string[] = [];
  l.push("[Contexto de la app para Clara. No lo leas ni lo repitas textual: usalo para responder.]");
  l.push(
    `Quien escribe es el familiar que acompaña${nombrePaciente ? ` a ${nombrePaciente}` : ""}. Está en «Actividades extra»: ideas para practicar fuera del plan, que no se registran. Hablale de vos.`,
  );
  l.push("Tu tarea: ayudarle a elegir una actividad de esta lista según lo que buscan (ganas, tiempo, energía, lugar, materiales o lo que disfruta la persona).");
  l.push(
    "Cómo responder: recomendá de 1 a 3 actividades, solo de esta lista. Nombrá cada una por su título seguido de su código entre corchetes, así: «¿Qué necesitamos llevar?» [COG-012]. La app convierte el código en una tarjeta para abrirla. Agregá una frase corta de por qué le puede gustar. Si no queda claro qué buscan, hacé una sola pregunta corta. Si nada encaja, decilo y sugerí la más cercana. No inventes actividades ni cambies el plan del equipo. No nombres etapas, diagnósticos ni puntajes.",
  );
  l.push("Actividades disponibles:");
  for (const o of opciones) {
    const deQue = limpio(o.deQue);
    l.push(`[${o.codigo}] ${limpio(o.titulo)} · ${moduloLabel[o.modulo]}${o.duracion ? ` · ${limpio(o.duracion)}` : ""}${deQue ? ` · ${deQue.length > 140 ? `${deQue.slice(0, 137)}…` : deQue}` : ""}`);
  }
  return l.join("\n");
}

// Los códigos que Clara recomendó ([COG-012]), en orden y sin repetir.
export function codigosEnTexto(texto: string): string[] {
  return [...new Set([...texto.matchAll(/\[([A-Z]{2,4}-\d{2,4})\]/g)].map((m) => m[1]))];
}

// El texto de Clara sin los códigos (las actividades se muestran como tarjetas).
export const sinCodigos = (texto: string) =>
  texto
    .replace(/\s*\[[A-Z]{2,4}-\d{2,4}\]\s*/g, " ")
    .replace(/ +([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

// En «Mi programa»: Clara responde dudas sobre los programas (qué incluye
// cada uno, cuál conviene, cómo pasar al otro, la semana gratis). Solo con
// lo que está definido; precios y condiciones, como figuran acá.
export interface ProgramaParaClara {
  nombre: string;
  lema: string;
  precio: string;
  periodo: string;
  idealSi: string[];
  incluye: string[];
  requisito?: string;
}
export function contextoParaProgramas(programas: ProgramaParaClara[], actual: string | null, nombrePaciente: string | null): string {
  const l: string[] = [];
  l.push("[Contexto de la app para Clara. No lo leas ni lo repitas textual: usalo para responder.]");
  l.push(
    `Quien escribe es el familiar que acompaña${nombrePaciente ? ` a ${nombrePaciente}` : ""}. Está en «Mi programa», comparando los programas de IntegraMente. Hablale de vos.`,
  );
  if (actual) l.push(`Su programa actual: ${actual}.`);
  l.push(
    "Tu tarea: resolver sus dudas sobre los programas y ayudarle a ver cuál le conviene, en 2 a 4 frases. Usá solo esta información: no inventes precios, servicios, plazos ni descuentos. Para cambiar de programa, contratar sesiones o pedir un presupuesto, sugerí escribir al equipo por WhatsApp. No nombres etapas, diagnósticos ni puntajes.",
  );
  for (const p of programas) {
    l.push(`Programa «${p.nombre}»: ${limpio(p.lema)} Precio: ${p.precio}${p.periodo ? ` ${p.periodo}` : ""}.`);
    l.push(`  Ideal si: ${p.idealSi.join("; ")}.`);
    l.push(`  Incluye: ${p.incluye.join("; ")}.`);
    if (p.requisito) l.push(`  Requisito: ${limpio(p.requisito)}`);
  }
  l.push(
    "Para pasar al programa con sesiones: 1) escribir por WhatsApp; 2) ver la valoración neuropsicológica (una de los últimos 12 meses, o coordinarla con IntegraMente, que se paga aparte); 3) el equipo envía el presupuesto según las sesiones que se necesiten.",
  );
  return l.join("\n");
}
