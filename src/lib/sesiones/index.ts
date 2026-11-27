import type { NivelCognitivo } from "../mediaResources";
import { cuandoParar } from "../bloquesGerontogimnasia";
import { cog005 } from "./guiones/cog005";
import { COGNICION } from "./guiones/cognicion";
import { ger003 } from "./guiones/ger003";
import { ger001, ger002, ger004, ger005, ger006, ger007, ger008, ger009, ger010 } from "./guiones/gerontogimnasia";
import { GERONTOGIMNASIA_2 } from "./guiones/gerontogimnasia2";
import { pre005 } from "./guiones/pre005";
import { NUTRICION } from "./guiones/nutricion";
import { VIVENCIAS } from "./guiones/vivencias";
import type { Escena, Guion, Opcion, Respuestas } from "./tipos";
import type { NutricionFlags } from "../reglasRecursos";
import { cuidadosQueAplican } from "./cuidados";

export type { Escena, Guion, Opcion, PasoGuia, Progreso, Respuestas, UsoSesion } from "./tipos";
export { cuidadosQueAplican } from "./cuidados";

// Recursos con sesión guiada propia. Los demás usan el paso a paso
// automático (lib/pasoAPaso.ts).
export const LISTA_GUIONES: Guion[] = [
  // Gerontogimnasia
  ger001,
  ger002,
  ger003,
  ger004,
  ger005,
  ger006,
  ger007,
  ger008,
  ger009,
  ger010,
  ...GERONTOGIMNASIA_2,
  // Reminiscencia y cognición
  cog005,
  ...COGNICION,
  // Nutrición
  pre005,
  ...NUTRICION,
  // Reminiscencia, movimiento, música, sentidos y bienvenida
  ...VIVENCIAS,
];

export const GUIONES: Record<string, Guion> = Object.fromEntries(LISTA_GUIONES.map((g) => [g.codigo, g]));

export const guionDe = (codigo: string | null | undefined): Guion | null => (codigo ? (GUIONES[codigo] ?? null) : null);

// Prefijo de lo que se escribe a mano en una lista («texto:Un paraguas»).
export const LIBRE = "texto:";

export const valorUno = (r: Respuestas, clave: string): string | null => {
  const v = r[clave];
  return typeof v === "string" ? v : null;
};
export const valorLista = (r: Respuestas, clave: string): string[] => {
  const v = r[clave];
  return Array.isArray(v) ? v : [];
};

export interface OpcionesVisibles {
  // La clínica activó la doble tarea para esta actividad.
  dobleTarea?: boolean;
  // Perfil de nutrición (null: sin datos, se muestran todos los cuidados).
  nutricion?: NutricionFlags | null;
}

// Un desafío opcional (doble tarea): el reto cognitivo o lo marcado `doble`.
export const esDesafio = (e: Escena) => e.tipo === "reto" || !!e.doble;

// Escenas que corresponden con lo respondido hasta ahora. Los desafíos,
// solo con la doble tarea activada y si no dijeron «Ahora no» (`_reto`).
// Los cuidados de nutrición, solo si alguno le aplica a la persona.
export const escenasVisibles = (g: Guion, r: Respuestas, o: OpcionesVisibles = { dobleTarea: true }): Escena[] =>
  g.escenas.filter((e) => {
    if (e.si && !e.si.es.includes(valorUno(r, e.si.clave) ?? "")) return false;
    if (esDesafio(e) && (!o.dobleTarea || valorUno(r, "_reto") === "no")) return false;
    if (e.tipo === "cuidados" && o.nutricion && cuidadosQueAplican(e.items, o.nutricion).length === 0) return false;
    return true;
  });

// La escena «elegir» de una clave (para buscar sus opciones).
function eleccion(g: Guion, clave: string) {
  for (const e of g.escenas) if (e.tipo === "elegir" && e.clave === clave) return e;
  return null;
}

