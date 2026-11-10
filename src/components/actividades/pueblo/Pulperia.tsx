import { useRef, useState, type ReactNode } from "react";
import { colones, combinacion, esBillete, revisarPago, type EjercicioPago } from "../../../lib/actividades/pagoExacto";
import { usePista, type Control } from "../interactivas/comun";
import { Boton } from "../interactivas/ui";
import { roseton } from "../../../lib/actividades/roseton";
import { Roseton } from "./Ornamento";
import { BILLETES, MONEDA, P, sombraPapel } from "./paleta";

// «La pulpería» (pago-exacto). Estantes con frascos, la pizarra y la romana
// al fondo; al frente, el mostrador de madera: la libreta con la cuenta, la
// bandeja de peltre donde se pone el pago, y la plata sobre el mostrador.
// Escena y mesa son un solo dibujo. La recompensa es la escena: el sello de
// «Pagado» en la libreta y, al final, la bolsa de la compra.

export function JuegoPulperia({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioPago; config: { mostrarSuma: boolean }; ctl: Control }) {
  const [pago, setPago] = useState<{ id: number; valor: number }[]>([]);
  const [sugerida, setSugerida] = useState<number[] | null>(null);
  const [hecho, setHecho] = useState(false);
  const sig = useRef(0);
  const poner = (valor: number) => setPago((p) => [...p, { id: sig.current++, valor }]);
  const L = ctl.large;
  const suma = pago.reduce((s, x) => s + x.valor, 0);

  usePista(ctl.pista, () => {
    setSugerida(combinacion(ej.monto, ej.denominaciones));
    ctl.aviso("En la bandeja quedó marcada una forma de pagarlo. Podés armarla igual o de otra forma.");
  });

  function listo() {
    const r = revisarPago(
      ej.monto,
      pago.map((x) => x.valor),
    );
    if (r === "justo") {
      setHecho(true);
      setSugerida(null);
      return ctl.listo();
    }
    ctl.reintento(r === "falta" ? "Falta un poco." : "Te pasaste un poco.");
  }

  const billetes = [...ej.denominaciones].filter(esBillete).reverse();
  const monedas = [...ej.denominaciones].filter((d) => !esBillete(d)).reverse();

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={{ boxShadow: sombraPapel(4, "rgba(51,36,28,0.25)") }}>
        <Fondo />
        <Mostrador>
          {/* Libreta con la cuenta */}
          <Libreta monto={ej.monto} suma={config.mostrarSuma ? suma : null} pagado={hecho} large={L} />

          {/* Bandeja de peltre: lo que vas a pagar */}
          <section
            aria-label="Lo que vas a pagar"
            className="relative mt-3 rounded-[22px] p-3 min-h-[96px]"
            style={{ background: P.cal, border: `4px solid ${P.profundo}`, boxShadow: `inset 0 3px 0 rgba(51,36,28,0.12), ${sombraPapel(3)}` }}
          >
            {pago.length === 0 && !sugerida && (
              <p className={`m-0 py-5 text-center text-tinta-suave ${L ? "text-[20px]" : "text-[18px]"}`}>Poné aquí lo que vas a pagar</p>
            )}
            {sugerida && !hecho && (
              <ul aria-label={`Una forma de pagarlo: ${sugerida.map(colones).join(", ")}`} className="list-none m-0 p-0 flex flex-wrap gap-2 mb-2">
                {sugerida.map((d, i) => (
                  <li key={i} aria-hidden="true" className="opacity-40">
                    <Dinero valor={d} chico />
                  </li>
                ))}
              </ul>
            )}
            {pago.length > 0 && (
              <ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-3" aria-label="Piezas en la bandeja">
                {pago.map((x) => (
                  <li key={x.id} className="motion-safe:animate-[pueblo-asentar_320ms_ease-out]">
                    <Dinero valor={x.valor} chico etiqueta={`Quitar ${colones(x.valor)} de la bandeja`} disabled={hecho} onClick={() => setPago((p) => p.filter((y) => y.id !== x.id))} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* La plata, sobre el mostrador */}
          {!hecho && (
            <section aria-label="Tu plata" className="mt-4">
              {billetes.length > 0 && (
                <ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-3 mb-3">
                  {billetes.map((d) => (
                    <li key={d}>
                      <Dinero valor={d} etiqueta={`Poner ${colones(d)}`} onClick={() => poner(d)} />
                    </li>
                  ))}
                </ul>
              )}
              <ul className="list-none m-0 p-0 flex flex-wrap items-center justify-center gap-3">
                {monedas.map((d) => (
                  <li key={d}>
                    <Dinero valor={d} etiqueta={`Poner ${colones(d)}`} onClick={() => poner(d)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Mostrador>
      </div>

      {!hecho && (
        <>
          <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>Tocá la plata para pagar justo.</p>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Boton onClick={listo} disabled={!pago.length} large={L}>
              Listo
            </Boton>
            <Boton variante="secundario" onClick={() => setPago([])} disabled={!pago.length} large={L}>
              Vaciar
            </Boton>
          </div>
        </>
      )}
    </div>
  );
}

// Portada: la pulpería esperando (inicio) o la bolsa de la compra lista (cierre).
export function PortadaPulperia({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[420px] overflow-hidden rounded-[20px]" style={{ boxShadow: sombraPapel(4, "rgba(51,36,28,0.25)") }} aria-hidden="true">
      <Fondo />
      <Mostrador bajo>
        <div className={`relative ${final ? "h-[150px]" : "h-[120px]"}`}>
          {final ? (
            <BolsaConManos />
          ) : (
            <>
              <div className="absolute left-2 top-2 w-[46%] -rotate-3">
                <LibretaVacia />
              </div>
              <div className="absolute right-6 top-6 flex gap-2">
                <Dinero valor={500} chico />
                <Dinero valor={100} chico />
              </div>
              <div className="absolute right-10 top-[68px] rotate-6">
                <Dinero valor={1000} chico />
              </div>
            </>
          )}
        </div>
      </Mostrador>
    </div>
  );
}

// ─── Dibujo ───

// Pared encalada, cenefa pintada, estantes, pizarra y romana. Contraste medio:
// es el fondo, nada de esto se toca.
function Fondo() {
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      {/* Cenefa de carreta, de lado a lado */}
      <div
        className="h-4"
        style={{
          backgroundColor: P.naranja,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='16' viewBox='0 0 30 16'><path d='M15 1.5C17 5 17.6 6.4 15 8 12.4 6.4 13 5 15 1.5ZM22 8C18.5 10 17.1 10.6 15 8 17.1 5.4 18.5 6 22 8ZM15 14.5C13 11 12.4 9.6 15 8 17.6 9.6 17 11 15 14.5ZM8 8C11.5 6 12.9 5.4 15 8 12.9 10.6 11.5 10 8 8Z' fill='${P.mostaza}'/></svg>`,
          )}")`,
          boxShadow: "0 3px 0 rgba(51,36,28,0.22)",
        }}
      />
      <svg viewBox="12 16 336 156" className="relative block mx-auto w-full max-w-[520px] h-auto">

        {/* Estante de arriba */}
        <Frasco x={22} y={74} contenido={P.tierra} />
        <Frasco x={54} y={74} contenido={P.cal} granos={P.maderaClara} />
        <Frasco x={86} y={74} contenido={P.naranja} granos={P.mostaza} />
        {[124, 150, 176].map((x) => (
          <g key={x}>
            <rect x={x} y="48" width="22" height="26" rx="2" fill={P.profundo} />
            <rect x={x} y="56" width="22" height="9" fill={P.mostaza} />
            <ellipse cx={x + 11} cy="48" rx="11" ry="2.5" fill={P.serenidad} />
          </g>
        ))}
        {/* Pizarra */}
        <g>
          <rect x="210" y="26" width="64" height="40" rx="2" fill={P.madera} />
          <rect x="214" y="30" width="56" height="32" fill={P.profundo} />
          <text x="242" y="44" textAnchor="middle" fontFamily="Caprasimo, serif" fontSize="11" fill={P.cal}>
            Hay
          </text>
          <text x="242" y="57" textAnchor="middle" fontFamily="Caprasimo, serif" fontSize="11" fill={P.cal}>
            tortillas
          </text>
        </g>
        <Tabla y={74} />

        {/* Estante de abajo */}
        {[20, 46].map((x, i) => (
          <g key={x}>
            <path d={`M${x} 140 V112 l4 -6 h20 l4 6 V140z`} fill={P.maderaClara} />
            <rect x={x + 5} y="118" width="18" height="10" fill={i ? P.naranja : P.profundo} />
          </g>
        ))}
        <Frasco x={84} y={140} contenido={P.cal} granos={P.grano} ancho={30} />
        {/* Racimo de plátanos */}
        <g transform="translate(126 108)">
          {[0, 9, 18, 27].map((dx) => (
            <path key={dx} d={`M${dx} 6 c-2 12 2 22 12 26 c-6 -8 -8 -16 -6 -26z`} fill={P.mostaza} stroke={P.madera} strokeWidth="1.2" />
          ))}
          <rect x="10" y="0" width="16" height="7" rx="2" fill={P.madera} />
        </g>
        {[178, 196, 214, 232].map((x, i) => (
          <g key={x}>
            <rect x={x} y="110" width="12" height="30" rx="3" fill={i % 2 ? P.serenidad : P.profundo} />
            <rect x={x + 3} y="104" width="6" height="7" fill={i % 2 ? P.profundo : P.serenidad} />
            <rect x={x + 3} y="100" width="6" height="4" fill={P.naranja} />
          </g>
        ))}
        <Tabla y={140} />

        {/* Romana colgando */}
        <g>
          <path d="M318 19 V70" stroke={P.tierra} strokeWidth="1.6" />
          <circle cx="318" cy="88" r="19" fill={P.cal} stroke={P.tierra} strokeWidth="3" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = ((-120 + i * 30) * Math.PI) / 180;
            return <path key={i} d={`M${318 + 13 * Math.sin(a)} ${88 - 13 * Math.cos(a)} L${318 + 16 * Math.sin(a)} ${88 - 16 * Math.cos(a)}`} stroke={P.tierra} strokeWidth="1.4" />;
          })}
          <path d="M318 88 L327 79" stroke={P.naranja} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="318" cy="88" r="2.6" fill={P.tierra} />
          <path d="M318 107 V120 M318 120 L300 138 M318 120 L336 138" stroke={P.tierra} strokeWidth="1.4" />
          <path d="M296 138 h44 a22 7 0 0 1 -44 0z" fill={P.madera} />
        </g>
      </svg>
    </div>
  );
}

function Tabla({ y }: { y: number }) {
  return (
    <>
      <rect x="8" y={y + 4} width="266" height="6" fill={P.tierra} opacity="0.28" />
      <rect x="8" y={y} width="266" height="6" fill={P.madera} />
    </>
  );
}

function Frasco({ x, y, contenido, granos, ancho = 26 }: { x: number; y: number; contenido: string; granos?: string; ancho?: number }) {
  const alto = 32;
  return (
    <g>
      <rect x={x} y={y - alto} width={ancho} height={alto} rx="5" fill={P.cal} stroke={P.tierra} strokeOpacity="0.5" strokeWidth="1.4" />
      <rect x={x + 2} y={y - alto * 0.62} width={ancho - 4} height={alto * 0.62 - 2} rx="3" fill={contenido} />
      {granos &&
        [0.25, 0.5, 0.75].flatMap((fx, i) =>
          [0.35, 0.7].map((fy) => <circle key={`${i}-${fy}`} cx={x + ancho * fx} cy={y - alto * 0.62 * fy} r="2" fill={granos} />),
        )}
      <rect x={x - 1} y={y - alto - 6} width={ancho + 2} height="7" rx="1.5" fill={P.naranja} />
    </g>
  );
}

// Mostrador: superficie de madera clara (la mesa de juego, calma y de alto
// contraste) y el frente pintado de verde con cenefa de carreta.
function Mostrador({ children, bajo = false }: { children: ReactNode; bajo?: boolean }) {
  return (
    <div>
      {/* Canto del mostrador */}
      <div className="h-3" style={{ background: P.maderaOscura }} />
      <div className={`relative ${bajo ? "px-3 pt-3 pb-4" : "px-3 pt-4 pb-5 sm:px-5"}`} style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 22px, #D29D60 22px 23px)` }}>
        <div className="mx-auto max-w-[560px]">{children}</div>
      </div>
      {/* Frente pintado */}
      <div className="h-11" style={{ backgroundColor: P.profundo, borderTop: `4px solid ${P.naranja}`, backgroundImage: CENEFA_FRENTE, backgroundPosition: "center", backgroundRepeat: "repeat-x" }} />
    </div>
  );
}

// Cenefa del frente del mostrador: rosetones de carreta alternados, de lado a lado.
const cenefaSvg = (() => {
  const rs = [roseton({ petalos: 8, anillos: 1, forma: "gota", colores: [P.mostaza, P.naranja, P.cal] }), roseton({ petalos: 8, anillos: 1, forma: "punta", colores: [P.mostaza, P.naranja, P.cal] })];
  const g = rs.map((r, i) => `<g transform='translate(${12 + i * 44} 7) scale(0.26)'>${r.map((f) => `<path d='${f.d}' fill='${f.fill}'/>`).join("")}</g>`).join("");
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='88' height='40' viewBox='0 0 88 40'>${g}</svg>`)}")`;
})();
const CENEFA_FRENTE = cenefaSvg;

// Libreta de apuntes con la cuenta (y cuánto lleva, si está activado).
function Libreta({ monto, suma, pagado, large }: { monto: number; suma: number | null; pagado: boolean; large: boolean }) {
  return (
    <div
      className="relative mx-auto max-w-[340px] -rotate-1 rounded-[3px] pl-9 pr-4 pt-5 pb-3"
      style={{
        background: `repeating-linear-gradient(180deg, ${P.cal} 0 27px, rgba(138,75,154,0.22) 27px 28px)`,
        boxShadow: sombraPapel(3),
      }}
    >
      {/* Margen y espiral */}
      <span aria-hidden="true" className="absolute left-6 top-0 bottom-0 w-[2px]" style={{ background: P.grano, opacity: 0.55 }} />
      <span aria-hidden="true" className="absolute left-3 right-3 -top-1.5 flex justify-between">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: P.tierra }} />
        ))}
      </span>
      <p className={`m-0 font-semibold text-tinta-suave ${large ? "text-[20px]" : "text-[18px]"}`}>La cuenta</p>
      <p className={`m-0 font-extrabold leading-tight whitespace-nowrap ${large ? "text-[40px]" : "text-[36px]"}`} style={{ color: P.tierra }}>
        {colones(monto)}
      </p>
      {suma !== null && (
        <p className={`m-0 mt-0.5 font-semibold text-tinta-suave ${large ? "text-[20px]" : "text-[18px]"}`} aria-live="polite">
          Llevás {colones(suma)}
        </p>
      )}
      {pagado && (
        <span
          className="absolute right-3 top-6 rounded-md px-3 py-1 font-rotulo text-[24px] leading-none motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]"
          style={{ ["--giro" as string]: "-10deg", transform: "rotate(-10deg)", color: P.grano, border: `3px solid ${P.grano}`, background: "rgba(246,241,228,0.85)" }}
        >
          Pagado
        </span>
      )}
    </div>
  );
}

