import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  cajaCorrecta,
  estadoInicial,
  normalizarConfig,
  reducirJuego,
  simboloRegla,
  type Accion,
  type ConfigClasificar,
  type EstadoJuego,
  type ExtrasClasificar,
} from "../../lib/clasificarNumeros";
import { detenerVoz, lecturaDisponible, leerEnVoz } from "../../lib/voz";
import { Modal } from "../ui/Modal";

// Juego «Clasificar números por valor» (extras.modo = "clasificar").
// Pensado para personas mayores: se juega tocando un número y después la
// caja (el arrastre queda como alternativa en computadora), tarjetas
// grandes, etiquetas en palabras, errores sin castigo (borde mostaza y un
// texto amable) y sin puntajes. La lógica está en lib/clasificarNumeros.ts.

const ESPERA_ERROR = 2000;
const ESPERA_RONDA = 1300;

export function ClasificarNumeros({ extras, size = "compact" }: { extras: ExtrasClasificar; size?: "compact" | "large" }) {
  const config = useMemo(() => normalizarConfig(extras), [extras]);
  const [estado, despachar] = useReducer((e: EstadoJuego, a: Accion) => reducirJuego(e, a, config), config, (c) => estadoInicial(c));
  const [ayuda, setAyuda] = useState(false);
  const large = size === "large";

  // Error: la tarjeta queda un momento en la caja y después vuelve sola.
  useEffect(() => {
    if (!estado.error) return;
    const t = window.setTimeout(() => despachar({ tipo: "devolver" }), ESPERA_ERROR);
    return () => window.clearTimeout(t);
  }, [estado.error]);
  // Fin de ronda: un momento para verla completa y pasa a la siguiente.
  useEffect(() => {
    if (!estado.rondaTerminada || estado.fase !== "juego") return;
    const t = window.setTimeout(() => despachar({ tipo: "siguiente" }), ESPERA_RONDA);
    return () => window.clearTimeout(t);
  }, [estado.rondaTerminada, estado.fase]);
  useEffect(() => () => detenerVoz(), []);

  return (
    <section aria-label={config.titulo} className="rounded-[26px] bg-white border border-borde p-4 sm:p-6">
      {estado.fase === "inicio" && <Inicio config={config} large={large} onEmpezar={() => despachar({ tipo: "empezar" })} />}
      {(estado.fase === "juego" || estado.fase === "pausa") && (
        <Juego config={config} estado={estado} despachar={despachar} large={large} onAyuda={() => setAyuda(true)} />
      )}
      {estado.fase === "fin" && <Fin large={large} onOtraVez={() => despachar({ tipo: "reiniciar" })} />}

      {estado.fase === "pausa" && (
        <div role="dialog" aria-modal="true" aria-labelledby="pausa-titulo" className="fixed inset-0 z-40 bg-tinta/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-[26px] bg-white p-7 text-center shadow-elevada">
            <p id="pausa-titulo" className="m-0 font-serif text-[28px] leading-tight text-tinta">
              Pausaste la actividad
            </p>
            <p className="m-0 mt-2 text-[16px] text-tinta-suave">Todo queda como estaba. Seguí cuando quieras.</p>
            <button
              type="button"
              autoFocus
              onClick={() => despachar({ tipo: "continuar" })}
              className="mt-6 w-full min-h-14 rounded-full border-0 bg-verde-profundo text-white text-[18px] font-semibold cursor-pointer hover:bg-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {ayuda && (
        <Modal onClose={() => setAyuda(false)}>
          <h2 className="m-0 mb-2 pr-10 font-serif font-normal text-[26px] text-tinta">{config.titulo}</h2>
          <p className="m-0 mb-4 text-[17px] leading-relaxed text-tinta">{config.consigna}</p>
          <BotonEscuchar texto={textoConsigna(config)} />
          <div className="mt-5">
            <Ejemplo config={config} />
          </div>
        </Modal>
      )}
    </section>
  );
}

// Consigna completa para leer en voz alta.
const textoConsigna = (c: ConfigClasificar) => `${c.consigna} Tocá un número y después la caja donde va: ${c.cajas.map((x) => x.etiqueta).join(", o ")}.`;

const etiquetaCaja = (c: ConfigClasificar["cajas"][number]) => {
  const s = simboloRegla(c.regla);
  return s ? `${c.etiqueta} (${s})` : c.etiqueta;
};