// Opciones fijas o según lo elegido antes (con «otra» como respaldo).
export function opcionesSegun(x: Opcion[] | Record<string, Opcion[]>, segun: string | undefined, r: Respuestas): Opcion[] {
  if (Array.isArray(x)) return x;
  const elegido = segun ? valorUno(r, segun) : null;
  return (elegido && x[elegido]) || x.otra || Object.values(x)[0] || [];
}

// Todas las opciones posibles de una clave (para mostrar lo elegido).
function todasLasOpciones(g: Guion, clave: string): Opcion[] {
  const out: Opcion[] = [];
  for (const e of g.escenas) {
    if (e.tipo === "elegir" && e.clave === clave) out.push(...e.opciones);
    if (e.tipo === "lista" && e.clave === clave) out.push(...(Array.isArray(e.sugerencias) ? e.sugerencias : Object.values(e.sugerencias).flat()));
    if (e.tipo === "ordenar" && e.clave === clave) out.push(...(Array.isArray(e.items) ? e.items : Object.values(e.items).flat()));
  }
  return out;
}

// Lo elegido para una clave, como opción (lo escrito a mano, sin dibujo).
export function opcionDe(g: Guion, clave: string, valor: string, r: Respuestas): Opcion | null {
  // Ordenar lo armado en otra lista: las opciones son las de esa lista.
  const ordenar = g.escenas.find((e) => e.tipo === "ordenar" && e.clave === clave);
  if (ordenar?.tipo === "ordenar" && ordenar.desde) return opcionDe(g, ordenar.desde, valor, r);
  if (valor === "otra") {
    const texto = valorUno(r, `${clave}_texto`)?.trim();
    return texto ? { id: "otra", texto, icono: "otra", dicho: texto } : null;
  }
  if (valor.startsWith(LIBRE)) return { id: valor, texto: valor.slice(LIBRE.length), icono: "estrella" };
  return todasLasOpciones(g, clave).find((o) => o.id === valor) ?? null;
}

// «Pensemos que vamos a {salida}» → «Pensemos que vamos a ir al parque».
export function plantilla(texto: string, g: Guion, r: Respuestas): string {
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) => {
    const v = valorUno(r, clave);
    const o = v ? opcionDe(g, clave, v, r) : null;
    if (o) return o.dicho ?? o.texto.toLowerCase();
    // Sin respuesta todavía (vista previa salteada): la primera opción.
    const e = eleccion(g, clave);
    return e?.opciones[0]?.dicho ?? "…";
  });
}

// Lo que se puede contestar para seguir.
export function puedeSeguir(e: Escena, r: Respuestas): boolean {
  if (e.tipo === "elegir") {
    const v = valorUno(r, e.clave);
    return !!v && (v !== "otra" || !!valorUno(r, `${e.clave}_texto`)?.trim());
  }
  if (e.tipo === "lista" || e.tipo === "ordenar") return valorLista(r, e.clave).length >= e.minimo;
  return true;
}

// Ayuda por etapa: solo la de la persona; sin etapa (clínica), todas.
const ORDEN: NivelCognitivo[] = ["preventivo", "dcl", "leve", "moderada", "avanzada"];
export function ayudaDeEtapa(
  g: Guion | Partial<Record<NivelCognitivo, string>> | null | undefined,
  etapas: NivelCognitivo[],
): { etapa: NivelCognitivo; texto: string }[] {
  const por: Partial<Record<NivelCognitivo, string>> = (g && "escenas" in g ? g.ayudaPorEtapa : g) ?? {};
  return ORDEN.filter((e) => por[e] && (!etapas.length || etapas.includes(e))).map((e) => ({ etapa: e, texto: por[e]! }));
}

export const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

// Texto principal de cada escena: lo que se lee en voz alta y lo que el
// presupuesto de palabras controla.
export function textoPrincipal(e: Escena): string {
  switch (e.tipo) {
    case "consigna":
      return e.texto;
    case "decir":
      return e.frase;
    case "leer":
      return e.texto;
    case "mision":
      return e.texto;
    case "cierre":
      return e.texto;
    case "seguridad":
    case "juego":
      return "";
    default:
      return e.titulo;
  }
}

