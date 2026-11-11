import { useState } from "react";
import { esSiguienteValida, siguienteCorrecta, type EjercicioOrdenar } from "../../../lib/actividades/ordenar";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «La estación» (ordenar-secuencia). Andén de una estación de tren antigua,
// con alero de madera calado. Las piezas son vagones numerados (o con letras
// o palabras) en la vía de espera; se enganchan en orden detrás de la
// locomotora. Al final de la sesión el tren sale despacio del andén.

const COLORES_VAGON = [P.naranja, P.profundo, P.grano, P.serenidad];

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioOrdenar; ctl: Control }) {
  const [enganchados, setEnganchados] = useState<number[]>([]);
  const [devuelto, setDevuelto] = useState<number | null>(null);
  const [marcado, setMarcado] = useState<number | null>(null);
  const L = ctl.large;
  const porId = (id: number) => ej.tarjetas.find((t) => t.id === id)!;
  const sueltos = ej.tarjetas.filter((t) => !enganchados.includes(t.id));
  const completo = sueltos.length === 0;

  usePista(ctl.pista, () => {
    const id = siguienteCorrecta(ej, enganchados);
    setMarcado(id);
    if (id !== null) ctl.aviso("El vagón marcado es el que sigue.");
  });

  function tocar(id: number) {
    setMarcado(null);
    if (!esSiguienteValida(ej, enganchados, id)) {
      setDevuelto(id);
      return ctl.reintento("Ese vagón va más adelante. Probemos otra vez.");
    }
    const sig = [...enganchados, id];
    setEnganchados(sig);
    setDevuelto(null);
    if (sig.length === ej.tarjetas.length) ctl.listo();
    else ctl.acierto("Enganchado.");
  }

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <EstacionFondo />
        {/* Andén y vía principal: el tren que se va formando */}
        <div className="relative px-3 pt-3 pb-2" style={{ background: P.beige }}>
          <div className="mx-auto max-w-[560px]">
            <ol className="list-none m-0 p-0 flex flex-wrap items-end gap-x-1 gap-y-3" aria-label="El tren, en orden">
              <li aria-hidden="true">
                <Locomotora humo={completo} />
              </li>
              {enganchados.map((id, k) => (
                <li key={id} className="motion-safe:animate-[pueblo-asentar_320ms_ease-out]">
                  <Vagon texto={porId(id).texto} color={COLORES_VAGON[k % COLORES_VAGON.length]} chico />
                  <span className="sr-only">Vagón {k + 1}</span>
                </li>
              ))}
            </ol>
          </div>
          <Riel />
        </div>
        {/* Vía de espera: los vagones sueltos (la mesa de juego) */}
        <div className="relative px-3 pt-4 pb-3" style={{ background: `radial-gradient(circle at 3px 3px, ${P.maderaClara} 1.2px, transparent 1.6px) 0 0 / 9px 9px, #C9B98E` }}>
          <div className="mx-auto max-w-[560px]">
            {sueltos.length > 0 ? (
              <ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-3" aria-label="Vagones en la vía de espera">
                {sueltos.map((t) => {
                  const est = estiloPieza(marcado === t.id ? "pista" : devuelto === t.id ? "regreso" : "reposo");
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => tocar(t.id)}
                        aria-label={`Vagón ${t.texto}${marcado === t.id ? ". Es el que sigue" : ""}`}
                        className={`${clasePieza} ${est.className} rounded-[10px]`}
                        style={{ ...est.style, background: "transparent", boxShadow: "none", border: est.style.border, padding: 2 }}
                      >
                        <Vagon texto={t.texto} color={COLORES_VAGON[t.id % COLORES_VAGON.length]} large={L} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={`m-0 py-3 text-center font-semibold ${L ? "text-[22px]" : "text-[20px]"}`} style={{ color: P.tierra }}>
                ¡Tren completo!
              </p>
            )}
          </div>
          <Riel />
        </div>
      </div>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {completo ? "¡Listo para salir!" : enganchados.length === 0 ? "¿Cuál vagón va primero?" : "¿Cuál vagón sigue?"}
      </p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <EstacionFondo />
      <div className="relative px-3 pt-3 pb-2 overflow-hidden" style={{ background: P.beige }}>
        <div className={`flex items-end gap-1 ${final ? "motion-safe:animate-[pueblo-salida_3.2s_ease-in_1.2s_both]" : ""}`}>
          <Locomotora humo />
          {["1", "2", "3"].map((n, k) => (
            <Vagon key={n} texto={n} color={COLORES_VAGON[k]} chico />
          ))}
        </div>
        <Riel />
      </div>
    </div>
  );
}

// ─── Dibujo ───

function Riel() {
  return (
    <div aria-hidden="true" className="mt-1 h-3" style={{ background: `repeating-linear-gradient(90deg, ${P.maderaOscura} 0 6px, transparent 6px 16px) 0 4px / 100% 8px no-repeat, linear-gradient(${P.tierra}, ${P.tierra}) 0 2px / 100% 3px no-repeat` }} />
  );
}

function Vagon({ texto, color, chico = false, large = false }: { texto: string; color: string; chico?: boolean; large?: boolean }) {
  const largo = texto.length > 4;
  return (
    <span className={`relative inline-flex flex-col items-center ${chico ? "pb-2" : "pb-2.5"}`}>
      <span
        className={`relative flex items-center justify-center rounded-t-[8px] rounded-b-[3px] ${chico ? `h-10 ${largo ? "px-2" : "w-12"}` : `h-14 ${largo ? "px-3" : "w-[72px]"}`}`}
        style={{ background: color, boxShadow: `inset 0 5px 0 rgba(51,36,28,0.25)` }}
      >
        <span className={`rounded-[4px] px-1.5 font-extrabold leading-tight ${chico ? "text-[16px]" : large ? "text-[26px]" : "text-[24px]"}`} style={{ background: P.cal, color: P.tierra }}>
          {texto}
        </span>
      </span>
      {/* Ruedas */}
      <span aria-hidden="true" className={`absolute bottom-0 flex justify-between ${chico ? "inset-x-1.5" : "inset-x-2"}`}>
        {[0, 1].map((i) => (
          <span key={i} className={`${chico ? "w-3.5 h-3.5" : "w-4.5 h-4.5 w-[18px] h-[18px]"} rounded-full`} style={{ background: P.tierra, boxShadow: `inset 0 0 0 3px ${P.maderaOscura}, inset 0 0 0 5px ${P.tierra}` }} />
        ))}
      </span>
    </span>
  );
}

function Locomotora({ humo = false }: { humo?: boolean }) {
  return (
    <svg viewBox="0 0 80 56" width="80" height="56" className="block">
      {humo && (
        <g fill={P.cal} opacity="0.9" className="motion-safe:animate-[pueblo-aparece_400ms_ease-out_both]">
          <circle cx="22" cy="8" r="6" />
          <circle cx="32" cy="5" r="5" />
          <circle cx="41" cy="7" r="4" />
        </g>
      )}
      {/* Chimenea, caldera y cabina */}
      <path d="M16 12 h12 l-2 10 h-8z" fill={P.tierra} />
      <rect x="6" y="20" width="44" height="22" rx="10" fill={P.profundo} />
      <rect x="6" y="20" width="44" height="6" rx="3" fill={P.serenidad} />
      <rect x="46" y="10" width="28" height="32" rx="3" fill={P.grano} />
      <rect x="44" y="7" width="32" height="5" rx="2" fill={P.tierra} />
      <rect x="52" y="16" width="16" height="11" rx="2" fill={P.mostaza} />
      <circle cx="10" cy="31" r="4" fill={P.mostaza} />
      {/* Trompa */}
      <path d="M0 46 L8 38 H12 V46z" fill={P.naranja} />
      {/* Ruedas */}
      {[16, 34].map((x) => (
        <g key={x}>
          <circle cx={x} cy="47" r="8" fill={P.tierra} />
          <circle cx={x} cy="47" r="4" fill={P.naranja} />
        </g>
      ))}
      <circle cx="62" cy="49" r="6" fill={P.tierra} />
      <circle cx="62" cy="49" r="2.5" fill={P.naranja} />
      <rect x="14" y="45" width="50" height="3" rx="1.5" fill={P.maderaOscura} />
    </svg>
  );
}

// Alero de la estación con calado de madera, rótulo y cielo de tarde.
function EstacionFondo() {
  return (
    <svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice" className="block w-full h-[120px] sm:h-[150px]" style={{ background: P.rosa }} aria-hidden="true">
      <rect x="0" y="0" width="360" height="54" fill={P.mostaza} opacity="0.45" />
      {/* Cerros lejanos */}
      <path d="M0 92 C60 70 110 74 160 86 C210 68 280 64 360 82 V120 H0z" fill={P.serenidad} />
      {/* Edificio de la estación: pared y alero */}
      <rect x="0" y="40" width="360" height="80" fill={P.cal} />
      {[30, 110, 250, 330].map((x) => (
        <g key={x}>
          <rect x={x - 14} y="62" width="28" height="44" rx="2" fill={P.profundo} />
          <rect x={x - 10} y="66" width="20" height="18" fill={P.mostaza} opacity="0.7" />
        </g>
      ))}
      {/* Puerta */}
      <path d="M160 120 V74 a20 20 0 0 1 40 0 V120z" fill={P.madera} />
      {/* Alero de zinc */}
      <path d="M-10 40 L180 20 L370 40 V50 H-10z" fill={P.grano} />
      <rect x="-10" y="48" width="380" height="5" fill={P.tierra} opacity="0.3" />
      {/* Calado de madera (lambrequín) */}
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} d={`M${i * 16} 50 h16 v4 q-8 10 -16 0z`} fill={P.cal} stroke={P.madera} strokeWidth="1" />
      ))}
      {/* Rótulo */}
      <rect x="128" y="26" width="104" height="22" rx="2" fill={P.profundo} />
      <text x="180" y="42" textAnchor="middle" fontFamily="Caprasimo, serif" fontSize="14" fill={P.cal}>
        Estación
      </text>
      {/* Reloj de la estación */}
      <circle cx="290" cy="34" r="0" />
    </svg>
  );
}
