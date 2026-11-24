import { useState } from "react";
// «La ciencia de esta actividad», con la línea gráfica de IntegraMente: el
// verde serenidad y el beige de la marca, las gotas del isotipo como fondo,
// la idea principal en la serif de la marca, el cierre con el acento
// mostaza y, al pie, la firma con el logotipo oficial (public/marca).

// Sin emojis: la marca habla con sus propios colores y gotas.
const sinEmojis = (t: string) =>
  t
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

// La primera oración, como titular; el resto, como explicación.
function partir(t: string): [string, string] {
  const m = /^(.+?[.?!])\s+(.+)$/s.exec(t);
  return m ? [m[1], m[2]] : [t, ""];
}

export interface TextoCiencia {
  gancho?: string;
  evidencia?: string;
  cierre?: string;
}

// `compacta`: solo el titular y «Leer más» (en el tablero de la actividad,
// para que lo primero sea cómo se hace).
export function CienciaActividad({ ciencia, large = false, compacta = false }: { ciencia: TextoCiencia; large?: boolean; compacta?: boolean }) {
  const [abierta, setAbierta] = useState(!compacta);
  let titular = sinEmojis(ciencia.gancho ?? "");
  let cuerpo = sinEmojis(ciencia.evidencia ?? "");
  const cierre = sinEmojis(ciencia.cierre ?? "");
  // Un solo texto (el «¿Sabías que…?» o el porqué): su primera oración es el titular.
  if (titular && !cuerpo && !cierre) [titular, cuerpo] = partir(titular);
  if (!titular && !cuerpo && !cierre) return null;

  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-verde-serenidad/25 px-5 pt-5 pb-4 shadow-[0_18px_40px_-32px_rgba(31,51,56,0.55)]"
      style={{ background: "linear-gradient(160deg, #f5f9f9 0%, #dfeceb 52%, #ebe6ce 100%)" }}
    >
      {/* Las gotas del isotipo, grandes y suaves, como marca de agua */}
      <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 w-44 rotate-12 opacity-[0.13] select-none" />

      <p className={`relative m-0 flex items-center gap-2 tracking-[0.16em] uppercase font-semibold text-verde-profundo ${large ? "text-[14px]" : "text-[13px]"}`}>
        <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="w-5 h-auto" />
        La ciencia de esta actividad
      </p>
      <span className="relative mt-3 block h-[3px] w-12 rounded-full bg-mostaza-vital" aria-hidden="true" />

      {titular && <p className={`relative m-0 mt-3 font-serif leading-snug text-tinta ${large ? "text-[26px]" : "text-[22px]"}`}>{titular}</p>}
      {abierta && cuerpo && <p className={`relative m-0 mt-2.5 leading-relaxed text-tinta-suave ${large ? "text-[19px]" : "text-[15.5px]"}`}>{cuerpo}</p>}
      {!abierta && (cuerpo || cierre) && (
        <button
          type="button"
          onClick={() => setAbierta(true)}
          className={`relative mt-2 min-h-11 p-0 border-0 bg-transparent font-sans font-semibold text-verde-profundo underline underline-offset-4 cursor-pointer ${large ? "text-[18px]" : "text-[15.5px]"}`}
        >
          Leer más
        </button>
      )}

      {abierta && cierre && (
        <div className="relative mt-4 flex items-stretch gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-[0_6px_16px_-12px_rgba(31,51,56,0.5)]">
          <span className="w-1.5 shrink-0 rounded-full bg-mostaza-vital" aria-hidden="true" />
          <p className={`m-0 font-semibold leading-snug text-tinta ${large ? "text-[19px]" : "text-[15.5px]"}`}>{cierre}</p>
        </div>
      )}

      {/* Firma de la marca */}
      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-verde-serenidad/20 pt-3">
        <span className={`text-tinta-tenue ${large ? "text-[15px]" : "text-[14px]"}`}>Explicado por el equipo de</span>
        <span className="inline-flex items-center gap-1.5 h-6">
          <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="h-full w-auto" />
          <img src="/marca/logotipo.png" alt="IntegraMente" className="h-[80%] w-auto" />
        </span>
      </div>
    </section>
  );
}
