import { useEffect, useRef, useState } from "react";
import { roseton, type ParamsRoseton } from "../../../lib/actividades/roseton";
import { P } from "./paleta";

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
