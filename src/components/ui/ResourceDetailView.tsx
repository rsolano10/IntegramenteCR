import { ImagePlaceholder } from "./ImagePlaceholder";
import { LightbulbIcon } from "./Icons";
import { resourceUrl, type MediaKind } from "../../lib/mediaResources";

export interface ResourceContent {
  mediaKind?: MediaKind | null;
  storagePath?: string | null;
  externalUrl?: string | null;
  materiales?: string | null;
  adaptacion?: string | null;
  ciencia?: { gancho: string; evidencia: string; cierre: string } | null;
  porQue?: string | null;
  pasos?: string[];
  fallbackLabel: string;
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

      {content.adaptacion && (
        <div className={`bg-campo border border-borde ${large ? "rounded-2xl px-4 py-3.5" : "rounded-2xl p-4"}`}>
          <p className={`m-0 mb-1.5 font-bold text-tinta ${large ? "text-[16px]" : "text-[15px]"}`}>Si necesita ayuda extra</p>
          <p className={`m-0 leading-relaxed text-tinta-suave ${large ? "text-[18px]" : "text-[15px]"}`}>{content.adaptacion}</p>
        </div>
      )}
    </>
  );
}
