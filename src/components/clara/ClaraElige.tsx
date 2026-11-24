import { Suspense, lazy, useState } from "react";
import { usePermiso } from "../../lib/consentimientos";
import { ActivarClara } from "./ActivarClara";
import { Link } from "react-router-dom";
import type { MediaResource } from "../../lib/mediaResources";
import { useMyPatient } from "../../lib/useMyPatient";
import { RUTA_EXTRAS } from "../../lib/usePlan";
import { guionDe } from "../../lib/sesiones";
import { duracionCorta } from "../../lib/duracion";
import { moduloLabel } from "../../lib/modulos";
import { codigosEnTexto, contextoParaElegir, sinCodigos } from "../../lib/claraActividad";
import { IconoActividad } from "../actividad/IconoActividad";
import { ClaraAvatar } from "./ClaraAvatar";

// En «Actividades extra»: la familia le cuenta a Clara qué tiene ganas de
// hacer y Clara recomienda de 1 a 3 actividades de su lista. Clara las
// nombra con su código ([COG-012]); la app saca el código del texto y las
// muestra como tarjetas para abrirlas. El chat se carga con la primera
// pregunta.

const Chat = lazy(() => import("./ChatClaraActividad"));

function ClaraEligeConPermiso({ recursos }: { recursos: MediaResource[] }) {
  const { data: myPatient } = useMyPatient();
  const [primera, setPrimera] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const conCodigo = recursos.filter((r) => r.codigo);
  const porCodigo = new Map(conCodigo.map((r) => [r.codigo!, r]));
  const contexto = contextoParaElegir(
    conCodigo.map((r) => ({ codigo: r.codigo!, titulo: r.titulo, modulo: r.modulo, duracion: r.duracion, deQue: guionDe(r.codigo)?.frase ?? r.detalle })),
    myPatient?.nombre?.split(" ")[0] ?? null,
  );

  // Las actividades que Clara recomendó, como tarjetas.
  const tarjetas = (texto: string) => {
    const rs = codigosEnTexto(texto)
      .map((c) => porCodigo.get(c))
      .filter((r): r is MediaResource => !!r);
    if (!rs.length) return null;
    return (
      <ul className="m-0 p-0 list-none grid gap-2">
        {rs.map((r) => (
          <li key={r.id}>
            <Link
              to={`${RUTA_EXTRAS}/${r.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-verde-serenidad/40 bg-verde-tenue/40 p-2.5 no-underline hover:border-verde-serenidad"
            >
              <IconoActividad modulo={r.modulo} lado={44} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug text-[16px] text-tinta">{r.titulo}</span>
                <span className="block text-[14px] text-tinta-suave">{[moduloLabel[r.modulo], duracionCorta(r.duracion)].filter(Boolean).join(" · ")}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-verde-profundo group-hover:bg-verde-tenue">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  if (!conCodigo.length) return null;

  return (
    <section aria-label="Clara te ayuda a elegir" className="grid gap-3">
      <p className="m-0 text-[13px] tracking-[0.14em] uppercase font-semibold text-tinta-suave">O contale a Clara qué buscan</p>
      <div className="rounded-[22px] border border-borde bg-white px-4 py-4 grid gap-3">
        <p className="m-0 flex items-center gap-2.5 text-[16px] leading-snug text-tinta">
          <ClaraAvatar tam={24} />
          <span>
            ¿Algo tranquilo, para moverse, con música? <span className="text-tinta-suave">Clara te sugiere una.</span>
          </span>
        </p>
        {primera ? (
          <Suspense fallback={<p className="m-0 text-[16px] text-tinta-suave">Abriendo el chat…</p>}>
            <Chat contexto={contexto} inicial={primera} quien="familia" mostrar={sinCodigos} adjuntos={tarjetas} placeholder="Contale qué buscan…" />
          </Suspense>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) setPrimera(input.trim());
            }}
          >
            <label className="sr-only" htmlFor="clara-elige">
              Qué tienen ganas de hacer
            </label>
            <textarea
              id="clara-elige"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) setPrimera(input.trim());
                }
              }}
              rows={1}
              placeholder="Por ejemplo: algo corto y tranquilo"
              className="flex-1 min-h-12 max-h-32 resize-none rounded-2xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans text-[16px] leading-snug text-tinta"
            />
            <button type="submit" disabled={!input.trim()} className="shrink-0 min-h-12 px-5 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed">
              Enviar
            </button>
          </form>
        )}
        <p className="m-0 text-[12.5px] leading-snug text-tinta-suave">Clara es una IA y puede equivocarse.</p>
      </div>
    </section>
  );
}

// Sin el permiso «ia_clara», en lugar del chat se ofrece activarla.
export function ClaraElige(props: Parameters<typeof ClaraEligeConPermiso>[0]) {
  const { permitido, cargando } = usePermiso("ia_clara");
  if (cargando) return null;
  return permitido ? <ClaraEligeConPermiso {...props} /> : <ActivarClara compacto />;
}