export function BotonEscuchar({ texto }: { texto: string }) {
  const [leyendo, setLeyendo] = useState(false);
  if (!lecturaDisponible) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (leyendo) {
          detenerVoz();
          setLeyendo(false);
        } else {
          setLeyendo(true);
          leerEnVoz(texto, () => setLeyendo(false));
        }
      }}
      className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border-[1.5px] border-verde-serenidad/60 bg-verde-tenue text-verde-profundo text-[15px] font-semibold cursor-pointer hover:bg-[#e6f0f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
      </svg>
      {leyendo ? "Detener" : "Escuchar la consigna"}
    </button>
  );
}

function Inicio({ config, large, onEmpezar }: { config: ConfigClasificar; large: boolean; onEmpezar: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <h3 className={`m-0 font-serif font-normal leading-tight text-tinta ${large ? "text-[30px]" : "text-[26px]"}`}>{config.titulo}</h3>
      <p className={`m-0 text-tinta ${large ? "text-[20px]" : "text-[17px]"}`}>{config.consigna}</p>
      <BotonEscuchar texto={textoConsigna(config)} />
      {config.mostrarEjemplo && (
        <div className="w-full max-w-md">
          <Ejemplo config={config} />
        </div>
      )}
      <button
        type="button"
        onClick={onEmpezar}
        className={`w-full max-w-xs rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
          large ? "min-h-16 text-[21px]" : "min-h-14 text-[18px]"
        }`}
      >
        Empezar
      </button>
    </div>
  );
}