function LibretaVacia() {
  return (
    <div className="relative rounded-[3px] pl-6 pr-3 pt-4 pb-2" style={{ background: `repeating-linear-gradient(180deg, ${P.cal} 0 17px, rgba(138,75,154,0.22) 17px 18px)`, boxShadow: sombraPapel(3) }}>
      <span className="absolute left-4 top-0 bottom-0 w-[2px]" style={{ background: P.grano, opacity: 0.55 }} />
      <span className="block h-[54px]" />
    </div>
  );
}

// Billete o moneda: color real, ilustración propia (no el arte del billete).
// Tocables: borde claro, sombra de papel y el mayor contraste de la escena.
function Dinero({ valor, chico = false, onClick, etiqueta, disabled }: { valor: number; chico?: boolean; onClick?: () => void; etiqueta?: string; disabled?: boolean }) {
  const billete = esBillete(valor);
  let cuerpo: ReactNode;
  let estilo: React.CSSProperties;
  let forma: string;
  if (billete) {
    const c = BILLETES[valor];
    forma = `${chico ? "w-[100px] h-14" : "w-[128px] h-16"} rounded-[4px] flex items-center gap-1.5 px-1.5`;
    estilo = { background: c.fondo, border: `2px solid ${P.cal}`, boxShadow: sombraPapel(4, c.sombra) };
    cuerpo = (
      <>
        <Roseton size={chico ? 26 : 34} params={{ petalos: 6, anillos: 1, forma: "punta", colores: [P.cal, c.sombra, P.cal] }} />
        <span className={`flex-1 rounded-[3px] px-1 py-0.5 text-center font-extrabold leading-none ${chico ? "text-[17px]" : "text-[21px]"}`} style={{ background: P.cal, color: P.tierra }}>
          {colones(valor)}
        </span>
      </>
    );
  } else {
    const d = chico ? 56 : valor >= 500 ? 76 : valor >= 100 ? 70 : valor >= 50 ? 64 : 60;
    forma = "rounded-full flex items-center justify-center";
    estilo = {
      width: d,
      height: d,
      background: MONEDA.cara,
      border: `3px solid ${P.cal}`,
      boxShadow: `inset 0 0 0 4px ${MONEDA.canto}, inset 0 0 0 6px ${MONEDA.brillo}, ${sombraPapel(4, MONEDA.canto)}`,
    };
    cuerpo = (
      <span className={`font-extrabold leading-none ${chico ? "text-[14px]" : d >= 70 ? "text-[18px]" : "text-[16px]"}`} style={{ color: P.tierra }}>
        {colones(valor)}
      </span>
    );
  }
  const cls = `relative shrink-0 select-none ${forma}`;
  if (!onClick)
    return (
      <span className={cls} style={estilo}>
        {cuerpo}
      </span>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className={`${cls} cursor-pointer p-0 font-sans transition-transform duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5 disabled:cursor-default focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo`}
      style={estilo}
    >
      {cuerpo}
    </button>
  );
}

