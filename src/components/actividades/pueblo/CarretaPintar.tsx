import { useState, type KeyboardEvent } from "react";
import { PINTURAS, celda, objetivo, revisarRueda, type EjercicioRueda, type Marca } from "../../../lib/actividades/pintarRueda";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { Roseton, Letrero } from "./Ornamento";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La carreta por pintar» (pintar-rueda). El taller de pintura de carretas,
// de día: la rueda modelo cuelga de un clavo en la pared; la rueda en
// blanco está en el caballete; los botes de pintura, en el banco. Cada bote
// tiene una marca en la tapa, y la misma marca queda pintada en el sector,
// para no depender solo del color.

const SIN_PINTAR = "#FBF8EF";

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioRueda; config: { rotada: boolean }; ctl: Control }) {
  const [pintura, setPintura] = useState<(number | null)[]>(() => Array(ej.sectores * ej.anillos).fill(null));
  const [bote, setBote] = useState<number | null>(null);
  const [hecho, setHecho] = useState(false);
  const [recien, setRecien] = useState<number[]>([]);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const { giro } = revisarRueda(ej, pintura, config.rotada);
    const meta = objetivo(ej, giro);
    const i = meta.findIndex((p, k) => pintura[k] !== p);
    if (i < 0) return;
    pintar(i, meta[i]);
    ctl.aviso(`Pintamos un sector de ${PINTURAS[meta[i]].nombre}, como en el modelo.`);
  });

  function pintar(i: number, p: number) {
    setPintura((x) => x.map((v, k) => (k === i ? p : v)));
    setRecien([i]);
  }

  function tocarCelda(i: number) {
    if (hecho) return;
    if (bote === null) return ctl.aviso("Primero tocá un bote de pintura.");
    pintar(i, bote);
  }

  function listo() {
    const r = revisarRueda(ej, pintura, config.rotada);
    if (r.completa) {
      setHecho(true);
      return ctl.listo();
    }
    // Lo que no coincide vuelve a blanco con suavidad; lo correcto se queda.
    setPintura((x) => x.map((v, k) => (r.malas.includes(k) ? null : v)));
    setRecien([]);
    const vacias = pintura.filter((v) => v === null).length;
    ctl.reintento(vacias === r.malas.length ? "Faltan sectores por pintar." : "Algunos sectores no son como el modelo: quedaron en blanco para pintarlos otra vez.");
  }

  const disponibles = ej.pinturas;
  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Taller>
          <div className="mx-auto max-w-[560px] grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 sm:gap-6 items-end">
            {/* El modelo, colgado de un clavo */}
            <figure className="m-0 grid justify-items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: P.tierra }} aria-hidden="true" />
              <Rueda ej={ej} valores={ej.modelo} giro={ej.giro} etiqueta="La rueda modelo" />
              <figcaption className="px-2.5 py-0.5 rounded-[3px] font-rotulo text-[16px]" style={{ background: P.cal, color: P.tierra, boxShadow: "0 2px 0 rgba(51,36,28,0.3)" }}>
                Modelo
              </figcaption>
            </figure>
            {/* La rueda en blanco, en el caballete */}
            <div className="relative grid justify-items-center">
              <Rueda ej={ej} valores={pintura} giro={0} onTocar={hecho ? undefined : tocarCelda} recien={recien} etiqueta="La rueda por pintar" grande />
              <Caballete />
            </div>
          </div>
        </Taller>
        {/* El banco con los botes */}
        <div className="px-3 pt-3 pb-4 sm:px-5" style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 22px, #CF9A5E 22px 24px)`, borderTop: `8px solid ${P.madera}` }}>
          <ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-3" aria-label="Botes de pintura">
            {disponibles.map((p) => {
              const est = estiloPieza(bote === p ? "elegida" : "reposo");
              return (
                <li key={p}>
                  <button
                    type="button"
                    aria-pressed={bote === p}
                    disabled={hecho}
                    onClick={() => {
                      setBote(bote === p ? null : p);
                      if (bote !== p) ctl.aviso(`Elegiste el ${PINTURAS[p].nombre}.`);
                    }}
                    aria-label={`Bote ${PINTURAS[p].nombre}, tapa con ${nombreMarca[PINTURAS[p].marca]}`}
                    className={`${clasePieza} ${est.className} rounded-[14px] px-2 pt-2 pb-1.5`}
                    style={{ ...est.style, background: P.cal }}
                  >
                    <Bote p={p} large={L} />
                    <span className={`block text-center font-bold ${L ? "text-[18px]" : "text-[16px]"}`} style={{ color: P.tierra }}>
                      {PINTURAS[p].nombre[0].toUpperCase() + PINTURAS[p].nombre.slice(1)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <Letrero large={L} clavado>
        {hecho ? "¡La rueda quedó igual al modelo!" : bote === null ? "Tocá un bote de pintura." : `Tocá los sectores que van de ${PINTURAS[bote].nombre}.`}
      </Letrero>
      {!hecho && (
        <Acciones ctl={ctl}>
          <Boton onClick={listo} disabled={pintura.every((v) => v === null)} large={L}>
            Listo
          </Boton>
          <Boton variante="secundario" onClick={() => setPintura((x) => x.map(() => null))} disabled={pintura.every((v) => v === null)} large={L}>
            Borrar
          </Boton>
        </Acciones>
      )}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Taller bajo>
        <svg viewBox="0 0 320 120" className="block w-full h-auto">
          <g className={final ? "motion-safe:animate-[pueblo-avanza_2.4s_ease-in-out_both]" : ""}>
            <Carreta />
          </g>
        </svg>
      </Taller>
    </div>
  );
}

// ─── Dibujo ───

const nombreMarca: Record<Marca, string> = { circulo: "un círculo", cuadrado: "un cuadrado", triangulo: "un triángulo", rombo: "un rombo" };

function MarcaSvg({ marca, x, y, r, color }: { marca: Marca; x: number; y: number; r: number; color: string }) {
  switch (marca) {
    case "circulo":
      return <circle cx={x} cy={y} r={r} fill={color} />;
    case "cuadrado":
      return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={color} />;
    case "triangulo":
      return <path d={`M${x} ${y - r * 1.15} L${x + r * 1.1} ${y + r * 0.8} L${x - r * 1.1} ${y + r * 0.8}Z`} fill={color} />;
    case "rombo":
      return <path d={`M${x} ${y - r * 1.2} L${x + r} ${y} L${x} ${y + r * 1.2} L${x - r} ${y}Z`} fill={color} />;
  }
}
const tintaSobre = (p: number) => (PINTURAS[p].id === "amarillo" ? P.tierra : P.cal);

function Taller({ children, bajo = false }: { children: React.ReactNode; bajo?: boolean }) {
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      {/* Cenefa pintada y ventana de luz de día */}
      <div className="h-4" style={{ background: `repeating-linear-gradient(90deg, ${P.naranja} 0 20px, ${P.mostaza} 20px 26px)` }} />
      <div className={`relative ${bajo ? "px-4 pt-3 pb-2" : "px-3 pt-4 pb-3 sm:px-5"}`}>{children}</div>
    </div>
  );
}

function Caballete() {
  return (
    <svg viewBox="0 0 120 30" className="block w-[70%] -mt-1 h-auto" aria-hidden="true">
      <path d="M30 0 L14 30 M90 0 L106 30 M60 0 V30" stroke={P.madera} strokeWidth="6" strokeLinecap="round" />
      <rect x="20" y="0" width="80" height="7" rx="2" fill={P.maderaOscura} />
    </svg>
  );
}

function Bote({ p, large }: { p: number; large: boolean }) {
  const s = large ? 62 : 54;
  return (
    <svg viewBox="0 0 60 60" width={s} height={s} aria-hidden="true" className="block mx-auto">
      <path d="M12 18 h36 v34 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4z" fill="#A9B4B6" stroke={P.tierra} strokeWidth="2" />
      <rect x="12" y="26" width="36" height="20" fill={PINTURAS[p].color} />
      {/* Tapa con la marca */}
      <ellipse cx="30" cy="18" rx="20" ry="7" fill={PINTURAS[p].color} stroke={P.tierra} strokeWidth="2" />
      <MarcaSvg marca={PINTURAS[p].marca} x={30} y={18} r={4} color={tintaSobre(p)} />
      <path d="M14 22 C14 4 46 4 46 22" stroke={P.tierra} strokeWidth="2" fill="none" />
    </svg>
  );
}

// Una rueda de carreta con sus celdas (sectores × anillos). Con `onTocar`
// cada celda es un botón.
function Rueda({
  ej,
  valores,
  giro,
  onTocar,
  recien = [],
  etiqueta,
  grande = false,
}: {
  ej: EjercicioRueda;
  valores: (number | null)[];
  giro: number;
  onTocar?: (i: number) => void;
  recien?: number[];
  etiqueta: string;
  grande?: boolean;
}) {
  const S = ej.sectores;
  const radios = ej.anillos === 1 ? [[17, 46]] : [[31, 46], [17, 31]];
  const paso = 360 / S;
  const pt = (r: number, a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)];
  };
  const camino = (s: number, a: number) => {
    const [r0, r1] = radios[a];
    const a0 = s * paso, a1 = (s + 1) * paso;
    const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
    const g = a1 - a0 > 180 ? 1 : 0;
    return `M${x0} ${y0} A${r1} ${r1} 0 ${g} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${g} 0 ${x3} ${y3}Z`;
  };
  const tecla = (i: number) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTocar?.(i);
    }
  };
  return (
    <svg
      viewBox="0 0 100 100"
      className={`block h-auto ${grande ? "w-full max-w-[260px]" : "w-full max-w-[170px]"}`}
      role={onTocar ? "group" : "img"}
      aria-label={etiqueta}
      style={{ transform: `rotate(${giro * paso}deg)`, overflow: "visible" }}
    >
      <circle cx="50" cy="50" r="49" fill={P.maderaOscura} />
      {Array.from({ length: ej.anillos }, (_, a) =>
        Array.from({ length: S }, (_, s) => {
          const i = celda(s, a, S);
          const v = valores[i];
          const [r0, r1] = radios[a];
          const [cx, cy] = pt((r0 + r1) / 2, (s + 0.5) * paso);
          const nombre = `Sector ${s + 1}${ej.anillos === 2 ? (a === 0 ? " de afuera" : " de adentro") : ""}: ${v === null ? "sin pintar" : PINTURAS[v].nombre}`;
          return (
            <g key={i}>
              <path
                d={camino(s, a)}
                fill={v === null ? SIN_PINTAR : PINTURAS[v].color}
                stroke={P.tierra}
                strokeWidth="1.4"
                strokeDasharray={v === null ? "2 1.6" : undefined}
                className={`${onTocar ? "cursor-pointer outline-none focus-visible:[stroke:#1f3338] focus-visible:[stroke-width:3]" : ""} ${recien.includes(i) ? "motion-safe:animate-[pueblo-asentar_320ms_ease-out]" : ""}`}
                style={{ transformOrigin: "50px 50px", transformBox: "view-box" }}
                {...(onTocar ? { role: "button", tabIndex: 0, "aria-label": nombre, onClick: () => onTocar(i), onKeyDown: tecla(i) } : {})}
              />
              {v !== null && <MarcaSvg marca={PINTURAS[v].marca} x={cx} y={cy} r={ej.anillos === 2 ? 2.2 : 3} color={tintaSobre(v)} />}
            </g>
          );
        }),
      )}
      {/* Cubo de la rueda y el clavo de referencia arriba */}
      <circle cx="50" cy="50" r="10" fill={P.madera} stroke={P.tierra} strokeWidth="1.5" />
      <circle cx="50" cy="50" r="3.5" fill={P.tierra} />
      <path d="M50 1 l-3.5 -6 h7z" fill={P.naranja} stroke={P.tierra} strokeWidth="1" />
    </svg>
  );
}

// Momento final: la carreta con la rueda pintada, avanzando un poco.
function Carreta() {
  return (
    <g>
      <ellipse cx="150" cy="112" rx="110" ry="5" fill={P.tierra} opacity="0.2" />
      {/* Caja de la carreta */}
      <path d="M60 30 h170 l-8 46 h-154z" fill={P.naranja} stroke={P.tierra} strokeWidth="2" />
      <path d="M66 40 h158 M68 58 h154" stroke={P.mostaza} strokeWidth="4" />
      <path d="M230 60 L300 70" stroke={P.madera} strokeWidth="6" strokeLinecap="round" />
      {/* La rueda pintada */}
      <g transform="translate(108 46)">
        <circle cx="34" cy="34" r="36" fill={P.maderaOscura} />
        <g transform="translate(-2 -2) scale(0.72)">
          <Roseton params={{ petalos: 8, anillos: 2, forma: "gota", colores: [P.naranja, P.mostaza, P.profundo, P.cal] }} size={100} />
        </g>
      </g>
    </g>
  );
}
