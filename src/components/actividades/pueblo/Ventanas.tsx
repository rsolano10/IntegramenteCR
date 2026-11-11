import { useState, type ReactNode } from "react";
import { revisarPosiciones, type EjercicioPosiciones } from "../../../lib/actividades/recordarPosiciones";
import { usePista, type Control } from "../interactivas/comun";
import { Boton } from "../interactivas/ui";
import { P } from "./paleta";
import { sombraCapa } from "./pieza";

// «Las ventanas del pueblo» (recordar-posiciones). La fachada de una casa al
// anochecer, con cielo rosado y el pueblo al fondo. Las casillas son
// ventanas de arco con postigos; con luz, dejan ver algo de adentro (una
// lámpara, un gato, una planta…). Mirar, tocar «Ya lo memoricé» (sin
// temporizador) y volver a encender las que tenían luz. Al final de la
// sesión se enciende todo el pueblo. Formas planas, sin degradados.


export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioPosiciones; config: { permitirVerDeNuevo: boolean }; ctl: Control }) {
  const [fase, setFase] = useState<"mirar" | "responder" | "hecho">("mirar");
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [apagadas, setApagadas] = useState<number[]>([]);
  const L = ctl.large;
  const n = ej.encendidas.length;

  usePista(ctl.pista, () => {
    setFase("mirar");
    ctl.aviso("Mirá otra vez las ventanas con luz.");
  });

  function listo() {
    const r = revisarPosiciones(ej, marcadas);
    if (r.correcto) {
      setFase("hecho");
      return ctl.listo();
    }
    // Quedan las que acertó; las demás se apagan con suavidad.
    setApagadas(r.sobran);
    setMarcadas(r.aciertos);
    ctl.reintento(r.sobran.length ? "Apagamos las que no tenían luz. Probemos otra vez." : "Aún falta alguna ventana por encender.");
  }

  const encendida = (i: number) => (fase === "responder" ? marcadas.includes(i) : ej.encendidas.includes(i));

  return (
    <div className="grid gap-4">
      <Escena
        filas={ej.filas}
        columnas={ej.columnas}
        encendida={encendida}
        pueblo={fase === "hecho" ? "algunas" : "apagado"}
        onTocar={
          fase === "responder"
            ? (i) => {
                setApagadas([]);
                setMarcadas((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
              }
            : undefined
        }
        apagadas={apagadas}
        estado={fase}
      />
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {fase === "mirar" ? "Mirá qué ventanas tienen luz." : fase === "responder" ? "Se apagaron las luces. ¿Cuáles estaban encendidas?" : "¡Encendiste las ventanas!"}
      </p>

      {fase === "mirar" && (
        <div className="grid gap-3">
          <p className={`m-0 text-tinta-suave ${L ? "text-[20px]" : "text-[18px]"}`}>Tomate el tiempo que necesités.</p>
          <Boton onClick={() => setFase("responder")} large={L} className="w-full">
            Ya lo memoricé
          </Boton>
        </div>
      )}

      {fase === "responder" && (
        <div className="grid gap-3">
          <Medidor total={n} llevas={Math.min(marcadas.length, n)} large={L} />
          <Boton onClick={listo} disabled={!marcadas.length} large={L} className="w-full">
            Listo
          </Boton>
          {config.permitirVerDeNuevo && (
            <Boton variante="secundario" onClick={() => setFase("mirar")} large={L} className="w-full">
              Ver las ventanas de nuevo
            </Boton>
          )}
        </div>
      )}
    </div>
  );
}

// Portada: la casa con algunas luces (inicio) o todo el pueblo encendido (cierre).
export function Portada({ final = false }: { final?: boolean }) {
  const prendidas = [0, 4, 5];
  return (
    <div className="w-full max-w-[460px]" aria-hidden="true">
      <Escena filas={2} columnas={3} encendida={(i) => final || prendidas.includes(i)} pueblo={final ? "todo" : "apagado"} compacta />
    </div>
  );
}

// Cuántas ventanas hay que encender: bombillos que se llenan (no es un puntaje).
function Medidor({ total, llevas, large }: { total: number; llevas: number; large: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" role="status" aria-label={`Encendiste ${llevas} de ${total} ventanas`}>
      <span className={`text-tinta-suave ${large ? "text-[20px]" : "text-[18px]"}`}>Encendé {total === 1 ? "1 ventana" : `${total} ventanas`}</span>
      <span className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <svg key={i} width="26" height="26" viewBox="0 0 24 24">
            <path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8V17h7.6v-2.7A6.5 6.5 0 0 0 12 2.5z" fill={i < llevas ? P.mostaza : P.cal} stroke={P.tierra} strokeWidth="1.6" />
            <path d="M9 19.5h6M10 22h4" stroke={P.tierra} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ))}
      </span>
    </div>
  );
}

