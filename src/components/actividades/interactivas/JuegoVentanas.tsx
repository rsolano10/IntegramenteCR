import { useId, useState, type ReactNode } from "react";
import { revisarPosiciones, type EjercicioPosiciones } from "../../../lib/actividades/recordarPosiciones";
import { usePista, type Control } from "./comun";
import { Boton, Check } from "./ui";

// «Ventanas encendidas», con escena propia: una casa de barrio de noche, con
// techo de teja, ventanas de arco, postigos y maceteros. Cada ventana con luz
// deja ver algo de adentro (una lámpara, un gato, una planta…). Mirar, tocar
// «Ya lo memoricé» (sin temporizador) y volver a encender las que tenían luz.
// Sin parpadeos: las luces entran y salen con un fundido suave, y nada se
// anima con prefers-reduced-motion.

// Colores de la paleta (tokens de index.css).
const C = {
  tinta: "#1f3338",
  profundo: "#3f6a70",
  serenidad: "#6a969c",
  beige: "#ebe6ce",
  arena: "#e7dcb6",
  papel: "#f7f4e9",
  mostaza: "#f4d096",
  ambar: "#e8b857",
  madera: "#8a6a2a",
};

export function JuegoVentanas({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioPosiciones; config: { permitirVerDeNuevo: boolean }; ctl: Control }) {
  const [fase, setFase] = useState<"mirar" | "responder" | "hecho">("mirar");
  const [marcadas, setMarcadas] = useState<number[]>([]);
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
    setMarcadas(r.aciertos);
    ctl.reintento(r.sobran.length ? "Apagamos las que no tenían luz. Probemos otra vez." : "Aún falta alguna ventana por encender.");
  }

  const encendida = (i: number) => (fase === "responder" ? marcadas.includes(i) : ej.encendidas.includes(i));
  const titulo =
    fase === "mirar" ? "Mirá qué ventanas tienen luz." : fase === "responder" ? "Se apagaron las luces. ¿Cuáles estaban encendidas?" : "¡La casa quedó iluminada!";

  return (
    <div className="grid gap-4">
      <p className={`m-0 font-serif leading-tight text-white ${L ? "text-[30px]" : "text-[27px]"}`}>{titulo}</p>

      <Escena
        filas={ej.filas}
        columnas={ej.columnas}
        encendida={encendida}
        fiesta={fase === "hecho"}
        onTocar={fase === "responder" ? (i) => setMarcadas((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i])) : undefined}
        marcarHechas={fase === "hecho"}
        estado={fase === "responder" ? "" : fase === "mirar" ? "mirar" : "hecho"}
      />

      {fase === "mirar" && (
        <div className="grid gap-3">
          <p className={`m-0 flex items-center gap-2 text-white/80 ${L ? "text-[20px]" : "text-[18px]"}`}>
            <Reloj /> Tomate el tiempo que necesités.
          </p>
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

// Portada del inicio (algunas luces) y del cierre (toda la casa iluminada).
export function PortadaVentanas({ final = false }: { final?: boolean }) {
  const prendidas = [0, 4, 5];
  return (
    <div className="w-full max-w-[380px]" aria-hidden="true">
      <Escena filas={2} columnas={3} encendida={(i) => final || prendidas.includes(i)} fiesta={final} compacta />
    </div>
  );
}

// Cuántas ventanas hay que encender: bombillos que se llenan (no es un puntaje).
function Medidor({ total, llevas, large }: { total: number; llevas: number; large: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" role="status" aria-label={`Encendiste ${llevas} de ${total} ventanas`}>
      <span className={`text-white/85 ${large ? "text-[20px]" : "text-[18px]"}`}>Encendé {total === 1 ? "1 ventana" : `${total} ventanas`}</span>
      <span className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <Bombillo key={i} lleno={i < llevas} />
        ))}
      </span>
    </div>
  );
}

function Bombillo({ lleno }: { lleno: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" className={`transition-[filter] duration-300 motion-reduce:transition-none ${lleno ? "drop-shadow-[0_0_6px_rgba(244,208,150,0.9)]" : ""}`}>
      <path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8V17h7.6v-2.7A6.5 6.5 0 0 0 12 2.5z" fill={lleno ? C.mostaza : "none"} stroke={lleno ? C.mostaza : "rgba(255,255,255,.55)"} strokeWidth="1.6" />
      <path d="M9 19.5h6M10 22h4" stroke={lleno ? C.mostaza : "rgba(255,255,255,.55)"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Reloj() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.mostaza} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0" />
      <path d="M12 8v4.5l3 1.5" />
    </svg>
  );
}