// Momento final: las manos del pulpero dejan la bolsa de la compra sobre el
// mostrador (solo manos, sin rostro).
const KRAFT = "#B88250";
const PIEL = "#A86F4C";
function BolsaConManos() {
  return (
    <svg viewBox="0 0 340 150" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax meet">
      <g className="motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]">
        {/* Sombra de la bolsa sobre el mostrador */}
        <ellipse cx="172" cy="144" rx="58" ry="5" fill={P.tierra} opacity="0.28" />
        {/* Lo que asoma: pan, plátanos y culantro */}
        <path d="M128 52 C120 18 134 6 144 10 C150 14 150 30 152 52z" fill={P.maderaClara} stroke={P.madera} strokeWidth="2" />
        <path d="M134 24 l8 -3 M133 34 l10 -3" stroke={P.madera} strokeWidth="2" strokeLinecap="round" />
        {[0, 10, 20].map((dx) => (
          <path key={dx} d={`M${160 + dx} 52 C${156 + dx} 30 ${166 + dx} 14 ${180 + dx} 10 C${176 + dx} 24 ${174 + dx} 38 ${176 + dx} 52z`} fill={P.mostaza} stroke={P.madera} strokeWidth="1.6" />
        ))}
        <path d="M196 52 C192 34 200 22 210 18 C208 30 214 40 214 52z" fill={P.serenidad} />
        <path d="M202 52 C204 36 214 28 222 28 C218 38 220 46 218 52z" fill={P.profundo} />
        {/* Bolsa de papel */}
        <path d="M116 50 L124 42 L132 50 L140 42 L148 50 L156 42 L164 50 L172 42 L180 50 L188 42 L196 50 L204 42 L212 50 L220 42 L228 50 V142 H116Z" fill={KRAFT} />
        <path d="M116 50 H228 V62 H116Z" fill={P.madera} opacity="0.35" />
        <path d="M116 142 H228 V136 H116Z" fill={P.madera} opacity="0.4" />
        {/* Sello de la pulpería: un rosetón */}
        <g transform="translate(150 78) scale(0.44)">
          <circle cx="50" cy="50" r="48" fill={P.cal} />
        </g>
        <g transform="translate(153 81) scale(0.38)">
          <path d="M50 6 C62 28 66 38 50 50 C34 38 38 28 50 6Z M94 50 C72 62 62 66 50 50 C62 34 72 38 94 50Z M50 94 C38 72 34 62 50 50 C66 62 62 72 50 94Z M6 50 C28 38 38 34 50 50 C38 66 28 62 6 50Z" fill={P.naranja} />
          <circle cx="50" cy="50" r="9" fill={P.grano} />
        </g>
      </g>
      {/* Manos que la dejan: mangas de camisa y manos, entrando desde arriba */}
      {[
        { x: 110, y: 112, giro: 14, esp: 1 },
        { x: 234, y: 112, giro: -14, esp: -1 },
      ].map((m) => (
        <g key={m.x} transform={`translate(${m.x} ${m.y}) scale(${m.esp} 1) rotate(${m.giro})`}>
          <g className="motion-safe:animate-[pueblo-aparece_420ms_ease-out_both]">
          <rect x="-26" y="-92" width="34" height="70" rx="6" fill={P.profundo} />
          <rect x="-26" y="-30" width="34" height="9" rx="2" fill={P.cal} />
          {/* Palma y dedos sobre el costado de la bolsa */}
          <path d="M-22 -22 C-26 -6 -22 12 -8 16 C2 18 10 12 10 4 L8 -22Z" fill={PIEL} />
          <path d="M8 -14 C16 -14 20 -8 18 -2 C16 2 12 2 10 0Z" fill={PIEL} />
          <path d="M-14 10 v-10 M-6 13 v-11 M2 12 v-10" stroke={P.tierra} strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      ))}
    </svg>
  );
}