// ─── La escena ───

function Escena({
  filas,
  columnas,
  encendida,
  onTocar,
  pueblo,
  compacta = false,
  apagadas = [],
  estado = "",
}: {
  filas: number;
  columnas: number;
  encendida: (i: number) => boolean;
  onTocar?: (i: number) => void;
  pueblo: "apagado" | "algunas" | "todo";
  compacta?: boolean;
  apagadas?: number[];
  estado?: string;
}) {
  const total = filas * columnas;
  const ancho = columnas <= 2 ? "max-w-[230px]" : columnas === 3 ? "max-w-[300px]" : "max-w-[340px]";
  return (
    <div className={`relative overflow-hidden rounded-[20px] ${compacta ? "pt-8" : "pt-12"}`} style={{ ...sombraCapa, background: P.rosa }}>
      <Cielo pueblo={pueblo} />
      <div className={`relative z-10 mx-auto w-[84%] ${ancho}`}>
        <Techo />
        <ul
          className={`relative list-none m-0 grid ${compacta ? "gap-x-1.5 gap-y-2 px-3 pt-3 pb-1" : "gap-x-2 gap-y-3 px-3.5 pt-4 pb-2"}`}
          style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`, background: P.cal }}
          aria-label={onTocar ? `Casa con ${total} ventanas` : undefined}
        >
          {Array.from({ length: total }, (_, i) => {
            const fila = Math.floor(i / columnas);
            const col = (i % columnas) + 1;
            const nombre = `Ventana del piso ${filas - fila}, ${col}.ª desde la izquierda`;
            return (
              <li key={i}>
                <Ventana
                  luz={encendida(i)}
                  interior={(i * 5 + fila) % INTERIORES.length}
                  onTocar={onTocar ? () => onTocar(i) : undefined}
                  apagandose={apagadas.includes(i)}
                  etiqueta={onTocar ? nombre : estado === "mirar" ? `${nombre}, ${encendida(i) ? "con luz" : "apagada"}` : undefined}
                />
              </li>
            );
          })}
        </ul>
        <PlantaBaja />
      </div>
      {/* Calle empedrada */}
      <div aria-hidden="true" className="relative z-10 h-5" style={{ background: P.serenidad, boxShadow: "inset 0 4px 0 rgba(51,36,28,0.2)" }} />
    </div>
  );
}

function Ventana({ luz, interior, onTocar, etiqueta, apagandose }: { luz: boolean; interior: number; onTocar?: () => void; etiqueta?: string; apagandose: boolean }) {
  const Interior = INTERIORES[interior];
  const cuerpo: ReactNode = (
    <>
      {/* Postigos de madera pintada */}
      {["left-0", "right-0"].map((lado) => (
        <span key={lado} aria-hidden="true" className={`absolute ${lado} top-[8%] bottom-[20%] w-[15%] rounded-[2px]`} style={{ background: `repeating-linear-gradient(180deg, ${P.serenidad} 0 5px, ${P.profundo} 5px 6px)` }} />
      ))}
      {/* Vidrio en arco */}
      <span
        aria-hidden="true"
        className="absolute left-[18%] right-[18%] top-[4%] bottom-[18%] rounded-t-full overflow-hidden"
        style={{ background: P.profundo, border: `3px solid ${P.madera}`, boxShadow: luz ? `0 0 0 5px ${P.mostaza}66` : "none" }}
      >
        <span
          className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${luz ? "opacity-100" : "opacity-0"} ${apagandose ? "duration-700" : ""}`}
          style={{ background: P.mostaza }}
        >
          <span className="absolute inset-x-[14%] bottom-0 top-[30%] flex items-end justify-center" style={{ color: P.madera }}>
            <Interior />
          </span>
        </span>
        <span className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2" style={{ background: P.madera }} />
        <span className="absolute left-0 right-0 top-[52%] h-[3px]" style={{ background: P.madera }} />
      </span>
      {/* Macetero con flores */}
      <span aria-hidden="true" className="absolute left-[10%] right-[10%] bottom-[5%] h-[13%]">
        <svg viewBox="0 0 60 14" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {[10, 22, 32, 44, 52].map((x, i) => (
            <circle key={x} cx={x} cy={4.5} r={i % 2 ? 3 : 3.4} fill={i % 2 ? P.guaria : P.naranja} />
          ))}
          <path d="M3 6h54l-3 8H6z" fill={P.madera} />
        </svg>
      </span>
    </>
  );
  const base = "relative block w-full aspect-[4/5] min-h-14";
  if (!onTocar)
    return (
      <span className={base} role={etiqueta ? "img" : undefined} aria-label={etiqueta}>
        {cuerpo}
      </span>
    );
  return (
    <button
      type="button"
      aria-pressed={luz}
      aria-label={`${etiqueta}${luz ? ", encendida" : ", apagada"}`}
      onClick={onTocar}
      className={`${base} p-0 border-0 bg-transparent cursor-pointer rounded-xl transition-transform duration-150 motion-safe:active:scale-95 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${luz ? "motion-safe:animate-[pueblo-asentar_300ms_ease-out]" : ""}`}
    >
      {cuerpo}
    </button>
  );
}

