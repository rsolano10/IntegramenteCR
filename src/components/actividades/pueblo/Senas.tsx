import { useState, type KeyboardEvent } from "react";
import { CASAS, COLORES_CASA, COLUMNAS, DETALLES_CASA, FILAS, REFERENCIAS, descripcionCasa, metros, recorrer, type EjercicioSenas, type Rumbo } from "../../../lib/actividades/senas";
import { BotonEscuchar } from "../ClasificarNumeros";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { Letrero } from "./Ornamento";
import { sombraCapa } from "./pieza";

// «Las señas» (senas). El pueblo visto desde arriba, como un mapa pintado:
// cuadras con casas de colores, la iglesia, la plaza, la escuela, la
// pulpería y el palo de mango. La rosa de los vientos fija arriba (el mapa
// no gira). Arriba, la seña escrita en un papelito. Se toca la casa.

const CELDA = 60;
const CALLE = 12;
const ANCHO = COLUMNAS * CELDA + (COLUMNAS + 1) * CALLE;
const ALTO = FILAS * CELDA + (FILAS + 1) * CALLE;
const x0 = (col: number) => CALLE + col * (CELDA + CALLE);
const y0 = (fila: number) => CALLE + fila * (CELDA + CALLE);
const centro = (col: number, fila: number) => [x0(col) + CELDA / 2, y0(fila) + CELDA / 2] as const;

const FLECHA: Record<Rumbo, string> = { norte: "↑", sur: "↓", este: "→", oeste: "←" };

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioSenas; config: { marcarPartida: boolean; mostrarFlecha: boolean; leerEnVoz: boolean }; ctl: Control }) {
  const [tramosVistos, setTramosVistos] = useState(0);
  const [errada, setErrada] = useState<number | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;
  const partida = REFERENCIAS.find((r) => r.id === ej.partida)!;

  usePista(ctl.pista, () => {
    if (tramosVistos >= ej.tramos.length) return;
    setTramosVistos((n) => n + 1);
    const t = ej.tramos[tramosVistos];
    ctl.aviso(`En el mapa quedó pintado el tramo: ${metros(t.cuadras)} metros al ${t.rumbo}.`);
  });

  function tocar(i: number) {
    if (hecho) return;
    if (i === ej.destino) {
      setHecho(true);
      setTramosVistos(ej.tramos.length);
      return ctl.listo();
    }
    setErrada(i);
    ctl.reintento("Esa no es. Probemos otra vez desde el punto de partida.");
  }

  const camino = recorrer(partida, ej.tramos.slice(0, tramosVistos)) ?? [];
  return (
    <div className="grid gap-4">
      {/* La seña, en un papelito */}
      <div className="relative mx-auto w-full max-w-[600px] flex items-start gap-3">
      <div className="flex-1 min-w-0 rounded-[4px] px-4 py-3 -rotate-[0.6deg]" style={{ background: P.cal, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
        <p className={`m-0 font-semibold leading-snug ${L ? "text-[24px]" : "text-[22px]"}`} style={{ color: P.tierra }}>
          {ej.sena}
        </p>
        {config.mostrarFlecha && (
          <p className="m-0 mt-2 flex flex-wrap gap-2" aria-hidden="true">
            {ej.tramos.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[17px] font-bold" style={{ background: P.mostaza, color: P.tierra }}>
                <span className="text-[20px] leading-none">{FLECHA[t.rumbo]}</span>
                {metros(t.cuadras)} m al {t.rumbo}
              </span>
            ))}
          </p>
        )}
        {config.leerEnVoz && (
          <div className="mt-2">
            <BotonEscuchar texto={ej.sena} />
          </div>
        )}
      </div>
      {/* La rosa de los vientos, fija: el norte siempre arriba */}
      <RosaVientos />
      </div>

      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Mapa
          partida={config.marcarPartida || hecho ? ej.partida : null}
          camino={camino}
          punteado={hecho}
          destino={hecho ? ej.destino : null}
          errada={errada}
          onTocar={hecho ? undefined : tocar}
        />
      </div>
      <Letrero large={L} clavado>
        {hecho ? "¡Llegaste a la casa!" : "Tocá la casa a la que se llega."}
      </Letrero>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  const iglesia = REFERENCIAS[0];
  const camino = final ? (recorrer(iglesia, [{ rumbo: "sur", cuadras: 2 }, { rumbo: "este", cuadras: 2 }]) ?? []) : [];
  return (
    <div className="relative w-full max-w-[420px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Mapa partida={final ? "iglesia" : null} camino={camino} punteado destino={final ? CASAS.findIndex((c) => c.col === 4 && c.fila === 3) : null} encendidas={final ? [7, 12, 15] : []} />
    </div>
  );
}

// ─── Dibujo ───

function Mapa({
  partida,
  camino,
  punteado = false,
  destino,
  errada = null,
  encendidas = [],
  onTocar,
}: {
  partida: string | null;
  camino: { col: number; fila: number }[];
  punteado?: boolean;
  destino: number | null;
  errada?: number | null;
  encendidas?: number[];
  onTocar?: (i: number) => void;
}) {
  const ruta = camino.map((p) => centro(p.col, p.fila).join(" ")).join(" L");
  const tecla = (i: number) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTocar?.(i);
    }
  };
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: "#E2D8C0" }}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="block mx-auto w-full max-w-[600px] h-auto" role={onTocar ? "group" : "img"} aria-label="Mapa del pueblo, con el norte arriba">
        {/* Calles de lastre (el fondo) y cuadras con zacate */}
        {Array.from({ length: FILAS }, (_, f) =>
          Array.from({ length: COLUMNAS }, (_, c) => <rect key={`${c}-${f}`} x={x0(c)} y={y0(f)} width={CELDA} height={CELDA} rx="6" fill="#B7C79A" />),
        )}
        {/* Referencias */}
        {REFERENCIAS.map((r) => (
          <g key={r.id} transform={`translate(${x0(r.col)} ${y0(r.fila)})`}>
            <Referencia id={r.id} />
            {partida === r.id && (
              <>
                <rect x="-3" y="-3" width={CELDA + 6} height={CELDA + 6} rx="9" fill="none" stroke={P.naranja} strokeWidth="4" />
                <rect x="4" y={CELDA - 14} width={CELDA - 8} height="13" rx="3" fill={P.naranja} />
                <text x={CELDA / 2} y={CELDA - 4} textAnchor="middle" fontSize="9" fontWeight="800" fill={P.cal}>
                  PARTIDA
                </text>
              </>
            )}
          </g>
        ))}
        {/* Casas */}
        {CASAS.map((c, i) => {
          const marcada = destino === i;
          const g = (
            <g transform={`translate(${x0(c.col)} ${y0(c.fila)})`} className={errada === i ? "motion-safe:animate-[pueblo-regreso_320ms_ease-out]" : ""} style={{ transformBox: "fill-box" }}>
              <CasaDibujo color={COLORES_CASA[c.color].color} detalle={DETALLES_CASA[c.detalle].id} luz={marcada || encendidas.includes(i)} />
              {marcada && <rect x="-3" y="-3" width={CELDA + 6} height={CELDA + 6} rx="9" fill="none" stroke={P.mostaza} strokeWidth="5" />}
            </g>
          );
          if (!onTocar) return <g key={i}>{g}</g>;
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={descripcionCasa(c)}
              onClick={() => onTocar(i)}
              onKeyDown={tecla(i)}
              className="cursor-pointer outline-none [&:focus-visible>g>rect:first-child]:[stroke:#1f3338] [&:focus-visible>g>rect:first-child]:[stroke-width:4]"
            >
              {g}
            </g>
          );
        })}
        {/* El recorrido: pincelada (pista) o camino punteado (al llegar) */}
        {camino.length > 1 && (
          <path
            d={`M${ruta}`}
            fill="none"
            stroke={punteado ? P.tierra : P.naranja}
            strokeWidth={punteado ? 4 : 7}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={punteado ? "2 9" : undefined}
            opacity={punteado ? 0.8 : 0.75}
            className="pointer-events-none"
          />
        )}
      </svg>
    </div>
  );
}

