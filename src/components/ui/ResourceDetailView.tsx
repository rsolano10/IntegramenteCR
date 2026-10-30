import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { LightbulbIcon } from "./Icons";
import { nivelCognitivoLabel, resourceUrl, type AdaptacionPorEtapa, type MediaKind, type NivelCognitivo, type ResourceExtras } from "../../lib/mediaResources";
import { modulosFicha, type ResourceModulo } from "../../lib/modulos";
import { antesDeEmpezar, comoIncorporarDobleTarea, cuandoParar } from "../../lib/bloquesGerontogimnasia";

export interface ResourceContent {
  codigo?: string | null;
  modulo?: ResourceModulo | null;
  mediaKind?: MediaKind | null;
  storagePath?: string | null;
  externalUrl?: string | null;
  posterPath?: string | null;
  // "Lo que verá el familiar en la App" (recursos cognitivos).
  intro?: string | null;
  perfil?: string | null;
  sabiasQue?: string | null;
  materiales?: string | null;
  actividad?: string | null;
  dosis?: string | null;
  // Dosis o porción autorizada para esta persona (plan_tasks.indicacion_individual).
  indicacionIndividual?: string | null;
  requierePlanIndividual?: boolean | null;
  adaptacion?: string | null;
  adaptacionPorEtapa?: AdaptacionPorEtapa | null;
  ayuda?: string | null;
  tenEnCuenta?: string | null;
  paraCerrar?: string | null;
  ciencia?: { gancho: string; evidencia: string; cierre: string } | null;
  porQue?: string | null;
  pasos?: string[];
  extras?: ResourceExtras | null;
  // Etapa de la persona que mira. Sin dato (vista previa de la clínica) se
  // muestran todas las adaptaciones, cada una con su etapa.
  etapas?: NivelCognitivo[] | null;
  fallbackLabel: string;
}

type TablaOTarjetas = Extract<ResourceExtras, { modo: "tabla" | "tarjetas" }>;

const ETAPAS: NivelCognitivo[] = ["preventivo", "dcl", "leve", "moderada", "avanzada"];

// «¿Una sombrilla o una toalla de baño?» → las dos opciones, para alternar
// su orden (regla de COG-012: no dejar siempre primero la opción adecuada).
function alternarOpciones(texto: string, invertir: boolean): string {
  const m = /^«¿(.+) o (.+)\?»(\.?)$/.exec(texto.trim());
  if (!m || !invertir) return texto;
  return `«¿${m[2].charAt(0).toUpperCase()}${m[2].slice(1)} o ${m[1].charAt(0).toLowerCase()}${m[1].slice(1)}?»${m[3]}`;
}

