import { useEffect, useRef, useState, type ReactNode } from "react";
import { agregarPalabras, type EjercicioPizarra, type ModoEntrada } from "../../../lib/actividades/pizarra";
import { dictadoDisponible, useDictado } from "../../../lib/voz";
import { usePista, type Control } from "../interactivas/comun";
import { Acciones, Boton } from "../interactivas/ui";
import { P } from "./paleta";
import { sombraCapa } from "./pieza";

// «La pizarra de la escuela» (pizarra). El aula de la escuela rural: la
// pizarra verde con marco de madera, la tiza, el mapa de Costa Rica en la
// pared. Las palabras aparecen escritas con tiza (o, si se dicen en voz
// alta, como marcas de tiza). No hay tiempo, ni número, ni palabras malas.
// Al terminar suena (se mueve) la campana del corredor.

interface Config {
  modoEntrada: ModoEntrada;
  permitirDictado: boolean;
  mostrarEjemplo: boolean;
}

const TIZA = "#F6F1E4";
const PIZARRA = "#2F5A4A";

export function Juego({ ejercicio: ej, config, ctl }: { ejercicio: EjercicioPizarra; config: Config; ctl: Control }) {
  const k = ej.consigna;
  const dictadoOk = config.permitirDictado && dictadoDisponible;
  const [modo, setModo] = useState<ModoEntrada>(config.modoEntrada === "dictado" && !dictadoOk ? "marcas" : config.modoEntrada);
  const [palabras, setPalabras] = useState<string[]>(config.mostrarEjemplo ? [k.ejemplo] : []);
  const [marcas, setMarcas] = useState(0);
  const [escrito, setEscrito] = useState("");
  const [hecho, setHecho] = useState(false);
  const [pista, setPista] = useState(0);
  const L = ctl.large;

  // Dictado: lo reconocido se agrega al terminar cada frase.
  const pendiente = useRef("");
  const { escuchando, alternar } = useDictado((t) => (pendiente.current = t));
  useEffect(() => {
    if (escuchando || !pendiente.current) return;
    const t = pendiente.current;
    pendiente.current = "";
    setPalabras((p) => agregarPalabras(p, t, true));
  }, [escuchando]);

  usePista(ctl.pista, () => {
    ctl.aviso(k.pistas[pista % k.pistas.length]);
    setPista((n) => n + 1);
  });

  function escribir() {
    if (!escrito.trim()) return;
    setPalabras((p) => agregarPalabras(p, escrito));
    setEscrito("");
  }

  function terminar() {
    setHecho(true);
    ctl.listo();
  }

  const modos: { id: ModoEntrada; texto: string }[] = [
    { id: "marcas", texto: "Decirlas en voz alta" },
    { id: "teclado", texto: "Escribirlas" },
    ...(dictadoOk ? [{ id: "dictado" as const, texto: "Dictarlas" }] : []),
  ];

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-[20px]" style={sombraCapa}>
        <Aula campana={hecho}>
          <p className={`m-0 mb-3 font-rotulo leading-tight ${L ? "text-[24px]" : "text-[20px] sm:text-[22px]"}`} style={{ color: TIZA }}>
            {k.texto}
          </p>
          {modo === "marcas" ? (
            <Marcas n={marcas} />
          ) : (
            <ul className="list-none m-0 p-0 flex flex-wrap gap-x-4 gap-y-1" aria-label="Palabras en la pizarra" aria-live="polite">
              {palabras.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => !hecho && setPalabras((x) => x.filter((y) => y !== p))}
                    aria-label={`${p}. Tocá para borrarla`}
                    className={`border-0 bg-transparent p-0 font-serif italic cursor-pointer motion-safe:animate-[pueblo-aparece_320ms_ease-out_both] ${L ? "text-[28px]" : "text-[24px]"}`}
                    style={{ color: TIZA, textShadow: "0 0 1px rgba(246,241,228,0.6)" }}
                  >
                    {p}
                  </button>
                </li>
              ))}
              {palabras.length === 0 && (
                <li className={`italic ${L ? "text-[20px]" : "text-[17px]"}`} style={{ color: `${TIZA}99` }}>
                  La pizarra está esperando…
                </li>
              )}
            </ul>
          )}
        </Aula>
      </div>

      {!hecho && (
        <>
          <p className={`m-0 leading-snug text-tinta ${L ? "text-[24px]" : "text-[21px]"}`}>{k.frase}</p>
          {modos.length > 1 && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cómo anotar las palabras">
              {modos.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={modo === m.id}
                  onClick={() => setModo(m.id)}
                  className={`min-h-11 px-4 rounded-full border-[1.5px] text-[15px] font-semibold cursor-pointer ${modo === m.id ? "border-verde-profundo bg-verde-tenue text-verde-profundo" : "border-borde bg-white text-tinta-suave"}`}
                >
                  {m.texto}
                </button>
              ))}
            </div>
          )}
          {modo === "marcas" && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMarcas((n) => n + 1)}
                className={`min-h-16 px-7 rounded-2xl border-0 font-bold cursor-pointer active:scale-[0.97] transition-transform ${L ? "text-[22px]" : "text-[20px]"}`}
                style={{ background: PIZARRA, color: TIZA, boxShadow: "0 4px 0 #1d3a2f" }}
              >
                Dijo una palabra
              </button>
              {marcas > 0 && (
                <button type="button" onClick={() => setMarcas((n) => n - 1)} className="border-0 bg-transparent p-0 text-[15px] text-tinta-tenue underline decoration-dotted cursor-pointer">
                  Borrar una marca
                </button>
              )}
            </div>
          )}
          {modo === "teclado" && (
            <div className="flex gap-2 min-w-0">
              <input
                size={1}
                value={escrito}
                onChange={(e) => setEscrito(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && escribir()}
                placeholder="Escribí una palabra"
                aria-label="Escribí una palabra"
                autoComplete="off"
                className={`flex-1 min-w-0 min-h-14 rounded-2xl border-[1.5px] border-borde-campo bg-white px-4 text-tinta ${L ? "text-[22px]" : "text-[19px]"}`}
              />
              <button
                type="button"
                onClick={escribir}
                disabled={!escrito.trim()}
                className="min-h-14 px-5 rounded-2xl border-0 font-bold text-[18px] cursor-pointer disabled:opacity-40"
                style={{ background: PIZARRA, color: TIZA }}
              >
                Escribir
              </button>
            </div>
          )}
          {modo === "dictado" && (
            <button
              type="button"
              onClick={() => alternar("")}
              aria-pressed={escuchando}
              className={`justify-self-start min-h-16 px-6 inline-flex items-center gap-3 rounded-2xl border-0 font-bold cursor-pointer ${L ? "text-[22px]" : "text-[20px]"}`}
              style={{ background: escuchando ? P.grano : PIZARRA, color: TIZA }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {escuchando ? "Escuchando… tocá para parar" : "Tocá y decí las palabras"}
            </button>
          )}
          {modo !== "marcas" && palabras.length > 0 && <p className="m-0 text-[15px] text-tinta-tenue">Si una palabra quedó mal escrita, tocala en la pizarra para borrarla.</p>}
        </>
      )}
      {hecho && <p className={`m-0 leading-snug text-tinta ${L ? "text-[24px]" : "text-[21px]"}`}>¡Qué pizarra más llena! Suena la campana.</p>}

      {!hecho && (
        <Acciones ctl={ctl}>
          <Boton onClick={terminar} large={L}>
            Ya terminé
          </Boton>
        </Acciones>
      )}
    </div>
  );
}

