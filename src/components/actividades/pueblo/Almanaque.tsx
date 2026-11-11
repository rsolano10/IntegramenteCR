import { useState } from "react";
import { DIAS, MESES, momentoCR, opcionADescartar, parteDelDia, type EjercicioOrientacion } from "../../../lib/actividades/orientacionHoy";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «El almanaque» (orientacion-hoy). El corredor de la casa: el almanaque de
// pared, el reloj y los arcos que dan al patio. Con «pistas en la escena»
// (nivel suave y medio), el patio muestra la luz del momento (mañana, tarde
// o noche) y la lluvia en época lluviosa, y el reloj marca la hora. Las
// opciones son hojas del almanaque. Al acertar, la respuesta queda escrita en
// la hoja; al final, se arranca la hoja del día y queda puesta la fecha.
// Mensajes muy suaves: nunca sugieren que la persona «debería saberlo».

const mayuscula = (s: string) => s[0].toLocaleUpperCase("es") + s.slice(1);

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioOrientacion; config: { pistasEnEscena: boolean; mesesSeca: number[] }; ctl: Control }) {
  const [descartadas, setDescartadas] = useState<string[]>([]);
  const [ultima, setUltima] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const L = ctl.large;

  usePista(ctl.pista, () => {
    const o = opcionADescartar(ej, descartadas);
    if (o) {
      setDescartadas((d) => [...d, o]);
      ctl.aviso("Quitamos una hoja para que sea más fácil.");
    }
  });

  function elegir(o: string) {
    if (hecho || descartadas.includes(o)) return;
    setUltima(o);
    if (o === ej.correcta) {
      setHecho(true);
      return ctl.listo();
    }
    ctl.reintento("Está bien, miremos juntos otra hoja. Si querés, revisen un calendario.");
  }

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Corredor pistas={config.pistasEnEscena} mesesSeca={config.mesesSeca} hoja={hecho ? mayuscula(ej.correcta) : "?"} arrancar={hecho} />
        {/* La mesa del corredor, con las hojas del almanaque */}
        <div className="px-3 pt-4 pb-4" style={{ background: `repeating-linear-gradient(90deg, ${P.maderaClara} 0 40px, #CF9A5E 40px 42px)`, borderTop: `8px solid ${P.madera}` }}>
          <p className={`m-0 mb-3 mx-auto max-w-[520px] font-rotulo leading-tight ${L ? "text-[28px]" : "text-[25px]"}`} style={{ color: P.tierra }}>
            {ej.texto}
          </p>
          <ul className="list-none m-0 p-0 mx-auto max-w-[520px] grid grid-cols-2 gap-3" aria-label="Hojas del almanaque">
            {ej.opciones.map((o, i) => {
              const fuera = descartadas.includes(o);
              const bien = hecho && o === ej.correcta;
              const est = estiloPieza(bien ? "asentada" : !hecho && ultima === o && o !== ej.correcta ? "regreso" : "reposo");
              return (
                <li key={o} className={ej.opciones.length === 3 && i === 2 ? "col-span-2" : ""}>
                  <button
                    type="button"
                    onClick={() => elegir(o)}
                    aria-disabled={fuera || hecho}
                    aria-label={`${mayuscula(o)}${fuera ? ", descartada" : ""}`}
                    className={`${clasePieza} ${est.className} w-full min-h-16 rounded-[4px] overflow-hidden text-center ${fuera ? "opacity-35 cursor-default" : ""} ${hecho && !bien ? "opacity-45 cursor-default" : ""}`}
                    style={{ ...est.style, background: P.cal, color: P.tierra, ...(bien ? { border: `3px solid ${P.mostaza}` } : {}) }}
                  >
                    {/* Lomo del almanaque */}
                    <span aria-hidden="true" className="block h-3" style={{ background: P.grano }} />
                    <span className={`block px-3 py-3 font-bold leading-tight ${fuera ? "line-through" : ""} ${L ? "text-[24px]" : "text-[22px]"}`}>{mayuscula(o)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Portada({ final = false, config }: { final?: boolean; config?: Record<string, unknown> }) {
  const m = momentoCR(new Date());
  const fecha = final ? `${mayuscula(DIAS[m.diaSemana])}` : "";
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Corredor
        pistas={(config?.pistasEnEscena as boolean | undefined) ?? true}
        mesesSeca={(config?.mesesSeca as number[] | undefined) ?? [12, 1, 2, 3, 4]}
        hoja={final ? fecha : ""}
        numero={final ? String(new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "numeric" }).format(new Date())) : undefined}
        mes={final ? MESES[m.mes - 1] : undefined}
        arrancar={final}
      />
      <div className="h-6" style={{ background: P.maderaClara, borderTop: `8px solid ${P.madera}` }} />
    </div>
  );
}

// ─── Dibujo ───

function Corredor({ pistas, mesesSeca, hoja, numero, mes, arrancar }: { pistas: boolean; mesesSeca: number[]; hoja: string; numero?: string; mes?: string; arrancar: boolean }) {
  const m = momentoCR(new Date());
  const parte = parteDelDia(m.hora);
  const lluvia = pistas && !mesesSeca.map(Number).includes(m.mes);
  // Sin pistas: una tarde neutra, sin lluvia ni hora.
  const cielo = !pistas ? P.beige : parte === 0 ? P.mostaza : parte === 1 ? P.rosa : P.profundo;
  const minutos = new Date().getMinutes();
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      <svg viewBox="0 0 360 170" preserveAspectRatio="xMidYMax slice" className="block w-full h-[170px] sm:h-[200px]" aria-hidden="true">
        {/* Arcos del corredor con el patio */}
        {[0, 1].map((k) => (
          <g key={k}>
            <path d={`M${18 + k * 100} 150 V58 a40 40 0 0 1 80 0 V150z`} fill={cielo} />
            {parte === 2 && pistas && k === 0 && <circle cx="90" cy="44" r="8" fill={P.cal} />}
            {parte === 0 && pistas && k === 0 && <circle cx="70" cy="62" r="13" fill={P.cal} opacity="0.85" />}
            {/* Patio: cerca, zacate y una mata de plátano */}
            <path d={`M${18 + k * 100} 116 h80 V150 h-80z`} fill={P.serenidad} />
            <path d={`M${18 + k * 100} 120 h80`} stroke={P.maderaOscura} strokeWidth="2" />
            {lluvia &&
              Array.from({ length: 8 }, (_, i) => (
                <path key={i} d={`M${26 + k * 100 + i * 10} ${50 + (i % 3) * 18} l-4 12`} stroke={P.cal} strokeWidth="1.6" opacity="0.8" />
              ))}
          </g>
        ))}
        <path d="M150 150 C146 120 150 104 160 96 M160 96 c-14 -6 -26 -2 -32 6 M160 96 c4 -14 14 -20 26 -20 M160 96 c-6 -16 -18 -22 -28 -20" stroke={P.profundo} strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Columnas */}
        {[12, 112, 212].map((x) => (
          <rect key={x} x={x} y="20" width="12" height="130" fill={P.cal} stroke={P.tierra} strokeOpacity="0.12" />
        ))}
        <rect x="0" y="14" width="360" height="8" fill={P.madera} />
        {/* Zócalo */}
        <rect x="0" y="150" width="360" height="20" fill={P.naranja} />
        {/* Reloj de pared (con pistas marca la hora) */}
        <g transform="translate(316 48)">
          <rect x="-16" y="-4" width="32" height="74" rx="4" fill={P.madera} />
          <circle cx="0" cy="14" r="13" fill={P.cal} />
          {pistas && (
            <>
              <path d={`M0 14 L${7 * Math.sin(((m.hora % 12) / 12) * 2 * Math.PI)} ${14 - 7 * Math.cos(((m.hora % 12) / 12) * 2 * Math.PI)}`} stroke={P.tierra} strokeWidth="2.4" strokeLinecap="round" />
              <path d={`M0 14 L${10 * Math.sin((minutos / 60) * 2 * Math.PI)} ${14 - 10 * Math.cos((minutos / 60) * 2 * Math.PI)}`} stroke={P.tierra} strokeWidth="1.6" strokeLinecap="round" />
            </>
          )}
          <circle cx="0" cy="14" r="1.8" fill={P.tierra} />
          <path d="M0 34 V56" stroke={P.mostaza} strokeWidth="2" />
          <circle cx="0" cy="58" r="5" fill={P.mostaza} />
        </g>
      </svg>
      {/* El almanaque de pared */}
      <div className="absolute right-[64px] top-6 w-[96px] sm:right-[110px]" aria-hidden="true">
        <span className="block h-3 rounded-t-[3px]" style={{ background: P.grano }} />
        <span className="relative block px-1.5 pt-1.5 pb-2 text-center" style={{ background: P.cal, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
          {arrancar && (
            <span className="absolute inset-x-0 -top-1 h-3 motion-safe:animate-[pueblo-arranque_600ms_ease-in_both]" style={{ background: P.cal, borderBottom: `2px dashed ${P.maderaClara}` }} />
          )}
          {mes && <span className="block text-[12px] font-bold" style={{ color: P.grano }}>{mayuscula(mes)}</span>}
          {numero && <span className="block font-rotulo text-[34px] leading-none" style={{ color: P.tierra }}>{numero}</span>}
          <span className={`block font-rotulo leading-tight ${hoja === "?" ? "text-[34px]" : "text-[15px]"} ${arrancar ? "motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]" : ""}`} style={{ color: hoja === "?" ? P.maderaClara : P.tierra }}>
            {hoja}
          </span>
        </span>
      </div>
    </div>
  );
}
