import { useState } from "react";
import { revisarConteo, type EjercicioContar } from "../../../lib/actividades/contarPorTipo";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { Figura } from "../interactivas/Figura";
import { P } from "./paleta";
import { sombraCapa } from "./pieza";

// «El canasto» (contar-por-tipo). Un canasto volcado sobre un mantel de
// cuadros, con frutas de acá: mango, jocote, pejibaye, cas y mamón chino.
// Debajo, una tablita por fruta con − y + para contar. «Listo» revisa. Al
// final, las frutas quedan ordenadas en el canasto.

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioContar; ctl: Control }) {
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [revisar, setRevisar] = useState<string | null>(null);
  const [numerar, setNumerar] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const sinArt = (s: string) => s.replace(/^(el|la|los|las) /, "");

  usePista(ctl.pista, () => {
    const t = revisarConteo(ej, conteos) ?? ej.tipos[0];
    setNumerar(t.id);
    ctl.aviso(`Numeramos ${t.plural} en el mantel.`);
  });

  function listo() {
    const mal = revisarConteo(ej, conteos);
    if (!mal) {
      setHecho(true);
      setRevisar(null);
      return ctl.listo();
    }
    setRevisar(mal.id);
    ctl.reintento(`Revisá ${mal.plural}.`);
  }

  const orden: Record<number, number> = {};
  const vistos: Record<string, number> = {};
  ej.items.forEach((it, i) => (orden[i] = vistos[it.tipo] = (vistos[it.tipo] ?? 0) + 1));

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        {/* El mantel con las frutas (y el canasto volcado) */}
        <figure className="relative m-0 px-3 pt-4 pb-5" style={{ background: MANTEL }} aria-label={`Mantel con ${ej.tipos.map((t) => sinArt(t.plural)).join(", ")}`}>
          <div className="relative mx-auto max-w-[520px] min-h-[150px]">
            <span aria-hidden="true" className={`absolute -left-2 -top-1 ${hecho ? "motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]" : ""}`}>
              <CanastoSvg volcado={!hecho} />
            </span>
            <div className={`relative flex flex-wrap items-center justify-center gap-2.5 ${hecho ? "pl-24 opacity-30" : "pl-16"}`} aria-hidden="true">
              {ej.items.map((it, i) => (
                <span key={i} className="relative inline-flex" style={{ transform: `rotate(${((i * 37) % 30) - 15}deg)` }}>
                  <Fruta id={it.tipo} size={it.grande ? (L ? 50 : 44) : L ? 32 : 28} />
                  {numerar === it.tipo && (
                    <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full text-[14px] font-bold flex items-center justify-center" style={{ background: P.cal, color: P.tierra, boxShadow: "0 2px 0 rgba(51,36,28,0.3)" }}>
                      {orden[i]}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </figure>
        {/* Tablitas para contar, sobre la mesa de madera */}
        <ul className="list-none m-0 px-3 pt-3 pb-4 grid gap-3" style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 22px, #CF9A5E 22px 23px)`, borderTop: `8px solid ${P.madera}` }}>
          {ej.tipos.map((t) => {
            const n = conteos[t.id] ?? 0;
            const aRevisar = revisar === t.id;
            return (
              <li
                key={t.id}
                className="mx-auto w-full max-w-[520px] flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] px-3 py-2"
                style={{ background: P.cal, border: aRevisar ? `3px solid ${P.mostaza}` : `2px solid ${P.cal}`, boxShadow: "0 4px 0 rgba(51,36,28,0.3)" }}
              >
                <span className={`flex flex-1 min-w-[6rem] items-center gap-2.5 font-semibold ${L ? "text-[22px]" : "text-[20px]"}`} style={{ color: P.tierra }}>
                  <Fruta id={t.id} size={L ? 38 : 34} />
                  <span className="inline-block first-letter:uppercase">{sinArt(t.plural)}</span>
                </span>
                <span className="ml-auto flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={hecho || n === 0}
                    onClick={() => setConteos((c) => ({ ...c, [t.id]: Math.max(0, (c[t.id] ?? 0) - 1) }))}
                    aria-label={`Uno menos de ${sinArt(t.plural)}`}
                    className="w-14 h-14 rounded-full border-[3px] border-verde-serenidad bg-white text-verde-profundo text-[30px] leading-none font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-default focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
                  >
                    −
                  </button>
                  <output aria-live="polite" aria-label={`${sinArt(t.plural)}: ${n}`} className={`w-9 text-center font-extrabold ${L ? "text-[30px]" : "text-[28px]"}`} style={{ color: P.tierra }}>
                    {n}
                  </output>
                  <button
                    type="button"
                    disabled={hecho}
                    onClick={() => setConteos((c) => ({ ...c, [t.id]: Math.min(20, (c[t.id] ?? 0) + 1) }))}
                    aria-label={`Uno más de ${sinArt(t.plural)}`}
                    className="w-14 h-14 rounded-full border-0 bg-verde-profundo text-white text-[30px] leading-none font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-default focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
                  >
                    +
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {!hecho && (
        <Acciones ctl={ctl}>
          <Boton onClick={listo} large={L}>
            Listo
          </Boton>
        </Acciones>
      )}
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>{hecho ? "¡Las frutas volvieron al canasto!" : "¿Cuántas hay de cada una?"}</p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  const frutas = ["mango", "jocote", "pejibaye", "cas", "mamon", "jocote", "cas"];
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] px-3 py-4" style={{ ...sombraCapa, background: MANTEL }} aria-hidden="true">
      <div className="flex items-center justify-center gap-2">
        <CanastoSvg volcado={!final} lleno={final} />
        {!final && (
          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
            {frutas.map((f, i) => (
              <span key={i} style={{ transform: `rotate(${(i * 23) % 30 - 15}deg)` }}>
                <Fruta id={f} size={36} />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Mantel de cuadros (guaria y cal), hecho con dos franjas cruzadas.
const MANTEL = `repeating-linear-gradient(0deg, rgba(138,75,154,0.28) 0 18px, transparent 18px 36px), repeating-linear-gradient(90deg, rgba(138,75,154,0.28) 0 18px, transparent 18px 36px), ${P.cal}`;

// Canasto tejido: volcado (de lado) o derecho y lleno.
function CanastoSvg({ volcado, lleno = false }: { volcado: boolean; lleno?: boolean }) {
  return (
    <svg viewBox="0 0 120 100" width={volcado ? 80 : 140} height={volcado ? 66 : 116}>
      <g transform={volcado ? "rotate(-70 60 55)" : undefined}>
        {lleno && (
          <g>
            {[
              ["mango", 30, 30],
              ["pejibaye", 52, 22],
              ["cas", 74, 30],
              ["jocote", 42, 36],
              ["mamon", 64, 38],
            ].map(([id, x, y]) => (
              <g key={id as string} transform={`translate(${(x as number) - 14} ${(y as number) - 18}) scale(0.7)`}>
                <FrutaPaths id={id as string} />
              </g>
            ))}
          </g>
        )}
        <path d="M10 40 h100 l-12 52 h-76z" fill={P.madera} />
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={`M14 ${48 + i * 9} h92`} stroke={P.maderaOscura} strokeWidth="3" opacity="0.6" />
        ))}
        <rect x="6" y="36" width="108" height="9" rx="4" fill={P.maderaOscura} />
      </g>
    </svg>
  );
}

function Fruta({ id, size }: { id: string; size: number }) {
  if (["cuchara", "tenedor", "plato", "vaso", "manzana", "banano", "naranja", "uvas", "circulo", "cuadrado", "triangulo", "estrella"].includes(id)) return <Figura id={id} size={size} />;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <FrutaPaths id={id} />
    </svg>
  );
}

// Frutas de acá, en formas planas con su sombra corta.
function FrutaPaths({ id }: { id: string }) {
  const s = "rgba(51,36,28,0.28)";
  switch (id) {
    case "mango":
      return (
        <>
          <path d="M8 24 C8 12 20 6 30 10 C38 14 36 30 24 34 C14 37 8 32 8 24z" fill={s} transform="translate(0 2)" />
          <path d="M8 24 C8 12 20 6 30 10 C38 14 36 30 24 34 C14 37 8 32 8 24z" fill="#E2B13A" />
          <path d="M20 8 C26 8 32 12 34 18 C30 14 26 12 20 12z" fill={P.naranja} />
          <path d="M28 9 l3 -5" stroke={P.maderaOscura} strokeWidth="2" />
        </>
      );
    case "jocote":
      return (
        <>
          <ellipse cx="20" cy="23" rx="10" ry="13" fill={s} />
          <ellipse cx="20" cy="21" rx="10" ry="13" fill={P.grano} />
          <ellipse cx="16" cy="16" rx="3" ry="5" fill={P.naranja} opacity="0.8" />
        </>
      );
    case "pejibaye":
      return (
        <>
          <path d="M20 6 C30 6 34 18 30 28 C27 35 13 35 10 28 C6 18 10 6 20 6z" fill={s} transform="translate(0 2)" />
          <path d="M20 6 C30 6 34 18 30 28 C27 35 13 35 10 28 C6 18 10 6 20 6z" fill={P.naranja} />
          <path d="M14 7 h12 l-2 5 h-8z" fill={P.tierra} />
        </>
      );
    case "cas":
      return (
        <>
          <circle cx="20" cy="22" r="12" fill={s} />
          <circle cx="20" cy="20" r="12" fill="#C9C26A" />
          <circle cx="20" cy="9" r="2" fill={P.maderaOscura} />
        </>
      );
    case "mamon":
      return (
        <>
          <circle cx="20" cy="22" r="11" fill={s} />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <path key={i} d={`M${20 + 10 * Math.cos(a)} ${20 + 10 * Math.sin(a)} L${20 + 15 * Math.cos(a)} ${20 + 15 * Math.sin(a)}`} stroke={P.grano} strokeWidth="2.4" strokeLinecap="round" />;
          })}
          <circle cx="20" cy="20" r="11" fill={P.grano} />
        </>
      );
    default:
      return null;
  }
}