// Rosa de los vientos fija en una esquina (el mapa nunca gira).
function RosaVientos() {
  return (
    <svg viewBox="0 0 80 80" className="shrink-0 w-[72px] sm:w-[92px] h-auto" role="img" aria-label="Rosa de los vientos: norte arriba, sur abajo, este a la derecha, oeste a la izquierda">
      <circle cx="40" cy="40" r="25" fill={P.cal} stroke={P.tierra} strokeWidth="2" opacity="0.92" />
      <path d="M40 16 L45 40 L40 64 L35 40Z" fill={P.tierra} />
      <path d="M16 40 L40 35 L64 40 L40 45Z" fill={P.madera} />
      <path d="M40 16 L45 40 L35 40Z" fill={P.naranja} />
      {[
        ["N", 40, 11],
        ["S", 40, 77],
        ["E", 74, 44],
        ["O", 6, 44],
      ].map(([t, x, y]) => (
        <text key={t as string} x={x as number} y={y as number} textAnchor="middle" fontSize="12" fontWeight="900" fill={P.tierra} stroke={P.cal} strokeWidth="3" paintOrder="stroke">
          {t}
        </text>
      ))}
    </svg>
  );
}

// Una casa vista desde arriba y un poco de frente: techo de teja, pared del
// color de la casa, puerta y el detalle (corredor, portón, macetas…).
function CasaDibujo({ color, detalle, luz }: { color: string; detalle: string; luz: boolean }) {
  const ventana = luz ? P.mostaza : P.tinta;
  return (
    <g>
      <rect x="6" y="24" width="48" height="30" fill={color} stroke={P.tierra} strokeWidth="1.5" />
      <path d="M2 26 L30 6 L58 26z" fill="#B4543A" stroke={P.tierra} strokeWidth="1.5" />
      <rect x="26" y="38" width="9" height="16" fill={P.madera} />
      <rect x="12" y="32" width="9" height="8" fill={ventana} />
      {detalle === "ventanas" ? <rect x="40" y="32" width="9" height="8" fill={ventana} /> : null}
      {detalle === "corredor" && <path d="M6 44 H54 M10 44 V54 M50 44 V54" stroke={P.maderaOscura} strokeWidth="2.5" />}
      {detalle === "porton" && <path d="M38 54 V44 h14 v10 M41 44 v10 M44 44 v10 M47 44 v10" stroke={P.tierra} strokeWidth="1.5" fill="none" />}
      {detalle === "maceta" && [40, 48].map((x) => <g key={x}><rect x={x} y="48" width="6" height="6" fill={P.naranja} /><circle cx={x + 3} cy="46" r="3.5" fill={P.grano} /></g>)}
      {detalle === "arbol" && (
        <g>
          <rect x="46" y="44" width="3" height="10" fill={P.maderaOscura} />
          <circle cx="47.5" cy="40" r="7" fill={P.profundo} />
        </g>
      )}
      {luz && <circle cx="16.5" cy="36" r="9" fill={P.mostaza} opacity="0.35" />}
    </g>
  );
}