// Techo de teja con alero (formas planas).
function Techo() {
  return (
    <svg viewBox="0 0 320 70" preserveAspectRatio="none" className="block -mx-[7%] w-[114%] h-auto" aria-hidden="true">
      <path d="M8 62 L58 6 H262 L312 62 Z" fill={P.grano} />
      {[18, 30, 42].map((y) => (
        <path key={y} d={`M${58 - (y - 6) * 0.89} ${y} H${262 + (y - 6) * 0.89}`} stroke={P.tierra} strokeOpacity="0.25" strokeWidth="2.4" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${60 + i * 15} 8 V60`} stroke={P.tierra} strokeOpacity="0.12" strokeWidth="2" />
      ))}
      <rect x="0" y="60" width="320" height="10" rx="2" fill={P.maderaOscura} />
    </svg>
  );
}

// Planta baja: puerta de madera, farol, macetas y gradas.
function PlantaBaja() {
  return (
    <svg viewBox="0 0 300 92" className="block w-full h-auto -mt-px" aria-hidden="true">
      <rect x="0" y="0" width="300" height="80" fill={P.cal} />
      <rect x="0" y="56" width="300" height="24" fill={P.serenidad} />
      <rect x="0" y="54" width="300" height="3" fill={P.profundo} />
      <path d="M126 80 V34 a24 24 0 0 1 48 0 V80 z" fill={P.madera} />
      <path d="M150 80 V12" stroke={P.tierra} strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="144" cy="62" r="2.6" fill={P.mostaza} />
      <circle cx="156" cy="62" r="2.6" fill={P.mostaza} />
      <circle cx="198" cy="34" r="13" fill={P.mostaza} opacity="0.35" />
      <path d="M192 28h12l-2 12h-8z" fill={P.mostaza} stroke={P.tierra} strokeWidth="1.5" />
      <path d="M198 20v8" stroke={P.tierra} strokeWidth="2" />
      {[
        [40, P.profundo],
        [80, P.naranja],
        [230, P.naranja],
        [262, P.profundo],
      ].map(([x, color]) => (
        <g key={x as number} transform={`translate(${x} 0)`}>
          <path d="M-14 62c4-14 10-20 14-24 4 4 10 10 14 24z" fill={P.profundo} />
          <path d="M-10 62h20l-3 18h-14z" fill={color as string} />
        </g>
      ))}
      <rect x="116" y="80" width="68" height="6" fill={P.beige} />
      <rect x="108" y="86" width="84" height="6" fill={P.maderaClara} />
    </svg>
  );
}

// Cielo de anochecer: rosa con una banda mostaza, la luna y el pueblo al
// fondo (casas planas); al final se encienden sus ventanas.
const CASAS = [
  { x: 0, w: 70, h: 70, techo: P.grano },
  { x: 62, w: 60, h: 56, techo: P.naranja },
  { x: 238, w: 64, h: 60, techo: P.naranja },
  { x: 294, w: 70, h: 74, techo: P.grano },
];
function Cielo({ pueblo }: { pueblo: "apagado" | "algunas" | "todo" }) {
  return (
    <svg viewBox="0 0 360 260" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect x="0" y="0" width="360" height="70" fill={P.guaria} opacity="0.35" />
      <rect x="0" y="150" width="360" height="40" fill={P.mostaza} opacity="0.45" />
      <circle cx="300" cy="40" r="16" fill={P.cal} />
      <circle cx="306" cy="36" r="13" fill={P.rosa} />
      {/* Cerros */}
      <path d="M0 196 C70 168 130 172 180 186 C240 164 300 160 360 178 V260 H0z" fill={P.serenidad} />
      {/* Casas del pueblo */}
      {CASAS.map((c, i) => {
        const y = 230 - c.h;
        return (
          <g key={c.x}>
            <rect x={c.x} y={y} width={c.w} height={c.h + 30} fill={P.profundo} />
            <path d={`M${c.x - 6} ${y} L${c.x + c.w / 2} ${y - 20} L${c.x + c.w + 6} ${y}z`} fill={c.techo} />
            {[0, 1].map((k) => {
              const prendida = pueblo === "todo" || (pueblo === "algunas" && (i + k) % 2 === 0);
              return (
                <rect
                  key={k}
                  x={c.x + 12 + k * (c.w - 36)}
                  y={y + 16}
                  width="12"
                  height="16"
                  fill={prendida ? P.mostaza : P.tierra}
                  opacity={prendida ? 1 : 0.5}
                  className={pueblo === "todo" ? "motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]" : ""}
                  style={{ animationDelay: `${(i * 2 + k) * 140}ms` }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// Lo que se ve adentro cuando hay luz (siluetas, en madera sobre luz cálida).
const INTERIORES: (() => ReactNode)[] = [
  // Lámpara de pie
  () => (
    <svg viewBox="0 0 40 40" className="w-[70%] h-auto" fill="currentColor" opacity="0.75">
      <path d="M13 9h14l4 10H9z" />
      <rect x="19" y="19" width="2.4" height="15" />
      <rect x="13" y="34" width="14" height="3" rx="1.5" />
    </svg>
  ),
  // Gato sentado
  () => (
    <svg viewBox="0 0 40 40" className="w-[70%] h-auto" fill="currentColor" opacity="0.75">
      <path d="M12 38c0-8 2-13 5-15l-1-8 4.5 4h3l4.5-4-1 8c3 2 5 7 5 15z" />
      <path d="M30 37c5 0 7-3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  // Planta en maceta
  () => (
    <svg viewBox="0 0 40 40" className="w-[70%] h-auto" fill="currentColor" opacity="0.75">
      <path d="M20 26c0-7-6-10-9-16 6 1 9 6 9 11 0-7 3-12 9-15-2 7-6 11-9 20z" />
      <path d="M13 26h14l-2 12H15z" />
    </svg>
  ),
  // Persona leyendo en su silla
  () => (
    <svg viewBox="0 0 40 40" className="w-[78%] h-auto" fill="currentColor" opacity="0.75">
      <circle cx="18" cy="11" r="5" />
      <path d="M10 38c0-10 3-17 8-17 4 0 6 3 7 7l-3 2z" />
      <path d="M21 24l9-3 2 8-9 2z" />
      <path d="M6 38V24h3v14zM6 31h26v3H6z" opacity="0.7" />
    </svg>
  ),
  // Mesa con tetera y taza
  () => (
    <svg viewBox="0 0 40 40" className="w-[74%] h-auto" fill="currentColor" opacity="0.75">
      <path d="M10 22h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
      <path d="M23 24c4 0 5 4 1 5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M14 18h5l-1 4h-3z" />
      <rect x="27" y="27" width="6" height="5" rx="1" />
      <rect x="5" y="32" width="30" height="3" />
      <rect x="8" y="35" width="2.4" height="4" />
      <rect x="30" y="35" width="2.4" height="4" />
    </svg>
  ),
  // Cuadro de montañas en la pared
  () => (
    <svg viewBox="0 0 40 40" className="w-[64%] h-auto" fill="currentColor" opacity="0.75">
      <rect x="8" y="8" width="24" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M10 24l7-9 5 6 3-3 5 6z" />
      <circle cx="26" cy="13" r="2" />
      <path d="M14 38h12" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  ),
];
