import { useState } from "react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { LightbulbIcon } from "./Icons";
import { resourceUrl, type MediaKind, type ResourceExtras } from "../../lib/mediaResources";

export interface ResourceContent {
  mediaKind?: MediaKind | null;
  storagePath?: string | null;
  externalUrl?: string | null;
  materiales?: string | null;
  adaptacion?: string | null;
  ciencia?: { gancho: string; evidencia: string; cierre: string } | null;
  porQue?: string | null;
  pasos?: string[];
  extras?: ResourceExtras | null;
  fallbackLabel: string;
}

// Ejemplos del manual (tabla de varias columnas): en vez de una tabla
// ancha, cada fila es una tarjetita con sus etiquetas, para que se lea bien
// en el celular.
function EjemplosTabla({ ex, large }: { ex: ResourceExtras; large: boolean }) {
  return (
    <div className={`grid gap-2.5 ${large ? "text-[17px]" : "text-[15px]"}`}>
      <p className={`m-0 tracking-[0.14em] uppercase text-tinta-tenue ${large ? "text-[15px]" : "text-[13px]"}`}>{ex.titulo}</p>
      {ex.intro && <p className="m-0 leading-relaxed text-tinta">{ex.intro}</p>}
      {ex.filas.map((fila, i) => (
        <div key={i} className="grid gap-1.5 rounded-2xl bg-white border border-borde px-4 py-3">
          {fila.map((celda, j) => (
            <p key={j} className={`m-0 leading-relaxed ${j === 0 ? "font-semibold text-tinta" : "text-tinta-suave"}`}>
              {j > 0 && ex.columnas[j] && <span className="block text-[12px] tracking-[0.06em] uppercase text-tinta-tenue">{ex.columnas[j]}</span>}
              {celda}
            </p>
          ))}
        </div>
      ))}
      {ex.cierre && <p className="m-0 leading-relaxed text-tinta-suave">{ex.cierre}</p>}
    </div>
  );
}

// Tarjetas del manual (refranes, actividad 13): una por vez, con la
// continuación oculta hasta «Ver frase completa» y la pregunta para
// conversar debajo. Columnas: inicio, continuación, pregunta.
function TarjetasUnaPorVez({ ex, large }: { ex: ResourceExtras; large: boolean }) {
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

// Single source of truth for "how a resource looks" — used both for the
// clinic's own preview (Biblioteca) and the real familiar/participante
// activity view, so the clinic always sees exactly what the family will see.
// `size` swaps between the compact familiar density and the larger
// touch-target type scale already used across the participant shell.
export function ResourceDetailView({ content, size = "compact" }: { content: ResourceContent; size?: "compact" | "large" }) {
  const large = size === "large";
  const mediaUrl = resourceUrl({ storage_path: content.storagePath ?? null, external_url: content.externalUrl ?? null });
  const pasos = content.pasos && content.pasos.length > 0 ? content.pasos : [];

  return (
    <>
      {mediaUrl && content.mediaKind === "video" && (
        <video controls src={mediaUrl} className={`w-full ${large ? "rounded-[20px]" : "rounded-2xl"} bg-tinta`} style={{ maxHeight: large ? 260 : 200 }} />
      )}
      {mediaUrl && content.mediaKind === "imagen" && (
        <img src={mediaUrl} alt="" className={`w-full object-cover ${large ? "rounded-[20px]" : "rounded-2xl"}`} style={{ maxHeight: large ? 260 : 200 }} />
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
      {!mediaUrl && <ImagePlaceholder label={content.fallbackLabel} height={large ? 170 : 150} rounded={large ? "rounded-[20px]" : "rounded-2xl"} />}

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

      {content.extras && content.extras.filas.length > 0 &&
        (content.extras.modo === "tarjetas" ? <TarjetasUnaPorVez ex={content.extras} large={large} /> : <EjemplosTabla ex={content.extras} large={large} />)}

      {content.adaptacion && (
        <div className={`bg-campo border border-borde ${large ? "rounded-2xl px-4 py-3.5" : "rounded-2xl p-4"}`}>
          <p className={`m-0 mb-1.5 font-bold text-tinta ${large ? "text-[16px]" : "text-[15px]"}`}>Si necesita ayuda extra</p>
          {/* pre-line: la adaptación trae un párrafo por nivel (Preventivo, DCL…). */}
          <p className={`m-0 leading-relaxed text-tinta-suave whitespace-pre-line ${large ? "text-[18px]" : "text-[15px]"}`}>{content.adaptacion}</p>
        </div>
      )}
    </>
  );
}
