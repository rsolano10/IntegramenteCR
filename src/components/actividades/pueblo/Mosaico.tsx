import { useState } from "react";
import { companera, continuar, estadoParejas, generarBaldosas, parejasCompletas, voltear, type Baldosa as TBaldosa, type Carta, type EjercicioParejas } from "../../../lib/actividades/parejas";
import { crearAzar } from "../../../lib/actividades/azar";
import { roseton } from "../../../lib/actividades/roseton";
import { usePista, type Control } from "../interactivas/comun";
import { Boton } from "../interactivas/ui";
import { Figura } from "../interactivas/Figura";
import { P } from "./paleta";
import { clasePieza, sombraCapa } from "./pieza";

// «El piso de mosaico» (parejas). El piso de baldosa hidráulica del corredor
// de una casa antigua, visto desde arriba. Las cartas son baldosas: lisas boca
// abajo, con su dibujo boca arriba (generado con el rosetón). Si no son
// pareja, quedan a la vista hasta «Continuar» (nada se voltea solo). Al
// final, el piso completo forma su diseño.

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioParejas; config: { numerarReverso: boolean }; ctl: Control }) {
  const [e, setE] = useState(estadoParejas);
  const [ultima, setUltima] = useState<number | null>(null);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const L = ctl.large;
  const cols = ej.cartas.length <= 6 ? "grid-cols-3" : ej.cartas.length <= 12 ? "grid-cols-3 min-[480px]:grid-cols-4" : "grid-cols-4";
  const completo = parejasCompletas(ej, e);

  usePista(ctl.pista, () => {
    if (ultima !== null && !e.encontradas.includes(ultima)) setMarcadas([companera(ej, ultima)]);
    else {
      const libre = ej.cartas.find((c) => !e.encontradas.includes(c.id));
      if (libre) setMarcadas([libre.id, companera(ej, libre.id)]);
    }
    ctl.aviso("La baldosa marcada es la pareja.");
  });

  function tocar(c: Carta) {
    const r = voltear(ej, e, c.id);
    if (r.resultado === "nada") return;
    setE(r.estado);
    setUltima(c.id);
    setMarcadas((m) => m.filter((x) => x !== c.id && !r.estado.encontradas.includes(x)));
    if (r.resultado === "pareja") {
      if (parejasCompletas(ej, r.estado)) ctl.listo();
      else ctl.acierto("Muy bien, son pareja.");
    } else if (r.resultado === "distintas") ctl.reintento("No son pareja. Mirá bien dónde están y tocá «Continuar».");
    else ctl.aviso("Ahora tocá otra baldosa.");
  }

  const nombre = (c: Carta) => (c.cara.tipo === "palabra" ? c.cara.valor : c.cara.nombre);

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Corredor />
        {/* El piso (la mesa de juego): sisas de cemento entre baldosas */}
        <div className="px-3 py-3 sm:px-5" style={{ background: "#CFC6A8" }}>
          <ul className={`list-none m-0 p-0 mx-auto max-w-[480px] grid gap-1.5 ${cols}`} aria-label="Baldosas">
            {ej.cartas.map((c, i) => {
              const encontrada = e.encontradas.includes(c.id);
              const arriba = encontrada || e.volteadas.includes(c.id);
              const marcada = marcadas.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => tocar(c)}
                    aria-disabled={arriba || e.esperando}
                    aria-label={arriba ? `${nombre(c)}${encontrada ? ", pareja encontrada" : ""}` : `Baldosa ${i + 1}, boca abajo${marcada ? ". Es la pareja" : ""}`}
                    className={`${clasePieza} w-full aspect-square rounded-[3px] overflow-hidden ${arriba && !encontrada ? "-translate-y-1" : ""} ${encontrada ? "cursor-default" : ""}`}
                    style={{
                      background: arriba ? P.cal : "#C9643F",
                      border: marcada ? `3px dashed ${P.mostaza}` : arriba && !encontrada ? `3px solid ${e.esperando ? P.mostaza : P.cal}` : encontrada ? "none" : `2px solid ${P.cal}`,
                      boxShadow: encontrada ? "none" : `0 4px 0 rgba(51,36,28,0.4)`,
                    }}
                  >
                    {arriba ? (
                      <span className={`block w-full h-full ${encontrada ? "" : "motion-safe:animate-[pueblo-asentar_300ms_ease-out]"}`}>
                        <Cara c={c} large={L} />
                      </span>
                    ) : (
                      <Reverso numero={config.numerarReverso ? i + 1 : null} large={L} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {e.esperando && (
        <Boton onClick={() => setE(continuar(e))} autoFocus large={L} className="w-full">
          Continuar
        </Boton>
      )}
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {completo ? "¡El piso quedó completo!" : e.esperando ? "Mirá bien dónde están." : "Tocá dos baldosas."}
      </p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  // Inicio: unas baldosas boca arriba y otras lisas. Final: el piso completo
  // con un mismo diseño, que al juntarse forma círculos.
  const tiles = generarBaldosas(3, crearAzar(11));
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Corredor />
      <div className="p-3" style={{ background: "#CFC6A8" }}>
        <div className={`grid gap-1 ${final ? "grid-cols-6" : "grid-cols-4"}`}>
          {Array.from({ length: final ? 12 : 4 }, (_, i) => (
            <span key={i} className={`aspect-square rounded-[2px] overflow-hidden ${final ? "motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]" : ""}`} style={{ animationDelay: `${i * 60}ms`, background: "#C9643F" }}>
              {final || i % 2 === 0 ? <BaldosaSvg b={tiles[final ? 0 : (i / 2) % 3].baldosa} /> : <Reverso numero={null} large={false} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dibujo ───

function Cara({ c, large }: { c: Carta; large: boolean }) {
  if (c.cara.tipo === "baldosa") return <BaldosaSvg b={c.cara.baldosa} />;
  if (c.cara.tipo === "icono")
    return (
      <span className="w-full h-full flex items-center justify-center">
        <Figura id={c.cara.valor} size={large ? 56 : 48} />
      </span>
    );
  return (
    <span className={`w-full h-full flex items-center justify-center px-1 text-center font-bold leading-tight break-words ${large ? "text-[20px]" : "text-[18px]"}`} style={{ color: P.tierra }}>
      {c.cara.valor}
    </span>
  );
}

// Baldosa hidráulica: fondo, cuartos de círculo en las esquinas (al juntarse
// forman círculos), y un rosetón al centro.
function BaldosaSvg({ b }: { b: TBaldosa }) {
  return (
    <svg viewBox="0 0 100 100" className="block w-full h-full">
      <rect width="100" height="100" fill={b.fondo} />
      {[
        [0, 0],
        [100, 0],
        [0, 100],
        [100, 100],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="30" fill={b.esquina} />
          <circle cx={x} cy={y} r="18" fill={b.fondo} />
          <circle cx={x} cy={y} r="10" fill={b.centro.colores[2] ?? b.esquina} />
        </g>
      ))}
      <g transform="translate(20 20) scale(0.6)">
        {roseton(b.centro).map((f, i) => (
          <path key={i} d={f.d} fill={f.fill} />
        ))}
      </g>
    </svg>
  );
}

// Baldosa lisa (boca abajo): barro cocido con un filete, y el número pintado si hay.
function Reverso({ numero, large }: { numero: number | null; large: boolean }) {
  return (
    <span className="relative w-full h-full flex items-center justify-center">
      <span aria-hidden="true" className="absolute inset-[10%] rounded-[2px]" style={{ border: `2px solid rgba(246,241,228,0.35)` }} />
      {numero !== null && (
        <span className={`relative font-rotulo ${large ? "text-[26px]" : "text-[24px]"}`} style={{ color: P.cal }}>
          {numero}
        </span>
      )}
    </span>
  );
}

// Arriba del piso: la pared del corredor con su zócalo, una puerta y una maceta.
function Corredor() {
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      <svg viewBox="0 0 360 80" preserveAspectRatio="xMidYMax slice" className="block w-full h-[80px] sm:h-[100px]" aria-hidden="true">
        <rect x="0" y="50" width="360" height="30" fill={P.guaria} />
        <rect x="0" y="46" width="360" height="5" fill={P.tierra} opacity="0.35" />
        <path d="M150 80 V24 a26 26 0 0 1 52 0 V80z" fill={P.madera} />
        <path d="M156 80 V26 a20 20 0 0 1 40 0 V80z" fill={P.maderaOscura} opacity="0.35" />
        {/* Maceta con helecho */}
        <path d="M44 80 l4 -22 h28 l4 22z" fill={P.naranja} />
        {[-24, -10, 6, 20].map((dx, i) => (
          <path key={dx} d={`M62 58 C${62 + dx} ${34 - (i % 2) * 6} ${62 + dx * 1.6} ${28} ${62 + dx * 2} ${30}`} stroke={P.profundo} strokeWidth="5" strokeLinecap="round" fill="none" />
        ))}
        {/* Mecedora de espaldar de bejuco, a la derecha */}
        <path d="M268 80 L276 30 H312 L320 80" stroke={P.maderaOscura} strokeWidth="5" fill="none" />
        <rect x="280" y="34" width="28" height="26" fill={P.maderaClara} />
        <path d="M262 80 q32 8 64 0" stroke={P.maderaOscura} strokeWidth="4" fill="none" />
      </svg>
    </div>
  );
}