// ─── La escena ───

function Escena({
  filas,
  columnas,
  encendida,
  onTocar,
  fiesta = false,
  marcarHechas = false,
  compacta = false,
  estado = "",
}: {
  filas: number;
  columnas: number;
  encendida: (i: number) => boolean;
  onTocar?: (i: number) => void;
  fiesta?: boolean;
  marcarHechas?: boolean;
  compacta?: boolean;
  estado?: string;
}) {
  const total = filas * columnas;
  const ancho = columnas <= 2 ? "max-w-[250px]" : columnas === 3 ? "max-w-[320px]" : "max-w-[360px]";
  return (
    <div className={`relative overflow-hidden rounded-[22px] ring-1 ring-white/10 bg-[linear-gradient(180deg,var(--color-tinta)_0%,var(--color-tinta)_35%,var(--color-verde-profundo)_100%)] ${compacta ? "pt-10" : "pt-14"}`}>
      <Cielo fiesta={fiesta} />
      {fiesta && <Destellos />}

      <div className={`relative z-10 mx-auto w-[84%] ${ancho}`}>
        {/* Resplandor cálido detrás de la casa cuando queda iluminada */}
        {fiesta && (
          <span
            aria-hidden="true"
            className="absolute -inset-x-10 -top-6 bottom-0 rounded-full bg-[radial-gradient(closest-side,rgba(244,208,150,0.55),transparent)] motion-safe:animate-[vent-fiesta_1.4s_ease-out_both]"
          />
        )}
        <Techo />
        <ul
          className={`relative list-none m-0 grid bg-[linear-gradient(180deg,var(--color-beige-serenidad),var(--color-seccion-arena))] shadow-[inset_0_-10px_18px_-12px_rgba(31,51,56,0.45)] ${compacta ? "gap-x-1.5 gap-y-2 px-3 pt-3 pb-1" : "gap-x-2 gap-y-3 px-3.5 pt-4 pb-2"}`}
          style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
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
                  hecha={marcarHechas && encendida(i)}
                  etiqueta={onTocar ? nombre : estado === "mirar" ? `${nombre}, ${encendida(i) ? "con luz" : "apagada"}` : undefined}
                />
              </li>
            );
          })}
        </ul>
        <PlantaBaja />
      </div>

      {/* Zacate y acera */}
      <div aria-hidden="true" className="relative z-10 h-5 bg-[linear-gradient(180deg,var(--color-verde-serenidad),var(--color-verde-profundo))]" />
    </div>
  );
}

