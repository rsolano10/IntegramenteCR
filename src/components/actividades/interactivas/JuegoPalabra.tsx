import { useState } from "react";
import { palabraFormada, type EjercicioPalabra } from "../../../lib/actividades/formarPalabra";
import { claseFicha, foco, usePista, type Control } from "./comun";
import { Check } from "./ui";

const igual = (a: string, b: string) => a.toLocaleLowerCase("es") === b.toLocaleLowerCase("es");
const mayus = (s: string) => s.toLocaleUpperCase("es");

// «Armá la palabra»: tocar una ficha la pone en la siguiente casilla libre;
// tocar una casilla llena devuelve la letra.
export function JuegoPalabra({ ejercicio: ej, ctl }: { ejercicio: EjercicioPalabra; ctl: Control }) {
  const n = ej.objetivo.length;
  const [casillas, setCasillas] = useState<(number | null)[]>(() => Array.from({ length: n }, (_, i) => (i < ej.fijas ? ej.fichas[i].id : null)));
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const letra = (id: number) => ej.fichas.find((f) => f.id === id)!.letra;
  const usadas = new Set(casillas.filter((x): x is number => x !== null));

  function revisar(c: (number | null)[]) {
    if (c.some((x) => x === null)) return;
    const puestas = c.map((id) => letra(id!));
    if (palabraFormada(ej, puestas)) {
      setHecho(true);
      return ctl.listo();
    }
    // Quedan las letras que están en su lugar; las demás vuelven.
    setCasillas(c.map((id, i) => (i < ej.fijas || igual(letra(id!), ej.objetivo[i]) ? id : null)));
    ctl.reintento("Probemos otra vez. Dejamos las letras que ya estaban en su lugar.");
  }

  function poner(id: number) {
    if (hecho || usadas.has(id)) return;
    const libre = casillas.indexOf(null);
    if (libre < 0) return;
    const c = [...casillas];
    c[libre] = id;
    setCasillas(c);
    revisar(c);
  }

  function quitar(i: number) {
    if (hecho || i < ej.fijas || casillas[i] === null) return;
    const c = [...casillas];
    c[i] = null;
    setCasillas(c);
  }

  usePista(ctl.pista, () => {
    const p = casillas.findIndex((id, i) => id === null || !igual(letra(id), ej.objetivo[i]));
    if (p < 0) return;
    const c = [...casillas];
    // Una ficha con esa letra que esté libre o mal puesta.
    const candidata = ej.fichas.find((f) => igual(f.letra, ej.objetivo[p]) && (!usadas.has(f.id) || c.some((id, q) => id === f.id && q !== p && !igual(letra(id), ej.objetivo[q]))));
    if (!candidata) return;
    const q = c.indexOf(candidata.id);
    if (q >= 0) c[q] = null;
    c[p] = candidata.id;
    setCasillas(c);
    ctl.aviso(`Pusimos la letra ${mayus(ej.objetivo[p])}.`);
    revisar(c);
  });

  const libres = ej.fichas.filter((f) => !usadas.has(f.id));
  const chica = n > 7;

  return (
    <div className="grid gap-4">
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>{hecho ? `¡${mayus(ej.objetivo.join(""))}!` : "Armá la palabra."}</p>
      {ej.pista && !hecho && <p className={`m-0 italic text-tinta-suave ${L ? "text-[22px]" : "text-[20px]"}`}>Pista: {ej.pista}</p>}

      {/* Casillas */}
      <ol className={`list-none m-0 p-0 flex flex-wrap justify-center ${chica ? "gap-1.5" : "gap-2"}`} aria-label="Palabra">
        {casillas.map((id, i) => {
          const fija = i < ej.fijas;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-disabled={id === null || fija || hecho}
                aria-label={id === null ? `Casilla ${i + 1}, vacía` : `Casilla ${i + 1}: ${mayus(letra(id))}${fija || hecho ? "" : ". Tocá para devolverla"}`}
                className={`relative ${chica ? "w-11 h-14" : "w-14 h-16"} rounded-xl flex items-center justify-center font-sans font-semibold text-tinta ${L ? "text-[30px]" : "text-[28px]"} ${foco} ${
                  id === null
                    ? "bg-campo border-2 border-dashed border-verde-serenidad cursor-default"
                    : hecho
                      ? "bg-campo border-2 border-semaforo-verde-texto"
                      : fija
                        ? "bg-verde-tenue border-2 border-verde-serenidad cursor-default"
                        : "bg-white border-[3px] border-verde-profundo cursor-pointer"
                }`}
              >
                {id !== null && mayus(letra(id))}
                {hecho && i === n - 1 && <Check />}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Fichas */}
      {!hecho && (
        <ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-3" aria-label="Letras">
          {libres.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => poner(f.id)} aria-label={`Letra ${mayus(f.letra)}`} className={`${claseFicha({})} w-14 h-14 ${L ? "text-[30px]" : "text-[28px]"}`}>
                {mayus(f.letra)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