// Miniatura del juego con un número de cada caja ya ubicado.
function Ejemplo({ config }: { config: ConfigClasificar }) {
  const muestra = config.cajas.map((_, i) => {
    for (let n = config.rango.min; n <= config.rango.max; n++) if (n !== config.referencia && cajaCorrecta(n, config) === i && (n * 7) % 3 === 0) return n;
    return null;
  });
  return (
    <figure className="m-0 rounded-2xl bg-campo border border-borde-suave p-3">
      <figcaption className="m-0 mb-2 text-[13px] font-semibold text-tinta-suave text-left">Ejemplo</figcaption>
      <div className="grid grid-cols-2 gap-2" aria-hidden="true">
        {config.cajas.slice(0, 2).map((c, i) => (
          <div key={c.etiqueta} className="rounded-xl overflow-hidden bg-white border border-borde">
            <p className="m-0 px-2 py-1.5 bg-verde-profundo text-white text-[12.5px] font-semibold">{etiquetaCaja(c)}</p>
            <div className="p-2 min-h-[44px]">
              {muestra[i] !== null && (
                <span className="relative inline-flex items-center justify-center min-w-11 h-9 px-2 rounded-lg border-2 border-semaforo-verde-texto bg-white text-[18px] font-semibold text-tinta">
                  {muestra[i]}
                  <Check chico />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {muestra[0] !== null && (
        <p className="m-0 mt-2 text-[14px] text-tinta-suave text-left">
          El {muestra[0]} va en «{config.cajas[0].etiqueta}».
        </p>
      )}
    </figure>
  );
}

function Check({ chico = false }: { chico?: boolean }) {
  return (
    <span aria-hidden="true" className={`absolute -top-2 -right-2 rounded-full bg-semaforo-verde-texto text-white flex items-center justify-center ${chico ? "w-4 h-4" : "w-5 h-5"}`}>
      <svg width={chico ? 9 : 11} height={chico ? 9 : 11} viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Juego({
  config,
  estado,
  despachar,
  large,
  onAyuda,
}: {
  config: ConfigClasificar;
  estado: EstadoJuego;
  despachar: (a: Accion) => void;
  large: boolean;
  onAyuda: () => void;
}) {
  const [encima, setEncima] = useState<number | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const previo = useRef(estado);

  // Lo que pasó, en palabras (también para lectores de pantalla).
  useEffect(() => {
    const antes = previo.current;
    previo.current = estado;
    if (estado.error && !antes.error) {
      const n = estado.numeros[estado.error.tarjeta];
      const otra = config.cajas.find((_, i) => i !== estado.error!.caja);
      setAnuncio(
        config.cajas.every((c) => c.regla === "menor" || c.regla === "mayor")
          ? `Mirá de nuevo: ¿el ${n} es mayor o menor que ${config.referencia}?`
          : `Mirá de nuevo: ¿el ${n} va en «${otra?.etiqueta ?? ""}»?`,
      );
      return;
    }
    const nuevos = Object.keys(estado.clasificados).filter((k) => antes.clasificados[Number(k)] === undefined);
    if (nuevos.length && antes.ronda === estado.ronda) {
      const t = Number(nuevos[0]);
      setAnuncio(`${estado.numeros[t]} va en ${config.cajas[estado.clasificados[t]].etiqueta.toLowerCase()}, correcto.`);
      return;
    }
    if (estado.ronda !== antes.ronda) setAnuncio(`Ronda ${estado.ronda + 1} de ${config.rondas}.`);
  }, [estado, config]);

  const seleccion = estado.seleccion;
  const completa = estado.rondaTerminada;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape") despachar({ tipo: "cancelar" });
      }}
      className="grid gap-3.5"
    >
      {/* Tarjetas: 4 columnas, 2 filas */}
      <ul className="list-none m-0 p-0 grid grid-cols-4 gap-2 sm:gap-2.5" aria-label="Números para clasificar">
        {estado.numeros.map((n, i) => {
          const ya = estado.clasificados[i] !== undefined;
          const enError = estado.error?.tarjeta === i;
          const elegida = seleccion === i;
          return (
            <li key={`${estado.ronda}-${i}`}>
              <button
                type="button"
                draggable={!ya && !estado.error}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(i));
                  despachar({ tipo: "seleccionar", tarjeta: i });
                }}
                onClick={() => despachar({ tipo: "seleccionar", tarjeta: i })}
                disabled={ya || enError || completa}
                aria-pressed={elegida}
                aria-label={ya ? `Número ${n}, ya clasificado` : `Número ${n}`}
                className={`w-full min-h-16 rounded-2xl border font-sans font-semibold leading-none cursor-pointer transition-[transform,box-shadow,background-color] motion-reduce:transition-none ${
                  large ? "text-[34px] min-h-[76px]" : "text-[30px]"
                } ${
                  ya || enError
                    ? "bg-campo border-borde-suave text-tinta/30 cursor-default"
                    : elegida
                      ? "bg-white border-[3px] border-verde-profundo text-tinta shadow-elevada motion-safe:-translate-y-1 motion-safe:scale-[1.04]"
                      : "bg-white border-borde-campo text-tinta hover:border-verde-serenidad"
                } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo`}
              >
                <span className={enError ? "invisible" : ""}>{n}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Lo que pasó / qué hacer */}
      <p
        aria-live="polite"
        className={`m-0 min-h-11 flex items-center rounded-xl px-3.5 py-2 ${large ? "text-[18px]" : "text-[15.5px]"} ${
          estado.error ? "bg-aviso text-aviso-texto font-semibold" : completa ? "bg-[#e3efe3] text-semaforo-verde-texto font-semibold" : "text-tinta-suave"
        }`}
      >
        {estado.error ? anuncio : completa ? "¡Ronda completa!" : seleccion !== null ? `Elegiste el ${estado.numeros[seleccion]}. Ahora tocá la caja donde va.` : "Tocá un número y después la caja donde va."}
      </p>
      <span className="sr-only" aria-live="polite">
        {!estado.error ? anuncio : ""}
      </span>

      {/* Cajas */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {config.cajas.map((c, k) => {
          const dentro = estado.numeros.map((n, i) => ({ n, i })).filter(({ i }) => estado.clasificados[i] === k);
          const errorAca = estado.error?.caja === k ? estado.numeros[estado.error.tarjeta] : null;
          const activa = seleccion !== null || encima === k;
          return (
            <button
              key={c.etiqueta}
              type="button"
              onClick={() => seleccion !== null && despachar({ tipo: "soltar", caja: k })}
              onDragOver={(e) => {
                e.preventDefault();
                setEncima(k);
              }}
              onDragLeave={() => setEncima(null)}
              onDrop={(e) => {
                e.preventDefault();
                setEncima(null);
                const t = Number(e.dataTransfer.getData("text/plain"));
                if (Number.isFinite(t)) despachar({ tipo: "soltar", caja: k, tarjeta: t });
              }}
              aria-label={`Caja: ${c.etiqueta.toLowerCase()}, tiene ${dentro.length} ${dentro.length === 1 ? "número" : "números"}${seleccion !== null ? ". Tocá para poner el número acá" : ""}`}
              className="text-left rounded-2xl overflow-hidden bg-white border border-borde p-0 cursor-pointer font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
            >
              <span className={`block px-3 py-2.5 bg-verde-profundo text-white font-semibold leading-tight ${large ? "text-[17px]" : "text-[14.5px]"}`}>{etiquetaCaja(c)}</span>
              <span
                className={`relative flex flex-wrap content-start gap-2 p-2.5 min-h-[124px] m-1.5 rounded-xl border-2 transition-colors motion-reduce:transition-none ${
                  encima === k ? "bg-verde-tenue border-verde-serenidad" : activa ? "border-dashed border-verde-serenidad/70" : "border-transparent"
                }`}
              >
                {dentro.map(({ n, i }) => (
                  <span
                    key={i}
                    className={`relative inline-flex items-center justify-center min-w-12 h-12 px-2.5 rounded-xl border-2 border-semaforo-verde-texto bg-white font-semibold text-tinta motion-safe:animate-[clara-entra_300ms_ease-out] ${large ? "text-[24px]" : "text-[21px]"}`}
                  >
                    {n}
                    <Check />
                  </span>
                ))}
                {errorAca !== null && (
                  <span className={`inline-flex items-center justify-center min-w-12 h-12 px-2.5 rounded-xl border-2 border-mostaza-vital bg-aviso font-semibold text-tinta ${large ? "text-[24px]" : "text-[21px]"}`}>
                    {errorAca}
                  </span>
                )}
                {activa && dentro.length === 0 && errorAca === null && (
                  <span className={`m-auto text-verde-profundo font-semibold ${large ? "text-[17px]" : "text-[15px]"}`}>Tocá aquí</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra inferior */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <p className={`m-0 font-semibold text-tinta ${large ? "text-[18px]" : "text-[15px]"}`}>
          Ronda {estado.ronda + 1} de {config.rondas}
        </p>
        <div className="flex items-center gap-1.5">
          <BotonBarra etiqueta="Ver el ejemplo y la consigna" onClick={onAyuda}>
            <span aria-hidden="true" className="font-serif text-[20px] leading-none">
              ?
            </span>
          </BotonBarra>
          <BotonBarra etiqueta="Pausar la actividad" onClick={() => despachar({ tipo: "pausar" })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
            <span className="hidden sm:inline text-[14px] font-semibold">Pausa</span>
          </BotonBarra>
          <BotonBarra etiqueta="Saltar a la siguiente ronda" onClick={() => despachar({ tipo: "saltar" })} disabled={completa}>
            <span className="text-[14px] font-semibold">Saltar</span>
            <span aria-hidden="true">›</span>
          </BotonBarra>
        </div>
      </div>
    </div>
  );
}

function BotonBarra({ etiqueta, onClick, disabled, children }: { etiqueta: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      className="inline-flex items-center justify-center gap-1.5 min-w-11 min-h-11 px-3 rounded-full border-[1.5px] border-borde bg-white text-verde-profundo cursor-pointer hover:border-verde-serenidad disabled:opacity-50 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
    >
      {children}
    </button>
  );
}

function Fin({ large, onOtraVez }: { large: boolean; onOtraVez: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
      <span aria-hidden="true" className="w-16 h-16 rounded-full bg-[#e3efe3] text-semaforo-verde-texto flex items-center justify-center">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </span>
      <p className={`m-0 font-serif text-tinta leading-tight ${large ? "text-[30px]" : "text-[26px]"}`}>¡Muy bien!</p>
      <p className={`m-0 text-tinta-suave ${large ? "text-[20px]" : "text-[17px]"}`}>Clasificaste todos los números.</p>
      <button
        type="button"
        onClick={onOtraVez}
        className={`mt-2 w-full max-w-xs rounded-full border-[1.5px] border-verde-serenidad bg-white text-verde-profundo font-semibold cursor-pointer hover:bg-verde-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
          large ? "min-h-16 text-[20px]" : "min-h-13 text-[17px]"
        }`}
      >
        Jugar de nuevo
      </button>
    </div>
  );
}
