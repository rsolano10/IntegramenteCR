import { useState } from "react";
import { revisarConteo, type EjercicioContar } from "../../../lib/actividades/contarPorTipo";
import { foco, usePista, type Control } from "./comun";
import { Figura } from "./Figura";
import { Boton } from "./ui";

// «¿Cuántos hay?»: una escena y un contador por tipo (− y +). «Listo» revisa.
export function JuegoContar({ ejercicio: ej, ctl }: { ejercicio: EjercicioContar; ctl: Control }) {
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [revisar, setRevisar] = useState<string | null>(null);
  const [numerar, setNumerar] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const sinArt = (s: string) => s.replace(/^(el|la|los|las) /, "");

  usePista(ctl.pista, () => {
    const t = revisarConteo(ej, conteos) ?? ej.tipos[0];
    setNumerar(t.id);
    ctl.aviso(`Numeramos ${t.plural} en el dibujo.`);
  });

  function cambiar(id: string, d: number) {
    setConteos((c) => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] ?? 0) + d)) }));
  }

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

  // Número de cada cosa dentro de su tipo (para la pista).
  const orden: Record<number, number> = {};
  const vistos: Record<string, number> = {};
  ej.items.forEach((it, i) => (orden[i] = vistos[it.tipo] = (vistos[it.tipo] ?? 0) + 1));

  return (
    <div className="grid gap-4">
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>¿Cuántos hay de cada uno?</p>

      <figure className="m-0 rounded-2xl bg-campo border-2 border-borde p-3" aria-label={`Dibujo con ${ej.tipos.map((t) => sinArt(t.plural)).join(", ")}`}>
        <div className="flex flex-wrap items-center justify-center gap-2.5" aria-hidden="true">
          {ej.items.map((it, i) => (
            <span key={i} className="relative inline-flex">
              <Figura id={it.tipo} size={it.grande ? (L ? 52 : 46) : L ? 34 : 30} />
              {numerar === it.tipo && (
                <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-mostaza-vital text-tinta text-[14px] font-bold flex items-center justify-center">{orden[i]}</span>
              )}
            </span>
          ))}
        </div>
      </figure>

      <ul className="list-none m-0 p-0 grid gap-3">
        {ej.tipos.map((t) => {
          const n = conteos[t.id] ?? 0;
          const aRevisar = revisar === t.id;
          return (
            <li key={t.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-3 py-2 ${aRevisar ? "bg-aviso border-[3px] border-mostaza-vital" : hecho ? "bg-campo border-2 border-semaforo-verde-texto" : "bg-white border-2 border-borde"}`}>
              <span className={`flex flex-1 min-w-[9rem] items-center gap-3 font-semibold text-tinta ${L ? "text-[22px]" : "text-[20px]"}`}>
                <Figura id={t.id} size={L ? 44 : 40} />
                <span className="inline-block first-letter:uppercase">{sinArt(t.plural)}</span>
              </span>
              <span className="ml-auto flex items-center gap-3 shrink-0">
              <button
                type="button"
                disabled={hecho || n === 0}
                onClick={() => cambiar(t.id, -1)}
                aria-label={`Uno menos de ${sinArt(t.plural)}`}
                className={`w-14 h-14 rounded-full border-2 border-verde-serenidad bg-white text-verde-profundo text-[30px] leading-none font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-default ${foco}`}
              >
                −
              </button>
              <output aria-live="polite" aria-label={`${sinArt(t.plural)}: ${n}`} className={`w-10 text-center font-semibold text-tinta ${L ? "text-[30px]" : "text-[28px]"}`}>
                {n}
              </output>
              <button
                type="button"
                disabled={hecho}
                onClick={() => cambiar(t.id, 1)}
                aria-label={`Uno más de ${sinArt(t.plural)}`}
                className={`w-14 h-14 rounded-full border-0 bg-verde-profundo text-white text-[30px] leading-none font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-default ${foco}`}
              >
                +
              </button>
              </span>
            </li>
          );
        })}
      </ul>

      {!hecho && (
        <Boton onClick={listo} large={L} className="w-full">
          Listo
        </Boton>
      )}
    </div>
  );
}