export function Portada({ final = false }: { final?: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]" style={sombraCapa} aria-hidden="true">
      <Aula campana={final}>
        {final ? <Marcas n={12} /> : <p className="m-0 font-rotulo text-[20px]" style={{ color: TIZA }}>Frutas</p>}
      </Aula>
    </div>
  );
}

// ─── Piezas ───

// Marcas de tiza en grupos de cinco (cuatro palos y uno cruzado). Sin número.
function Marcas({ n }: { n: number }) {
  const grupos = Math.ceil(n / 5);
  return (
    <div className="flex flex-wrap gap-4 min-h-12" aria-label={n === 0 ? "Todavía sin marcas" : "Marcas de tiza en la pizarra"}>
      {Array.from({ length: grupos }, (_, g) => {
        const enGrupo = Math.min(5, n - g * 5);
        return (
          <svg key={g} viewBox="0 0 54 44" width="54" height="44" aria-hidden="true">
            {Array.from({ length: Math.min(4, enGrupo) }, (_, k) => (
              <path key={k} d={`M${8 + k * 11} 6 L${6 + k * 11} 38`} stroke={TIZA} strokeWidth="3.5" strokeLinecap="round" className="motion-safe:animate-[pueblo-aparece_300ms_ease-out_both]" />
            ))}
            {enGrupo === 5 && <path d="M2 30 L52 12" stroke={TIZA} strokeWidth="3.5" strokeLinecap="round" className="motion-safe:animate-[pueblo-aparece_300ms_ease-out_both]" />}
          </svg>
        );
      })}
      {n === 0 && (
        <span className="italic text-[17px]" style={{ color: `${TIZA}99` }}>
          Cada palabra que diga, una marca de tiza.
        </span>
      )}
    </div>
  );
}

