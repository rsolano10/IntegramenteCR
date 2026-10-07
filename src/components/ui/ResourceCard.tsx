import type { ReactNode } from "react";
import { ClockIcon, MediaKindIcon, RepeatIcon } from "./Icons";
import { ModuloIcon } from "./ModuloIcon";
import {
  moduloLabel,
  nivelCognitivoShort,
  nivelMotorClass,
  nivelMotorLabel,
  resourceUrl,
  tipoLabel,
  type MediaResource,
  type ResourceModulo,
} from "../../lib/mediaResources";

// One mood per módulo so the grid reads by color before it reads by text —
// sentidos (calma/teal), movimiento (energía/ámbar), música (calidez/
// terracota), reminiscencia (nostalgia/sepia, como una foto antigua). Reuses
// hues already in the brand palette (verde-serenidad, mostaza-vital, los
// semáforo) instead of inventing new ones — just stretched into a gradient.
const moduloTheme: Record<ResourceModulo, { from: string; to: string; chip: string }> = {
  sentidos: { from: "#89c0c6", to: "#3f6a70", chip: "bg-verde-profundo/85" },
  movimiento: { from: "#fadfa9", to: "#e8b857", chip: "bg-[#8a6a2a]/80" },
  musica: { from: "#e8b5a1", to: "#c0664f", chip: "bg-[#8c3f2a]/80" },
  reminiscencia: { from: "#ece3c4", to: "#b7a06d", chip: "bg-[#6b5726]/80" },
};

const tagClass = "inline-flex items-center px-2 py-0.5 rounded-full bg-beige-serenidad text-tinta text-[11px] font-semibold";

// Shared visual for "one resource" — used by the clinic's own library
// (Biblioteca.tsx, with a RowMenu of actions) and the family's read-only
// catalog (familiar/Actividades.tsx, with onClick instead) so the same
// content doesn't read as two different products depending on who's
// looking at it. `actions` and `onClick` are both optional and mutually
// exclusive in practice — a card never needs both at once.
export function ResourceCard({
  resource: r,
  actions,
  onClick,
}: {
  resource: MediaResource;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  const url = resourceUrl(r);
  const hasImage = r.media_kind === "imagen" && !!url;
  const theme = moduloTheme[r.modulo];

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-[22px] border overflow-hidden transition-all duration-200 ${
        r.activo ? "border-borde bg-white" : "border-borde-suave bg-campo/60 opacity-70"
      } ${onClick ? "cursor-pointer hover:-translate-y-[3px] hover:shadow-elevada" : "hover:shadow-[0_20px_44px_-32px_rgba(31,51,56,0.5)]"}`}
    >
      <div
        className="relative h-32 shrink-0 overflow-hidden"
        style={hasImage ? undefined : { backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
      >
        {hasImage ? (
          <img
            src={url}
            alt={r.titulo}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ModuloIcon
            modulo={r.modulo}
            className="absolute -right-3 -bottom-5 w-24 h-24 text-white opacity-20 rotate-[-6deg]"
          />
        )}

        <span
          className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 pl-1.5 pr-2.5 py-1 rounded-full text-white text-[10.5px] font-semibold uppercase tracking-[0.04em] backdrop-blur-sm ${theme.chip}`}
        >
          <ModuloIcon modulo={r.modulo} className="w-3 h-3 text-white" />
          {moduloLabel[r.modulo]}
        </span>

        {actions ? (
          <div
            className="absolute top-2 right-2 rounded-full bg-white/90 shadow-sm backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : (
          r.codigo && (
            <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-tinta/50 text-white text-[10px] font-mono tracking-wide backdrop-blur-sm">
              {r.codigo}
            </span>
          )
        )}

        {!hasImage && r.media_kind && (
          <span className="absolute bottom-2.5 left-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-tinta shadow-sm">
            <MediaKindIcon kind={r.media_kind} className="w-4 h-4" />
          </span>
        )}

        {!r.activo && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-tinta/70 text-white text-[10.5px] font-semibold backdrop-blur-sm">
            Inactivo
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="m-0 text-[10.5px] uppercase tracking-[0.08em] text-tinta-tenue font-semibold">{tipoLabel[r.tipo]}</p>
        <h3 className="m-0 font-serif font-normal text-[18px] leading-snug text-tinta line-clamp-2">{r.titulo}</h3>
        {r.detalle && <p className="m-0 text-[13px] text-tinta-suave leading-snug line-clamp-2">{r.detalle}</p>}

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2.5">
          {(r.niveles_motores ?? []).map((nm) => (
            <span key={nm} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${nivelMotorClass[nm]}`}>
              {nivelMotorLabel[nm]}
            </span>
          ))}
          {(r.niveles_cognitivos ?? []).slice(0, 2).map((nc) => (
            <span key={nc} className={tagClass}>
              {nivelCognitivoShort[nc]}
            </span>
          ))}
        </div>

        {(r.duracion || r.frecuencia) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 border-t border-borde-suave text-[12px] text-tinta-tenue">
            {r.duracion && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="text-verde-serenidad" />
                {r.duracion}
              </span>
            )}
            {r.frecuencia && (
              <span className="inline-flex items-center gap-1">
                <RepeatIcon className="text-verde-serenidad" />
                {r.frecuencia}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