// Lo que se lee con «Escuchar» en cada pantalla (también lo usa el script
// que prepara las voces).
export function textoDeVoz(e: Escena | null, g: Guion, r: Respuestas, titulo?: string): string {
  if (!e) return titulo ? `${titulo}. ${g.frase}` : g.frase;
  if (e.tipo === "seguridad") return cuandoParar;
  if (e.tipo === "elegir") return `${e.titulo} ${e.opciones.map((o) => o.texto).join(", ")}.`;
  if (e.tipo === "pasos") return plantilla(`${e.titulo}. ${e.pasos.filter((p) => !p.si || p.si.es.includes(valorUno(r, p.si.clave) ?? "")).map((p, i) => `${i + 1}. ${p.texto}`).join(" ")}`, g, r);
  return plantilla(textoPrincipal(e), g, r);
}

// Todas las lecturas posibles de un guion: cada pantalla y, si la frase
// depende de algo elegido, una por cada opción.
export function textosDeVoz(g: Guion): string[] {
  const out = new Set<string>([textoDeVoz(null, g, {})]);
  for (const e of g.escenas) {
    if (e.tipo === "video") continue;
    if (e.tipo === "pasos") {
      out.add(textoDeVoz(e, g, {}));
      continue;
    }
    const base = e.tipo === "seguridad" || e.tipo === "elegir" ? null : textoPrincipal(e);
    const clave = base ? /\{(\w+)\}/.exec(base)?.[1] : null;
    const elegir = clave ? g.escenas.find((x) => x.tipo === "elegir" && x.clave === clave) : null;
    if (elegir?.tipo === "elegir") for (const o of elegir.opciones) out.add(textoDeVoz(e, g, { [clave!]: o.id }));
    else out.add(textoDeVoz(e, g, {}));
    if (e.tipo === "decir") for (const f of e.otras ?? []) out.add(f);
  }
  return [...out].filter(Boolean);
}

// ─── Para la pantalla de la actividad (antes de empezar) ───

export interface PasoResumen {
  icono: import("./iconos").NombreIcono;
  texto: string;
  // Cómo se hace ese paso, en una frase, o sus consignas de a una.
  detalle?: string;
  lista?: string[];
}

