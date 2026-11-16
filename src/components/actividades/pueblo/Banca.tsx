import { useState } from "react";
import type { EjercicioDicho } from "../../../lib/actividades/dichos";
import { BotonEscuchar } from "../ClasificarNumeros";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La banca del parque» (dichos). De tarde, frente a la iglesia del pueblo:
// la banca de hierro y madera con dos sombreros que sugieren la
// conversación (sin personas). El dicho está escrito en una tarjetita sobre
// la banca; abajo, los finales para elegir. Al terminar suenan (se mueven)
// las campanas.

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioDicho; config: { leerEnVoz: boolean }; ctl: Control }) {
  const [fuera, setFuera] = useState<number[]>([]);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const i = ej.opciones.findIndex((_, k) => k !== ej.correcta && !fuera.includes(k));
    if (i < 0) return;
    setFuera((f) => [...f, i]);
    ctl.aviso("Quitamos una que no era.");
  });

  function tocar(i: number) {
    if (hecho || fuera.includes(i)) return;
    if (i === ej.correcta) {
      setHecho(true);
      return ctl.listo();
    }
    setFuera((f) => [...f, i]);
    ctl.reintento(ej.tipo === "completar" ? "Ese final no es. Probá con otro." : "No quiere decir eso. Probá con otra.");
  }

  const escuchar = ej.tipo === "completar" ? `${ej.enunciado.replace(/…$/, "")}… ¿Cómo sigue?` : `${ej.completo} ¿Qué quiere decir?`;

  return (
    <div className="grid gap-4">
      <div>
        <div className="overflow-hidden rounded-[20px]" style={sombraCapa}>
          <Parque campana={hecho} />
        </div>
        {/* La tarjetita del dicho, como un rótulo clavado al pie del parque */}
        <div className="relative -mt-6 flex justify-center px-4">
          <p
            className={`m-0 max-w-[480px] px-4 py-2.5 rounded-[4px] font-rotulo leading-tight text-center -rotate-1 ${L ? "text-[25px]" : "text-[21px] sm:text-[24px]"}`}
            style={{ background: P.cal, color: P.tierra, boxShadow: "0 4px 0 rgba(51,36,28,0.3)" }}
          >
            {hecho ? ej.completo : ej.enunciado}
          </p>
        </div>
      </div>
      {config.leerEnVoz && (
        <div className="flex justify-center">
          <BotonEscuchar texto={escuchar} etiqueta="Escuchar el dicho" />
        </div>
      )}
      {ej.tipo === "significado" && !hecho && <p className={`m-0 font-semibold text-tinta ${L ? "text-[22px]" : "text-[19px]"}`}>¿Qué quiere decir?</p>}
      <ul className="list-none m-0 p-0 grid gap-2.5" aria-label={ej.tipo === "completar" ? "Finales para elegir" : "Significados para elegir"}>
        {ej.opciones.map((o, i) => {
          const descartada = fuera.includes(i);
          const esta = hecho && i === ej.correcta;
          const est = estiloPieza(esta ? "elegida" : descartada ? "quieta" : "reposo");
          return (
            <li key={o}>
              <button
                type="button"
                onClick={() => tocar(i)}
                disabled={hecho || descartada}
                className={`${clasePieza} ${est.className} w-full rounded-[14px] text-left px-4 py-3.5 min-h-16 font-bold leading-snug ${L ? "text-[22px]" : "text-[19px]"}`}
                style={{ ...est.style, background: P.cal, color: P.tierra, opacity: descartada ? 0.4 : 1 }}
              >
                {ej.tipo === "completar" ? `…${o}` : o}
              </button>
            </li>
          );
        })}
      </ul>
      {hecho && ej.tipo === "significado" && <p className={`m-0 leading-snug text-tinta ${L ? "text-[24px]" : "text-[21px]"}`}>¡Eso mismo!</p>}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Parque campana={final} />
    </div>
  );
}