function Ventana({ luz, interior, onTocar, hecha, etiqueta }: { luz: boolean; interior: number; onTocar?: () => void; hecha: boolean; etiqueta?: string }) {
  const Interior = INTERIORES[interior];
  const cuerpo: ReactNode = (
    <>
      {/* Postigos de madera pintada */}
      <span aria-hidden="true" className="absolute left-0 top-[8%] bottom-[20%] w-[15%] rounded-[3px] bg-[repeating-linear-gradient(180deg,var(--color-verde-serenidad)_0_5px,var(--color-verde-profundo)_5px_6px)]" />
      <span aria-hidden="true" className="absolute right-0 top-[8%] bottom-[20%] w-[15%] rounded-[3px] bg-[repeating-linear-gradient(180deg,var(--color-verde-serenidad)_0_5px,var(--color-verde-profundo)_5px_6px)]" />

      {/* Vidrio en arco */}
      <span
        aria-hidden="true"
        className={`absolute left-[18%] right-[18%] top-[4%] bottom-[18%] rounded-t-full overflow-hidden border-[3px] border-papel transition-shadow duration-700 motion-reduce:transition-none ${
          luz ? "shadow-[0_0_26px_6px_rgba(244,208,150,0.7)]" : "shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]"
        }`}
        style={{ background: `linear-gradient(160deg, ${C.profundo} 0%, ${C.tinta} 75%)` }}
      >
        {/* Reflejo de la luna en el vidrio apagado */}
        <span className="absolute -left-1/4 top-[20%] w-[150%] h-[14%] -rotate-[35deg] bg-white/10" />
        {/* Luz de adentro */}
        <span
          className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${luz ? "opacity-100 motion-safe:animate-[vent-luz_700ms_ease-out]" : "opacity-0"}`}
          style={{ background: `radial-gradient(circle at 50% 62%, #fff 0%, ${C.mostaza} 42%, ${C.ambar} 100%)` }}
        >
          <span className="absolute inset-x-[12%] bottom-[2%] top-[22%] flex items-end justify-center" style={{ color: C.madera }}>
            <Interior />
          </span>
        </span>
        {/* Marco en cruz */}
        <span className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-papel/90" />
        <span className="absolute left-0 right-0 top-[52%] h-[3px] bg-papel/90" />
      </span>

      {/* Macetero con flores */}
      <span aria-hidden="true" className="absolute left-[10%] right-[10%] bottom-[5%] h-[13%]">
        <svg viewBox="0 0 60 14" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <circle cx="10" cy="5" r="3.4" fill={C.mostaza} />
          <circle cx="22" cy="4" r="3" fill={C.papel} />
          <circle cx="32" cy="5" r="3.4" fill={C.mostaza} />
          <circle cx="44" cy="4" r="3" fill={C.papel} />
          <circle cx="52" cy="5" r="3.2" fill={C.mostaza} />
          <path d="M3 6h54l-3 8H6z" fill={C.madera} />
        </svg>
      </span>
      {hecha && <Check className="!top-0 !right-0" />}
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
      className={`${base} p-0 border-0 bg-transparent cursor-pointer rounded-xl transition-transform duration-150 motion-safe:active:scale-95 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo`}
    >
      {cuerpo}
    </button>
  );
}

// Destellos alrededor de la casa al iluminarla: aparecen una vez, escalonados,
// y se quedan quietos (sin parpadeo).
const DESTELLOS = [
  [8, 30, 18, 0],
  [88, 22, 22, 150],
  [14, 62, 14, 300],
  [90, 56, 16, 450],
  [26, 12, 12, 600],
  [74, 8, 14, 750],
];
function Destellos() {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-20 pointer-events-none">
      {DESTELLOS.map(([x, y, t, d]) => (
        <svg
          key={`${x}-${y}`}
          viewBox="0 0 20 20"
          width={t}
          height={t}
          className="absolute motion-safe:animate-[vent-fiesta_900ms_ease-out_both] drop-shadow-[0_0_6px_rgba(244,208,150,0.9)]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}ms` }}
        >
          <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8Z" fill={C.mostaza} />
        </svg>
      ))}
    </div>
  );
}

// Techo de teja con alero.
function Techo() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 78" preserveAspectRatio="none" className="block -mx-[7%] w-[114%] h-auto" aria-hidden="true">
      <defs>
        <pattern id={`teja-${id}`} width="18" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 Q9 2 18 14" fill="none" stroke={C.tinta} strokeOpacity="0.28" strokeWidth="2" />
        </pattern>
        <linearGradient id={`techo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.madera} />
          <stop offset="1" stopColor="#6e5422" />
        </linearGradient>
      </defs>
      <path d="M8 70 L58 6 H262 L312 70 Z" fill={`url(#techo-${id})`} />
      <path d="M8 70 L58 6 H262 L312 70 Z" fill={`url(#teja-${id})`} />
      <rect x="0" y="68" width="320" height="10" rx="2" fill={C.tinta} fillOpacity="0.55" />
      {/* Luz de luna sobre el borde del techo */}
      <path d="M58 6 H262" stroke={C.mostaza} strokeOpacity="0.5" strokeWidth="2" />
    </svg>
  );
}

// Planta baja: puerta de madera, farol encendido, macetas y gradas.
function PlantaBaja() {
  return (
    <svg viewBox="0 0 300 92" className="block w-full h-auto -mt-px" aria-hidden="true">
      <defs>
        <linearGradient id="pared-pb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.arena} />
          <stop offset="1" stopColor="#d9cb9c" />
        </linearGradient>
        <radialGradient id="farol-luz">
          <stop offset="0" stopColor={C.mostaza} stopOpacity="0.9" />
          <stop offset="1" stopColor={C.mostaza} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="300" height="80" fill="url(#pared-pb)" />
      <rect x="0" y="0" width="300" height="5" fill={C.tinta} fillOpacity="0.12" />
      {/* Puerta */}
      <path d="M126 80 V34 a24 24 0 0 1 48 0 V80 z" fill={C.madera} />
      <path d="M150 80 V12" stroke={C.tinta} strokeOpacity="0.3" strokeWidth="2" />
      <rect x="132" y="40" width="13" height="16" rx="2" fill="none" stroke={C.tinta} strokeOpacity="0.3" strokeWidth="2" />
      <rect x="155" y="40" width="13" height="16" rx="2" fill="none" stroke={C.tinta} strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="144" cy="62" r="2.6" fill={C.mostaza} />
      <circle cx="156" cy="62" r="2.6" fill={C.mostaza} />
      {/* Farol */}
      <circle cx="198" cy="34" r="22" fill="url(#farol-luz)" />
      <path d="M192 28h12l-2 12h-8z" fill={C.mostaza} stroke={C.tinta} strokeWidth="1.5" />
      <path d="M198 20v8" stroke={C.tinta} strokeWidth="2" />
      {/* Macetas */}
      {[
        [40, C.serenidad],
        [80, C.profundo],
        [230, C.profundo],
        [262, C.serenidad],
      ].map(([x, color]) => (
        <g key={x as number} transform={`translate(${x} 0)`}>
          <path d="M-14 62c4-14 10-20 14-24 4 4 10 10 14 24z" fill={color as string} />
          <path d="M-6 54c-6-6-10-14-8-20 6 4 9 10 8 20zM6 54c6-6 10-14 8-20-6 4-9 10-8 20z" fill={color as string} opacity="0.8" />
          <path d="M-10 62h20l-3 18h-14z" fill={C.madera} />
        </g>
      ))}
      {/* Gradas */}
      <rect x="116" y="80" width="68" height="6" fill={C.papel} />
      <rect x="108" y="86" width="84" height="6" fill={C.beige} />
    </svg>
  );
}