const conY = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} o ${xs[xs.length - 1]}`);

// Cómo va a ser la sesión: cada paso con su dibujo y cómo se hace. Las
// consignas seguidas se juntan en un paso con su lista.
export function resumenPasos(g: Guion, conVideo: boolean): PasoResumen[] {
  const out: PasoResumen[] = [];
  const r: Respuestas = {};
  const tx = (t: string) => plantilla(t, g, r);
  for (let k = 0; k < g.escenas.length; k++) {
    const e = g.escenas[k];
    if (e.si || esDesafio(e)) continue;
    switch (e.tipo) {
      case "seguridad":
        out.push({ icono: "rechazo", texto: "Repasar cuándo parar", detalle: "Las señales para detenerse, con dibujos." });
        break;
      case "preparar":
        out.push({ icono: e.items[0]?.icono ?? "lista", texto: e.titulo, detalle: e.items.length > 1 ? "Marcan en una lista lo que ya tienen listo." : e.nota });
        break;
      case "video":
        if (conVideo) out.push({ icono: "volumen", texto: "Ver el video", detalle: "Miran juntos cómo se hace." });
        break;
      case "consigna": {
        const grupo = [e];
        while (g.escenas[k + grupo.length]?.tipo === "consigna" && !g.escenas[k + grupo.length].si) grupo.push(g.escenas[k + grupo.length] as typeof e);
        if (grupo.length > 1) out.push({ icono: e.icono ?? "estrella", texto: "Las consignas, de a una", lista: grupo.map((c) => (c.tipo === "consigna" ? tx(c.texto) : "")) });
        else out.push({ icono: e.icono ?? "estrella", texto: e.titulo, detalle: tx(e.texto) });
        k += grupo.length - 1;
        break;
      }
      case "pasos":
        out.push({ icono: e.pasos[0]?.icono ?? "estrella", texto: e.titulo, lista: e.pasos.filter((p) => !p.si).map((p) => tx(p.texto)) });
        break;
      case "decir":
        out.push({ icono: e.icono ?? "conversar", texto: e.titulo, detalle: `«${tx(e.frase)}»${e.nota ? ` ${e.nota}` : ""}` });
        break;
      case "elegir":
        out.push({ icono: e.opciones[0]?.icono ?? "estrella", texto: tx(e.titulo), detalle: `Eligen entre ${conY([...e.opciones.map((o) => o.texto.toLowerCase()), ...(e.libre ? [e.libre.toLowerCase()] : [])])}.` });
        break;
      case "lista":
      case "ordenar":
        out.push({ icono: "lista", texto: tx(e.titulo), detalle: e.nota });
        break;
      case "repeticiones":
      case "tiempo":
        out.push({ icono: e.tipo === "tiempo" ? "reloj" : "corazon", texto: e.titulo, detalle: e.nota });
        break;
      case "descanso":
        out.push({ icono: "luna", texto: e.titulo, detalle: e.texto });
        break;
      case "sentir":
        out.push({ icono: "bien", texto: "Contar cómo se siente", detalle: "Bien, con cansancio o con molestia." });
        break;
      case "repaso":
        out.push({ icono: "libreta", texto: e.titulo, detalle: e.nota ?? "Repasan juntos lo que armaron." });
        break;
      case "mision":
        out.push({ icono: "calendario", texto: e.titulo, detalle: tx(e.texto) });
        break;
      case "cuidados":
        out.push({ icono: "corazon", texto: e.titulo, lista: e.items.map((i) => i.texto) });
        break;
      case "leer":
        out.push({ icono: e.icono ?? "libro", texto: e.titulo, detalle: "Un texto corto para leer en voz alta, despacio." });
        break;
      case "material":
        out.push({ icono: "libreta", texto: e.titulo, detalle: e.nota });
        break;
      case "ritmo":
        out.push({ icono: "palmas", texto: e.titulo, detalle: e.nota });
        break;
      case "reto":
        out.push({ icono: e.categorias?.[0]?.icono ?? "conversar", texto: e.titulo, detalle: e.nota ?? `Un reto para decir en voz alta, ${e.cada}.` });
        break;
      case "colores":
        out.push({ icono: "marcas", texto: e.titulo, detalle: e.nota ?? "Una secuencia de colores en pantalla." });
        break;
      case "orientacion":
        out.push({ icono: "marcas", texto: e.titulo, detalle: e.nota ?? "Recordar los colores y orientarse al girar." });
        break;
      case "objetos":
        out.push({ icono: "mesa", texto: e.titulo, detalle: e.nota ?? "Recordar los objetos de la mesa y descubrir qué cambió." });
        break;
      case "reaccion":
        out.push({ icono: e.modo === "manos" ? "globo" : "pelota", texto: e.titulo, detalle: e.nota });
        break;
      case "juego":
        out.push({ icono: "estrella", texto: "Jugar en pantalla", detalle: "Ejercicio por ejercicio, a su ritmo." });
        break;
      case "cierre":
        out.push({ icono: "estrella", texto: "Terminar y contar cómo les fue", detalle: "Cuentan si pudieron hacerla y si fue fácil de seguir." });
        break;
    }
  }
  return out;
}

// Lo que conviene tener a mano: lo de la primera escena «preparar».
export function aTenerAMano(g: Guion) {
  const e = g.escenas.find((x) => x.tipo === "preparar");
  return e?.tipo === "preparar" ? e.items : [];
}