// El parque de tarde: cielo rosado, la fachada de la iglesia con su
// campanario, el kiosko a lo lejos, el zacate, y la banca con los dos
// sombreros. `campana` mueve las campanas (momento final).
function Parque({ campana }: { campana: boolean }) {
  return (
    <div className="pueblo-grano" style={{ backgroundColor: P.rosa }}>
      <svg viewBox="0 0 360 200" className="block mx-auto w-full max-w-[560px] h-auto overflow-visible" aria-hidden="true">
        {/* Banda de luz de la tarde */}
        <rect x="-400" y="0" width="1160" height="70" fill={P.mostaza} opacity="0.45" />
        {/* La iglesia: fachada blanca, puerta y campanario */}
        <g>
          <rect x="120" y="60" width="120" height="90" fill={P.cal} />
          <path d="M112 64 L180 30 L248 64z" fill={P.cal} />
          <path d="M112 64 L180 30 L248 64" stroke={P.madera} strokeWidth="4" fill="none" />
          <rect x="160" y="96" width="40" height="54" rx="20" fill={P.madera} />
          <path d="M180 96 v54" stroke={P.maderaOscura} strokeWidth="2" />
          <circle cx="180" cy="74" r="9" fill={P.serenidad} stroke={P.madera} strokeWidth="3" />
          {/* Campanario */}
          <rect x="164" y="0" width="32" height="34" fill={P.cal} />
          <path d="M160 2 h40" stroke={P.madera} strokeWidth="4" />
          <path d="M172 32 v-18 a8 8 0 0 1 16 0 v18" fill={P.tierra} opacity="0.85" />
          <g style={{ transformOrigin: "180px 16px" }} className={campana ? "motion-safe:animate-[pueblo-campana_1.2s_ease-in-out_3]" : ""}>
            <path d="M174 26 c0 -8 2 -11 6 -11 s6 3 6 11z" fill={P.mostaza} stroke={P.madera} strokeWidth="1.5" />
            <circle cx="180" cy="28" r="2" fill={P.madera} />
          </g>
          {campana && (
            <g className="motion-safe:animate-[pueblo-vapor_1.8s_ease-out_3]" stroke={P.tierra} strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M150 12 c-6 4 -6 10 0 14 M140 8 c-9 6 -9 16 0 22" />
              <path d="M210 12 c6 4 6 10 0 14 M220 8 c9 6 9 16 0 22" />
            </g>
          )}
        </g>
        {/* Árboles a los lados */}
        <circle cx="52" cy="92" r="38" fill={P.serenidad} />
        <circle cx="30" cy="110" r="26" fill={P.profundo} />
        <rect x="48" y="112" width="8" height="40" fill={P.maderaOscura} />
        <circle cx="312" cy="96" r="36" fill={P.serenidad} />
        <circle cx="334" cy="114" r="22" fill={P.profundo} />
        <rect x="306" y="114" width="8" height="38" fill={P.maderaOscura} />
        {/* Zacate y acera */}
        <rect x="-400" y="148" width="1160" height="52" fill={P.profundo} opacity="0.85" />
        <rect x="-400" y="148" width="1160" height="8" fill={P.serenidad} />
        {/* La banca */}
        <g>
          <rect x="88" y="150" width="184" height="9" rx="3" fill={P.madera} />
          <rect x="88" y="136" width="184" height="7" rx="3" fill={P.maderaClara} />
          <rect x="88" y="126" width="184" height="7" rx="3" fill={P.maderaClara} />
          <path d="M98 126 v44 M262 126 v44 M96 170 h10 M254 170 h10" stroke={P.tierra} strokeWidth="5" strokeLinecap="round" />
          {/* Dos sombreros */}
          <g transform="translate(118 140)">
            <ellipse cx="0" cy="8" rx="20" ry="5" fill={P.mostaza} />
            <path d="M-11 8 c0 -12 4 -16 11 -16 s11 4 11 16z" fill={P.mostaza} />
            <path d="M-11 4 h22" stroke={P.naranja} strokeWidth="3" />
          </g>
          <g transform="translate(244 142)">
            <ellipse cx="0" cy="6" rx="17" ry="4.5" fill={P.tierra} />
            <path d="M-9 6 c0 -10 3 -13 9 -13 s9 3 9 13z" fill={P.tierra} />
            <path d="M-9 3 h18" stroke={P.grano} strokeWidth="2.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}
