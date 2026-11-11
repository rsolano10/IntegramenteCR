import { useState } from "react";
import { palabraFormada, type EjercicioPalabra } from "../../../lib/actividades/formarPalabra";
import { usePista, type Control } from "../interactivas/comun";
import { Roseton } from "./Ornamento";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «El rotulista» (formar-palabra). Taller de rótulos: tarros de pintura y
// brochas en la pared, una tabla en blanco sobre el caballete y las letras
// de madera pintada sobre el banco. Tocar una letra la pinta en la siguiente
// casilla de la tabla; tocar una casilla pintada la devuelve. Al completar,
// la tabla gana sus remates de carreta; al final, se cuelga en la fachada.

const COLORES_LETRA = [P.naranja, P.profundo, P.grano, P.guaria];
const igual = (a: string, b: string) => a.toLocaleLowerCase("es") === b.toLocaleLowerCase("es");
const mayus = (s: string) => s.toLocaleUpperCase("es");

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioPalabra; ctl: Control }) {
  const n = ej.objetivo.length;
  const [casillas, setCasillas] = useState<(number | null)[]>(() => Array.from({ length: n }, (_, i) => (i < ej.fijas ? ej.fichas[i].id : null)));
  const [hecho, setHecho] = useState(false);
  const [devueltas, setDevueltas] = useState<number[]>([]);
  const L = ctl.large;
  const letra = (id: number) => ej.fichas.find((f) => f.id === id)!.letra;
  const usadas = new Set(casillas.filter((x): x is number => x !== null));

  function revisar(c: (number | null)[]) {
    if (c.some((x) => x === null)) return;
    if (palabraFormada(ej, c.map((id) => letra(id!)))) {
      setHecho(true);
      return ctl.listo();
    }
    // Quedan pintadas las letras que están en su lugar; las demás vuelven al banco.
    const quedan = c.map((id, i) => (i < ej.fijas || igual(letra(id!), ej.objetivo[i]) ? id : null));
    setDevueltas(c.filter((id, i) => id !== null && quedan[i] === null) as number[]);
    setCasillas(quedan);
    ctl.reintento("Probemos otra vez. Dejamos pintadas las letras que ya estaban en su lugar.");
  }

  function poner(id: number) {
    if (hecho || usadas.has(id)) return;
    const libre = casillas.indexOf(null);
    if (libre < 0) return;
    const c = [...casillas];
    c[libre] = id;
    setCasillas(c);
    setDevueltas([]);
    revisar(c);
  }

  usePista(ctl.pista, () => {
    const p = casillas.findIndex((id, i) => id === null || !igual(letra(id), ej.objetivo[i]));
    if (p < 0) return;
    const c = [...casillas];
    const candidata = ej.fichas.find((f) => igual(f.letra, ej.objetivo[p]) && (!usadas.has(f.id) || c.some((id, q) => id === f.id && q !== p && !igual(letra(id), ej.objetivo[q]))));
    if (!candidata) return;
    const q = c.indexOf(candidata.id);
    if (q >= 0) c[q] = null;
    c[p] = candidata.id;
    setCasillas(c);
    ctl.aviso(`Pintamos la letra ${mayus(ej.objetivo[p])}.`);
    revisar(c);
  });

  const libres = ej.fichas.filter((f) => !usadas.has(f.id));
  const ancho = n > 7 ? "w-9 h-12 text-[26px]" : n > 5 ? "w-11 h-14 text-[32px]" : "w-12 h-16 text-[38px]";

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Taller />
        {/* La tabla sobre el caballete */}
        <div className="relative px-3 pb-3 -mt-14 sm:-mt-16">
          <div
            className="relative mx-auto max-w-[520px] rounded-[6px] px-3 pt-4 pb-4"
            style={{ background: P.cal, border: `6px solid ${P.madera}`, boxShadow: "0 5px 0 rgba(51,36,28,0.35)" }}
          >
            {hecho && (
              <>
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]">
                  <Roseton size={34} params={{ petalos: 8, anillos: 2, forma: "gota", colores: [P.naranja, P.mostaza, P.grano, P.cal] }} />
                </span>
                <span className="absolute -right-4 top-1/2 -translate-y-1/2 motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]">
                  <Roseton size={34} params={{ petalos: 8, anillos: 2, forma: "gota", colores: [P.naranja, P.mostaza, P.grano, P.cal] }} />
                </span>
              </>
            )}
            {ej.pista && !hecho && (
              <p className={`m-0 mb-2 text-center italic ${L ? "text-[20px]" : "text-[18px]"}`} style={{ color: P.madera }}>
                {ej.pista}
              </p>
            )}
            <ol className="list-none m-0 p-0 flex flex-wrap justify-center gap-1.5" aria-label="La tabla">
              {casillas.map((id, i) => {
                const fija = i < ej.fijas;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        if (hecho || fija || id === null) return;
                        const c = [...casillas];
                        c[i] = null;
                        setCasillas(c);
                      }}
                      aria-disabled={id === null || fija || hecho}
                      aria-label={id === null ? `Casilla ${i + 1}, sin pintar` : `Casilla ${i + 1}: ${mayus(letra(id))}${fija || hecho ? "" : ". Tocá para devolverla"}`}
                      className={`${ancho} flex items-end justify-center pb-1 font-rotulo leading-none bg-transparent border-0 p-0 ${id !== null && !fija && !hecho ? "cursor-pointer" : "cursor-default"} focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo`}
                      style={{ color: hecho ? P.grano : P.tierra, borderBottom: `3px ${id === null ? "dashed" : "solid"} ${id === null ? P.maderaClara : "transparent"}` }}
                    >
                      {id !== null && <span className={i >= ej.fijas ? "motion-safe:animate-[pueblo-asentar_300ms_ease-out]" : ""}>{mayus(letra(id))}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          {/* Patas del caballete */}
          <div aria-hidden="true" className="mx-auto max-w-[420px] flex justify-between px-10 -mt-0.5">
            <span className="w-2.5 h-5" style={{ background: P.maderaOscura }} />
            <span className="w-2.5 h-5" style={{ background: P.maderaOscura }} />
          </div>
        </div>
        {/* Banco de trabajo con las letras de madera */}
        {!hecho && (
          <div className="px-3 pt-4 pb-4" style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 22px, #CF9A5E 22px 23px)`, borderTop: `8px solid ${P.madera}` }}>
            <ul className="list-none m-0 p-0 mx-auto max-w-[520px] flex flex-wrap justify-center gap-3" aria-label="Letras de madera">
              {libres.map((f) => {
                const est = estiloPieza(devueltas.includes(f.id) ? "regreso" : "reposo");
                const color = COLORES_LETRA[f.id % COLORES_LETRA.length];
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => poner(f.id)}
                      aria-label={`Letra ${mayus(f.letra)}`}
                      className={`${clasePieza} ${est.className} w-14 h-14 rounded-[6px] flex items-center justify-center !font-rotulo ${L ? "text-[34px]" : "text-[32px]"}`}
                      style={{ ...est.style, background: color, color: P.cal }}
                    >
                      {mayus(f.letra)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {hecho ? `¡Quedó pintado: ${mayus(ej.objetivo.join(""))}!` : "Tocá las letras en orden para pintar la palabra."}
      </p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  if (!final)
    return (
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
        <Taller />
        <div className="flex justify-center gap-2 px-3 py-3" style={{ background: P.maderaClara, borderTop: `8px solid ${P.madera}` }}>
          {["R", "Ó", "T", "U", "L", "O"].map((l, i) => (
            <span key={i} className="w-10 h-10 rounded-[5px] flex items-center justify-center font-rotulo text-[24px]" style={{ background: COLORES_LETRA[i % 4], color: P.cal, boxShadow: "0 3px 0 rgba(51,36,28,0.35)" }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    );
  // Momento final: la tabla terminada cuelga en la fachada.
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <svg viewBox="0 0 360 200" className="block w-full h-auto" style={{ background: P.rosa }}>
        <rect x="0" y="0" width="360" height="70" fill={P.mostaza} opacity="0.4" />
        <rect x="30" y="40" width="300" height="160" fill={P.cal} />
        <path d="M14 46 L180 14 L346 46z" fill={P.grano} />
        <rect x="150" y="120" width="60" height="80" fill={P.madera} />
        {[60, 270].map((x) => (
          <g key={x}>
            <rect x={x} y="120" width="34" height="44" fill={P.profundo} />
            <rect x={x + 4} y="124" width="26" height="18" fill={P.mostaza} opacity="0.75" />
          </g>
        ))}
        <rect x="30" y="182" width="300" height="18" fill={P.serenidad} />
        {/* Cadenas y tabla */}
        <path d="M110 56 V70 M250 56 V70" stroke={P.tierra} strokeWidth="2" />
        <g className="motion-safe:animate-[pueblo-aparece_480ms_ease-out_both]">
          <rect x="88" y="68" width="184" height="44" rx="4" fill={P.cal} stroke={P.madera} strokeWidth="5" />
          <text x="180" y="98" textAnchor="middle" fontFamily="Caprasimo, serif" fontSize="22" fill={P.grano}>
            La Esquina
          </text>
          <circle cx="98" cy="90" r="6" fill={P.naranja} />
          <circle cx="262" cy="90" r="6" fill={P.naranja} />
        </g>
      </svg>
    </div>
  );
}

// Pared del taller: tarros de pintura, brochas y un rótulo de muestra.
function Taller() {
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      <svg viewBox="0 0 360 130" className="block w-full h-[130px] sm:h-[150px]" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {/* Repisa con tarros */}
        <rect x="16" y="52" width="130" height="6" fill={P.madera} />
        {[
          [22, P.naranja],
          [54, P.mostaza],
          [86, P.profundo],
          [118, P.grano],
        ].map(([x, c]) => (
          <g key={x as number}>
            <rect x={x as number} y="28" width="24" height="24" rx="2" fill={P.serenidad} />
            <rect x={(x as number) - 1} y="26" width="26" height="5" rx="1.5" fill={P.tierra} opacity="0.5" />
            <path d={`M${x} 30 h24 v8 c-4 4 -8 0 -12 4 c-4 -4 -8 0 -12 -4z`} fill={c as string} />
          </g>
        ))}
        {/* Brochas en un tarro */}
        <rect x="292" y="34" width="26" height="30" rx="2" fill={P.naranja} />
        {[298, 306, 312].map((x, i) => (
          <g key={x}>
            <rect x={x} y={8 + i * 4} width="4" height="28" fill={P.madera} />
            <rect x={x - 2} y={4 + i * 4} width="8" height="8" rx="1" fill={[P.mostaza, P.grano, P.profundo][i]} />
          </g>
        ))}
        {/* Rótulo de muestra colgado */}
        <path d="M196 6 V18 M268 6 V18" stroke={P.tierra} strokeWidth="1.5" />
        <rect x="180" y="16" width="104" height="30" rx="3" fill={P.profundo} />
        <text x="232" y="37" textAnchor="middle" fontFamily="Caprasimo, serif" fontSize="15" fill={P.mostaza}>
          Rótulos
        </text>
        {/* Caballete (detrás de la tabla) */}
        <path d="M120 130 L170 66 L190 66 L240 130" stroke={P.maderaOscura} strokeWidth="7" fill="none" />
      </svg>
    </div>
  );
}