// Cielo de noche: estrellas fijas, luna con halo y lomas con árboles.
const ESTRELLAS = [
  [22, 18, 1.4], [48, 40, 1], [70, 12, 1.6], [96, 30, 1], [118, 8, 1.2], [140, 46, 1], [168, 20, 1.5], [196, 38, 1], [214, 10, 1.1],
  [236, 52, 1], [258, 24, 1.3], [16, 58, 1], [88, 62, 1.2], [180, 64, 1], [124, 72, 1], [40, 86, 1], [370, 96, 1.2], [384, 30, 1], [352, 70, 1],
];

function Cielo({ fiesta }: { fiesta: boolean }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {/* Estrellas (arriba, se recortan sin perder nada importante) */}
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMin slice" className="absolute inset-x-0 top-0 w-full h-[45%]">
        {ESTRELLAS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity={fiesta ? 0.95 : 0.6} className="transition-opacity duration-1000" />
        ))}
        {[
          [64, 34],
          [236, 26],
        ].map(([x, y]) => (
          <path key={x} d={`M${x} ${y - 6}L${x + 1.5} ${y - 1.5}L${x + 6} ${y}L${x + 1.5} ${y + 1.5}L${x} ${y + 6}L${x - 1.5} ${y + 1.5}L${x - 6} ${y}L${x - 1.5} ${y - 1.5}Z`} fill={C.mostaza} opacity="0.9" />
        ))}
      </svg>
      {/* Luna: siempre entera, arriba a la derecha */}
      <svg viewBox="0 0 100 100" className="absolute -top-3 -right-3 w-28 h-28">
        <defs>
          <radialGradient id="halo-luna">
            <stop offset="0" stopColor={C.mostaza} stopOpacity="0.5" />
            <stop offset="1" stopColor={C.mostaza} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#halo-luna)" />
        <circle cx="50" cy="50" r="17" fill={C.mostaza} />
        <circle cx="44" cy="45" r="3.4" fill={C.ambar} opacity="0.55" />
        <circle cx="56" cy="56" r="2.6" fill={C.ambar} opacity="0.55" />
      </svg>
      {/* Lomas y árboles, abajo */}
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 w-full h-[55%]">
        <path d="M0 110 C60 70 120 80 170 102 C230 76 300 66 400 94 V200 H0z" fill={C.tinta} opacity="0.55" />
        <path d="M0 150 C80 124 150 134 210 146 C280 128 340 126 400 140 V200 H0z" fill={C.tinta} opacity="0.7" />
        <g fill={C.tinta} opacity="0.85">
          <path d="M34 200 C36 160 40 128 48 106 L52 107 C46 130 42 162 42 200z" />
          <path d="M50 106c-14-10-30-10-40-2 14-2 26 0 40 4zM50 106c-4-14-14-24-26-26 10 6 18 14 24 27zM50 106c8-12 22-18 36-16-12 2-24 8-34 18zM50 106c14-4 28 0 36 10-12-6-24-8-36-8z" />
        </g>
        <g fill={C.tinta} opacity="0.8">
          <rect x="358" y="138" width="6" height="62" />
          <circle cx="361" cy="130" r="24" />
          <circle cx="344" cy="142" r="14" />
        </g>
      </svg>
    </div>
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
