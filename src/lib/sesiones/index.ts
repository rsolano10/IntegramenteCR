import type { NivelCognitivo } from "../mediaResources";
import { cuandoParar } from "../bloquesGerontogimnasia";
import { cog005 } from "./guiones/cog005";
import { COGNICION } from "./guiones/cognicion";
import { ger003 } from "./guiones/ger003";
import { ger001, ger002, ger004, ger005, ger006, ger007, ger008, ger009, ger010 } from "./guiones/gerontogimnasia";
import { pre005 } from "./guiones/pre005";
import { NUTRICION } from "./guiones/nutricion";
import { VIVENCIAS } from "./guiones/vivencias";
import type { Escena, Guion, Opcion, Respuestas } from "./tipos";

export type { Escena, Guion, Opcion, Progreso, Respuestas, UsoSesion } from "./tipos";

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

// Escenas que corresponden con lo respondido hasta ahora.
export const escenasVisibles = (g: Guion, r: Respuestas): Escena[] =>
  g.escenas.filter((e) => !e.si || e.si.es.includes(valorUno(r, e.si.clave) ?? ""));

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
  return plantilla(textoPrincipal(e), g, r);
}

// Todas las lecturas posibles de un guion: cada pantalla y, si la frase
// depende de algo elegido, una por cada opción.
export function textosDeVoz(g: Guion): string[] {
  const out = new Set<string>([textoDeVoz(null, g, {})]);
  for (const e of g.escenas) {
    if (e.tipo === "video") continue;
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
}

// Cómo va a ser la sesión, en pocos pasos con dibujo. Las consignas
// seguidas se juntan en uno («3 consignas, de a una»).
export function resumenPasos(g: Guion, conVideo: boolean): PasoResumen[] {
  const out: PasoResumen[] = [];
  const r: Respuestas = {};
  for (let k = 0; k < g.escenas.length; k++) {
    const e = g.escenas[k];
    if (e.si) continue;
    switch (e.tipo) {
      case "seguridad":
        out.push({ icono: "rechazo", texto: "Repasar cuándo parar" });
        break;
      case "preparar":
        out.push({ icono: e.items[0]?.icono ?? "lista", texto: e.titulo });
        break;
      case "video":
        if (conVideo) out.push({ icono: "volumen", texto: "Ver el video" });
        break;
      case "consigna": {
        let n = 1;
        while (g.escenas[k + n]?.tipo === "consigna" && !g.escenas[k + n].si) n++;
        out.push({ icono: e.icono ?? "estrella", texto: n > 1 ? `${n} consignas, de a una` : e.titulo });
        k += n - 1;
        break;
      }
      case "decir":
        out.push({ icono: e.icono ?? "conversar", texto: e.titulo });
        break;
      case "elegir":
        out.push({ icono: e.opciones[0]?.icono ?? "estrella", texto: plantilla(e.titulo, g, r) });
        break;
      case "lista":
      case "ordenar":
        out.push({ icono: "lista", texto: plantilla(e.titulo, g, r) });
        break;
      case "repeticiones":
        out.push({ icono: "corazon", texto: e.titulo });
        break;
      case "tiempo":
        out.push({ icono: "reloj", texto: e.titulo });
        break;
      case "descanso":
        out.push({ icono: "luna", texto: e.titulo });
        break;
      case "sentir":
        out.push({ icono: "bien", texto: "Contar cómo se siente" });
        break;
      case "repaso":
        out.push({ icono: "libreta", texto: e.titulo });
        break;
      case "mision":
        out.push({ icono: "calendario", texto: e.titulo });
        break;
      case "cuidados":
        out.push({ icono: "corazon", texto: e.titulo });
        break;
      case "leer":
        out.push({ icono: e.icono ?? "libro", texto: e.titulo });
        break;
      case "material":
        out.push({ icono: "libreta", texto: e.titulo });
        break;
      case "ritmo":
        out.push({ icono: "palmas", texto: e.titulo });
        break;
      case "cierre":
        out.push({ icono: "estrella", texto: "Terminar y contar cómo les fue" });
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