function Referencia({ id }: { id: string }) {
  switch (id) {
    case "iglesia":
      return (
        <g>
          <rect x="8" y="22" width="44" height="34" fill={P.cal} stroke={P.tierra} strokeWidth="1.5" />
          <path d="M6 24 L30 10 L54 24z" fill={P.serenidad} stroke={P.tierra} strokeWidth="1.5" />
          <rect x="24" y="0" width="12" height="16" fill={P.cal} stroke={P.tierra} strokeWidth="1.5" />
          <path d="M30 -6 V2 M26 -3 H34" stroke={P.tierra} strokeWidth="2" />
          <path d="M24 56 V42 a6 6 0 0 1 12 0 V56z" fill={P.madera} />
        </g>
      );
    case "plaza":
      return (
        <g>
          <rect x="2" y="2" width="56" height="56" rx="6" fill="#9DB57E" />
          <circle cx="30" cy="30" r="12" fill={P.cal} stroke={P.tierra} strokeWidth="1.5" />
          <circle cx="30" cy="30" r="5" fill={P.serenidad} />
          {[[10, 10], [50, 10], [10, 50], [50, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill={P.profundo} />)}
          <path d="M30 2 V18 M30 42 V58 M2 30 H18 M42 30 H58" stroke={P.cal} strokeWidth="3" />
        </g>
      );
    case "escuela":
      return (
        <g>
          <rect x="4" y="22" width="52" height="32" fill={P.mostaza} stroke={P.tierra} strokeWidth="1.5" />
          <path d="M2 24 L30 8 L58 24z" fill="#B4543A" stroke={P.tierra} strokeWidth="1.5" />
          {[10, 22, 38].map((x) => <rect key={x} x={x} y="30" width="9" height="8" fill={P.cal} />)}
          <rect x="26" y="40" width="8" height="14" fill={P.madera} />
          <path d="M48 8 V22 M48 8 h8 v5 h-8" stroke={P.tierra} strokeWidth="1.5" fill={P.naranja} />
        </g>
      );
    case "pulperia":
      return (
        <g>
          <rect x="4" y="22" width="52" height="32" fill={P.cal} stroke={P.tierra} strokeWidth="1.5" />
          <path d="M2 24 L30 8 L58 24z" fill="#B4543A" stroke={P.tierra} strokeWidth="1.5" />
          <rect x="10" y="26" width="40" height="9" fill={P.naranja} />
          <text x="30" y="33" textAnchor="middle" fontSize="7" fontWeight="900" fill={P.cal}>
            PULPERÍA
          </text>
          <rect x="12" y="40" width="36" height="14" fill={P.madera} />
        </g>
      );
    case "mango":
      return (
        <g>
          <rect x="27" y="34" width="7" height="22" fill={P.maderaOscura} />
          <circle cx="30" cy="26" r="22" fill={P.profundo} />
          <circle cx="20" cy="20" r="10" fill={P.serenidad} opacity="0.7" />
          {[[18, 30], [34, 18], [40, 32], [26, 38]].map(([x, y]) => <ellipse key={`${x}${y}`} cx={x} cy={y} rx="3" ry="4" fill={P.mostaza} />)}
        </g>
      );
    default:
      return null;
  }
}
