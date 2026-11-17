import { useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { roseton, type ParamsRoseton } from "../../../lib/actividades/roseton";
import { P } from "./paleta";
import { PancartaArriba } from "../interactivas/comun";

// Piezas visuales comunes de «Un día en el pueblo»: el rosetón de carreta,
// la rueda de progreso que se pinta y el rótulo pintado de cada lugar.

export function Roseton({ params, size, className = "" }: { params: ParamsRoseton; size: number | string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      {roseton(params).map((f, i) => (
        <path key={i} d={f.d} fill={f.fill} />
      ))}
    </svg>
  );
}

const ROSETON_RUEDA: ParamsRoseton = { petalos: 8, anillos: 1, forma: "gota", colores: [P.naranja, P.mostaza, P.grano] };

// Rueda de carreta sin pintar: cada ejercicio completado pinta un sector con
// un trazo de pincel. No mide desempeño: se pinta igual con 1 o 5 intentos.
// Completa, da un giro lento (una vez). Para lectores: «Ejercicio X de N».
export function RuedaProgreso({ total, completados, actual, size = 60 }: { total: number; completados: number; actual: number; size?: number }) {
  const paso = 360 / total;
  const rayosPorSector = Math.ceil(10 / total);
  const r = 29;
  const completa = completados >= total;
  // Solo se anima el sector recién pintado (no los de antes al montar).
  const previo = useRef(completados);
  const [nuevo, setNuevo] = useState<number | null>(null);
  useEffect(() => {
    if (completados > previo.current) setNuevo(completados - 1);
    previo.current = completados;
  }, [completados]);

  const punto = (ang: number, rad: number) => {
    const a = ((ang - 90) * Math.PI) / 180;
    return `${50 + rad * Math.cos(a)} ${50 + rad * Math.sin(a)}`;
  };
  return (
    <div className="shrink-0" role="img" aria-label={completa ? `Terminaste los ${total} ejercicios` : `Ejercicio ${actual} de ${total}`}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <g
          style={{ transformOrigin: "50px 50px", transformBox: "view-box" }}
          className={completa && nuevo !== null ? "motion-safe:animate-[pueblo-giro_2.6s_ease-in-out_1]" : ""}
        >
          {/* Madera sin pintar */}
          <circle cx="50" cy="50" r="46" fill={P.cal} stroke={P.tierra} strokeWidth="5" />
          {/* Sectores pintados */}
          {Array.from({ length: Math.min(completados, total) }, (_, i) => {
            const a0 = i * paso + 2;
            const a1 = (i + 1) * paso - 2;
            const largo = (Math.PI * r * (a1 - a0)) / 180;
            const anima = i === nuevo;
            return (
              <path
                key={i}
                d={`M${punto(a0, r)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${punto(a1, r)}`}
                fill="none"
                stroke={i % 2 ? P.grano : P.naranja}
                strokeWidth="27"
                strokeDasharray={largo}
                style={{ ["--largo" as string]: largo }}
                className={anima ? "motion-safe:animate-[pueblo-pincel_380ms_ease-out_both]" : ""}
              />
            );
          })}
          {/* Rayos: al menos 10, alineados con los sectores */}
          {Array.from({ length: total * rayosPorSector }, (_, i) => (
            <path key={i} d={`M${punto((i * paso) / rayosPorSector, 13)} L${punto((i * paso) / rayosPorSector, 44)}`} stroke={P.tierra} strokeWidth={i % rayosPorSector ? 2.2 : 3.2} strokeLinecap="round" />
          ))}
          {/* Maza con rosetón */}
          <circle cx="50" cy="50" r="15" fill={P.tierra} />
          <g transform="translate(37 37) scale(0.26)">
            {roseton(ROSETON_RUEDA).map((f, i) => (
              <path key={i} d={f.d} fill={f.fill} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

// Rótulo pintado a mano: tabla de color con letras de rótulo y remate de puntos.
export function Rotulo({ texto, size = "md", color = P.naranja, className = "" }: { texto: string; size?: "md" | "lg"; color?: string; className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center gap-2.5 font-rotulo leading-none whitespace-nowrap text-[#F6F1E4] ${
        size === "lg"
          ? texto.length > 20
            ? "px-4 py-3 text-[24px]"
            : texto.length > 16
              ? "px-5 py-3 text-[27px]"
              : "px-6 py-3 text-[34px]"
          : texto.length > 20
            ? "px-3 py-2 text-[16px]"
            : texto.length > 16
              ? "px-3 py-2 text-[19px]"
              : "px-4 py-2 text-[24px]"
      } ${className}`}
      style={{ background: color, borderRadius: "6px 6px 8px 8px", boxShadow: `0 4px 0 ${P.tierra}55` }}
    >
      <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: P.mostaza }} />
      {texto}
      <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: P.mostaza }} />
    </span>
  );
}

// ─── Madera pintada: el letrero de la consigna y las pancartas ───

// Dos tablas con veta, canto oscuro y un filete pintado a mano, como los
// rótulos de pulpería. «clara» para avisos informativos.
function madera(tono: "oscura" | "clara" = "oscura", filete: string = P.mostaza): CSSProperties {
  const base = tono === "clara" ? ["#E2B57E", P.maderaClara, "#C9935A"] : ["#9A6640", P.madera, "#764B2C"];
  return {
    background: [
      // veta
      `repeating-linear-gradient(178deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 7px, rgba(51,36,28,0.06) 7px 8px, transparent 8px 13px)`,
      // junta entre las dos tablas
      `linear-gradient(180deg, transparent calc(50% - 1.5px), rgba(51,36,28,0.35) calc(50% - 1.5px) calc(50% + 1px), transparent calc(50% + 1px))`,
      `linear-gradient(180deg, ${base[0]}, ${base[1]} 48%, ${base[2]})`,
    ].join(", "),
    borderRadius: 6,
    boxShadow: `inset 0 0 0 3px ${tono === "clara" ? P.madera : P.maderaOscura}, inset 0 0 0 6px transparent, inset 0 0 0 7.5px ${filete}aa, 0 5px 0 rgba(51,36,28,0.38)`,
  };
}

const Clavo = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={`absolute w-[7px] h-[7px] rounded-full ${className}`} style={{ background: P.tierra, boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.35)" }} />
);
const clavos = (
  <>
    <Clavo className="left-2.5 top-2.5" />
    <Clavo className="right-2.5 top-2.5" />
    <Clavo className="left-2.5 bottom-2.5" />
    <Clavo className="right-2.5 bottom-2.5" />
  </>
);

// El letrero de la consigna, dentro de la escena. Con `clavado` se monta
// sobre el pie de la escena de arriba, como un rótulo clavado al tablón.
export function Letrero({ children, detalle, large = false, clavado = false, grande = false, className = "" }: { children: ReactNode; detalle?: ReactNode; large?: boolean; clavado?: boolean; grande?: boolean; className?: string }) {
  const oculto = useContext(PancartaArriba);
  if (!children) return null;
  const tam = grande ? (large ? "text-[34px]" : "text-[30px]") : large ? "text-[26px]" : "text-[22px] sm:text-[24px]";
  return (
    <div
      data-letrero=""
      className={`relative z-10 flex justify-center px-2 transition-[opacity,transform] motion-reduce:transition-none ${oculto ? "opacity-0 translate-y-2 duration-300" : "opacity-100 duration-500 delay-200"} ${clavado ? "-mt-6" : ""} ${className}`}
    >
      <div className="relative max-w-[560px] px-7 py-4 text-center -rotate-[0.6deg] motion-safe:animate-[pueblo-asentar_320ms_ease-out]" style={madera()}>
        {clavos}
        <p className={`m-0 font-rotulo leading-[1.15] [text-wrap:balance] ${tam}`} style={{ color: P.cal, textShadow: "0 2px 0 rgba(51,36,28,0.45)" }}>
          {children}
        </p>
        {detalle && (
          <p className={`m-0 mt-1.5 font-semibold leading-snug [text-wrap:balance] ${large ? "text-[19px]" : "text-[17px]"}`} style={{ color: `${P.cal}e6` }}>
            {detalle}
          </p>
        )}
      </div>
    </div>
  );
}

export type Aviso = { id: number; tipo: "ok" | "reintento" | "info"; texto: string };

const ENTRADA = 900;
const SALIDA = 650;
// Tiempo arriba: más largo cuanto más texto (entre 2,8 y 6,5 segundos).
const espera = (texto: string) => Math.min(6500, Math.max(2800, 1500 + texto.length * 55));

// La pancarta de los mensajes: un cartel de madera en su palo que sale
// despacio de la esquina inferior derecha, se queda un rato y se vuelve a
// esconder. Ocupa el lugar del último letrero del juego, que se esconde
// mientras tanto (nunca tapa las piezas) y deja pasar los toques. El texto, para lectores, está en la región aria-live
// del marco.
export function Pancarta({ aviso, large = false, onArriba }: { aviso: Aviso | null; large?: boolean; onArriba?: (arriba: boolean) => void }) {
  const [visto, setVisto] = useState<Aviso | null>(null);
  const [arriba, setArriba] = useState(false);
  const [abajo, setAbajo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  // Dónde está el letrero: la pancarta sale desde su borde de abajo.
  useLayoutEffect(() => {
    const padre = caja.current?.parentElement;
    if (!aviso || !padre) return;
    const letreros = padre.querySelectorAll("[data-letrero]");
    const l = letreros[letreros.length - 1];
    setAbajo(l ? Math.max(0, padre.getBoundingClientRect().bottom - l.getBoundingClientRect().bottom - 4) : 0);
  }, [aviso]);
  useEffect(() => {
    if (!aviso) {
      setArriba(false);
      return;
    }
    setVisto(aviso);
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setArriba(true)));
    const t = window.setTimeout(() => setArriba(false), ENTRADA + espera(aviso.texto));
    return () => {
      cancelAnimationFrame(r);
      window.clearTimeout(t);
    };
  }, [aviso]);
  // Avisa al marco para que el letrero se esconda mientras está arriba.
  const avisarArriba = useRef(onArriba);
  avisarArriba.current = onArriba;
  useEffect(() => avisarArriba.current?.(arriba), [arriba]);
  const clara = visto?.tipo === "info";
  return (
    <div ref={caja} aria-hidden="true" className="absolute -right-4 sm:-right-5 w-[calc(100%+2rem)] h-56 overflow-hidden pointer-events-none z-20" style={{ bottom: abajo }}>
      {visto && (
      <div
        className="absolute right-4 sm:right-6 bottom-0 max-w-[min(82%,420px)] flex flex-col items-end origin-bottom-right motion-reduce:!transition-opacity"
        style={{
          transform: arriba ? "translate(0, 0) rotate(-3deg)" : "translate(35%, 112%) rotate(14deg)",
          opacity: arriba ? 1 : 0.001,
          transition: arriba ? `transform ${ENTRADA}ms cubic-bezier(0.2, 0.8, 0.25, 1.06), opacity 200ms` : `transform ${SALIDA}ms cubic-bezier(0.55, 0, 0.8, 0.3), opacity 200ms ${SALIDA - 150}ms`,
        }}
      >
        <div className="relative px-6 py-3.5" style={madera(clara ? "clara" : "oscura", visto.tipo === "ok" ? P.mostaza : P.cal)}>
          {clavos}
          <p
            key={visto.id}
            className={`m-0 font-rotulo leading-[1.15] [text-wrap:balance] motion-safe:animate-[pueblo-asentar_320ms_ease-out] ${large ? "text-[23px]" : "text-[20px]"}`}
            style={{ color: clara ? P.tierra : P.cal, textShadow: clara ? "none" : "0 2px 0 rgba(51,36,28,0.45)" }}
          >
            {visto.texto}
          </p>
        </div>
        {/* El palo del que se sostiene */}
        <span className="mr-[22%] w-3.5 h-4 -mt-1" style={{ background: `linear-gradient(90deg, ${P.maderaOscura}, ${P.madera} 45%, ${P.maderaOscura})` }} />
      </div>
      )}
    </div>
  );
}
