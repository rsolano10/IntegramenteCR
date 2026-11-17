import { useState } from "react";
import type { Cosa } from "../../../lib/actividades/bancos/intrusos";
import type { EjercicioIntruso } from "../../../lib/actividades/intruso";
import { usePista, type Control } from "../interactivas/comun";
import { DibujoP } from "./Feria";
import { P } from "./paleta";
import { Letrero } from "./Ornamento";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La olla de carne» (intruso). La cocina de leña: pared encalada, el fogón
// de ladrillo con la leña encendida y la olla grande humeando. Sobre la mesa
// de madera, las cosas. Todas van juntas menos una: la persona toca la que
// no va. Lo que sí va y se toca (o sale con la pista) entra a la olla; la
// olla no castiga, solo recibe.

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioIntruso; config: { mostrarCriterio: boolean }; ctl: Control }) {
  const [adentro, setAdentro] = useState<number[]>([]);
  const [hallado, setHallado] = useState(false);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const i = ej.cosas.findIndex((_, k) => k !== ej.intruso && !adentro.includes(k));
    if (i < 0) return;
    entrar(i);
    ctl.aviso(`«${ej.cosas[i].texto}» sí va: ya está en la olla.`);
  });

  function entrar(i: number) {
    setAdentro((a) => [...a, i]);
  }

  function tocar(i: number) {
    if (hallado || adentro.includes(i)) return;
    if (i === ej.intruso) {
      setHallado(true);
      return ctl.listo();
    }
    entrar(i);
    ctl.reintento(`«${ej.cosas[i].texto}» sí va. Probemos con otra.`);
  }

  const enMesa = ej.cosas.map((c, i) => ({ c, i })).filter(({ i }) => !adentro.includes(i));

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Cocina hierve={adentro.length} servido={false} />
        {/* La mesa de madera (la mesa de juego) */}
        <div className="relative px-3 pt-4 pb-5 sm:px-5" style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 26px, #CF9A5E 26px 28px)`, borderTop: `8px solid ${P.madera}` }}>
          <p className="m-0 mx-auto mb-3 w-fit px-3 py-1 rounded-[3px] font-rotulo text-[20px] leading-tight -rotate-1" style={{ background: P.cal, color: P.tierra, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
            {ej.titulo}
          </p>
          <ul className="list-none m-0 p-0 mx-auto max-w-[560px] grid grid-cols-2 sm:grid-cols-3 gap-3" aria-label="Sobre la mesa">
            {enMesa.map(({ c, i }) => {
              const esEl = hallado && i === ej.intruso;
              const est = estiloPieza(esEl ? "elegida" : "reposo");
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => tocar(i)}
                    disabled={hallado}
                    aria-label={esEl ? `${c.texto}: este no va` : c.texto}
                    className={`${clasePieza} ${est.className} w-full rounded-[14px]`}
                    style={{ ...est.style, background: P.cal }}
                  >
                    <CosaDibujo cosa={c} large={L} />
                    {esEl && (
                      <span className="absolute -top-2.5 -right-1.5 rounded-full px-2.5 py-0.5 text-[15px] font-bold" style={{ background: P.mostaza, color: P.tierra }}>
                        No va
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <Letrero large={L} clavado>
        {hallado ? (config.mostrarCriterio ? ej.criterio : "¡Esa era la que no iba!") : "¿Cuál no va con las demás?"}
      </Letrero>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Cocina hierve={final ? 0 : 2} servido={final} />
      <div className="h-6" style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 12px, #CF9A5E 12px 14px)`, borderTop: `8px solid ${P.madera}` }} />
    </div>
  );
}

// ─── Dibujo ───

function CosaDibujo({ cosa, large }: { cosa: Cosa; large: boolean }) {
  return (
    <span className="flex items-center justify-center gap-2 px-3 py-2.5 min-h-16">
      {cosa.dibujo && <DibujoP d={cosa.dibujo} size={34} />}
      <span className={`font-bold leading-tight text-center ${large ? "text-[22px]" : "text-[20px]"}`} style={{ color: P.tierra }}>
        {cosa.texto}
      </span>
    </span>
  );
}

// La cocina de leña. `hierve` sube el vapor a medida que entran cosas;
// `servido` es el momento final: la olla ya está servida en platos.
function Cocina({ hierve, servido }: { hierve: number; servido: boolean }) {
  return (
    // Pared de lado a lado; el dibujo centrado (no se recorta en pantallas anchas).
    <div className="pueblo-grano overflow-hidden" style={{ backgroundColor: P.cal }}>
    <svg viewBox="0 0 360 170" className="block mx-auto w-full max-w-[500px] h-auto overflow-visible" aria-hidden="true">
      {/* Zócalo y ventana con cortina */}
      <rect x="-600" y="128" width="1560" height="42" fill={P.serenidad} opacity="0.35" />
      <g>
        <rect x="24" y="24" width="64" height="58" fill={P.rosa} stroke={P.madera} strokeWidth="5" />
        <path d="M56 24 V82 M24 53 H88" stroke={P.madera} strokeWidth="3" />
        <path d="M22 22 h68 v12 c-10 6 -18 6 -34 0 c-16 6 -24 6 -34 0z" fill={P.naranja} />
      </g>
      {/* Repisa con jarros */}
      <rect x="250" y="40" width="96" height="5" fill={P.madera} />
      {[262, 290, 318].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 40 v-16 a10 10 0 0 1 20 0 v16z`} fill={i === 1 ? P.profundo : P.naranja} />
          <path d={`M${x + 20} 28 c6 0 6 8 0 8`} stroke={i === 1 ? P.profundo : P.naranja} strokeWidth="3" fill="none" />
        </g>
      ))}
      {/* El fogón de ladrillo */}
      <rect x="110" y="104" width="190" height="66" fill="#B4543A" />
      {[0, 1, 2].map((f) =>
        Array.from({ length: 7 }, (_, k) => <rect key={`${f}-${k}`} x={110 + k * 28 + (f % 2 ? 14 : 0)} y={108 + f * 20} width="26" height="17" fill="#C8644A" opacity="0.7" />),
      )}
      <rect x="104" y="98" width="202" height="10" fill={P.tierra} />
      {/* Leña y fuego */}
      <g transform="translate(205 150)">
        <rect x="-36" y="-4" width="72" height="9" rx="4" fill={P.maderaOscura} transform="rotate(-6)" />
        <rect x="-34" y="-2" width="68" height="9" rx="4" fill={P.madera} transform="rotate(8)" />
        <path d="M-14 -4 C-18 -18 -6 -22 -4 -34 C4 -24 14 -20 10 -4z" fill={P.naranja} />
        <path d="M-6 -4 C-8 -12 0 -16 2 -24 C6 -16 10 -12 6 -4z" fill={P.mostaza} />
      </g>
      {servido ? (
        // Momento final: la olla ya servida en tres platos hondos.
        <g className="motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]">
          {[150, 205, 260].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="96" rx="24" ry="7" fill={P.cal} stroke={P.tierra} strokeWidth="2" />
              <ellipse cx={x} cy="94" rx="18" ry="4" fill={P.maderaClara} />
              <circle cx={x - 6} cy="93" r="3" fill={P.naranja} />
              <circle cx={x + 5} cy="93" r="3" fill={P.serenidad} />
              <path d={`M${x - 4} 80 c-4 -6 4 -8 0 -14 M${x + 6} 82 c-4 -6 4 -8 0 -14`} stroke={P.tierra} strokeOpacity="0.35" strokeWidth="2" fill="none" className="motion-safe:animate-[pueblo-vapor_3.6s_ease-in-out_infinite]" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          {/* La olla grande, de peltre oscuro, con asas */}
          <path d="M150 50 h110 v40 a10 10 0 0 1 -10 10 h-90 a10 10 0 0 1 -10 -10z" fill={P.profundo} />
          <rect x="144" y="44" width="122" height="10" rx="4" fill={P.tinta} />
          <path d="M144 62 c-14 0 -14 16 0 16 M266 62 c14 0 14 16 0 16" stroke={P.tinta} strokeWidth="5" fill="none" />
          <path d="M162 60 h20" stroke={P.cal} strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
          {/* Vapor: más hilos a medida que entran cosas */}
          {Array.from({ length: Math.min(4, 1 + hierve) }, (_, k) => (
            <path
              key={k}
              d={`M${176 + k * 20} 40 c-8 -8 8 -14 0 -22 c-8 -8 8 -12 0 -18`}
              stroke={P.tierra}
              strokeOpacity="0.28"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="motion-safe:animate-[pueblo-vapor_3.2s_ease-in-out_infinite]"
              style={{ animationDelay: `${k * 0.6}s` }}
            />
          ))}
        </g>
      )}
    </svg>
    </div>
  );
}