// Ejemplos del manual: tabla en escritorio, una tarjetita por fila en el
// celular para que se lea sin desplazarse de costado.
function EjemplosTabla({ ex, large }: { ex: TablaOTarjetas; large: boolean }) {
  const colApoyo = ex.columnas.findIndex((c) => c.toLowerCase().startsWith("apoyo"));
  // Se decide una vez por apertura, no en cada render.
  const invertir = useMemo(() => ex.filas.map(() => Math.random() < 0.5), [ex.filas]);
  const filas = ex.filas.map((f, i) => (colApoyo < 0 ? f : f.map((c, j) => (j === colApoyo ? alternarOpciones(c, invertir[i]) : c))));
  return (
    <div className={`grid gap-2.5 ${large ? "text-[17px]" : "text-[15px]"}`}>
      <p className={`m-0 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-[15px]" : "text-[13px]"}`}>{ex.titulo}</p>
      {ex.intro && <p className="m-0 leading-relaxed text-tinta">{ex.intro}</p>}
      <table className="hidden sm:table w-full border-collapse rounded-2xl overflow-hidden bg-white border border-borde">
        <thead>
          <tr className="text-left">
            {ex.columnas.map((c) => (
              <th key={c} className="px-4 py-2.5 text-[12px] tracking-[0.06em] uppercase font-semibold text-tinta-tenue bg-campo">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-t border-borde-suave align-top">
              {fila.map((celda, j) => (
                <td key={j} className={`px-4 py-3 leading-relaxed ${j === 0 ? "font-semibold text-tinta" : "text-tinta-suave"}`}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-2.5 sm:hidden">
        {filas.map((fila, i) => (
          <div key={i} className="grid gap-1.5 rounded-2xl bg-white border border-borde px-4 py-3">
            {fila.map((celda, j) => (
              <p key={j} className={`m-0 leading-relaxed ${j === 0 ? "font-semibold text-tinta" : "text-tinta-suave"}`}>
                {j > 0 && ex.columnas[j] && <span className="block text-[12px] tracking-[0.06em] uppercase text-tinta-tenue">{ex.columnas[j]}</span>}
                {celda}
              </p>
            ))}
          </div>
        ))}
      </div>
      {ex.cierre && <p className="m-0 leading-relaxed text-tinta-suave">{ex.cierre}</p>}
    </div>
  );
}

// Tarjetas del manual (refranes, COG-013): una por vez, con la continuación
// oculta hasta «Ver frase completa». Sin puntuación ni temporizador.
function TarjetasUnaPorVez({ ex, large }: { ex: TablaOTarjetas; large: boolean }) {
  const [i, setI] = useState(0);
  const [vista, setVista] = useState(false);
  const total = ex.filas.length;
  const [inicio, continuacion, pregunta] = ex.filas[i] ?? [];
  function ir(n: number) {
    setI(n);
    setVista(false);
  }
  const boton = `min-h-12 px-5 rounded-full font-sans font-semibold cursor-pointer border-[1.5px] disabled:opacity-40 disabled:cursor-default ${large ? "text-[17px]" : "text-[15px]"}`;
  return (
    <div className="grid gap-3">
      <p className={`m-0 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-[15px]" : "text-[13px]"}`}>
        {ex.titulo} · {i + 1} de {total}
      </p>
      <div className="rounded-[22px] bg-verde-tenue border border-borde-suave px-5 py-6 grid gap-3 text-center" aria-live="polite">
        <p className={`m-0 font-serif text-tinta leading-snug ${large ? "text-[28px]" : "text-[24px]"}`}>{inicio}</p>
        {vista ? (
          <>
            <p className={`m-0 font-serif italic text-verde-profundo leading-snug ${large ? "text-[24px]" : "text-[20px]"}`}>{continuacion}</p>
            {pregunta && <p className={`m-0 text-tinta-suave ${large ? "text-[18px]" : "text-[15.5px]"}`}>{pregunta}</p>}
          </>
        ) : (
          <button type="button" onClick={() => setVista(true)} className={`${boton} justify-self-center bg-white border-verde-serenidad text-verde-profundo`}>
            Ver frase completa
          </button>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <button type="button" onClick={() => ir(i - 1)} disabled={i === 0} className={`${boton} bg-white border-borde text-tinta`}>
          Anterior
        </button>
        <button type="button" onClick={() => ir(i + 1)} disabled={i === total - 1} className={`${boton} bg-white border-borde text-tinta`}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

// Ayuda opcional para las pausas de COG-016. Nunca muestra puntuación.
function Temporizador({ segundos, titulo, large }: { segundos: number[]; titulo: string; large: boolean }) {
  const [restante, setRestante] = useState<number | null>(null);
  useEffect(() => {
    if (restante === null || restante <= 0) return;
    const t = setTimeout(() => setRestante((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [restante]);
  const etiqueta = (s: number) => (s < 60 ? `${s} s` : `${s / 60} min`);
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const boton = `min-h-12 px-5 rounded-full font-sans font-semibold cursor-pointer border-[1.5px] ${large ? "text-[17px]" : "text-[15px]"}`;
  return (
    <div className="grid gap-3 rounded-2xl bg-white border border-borde p-4">
      <p className={`m-0 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-[15px]" : "text-[13px]"}`}>{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {segundos.map((s) => (
          <button key={s} type="button" onClick={() => setRestante(s)} className={`${boton} bg-white border-verde-serenidad text-verde-profundo`}>
            {etiqueta(s)}
          </button>
        ))}
        {restante !== null && (
          <button type="button" onClick={() => setRestante(null)} className={`${boton} bg-white border-borde text-tinta`}>
            Detener
          </button>
        )}
      </div>
      {restante !== null && (
        <p className={`m-0 font-serif text-tinta ${large ? "text-[34px]" : "text-[28px]"}`} aria-live="polite">
          {restante > 0 ? mmss(restante) : "Listo, podés preguntar."}
        </p>
      )}
    </div>
  );
}

// Texto de ficha: párrafos, viñetas "• " y pasos "1. ". Los prefijos de
// sección del manual ("Prepará", "Funcionalidad física") van en negrita.
function TextoFicha({ texto, prefijos = [], large }: { texto: string; prefijos?: string[]; large: boolean }) {
  const bloques: ReactNode[] = [];
  let lista: { tipo: "ol" | "ul"; items: string[] } | null = null;
  const cerrar = () => {
    if (!lista) return;
    const L = lista.tipo;
    bloques.push(
      <L key={bloques.length} className={`m-0 pl-6 grid gap-1.5 ${L === "ol" ? "list-decimal" : "list-disc"}`}>
        {lista.items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </L>,
    );
    lista = null;
  };
  for (const linea of texto.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const paso = /^\d+\.\s+(.*)$/.exec(linea);
    const vineta = /^•\s*(.*)$/.exec(linea);
    if (paso || vineta) {
      const tipo = paso ? "ol" : "ul";
      if (lista && lista.tipo !== tipo) cerrar();
      lista = lista ?? { tipo, items: [] };
      lista.items.push((paso ?? vineta)![1]);
      continue;
    }
    cerrar();
    const pref = prefijos.find((p) => linea.startsWith(p + " "));
    bloques.push(
      <p key={bloques.length} className="m-0">
        {pref ? (
          <>
            <strong className="font-semibold text-tinta">{pref}</strong>
            {linea.slice(pref.length)}
          </>
        ) : (
          linea
        )}
      </p>,
    );
  }
  cerrar();
  return <div className={`grid gap-2.5 leading-relaxed text-tinta-suave ${large ? "text-[18px]" : "text-[15.5px]"}`}>{bloques}</div>;
}

function Seccion({ titulo, children, large, tono = "plano" }: { titulo: string; children: ReactNode; large: boolean; tono?: "plano" | "caja" | "aviso" }) {
  const caja = tono === "caja" ? "bg-campo border border-borde rounded-2xl p-4" : tono === "aviso" ? "bg-aviso border border-mostaza-vital rounded-2xl p-4" : "";
  return (
    <section className={`grid gap-2 ${caja}`}>
      <p className={`m-0 font-bold text-tinta ${large ? "text-[17px]" : "text-[15px]"}`}>{titulo}</p>
      {children}
    </section>
  );
}

// Single source of truth for "how a resource looks" — used both for the
// clinic's own preview (Biblioteca) and the real familiar/participante
// activity view, so the clinic always sees exactly what the family will see.
// `size` swaps between the compact familiar density and the larger
// touch-target type scale already used across the participant shell.
export function ResourceDetailView({ content, size = "compact" }: { content: ResourceContent; size?: "compact" | "large" }) {
  const large = size === "large";
  const mediaUrl = resourceUrl({ storage_path: content.storagePath ?? null, external_url: content.externalUrl ?? null }) ?? undefined;
  const posterUrl = content.posterPath ? (resourceUrl({ storage_path: content.posterPath, external_url: null }) ?? undefined) : undefined;
  const pasos = content.pasos && content.pasos.length > 0 ? content.pasos : [];
  const esFicha = !!content.modulo && modulosFicha.includes(content.modulo);
  const esGer = content.modulo === "gerontogimnasia";
  const esIntroGer = esGer && content.codigo === "GER-010";
  const texto = `m-0 leading-relaxed text-tinta-suave ${large ? "text-[18px]" : "text-[15.5px]"}`;
  const radio = large ? "rounded-[20px]" : "rounded-2xl";

  // Adaptación por etapa: solo la de la persona; en la vista previa, todas.
  const adaptaciones = content.adaptacionPorEtapa
    ? ETAPAS.filter((e) => content.adaptacionPorEtapa![e] && (!content.etapas?.length || content.etapas.includes(e)))
    : [];
  const etiquetarEtapa = !content.etapas?.length || adaptaciones.length > 1;

  return (
    <>
      {/* Gerontogimnasia: cuándo parar va antes del video y las consignas. */}
      {esGer && !esIntroGer && (
        <>
          <Seccion titulo="Cuándo parar" tono="aviso" large={large}>
            <p className={`m-0 leading-relaxed text-tinta ${large ? "text-[18px]" : "text-[15.5px]"}`}>{cuandoParar}</p>
          </Seccion>
          <Seccion titulo="Antes de empezar" tono="caja" large={large}>
            <p className={texto}>{antesDeEmpezar}</p>
          </Seccion>
        </>
      )}

      {mediaUrl && content.mediaKind === "video" && (
        <video
          controls
          playsInline
          preload="metadata"
          poster={posterUrl}
          src={mediaUrl}
          className={`w-full ${radio} bg-tinta object-contain`}
          style={{ maxHeight: esGer ? (large ? 560 : 480) : large ? 260 : 200 }}
        />
      )}
      {mediaUrl && content.mediaKind === "imagen" && (
        <img src={mediaUrl} alt="" className={`w-full object-cover ${radio}`} style={{ maxHeight: large ? 260 : 200 }} />
      )}
      {mediaUrl && content.mediaKind === "audio" && <audio controls src={mediaUrl} className="w-full" />}
      {mediaUrl && (content.mediaKind === "enlace" || content.mediaKind === "documento") && (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className={`block text-center border-2 border-verde-serenidad rounded-2xl bg-verde-tenue text-verde-profundo font-sans font-bold cursor-pointer no-underline ${large ? "min-h-16 leading-[4rem] text-[19px]" : "min-h-12 leading-[3rem] text-[15px]"}`}
        >
          {content.mediaKind === "documento" ? "Ver documento" : "Ver recurso"} ↗
        </a>
      )}
      {/* Nutrición no tiene imágenes ni videos: sin marcador de lugar. */}
      {!mediaUrl && !esFicha && <ImagePlaceholder label={content.fallbackLabel} height={large ? 170 : 150} rounded={radio} />}

      {content.intro && <p className={`m-0 leading-relaxed text-tinta ${large ? "text-[19px]" : "text-[16px]"}`}>{content.intro}</p>}

      {content.perfil && (
        <Seccion titulo="¿Para quién?" large={large}>
          <TextoFicha texto={content.perfil.replaceAll(" · ", "\n")} prefijos={["Funcionalidad física"]} large={large} />
        </Seccion>
      )}

      {content.sabiasQue && (
        <div className={`bg-beige-serenidad ${radio} ${large ? "px-4 py-3.5" : "p-4"}`}>
          <p className={`m-0 mb-1.5 flex items-center gap-2 font-bold text-tinta ${large ? "text-[16px]" : "text-[15px]"}`}>
            <LightbulbIcon /> ¿Sabías que…?
          </p>
          <p className={texto}>{content.sabiasQue}</p>
        </div>
      )}

      {content.porQue && (
        <div className={`bg-fila-fria ${large ? "rounded-2xl px-4 py-3.5" : "rounded-2xl p-4"}`}>
          <p className={`m-0 mb-1.5 font-bold text-verde-profundo ${large ? "text-[16px]" : "text-[15px]"}`}>¿Por qué esta actividad?</p>
          <p className={`m-0 leading-relaxed text-tinta-suave ${large ? "text-[18px]" : "text-[15px]"}`}>{content.porQue}</p>
        </div>
      )}

      {content.ciencia && (content.ciencia.gancho || content.ciencia.evidencia || content.ciencia.cierre) && (
        <div className={`bg-beige-serenidad ${large ? "rounded-2xl px-4 py-3.5" : "rounded-2xl p-4"}`}>
          <p className={`m-0 mb-1.5 flex items-center gap-2 tracking-[0.08em] uppercase font-bold text-tinta ${large ? "text-[13px]" : "text-[12px]"}`}>
            <LightbulbIcon /> La ciencia detrás de esta actividad
          </p>
          <div className={`grid gap-2 leading-relaxed text-tinta-suave ${large ? "text-[17px]" : "text-[14px]"}`}>
            {content.ciencia.gancho && <p className="m-0">{content.ciencia.gancho}</p>}
            {content.ciencia.evidencia && <p className="m-0">{content.ciencia.evidencia}</p>}
            {content.ciencia.cierre && <p className="m-0 font-semibold text-tinta">{content.ciencia.cierre}</p>}
          </div>
        </div>
      )}

      {content.materiales && (
        <div className={large ? "text-[18px]" : "text-[15px]"}>
          <p className={`m-0 mb-1.5 tracking-[0.1em] uppercase text-tinta-tenue ${large ? "text-[13px]" : "text-[12px]"}`}>Qué vas a necesitar</p>
          <p className="m-0 leading-relaxed text-tinta-suave">{content.materiales}</p>
        </div>
      )}

      {content.actividad && (
        <Seccion titulo="Tu actividad" large={large}>
          <TextoFicha texto={content.actividad} prefijos={esGer ? ["Prepará"] : []} large={large} />
        </Seccion>
      )}

      {/* La dosis individual autorizada manda; si no hay, la propuesta. */}
      {(content.indicacionIndividual || content.dosis) && (
        <Seccion titulo={content.indicacionIndividual ? (esGer ? "Dosis indicada por el equipo" : "Según su plan") : "Dosis propuesta del terapeuta"} tono="caja" large={large}>
          <p className={texto}>{content.indicacionIndividual || content.dosis}</p>
        </Seccion>
      )}

      {pasos.length > 0 && (
        <>
          <p className={`m-0 mb-2.5 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-[15px]" : "text-[13px]"}`}>Cómo realizarla</p>
          <div className={`grid gap-2.5 leading-relaxed text-tinta-suave ${large ? "text-[19px]" : "text-[16px]"}`}>
            {pasos.map((p, i) => (
              <span key={p}>
                {i + 1}. {p}
              </span>
            ))}
          </div>
        </>
      )}

      {content.extras && <MaterialDeApoyo extras={content.extras} large={large} />}

      {content.ayuda && (
        <Seccion titulo="Si necesita ayuda" tono="caja" large={large}>
          <p className={texto}>{content.ayuda}</p>
        </Seccion>
      )}

      {adaptaciones.length > 0 && (
        <Seccion titulo="Adaptación" tono="caja" large={large}>
          {adaptaciones.map((e) => (
            <p key={e} className={texto}>
              {etiquetarEtapa && <strong className="font-semibold text-tinta">{nivelCognitivoLabel[e]}: </strong>}
              {content.adaptacionPorEtapa![e]}
            </p>
          ))}
        </Seccion>
      )}

      {content.adaptacion && (
        <div className={`bg-campo border border-borde ${large ? "rounded-2xl px-4 py-3.5" : "rounded-2xl p-4"}`}>
          <p className={`m-0 mb-1.5 font-bold text-tinta ${large ? "text-[16px]" : "text-[15px]"}`}>{esFicha ? "Si necesita una adaptación" : "Si necesita ayuda extra"}</p>
          {/* pre-line: la adaptación trae un párrafo por nivel (Preventivo, DCL…). */}
          <p className={`m-0 leading-relaxed text-tinta-suave whitespace-pre-line ${large ? "text-[18px]" : "text-[15px]"}`}>{content.adaptacion}</p>
        </div>
      )}

      {content.tenEnCuenta && (
        <Seccion titulo="Tené en cuenta" tono="aviso" large={large}>
          <p className={`m-0 leading-relaxed text-tinta ${large ? "text-[18px]" : "text-[15.5px]"}`}>{content.tenEnCuenta}</p>
        </Seccion>
      )}

      {content.paraCerrar && (
        <Seccion titulo="Para cerrar" large={large}>
          <p className={`m-0 font-serif italic text-verde-profundo ${large ? "text-[21px]" : "text-[18px]"}`}>{content.paraCerrar}</p>
        </Seccion>
      )}

      {esGer && !esIntroGer && (
        <details className="rounded-2xl border border-borde bg-white px-4 py-3">
          <summary className={`cursor-pointer font-semibold text-tinta ${large ? "text-[17px]" : "text-[15px]"}`}>Cómo incorporar doble tarea</summary>
          <div className="grid gap-2 mt-2">
            {comoIncorporarDobleTarea.map((p) => (
              <p key={p} className={texto}>
                {p}
              </p>
            ))}
          </div>
        </details>
      )}
    </>
  );
}

// Ejemplos, tarjetas o temporizador de un recurso (campo extras). También lo
// usa el modo paso a paso.
export function MaterialDeApoyo({ extras, large = false }: { extras: ResourceExtras; large?: boolean }) {
  if (extras.modo === "temporizador") return <Temporizador segundos={extras.segundos} titulo={extras.titulo} large={large} />;
  if (extras.filas.length === 0) return null;
  return extras.modo === "tarjetas" ? <TarjetasUnaPorVez ex={extras} large={large} /> : <EjemplosTabla ex={extras} large={large} />;
}
