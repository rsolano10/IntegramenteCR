import { useState, type ReactNode } from "react";
import { esSiguienteValida, siguienteCorrecta, type EjercicioOrdenar } from "../../../lib/actividades/ordenar";
import { usePista, type Control } from "../interactivas/comun";
import { P } from "./paleta";
import { clasePieza, estiloPieza, sombraCapa } from "./pieza";

// «El café de la tarde» (ordenar-pasos). La cocina de la casa en la tarde:
// pared encalada con zócalo verde, ventana con cielo rosado y, sobre la mesa
// de madera, el objeto de la rutina (el chorreador, la mesa puesta, la
// pila…). Los pasos son tarjetas de papel que se van numerando con pintura.
// Al completar, la escena responde: el café gotea y sube el vapor.

export function Juego({ ejercicio: ej, ctl }: { ejercicio: EjercicioOrdenar; ctl: Control }) {
  const [colocadas, setColocadas] = useState<number[]>([]);
  const [devuelta, setDevuelta] = useState<number | null>(null);
  const [marcada, setMarcada] = useState<number | null>(null);
  const L = ctl.large;
  const porId = (id: number) => ej.tarjetas.find((t) => t.id === id)!;
  const faltan = ej.tarjetas.filter((t) => !colocadas.includes(t.id));
  const listo = faltan.length === 0;

  usePista(ctl.pista, () => {
    const id = siguienteCorrecta(ej, colocadas);
    setMarcada(id);
    if (id !== null) ctl.aviso("El paso marcado es el que sigue.");
  });

  function tocar(id: number) {
    setMarcada(null);
    if (!esSiguienteValida(ej, colocadas, id)) {
      setDevuelta(id);
      return ctl.reintento("Ese paso viene más adelante. Probemos otra vez.");
    }
    const sig = [...colocadas, id];
    setColocadas(sig);
    setDevuelta(null);
    if (sig.length === ej.tarjetas.length) ctl.listo();
    else ctl.acierto();
  }

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Cocina titulo={ej.titulo ?? ""} listo={listo} />
        {/* Mesa de madera: la receta que se arma y los pasos sueltos */}
        <div className="relative px-3 pt-4 pb-4 sm:px-5" style={{ background: `repeating-linear-gradient(180deg, ${P.maderaClara} 0 26px, #CF9A5E 26px 27px)`, borderTop: `8px solid ${P.madera}` }}>
          <div className="mx-auto max-w-[560px] grid gap-3">
            {colocadas.length > 0 && (
              <ol className="list-none m-0 p-0 grid gap-2" aria-label="Pasos en orden">
                {colocadas.map((id, k) => (
                  <li key={id} className="motion-safe:animate-[pueblo-asentar_320ms_ease-out]">
                    <Tarjeta numero={k + 1} large={L}>
                      <span className="sr-only">Paso {k + 1}: </span>
                      {porId(id).texto}
                    </Tarjeta>
                  </li>
                ))}
              </ol>
            )}
            {faltan.length > 0 && (
              <ul className={`list-none m-0 p-0 grid gap-3 ${colocadas.length ? "pt-3 border-t-2 border-dashed" : ""}`} style={{ borderColor: "rgba(94,59,34,0.35)" }} aria-label="Pasos por ordenar">
                {faltan.map((t) => {
                  const est = estiloPieza(marcada === t.id ? "pista" : devuelta === t.id ? "regreso" : "reposo");
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => tocar(t.id)}
                        aria-label={`${t.texto}${marcada === t.id ? ". Es el que sigue" : ""}`}
                        className={`${clasePieza} ${est.className} w-full text-left rounded-[6px] px-4 py-3 min-h-14 ${L ? "text-[22px]" : "text-[20px]"}`}
                        style={{ ...est.style, background: P.cal, color: P.tierra, transform: `rotate(${t.id % 2 ? 0.6 : -0.6}deg)` }}
                      >
                        {t.texto}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      <p className={`m-0 leading-snug text-tinta ${L ? "text-[26px]" : "text-[24px]"}`}>
        {listo ? "¡Todo en orden!" : colocadas.length === 0 ? "¿Qué se hace primero?" : "¿Y después?"}
      </p>
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Cocina titulo="" listo={final} grande cafe />
      <div className="h-6" style={{ background: P.maderaClara, borderTop: `8px solid ${P.madera}` }} />
    </div>
  );
}

// ─── Dibujo ───

function Tarjeta({ numero, children, large }: { numero: number; children: ReactNode; large: boolean }) {
  return (
    <span className={`flex items-start gap-3 rounded-[6px] px-3 py-2.5 ${large ? "text-[22px]" : "text-[20px]"}`} style={{ background: P.cal, color: P.tierra, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
      <span aria-hidden="true" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-rotulo text-[19px]" style={{ background: P.naranja, color: P.cal }}>
        {numero}
      </span>
      <span className="pt-0.5">{children}</span>
    </span>
  );
}

// Pared, ventana con la tarde y el objeto central de la rutina.
function Cocina({ titulo, listo, grande = false, cafe = false }: { titulo: string; listo: boolean; grande?: boolean; cafe?: boolean }) {
  return (
    <div className="relative pueblo-grano" style={{ backgroundColor: P.cal }}>
      {/* Zócalo de lado a lado (la pared crece a lo ancho) */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[32.5%]" style={{ background: P.serenidad, borderTop: `5px solid ${P.profundo}` }} />
      <svg viewBox="0 0 360 160" className={`relative block mx-auto w-full max-w-[520px] h-auto ${grande ? "min-h-[150px]" : ""}`} aria-hidden="true">
        {/* Ventana con la tarde */}
        <rect x="24" y="18" width="84" height="70" rx="3" fill={P.madera} />
        <rect x="30" y="24" width="72" height="58" fill={P.rosa} />
        <rect x="30" y="56" width="72" height="26" fill={P.mostaza} opacity="0.5" />
        <path d="M30 70 C50 58 70 62 102 66 V82 H30z" fill={P.profundo} />
        <rect x="64" y="24" width="4" height="58" fill={P.madera} />
        <rect x="30" y="51" width="72" height="4" fill={P.madera} />
        <rect x="20" y="86" width="92" height="6" fill={P.maderaOscura} />
        {/* Repisa con jarros de peltre */}
        <rect x="126" y="40" width="100" height="5" fill={P.madera} />
        {[138, 168, 198].map((x, i) => (
          <g key={x}>
            <path d={`M${x} 18 h18 v20 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4z`} fill={i === 1 ? P.grano : P.cal} stroke={P.tierra} strokeOpacity="0.4" />
            <path d={`M${x + 18} 23 a6 6 0 0 1 0 12`} stroke={i === 1 ? P.grano : P.cal} strokeWidth="3" fill="none" />
            <rect x={x} y="18" width="18" height="3" fill={P.profundo} />
          </g>
        ))}
      </svg>
      {/* La rutina, en una nota prensada en la pared */}
      {titulo && (
        <p className="absolute right-3 top-3 m-0 max-w-[48%] sm:right-[12%] px-3 py-1.5 rotate-1 rounded-[2px] font-rotulo text-[17px] leading-tight text-center" style={{ background: P.cal, color: P.tierra, boxShadow: "0 3px 0 rgba(51,36,28,0.3)" }}>
          <span aria-hidden="true" className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full" style={{ background: P.grano }} />
          {titulo}
        </p>
      )}
      {/* Objeto central, sobre la mesa */}
      <div className="absolute right-[18%] bottom-0 sm:right-[30%]">
        <ObjetoRutina titulo={cafe ? "café" : titulo} listo={listo} />
      </div>
    </div>
  );
}

function ObjetoRutina({ titulo, listo }: { titulo: string; listo: boolean }) {
  const t = titulo.toLowerCase();
  if (t.includes("café")) return <Chorreador listo={listo} />;
  const listoSello = listo && (
    <span className="absolute -top-3 -right-4 rounded-[4px] px-2 py-0.5 font-rotulo text-[15px] -rotate-6 motion-safe:animate-[pueblo-aparece_380ms_ease-out_both]" style={{ ["--giro" as string]: "-6deg", background: P.naranja, color: P.cal }}>
      ¡Listo!
    </span>
  );
  let dibujo: ReactNode;
  if (t.includes("mesa"))
    dibujo = (
      <svg viewBox="0 0 90 60" width="110" height="74">
        <ellipse cx="45" cy="44" rx="36" ry="10" fill={P.cal} stroke={P.tierra} strokeOpacity="0.3" />
        <ellipse cx="45" cy="42" rx="22" ry="6" fill={P.naranja} />
        <rect x="6" y="34" width="3" height="20" rx="1.5" fill={P.tierra} />
        <rect x="80" y="34" width="3" height="20" rx="1.5" fill={P.tierra} />
        <path d="M70 20 h10 l-2 22 h-6z" fill={P.serenidad} />
      </svg>
    );
  else if (t.includes("manos") || t.includes("dientes"))
    dibujo = (
      <svg viewBox="0 0 90 70" width="110" height="86">
        <path d="M30 10 v12 h6" stroke={P.tierra} strokeWidth="4" fill="none" />
        <rect x="6" y="36" width="78" height="30" rx="4" fill={P.cal} stroke={P.tierra} strokeOpacity="0.3" />
        <rect x="12" y="40" width="66" height="10" rx="5" fill={P.serenidad} />
        <rect x="62" y="24" width="14" height="12" rx="3" fill={t.includes("dientes") ? P.naranja : P.mostaza} />
        {t.includes("dientes") && <rect x="66" y="8" width="4" height="18" fill={P.profundo} />}
      </svg>
    );
  else if (t.includes("cama"))
    dibujo = (
      <svg viewBox="0 0 100 60" width="120" height="72">
        <rect x="4" y="14" width="10" height="44" fill={P.madera} />
        <rect x="10" y="30" width="86" height="18" rx="3" fill={P.guaria} />
        <rect x="16" y="22" width="22" height="10" rx="4" fill={P.cal} />
        <rect x="10" y="46" width="86" height="5" fill={P.madera} />
      </svg>
    );
  else if (t.includes("pinto"))
    dibujo = (
      <svg viewBox="0 0 100 60" width="120" height="72">
        <ellipse cx="44" cy="40" rx="34" ry="12" fill={P.tierra} />
        <ellipse cx="44" cy="37" rx="30" ry="9" fill={P.maderaClara} />
        {[30, 40, 50, 58, 36, 46].map((x, i) => (
          <circle key={i} cx={x} cy={34 + (i % 2) * 4} r="2.4" fill={P.tierra} />
        ))}
        <rect x="76" y="34" width="22" height="5" rx="2.5" fill={P.tierra} />
      </svg>
    );
  else if (t.includes("salir"))
    dibujo = (
      <svg viewBox="0 0 70 90" width="78" height="100">
        <rect x="8" y="6" width="54" height="84" rx="3" fill={P.madera} />
        <rect x="14" y="12" width="42" height="34" fill={P.maderaOscura} opacity="0.4" />
        <circle cx="52" cy="54" r="4" fill={P.mostaza} />
      </svg>
    );
  else
    dibujo = (
      <svg viewBox="0 0 50 80" width="60" height="96">
        <rect x="6" y="4" width="38" height="72" rx="7" fill={P.tierra} />
        <rect x="10" y="12" width="30" height="52" rx="2" fill={P.serenidad} />
        <rect x="14" y="20" width="18" height="6" rx="3" fill={P.cal} />
        <rect x="18" y="32" width="18" height="6" rx="3" fill={P.mostaza} />
      </svg>
    );
  return (
    <div className="relative" aria-hidden="true">
      {dibujo}
      {listoSello}
    </div>
  );
}

// El chorreador de madera con su bolsita y el jarro. Listo: gotea y sube el vapor.
function Chorreador({ listo }: { listo: boolean }) {
  return (
    <svg viewBox="0 0 100 120" width="104" height="124" aria-hidden="true" className="block">
      {/* Vapor (lento, solo con movimiento permitido) */}
      {listo && (
        <g fill="none" stroke={P.cal} strokeWidth="3" strokeLinecap="round" opacity="0.95">
          <path d="M40 66 c-6 -8 6 -12 0 -20" className="motion-safe:animate-[pueblo-vapor_2.8s_ease-in-out_infinite]" />
          <path d="M54 66 c-6 -8 6 -12 0 -20" className="motion-safe:animate-[pueblo-vapor_2.8s_ease-in-out_0.9s_infinite]" />
        </g>
      )}
      {/* Patas y tabla del chorreador */}
      <rect x="14" y="10" width="7" height="104" fill={P.madera} />
      <rect x="79" y="10" width="7" height="104" fill={P.madera} />
      <rect x="10" y="20" width="80" height="9" rx="2" fill={P.maderaOscura} />
      {/* Bolsita de tela */}
      <path d="M30 22 h40 c-2 24 -12 38 -20 42 c-8 -4 -18 -18 -20 -42z" fill={P.cal} stroke={P.tierra} strokeOpacity="0.35" />
      <path d="M36 28 h28 c-2 14 -8 22 -14 25 c-6 -3 -12 -11 -14 -25z" fill={P.maderaOscura} opacity="0.8" />
      {/* Gotas */}
      {listo &&
        [0, 0.6, 1.2].map((d) => (
          <circle key={d} cx="50" cy="70" r="2.4" fill={P.maderaOscura} className="motion-safe:animate-[pueblo-gota_1.8s_ease-in_infinite]" style={{ animationDelay: `${d}s` }} />
        ))}
      {/* Jarro de peltre */}
      <path d="M30 82 h40 v26 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6z" fill={P.grano} />
      <rect x="30" y="82" width="40" height="5" fill={P.cal} />
      <path d="M70 88 a9 9 0 0 1 0 18" stroke={P.grano} strokeWidth="5" fill="none" />
      <rect x="6" y="113" width="88" height="5" rx="2" fill={P.tierra} opacity="0.3" />
    </svg>
  );
}