// El aula: pared con el mapa de Costa Rica y la campana del corredor; la
// pizarra (con lo que va adentro) y la repisa de la tiza.
function Aula({ campana, children }: { campana: boolean; children: ReactNode }) {
  return (
    <div className="pueblo-grano px-3 pt-3 pb-4 sm:px-5" style={{ backgroundColor: P.mostaza }}>
      <div className="flex items-end justify-between gap-3 mb-2.5 px-1">
        {/* El mapa de Costa Rica, simplificado */}
        <svg viewBox="0 0 120 70" className="w-[96px] sm:w-[120px] h-auto" aria-hidden="true">
          <rect x="2" y="2" width="116" height="66" rx="3" fill={P.cal} stroke={P.madera} strokeWidth="3" />
          <path
            d="M14 18 C24 14 34 18 42 16 C52 14 60 20 70 24 C80 28 88 26 98 34 C104 40 104 48 98 52 C90 50 84 56 76 54 C68 52 62 46 56 50 C50 54 44 50 38 44 C32 38 22 42 18 34 C14 28 10 24 14 18z"
            fill={P.serenidad}
            stroke={P.profundo}
            strokeWidth="1.5"
          />
          <circle cx="60" cy="34" r="2.5" fill={P.grano} />
        </svg>
        {/* La campana del corredor */}
        <svg viewBox="0 0 40 50" className="w-9 h-auto" aria-hidden="true">
          <path d="M20 2 v6" stroke={P.tierra} strokeWidth="2" />
          <g style={{ transformOrigin: "20px 8px" }} className={campana ? "motion-safe:animate-[pueblo-campana_1.1s_ease-in-out_3]" : ""}>
            <path d="M8 34 c0 -16 4 -24 12 -24 s12 8 12 24z" fill={P.naranja} stroke={P.tierra} strokeWidth="1.5" />
            <rect x="6" y="33" width="28" height="4" rx="2" fill={P.tierra} />
            <circle cx="20" cy="40" r="3" fill={P.tierra} />
          </g>
        </svg>
      </div>
      <div className="rounded-[6px] p-2" style={{ background: P.madera, boxShadow: "0 4px 0 rgba(51,36,28,0.35)" }}>
        <div className="relative rounded-[3px] px-4 py-4 min-h-[160px]" style={{ background: PIZARRA, backgroundImage: "radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.07), transparent 60%)" }}>
          {children}
        </div>
        <div className="mt-2 h-2.5 rounded-sm relative" style={{ background: P.maderaOscura }}>
          <span className="absolute left-6 -top-1.5 w-10 h-2 rounded-full" style={{ background: TIZA }} />
          <span className="absolute left-20 -top-1.5 w-6 h-2 rounded-full" style={{ background: P.mostaza }} />
        </div>
      </div>
    </div>
  );
}
