import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Escena } from "../../lib/sesiones";
import {
  COLORES,
  GIROS,
  MIRADAS,
  cambioAlAzar,
  girar,
  giroAlAzar,
  mesaDespues,
  secuenciaAlAzar,
  siguienteMano,
  type Cambio,
  type ColorId,
  type Giro,
  type Mano,
  type ModoManos,
} from "../../lib/sesiones/ger";
import { Icono } from "./Icono";
import { Marca, Nota, Pie, Titulo } from "./comun";
import { useSesion, useTam } from "./contexto";

// Escenas interactivas de gerontogimnasia 11 a 30: retos de doble tarea,
// secuencias de colores, orientación, memoria de objetos y reacción. El
// teléfono acompaña el movimiento: muestra lo justo, lleva la cuenta y
// decide al azar (giros, cambios, manos) para que el acompañante no tenga
// que inventar.

type De<T extends Escena["tipo"]> = Extract<Escena, { tipo: T }>;

// ─── Piezas ───

function Boton({ children, onClick, tono = "suave", disabled = false, className = "" }: { children: ReactNode; onClick: () => void; tono?: "principal" | "suave" | "claro"; disabled?: boolean; className?: string }) {
  const t = useTam();
  const estilo =
    tono === "principal"
      ? "border-0 bg-verde-profundo text-white hover:bg-tinta"
      : tono === "claro"
        ? "border-[1.5px] border-verde-profundo bg-verde-tenue text-verde-profundo"
        : "border-[1.5px] border-borde bg-white text-tinta hover:border-verde-serenidad";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${estilo} ${t.chico} ${className}`}
    >
      {children}
    </button>
  );
}

// Puntos de avance (series, cambios, rondas).
function Puntos({ hechos, total, etiqueta }: { hechos: number; total: number; etiqueta: string }) {
  const { tema } = useSesion();
  return (
    <span className="inline-flex gap-1.5" aria-label={etiqueta}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="w-3 h-3 rounded-full transition-colors" style={{ background: i < hechos ? tema.fuerte : "#e4dfc7" }} />
      ))}
    </span>
  );
}

function Disco({ color, tam = 64, oculto = false, hecho = false, numero, onClick, activo = false }: { color: ColorId; tam?: number; oculto?: boolean; hecho?: boolean; numero?: number; onClick?: () => void; activo?: boolean }) {
  const c = COLORES[color];
  const contenido = (
    <>
      <span
        className={`relative rounded-full flex items-center justify-center shadow-[inset_0_-6px_12px_rgba(0,0,0,0.18)] transition-transform ${activo ? "ring-4 ring-offset-2 ring-tinta/70 scale-105" : ""}`}
        style={{ width: tam, height: tam, background: oculto ? "#d8d3c2" : c.hex }}
      >
        {oculto ? (
          <span className="font-serif text-[28px] text-white">?</span>
        ) : hecho ? (
          <Marca className="w-9 h-9 [&_svg]:w-4 [&_svg]:h-4" />
        ) : numero !== undefined ? (
          <span className="font-serif text-[24px] text-white drop-shadow">{numero}</span>
        ) : null}
      </span>
      <span className="mt-1.5 text-[13.5px] font-semibold text-tinta">{oculto ? "?" : c.nombre}</span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={oculto ? "Color tapado" : c.nombre} className="flex flex-col items-center border-0 bg-transparent p-0 cursor-pointer">
      {contenido}
    </button>
  ) : (
    <span className="flex flex-col items-center">{contenido}</span>
  );
}

// Cuenta regresiva corta (observar, esperar).
function useCuenta(segundos: number, activa: boolean) {
  const [quedan, setQuedan] = useState(segundos);
  useEffect(() => setQuedan(segundos), [segundos, activa]);
  useEffect(() => {
    if (!activa || quedan <= 0) return;
    const id = setTimeout(() => setQuedan((q) => q - 1), 1000);
    return () => clearTimeout(id);
  }, [activa, quedan]);
  return quedan;
}

// Descanso entre series, dentro de la misma pantalla.
export function DescansoEntre({ segundos, siguiente, onSeguir }: { segundos: number; siguiente: string; onSeguir: () => void }) {
  const { tema } = useSesion();
  const t = useTam();
  const quedan = useCuenta(segundos, true);
  return (
    <div className="ses-sube mt-5 w-full max-w-sm rounded-[24px] bg-white border border-borde px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-3">
      <span className="relative shrink-0 w-16 h-16 flex items-center justify-center">
        <span className={`absolute inset-0 rounded-full opacity-40 ${quedan > 0 ? "ses-respira" : ""}`} style={{ background: tema.claro }} aria-hidden="true" />
        <span className="relative font-serif text-[22px] text-tinta">{quedan > 0 ? quedan : "✓"}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold text-tinta ${t.chico}`}>{quedan > 0 ? "Descanso entre series" : "Listos para seguir"}</span>
        <span className="block text-[13.5px] text-tinta-suave">Sentados o con el apoyo, respirando tranquilos.</span>
      </span>
      <Boton tono={quedan > 0 ? "suave" : "principal"} onClick={onSeguir} className="w-full">
        {siguiente}
      </Boton>
    </div>
  );
}

// ─── Reto: nombrar o seguir una secuencia, uno por movimiento ───
export function Reto({ e }: { e: De<"reto"> }) {
  const { tema, participante } = useSesion();
  const t = useTam();
  const cats = e.categorias ?? [];
  const [ci, setCi] = useState(0);
  const [cuenta, setCuenta] = useState(0);
  const [pista, setPista] = useState(-1);
  const [paso, setPaso] = useState(0);
  const [verSiguiente, setVerSiguiente] = useState(false);
  const cat = cats[ci % Math.max(1, cats.length)];
  const sec = e.secuencia ?? [];
  const completa = sec.length > 0 && paso >= sec.length;

  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.nota ?? "Solo si ya dominan el movimiento. Si le quita estabilidad, dejen el reto."}</Nota>

      {cat && (
        <section className="mt-5 rounded-[28px] bg-white border border-borde px-5 py-5 shadow-elevada">
          <div className="flex items-center gap-4">
            <span className="shrink-0 w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tema.claro})` }}>
              <Icono nombre={cat.icono} className="w-12 h-12 text-tinta" relleno={tema.relleno} />
            </span>
            <span className="min-w-0">
              <span className={`block tracking-[0.14em] uppercase font-semibold ${t.ceja}`} style={{ color: tema.tinta }}>
                {participante ? "Nombrá" : "Que nombre"}
              </span>
              <span key={cat.id} className={`ses-sube block font-serif leading-tight text-tinta ${t.grande}`}>{cat.texto}</span>
              <span className={`block text-tinta-suave ${t.chico}`}>Una {e.cada}.</span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCuenta((n) => n + 1)}
              className={`min-h-14 px-5 inline-flex items-center gap-2 rounded-2xl border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta ${t.chico}`}
            >
              <Icono nombre="estrella" className="w-6 h-6" relleno="#f4c372" />
              {participante ? "Dije una" : "Dijo una"}
            </button>
            <span className={`text-tinta ${t.chico}`} aria-live="polite">
              {cuenta === 0 ? "Todavía ninguna" : (
                <>
                  Van <strong key={cuenta} className={`ses-marca inline-block font-serif font-normal ${t.grande}`}>{cuenta}</strong>
                </>
              )}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {cat.ejemplos.length > 0 && (
              <Boton onClick={() => setPista((p) => (p + 1) % cat.ejemplos.length)}>{pista < 0 ? "¿Se trabó? Una idea" : "Otra idea"}</Boton>
            )}
            {cats.length > 1 && (
              <Boton
                onClick={() => {
                  setCi((i) => i + 1);
                  setPista(-1);
                }}
              >
                Otra categoría
              </Boton>
            )}
          </div>
          {pista >= 0 && (
            <p key={`${cat.id}-${pista}`} className={`ses-sube m-0 mt-3 rounded-2xl bg-fondo-papel px-4 py-2.5 text-tinta ${t.cuerpo}`}>
              Por ejemplo: <strong>{cat.ejemplos[pista]}</strong>
            </p>
          )}
        </section>
      )}

      {sec.length > 0 && (
        <section className="mt-5 rounded-[28px] bg-white border border-borde px-5 py-5 shadow-elevada">
          <p className={`m-0 tracking-[0.14em] uppercase font-semibold ${t.ceja}`} style={{ color: tema.tinta }}>
            Uno {e.cada}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 min-h-[44px]" aria-live="polite">
            {sec.slice(0, paso).map((s, i) => (
              <span key={i} className={`ses-marca inline-flex items-center rounded-full px-3.5 py-1.5 font-semibold text-tinta ${t.chico}`} style={{ background: `${tema.fuerte}26` }}>
                {s}
              </span>
            ))}
            {paso === 0 && <span className={`text-tinta-tenue ${t.chico}`}>Tocá «{participante ? "Lo dije" : "Lo dijo"}» con cada uno.</span>}
          </div>
          {completa ? (
            <p className={`ses-sube m-0 mt-4 font-semibold text-tinta ${t.cuerpo}`}>¡Completa! Pueden empezar de nuevo.</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaso((p) => p + 1);
                  setVerSiguiente(false);
                }}
                className={`min-h-14 px-5 inline-flex items-center gap-2 rounded-2xl border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta ${t.chico}`}
              >
                <Icono nombre="estrella" className="w-6 h-6" relleno="#f4c372" />
                {participante ? "Lo dije" : "Lo dijo"}
              </button>
              {verSiguiente ? (
                <span className={`ses-sube text-tinta ${t.chico}`}>
                  Sigue: <strong>{sec[paso]}</strong>
                </span>
              ) : (
                <Boton onClick={() => setVerSiguiente(true)}>Ver cuál sigue</Boton>
              )}
            </div>
          )}
          {paso > 0 && (
            <button
              type="button"
              onClick={() => {
                setPaso(0);
                setVerSiguiente(false);
              }}
              className={`mt-3 border-0 bg-transparent p-0 text-tinta-tenue underline decoration-dotted cursor-pointer ${t.chico}`}
            >
              Empezar de nuevo
            </button>
          )}
        </section>
      )}
      <Pie etiqueta="Seguir" />
    </>
  );
}

// ─── Colores: una secuencia para tocar, pisar o alcanzar ───
export function Colores({ e }: { e: De<"colores"> }) {
  const { participante } = useSesion();
  const t = useTam();
  const fijas = e.fijas ?? [];
  const [modo, setModo] = useState<number>(fijas.length ? 0 : -1); // -1 = al azar
  const [largo, setLargo] = useState(e.largo);
  const [azar, setAzar] = useState<ColorId[]>(() => secuenciaAlAzar(e.colores, e.largo));
  const [tocados, setTocados] = useState(0);
  const [hechas, setHechas] = useState(0);
  const [fase, setFase] = useState<"ver" | "tapada">("ver");
  const secuencia = modo >= 0 ? fijas[modo].colores : azar;
  const completa = tocados >= secuencia.length;
  const memoria = !!e.memorizar && modo < 0;
  const quedan = useCuenta(4 + largo * 2, memoria && fase === "ver" && tocados === 0);

  const nueva = (n = largo) => {
    setAzar(secuenciaAlAzar(e.colores, n));
    setTocados(0);
    setFase("ver");
  };
  const elegirModo = (m: number) => {
    setModo(m);
    setTocados(0);
    setFase("ver");
    if (m < 0) nueva();
  };
  const tocar = (i: number) => {
    if (i !== tocados) return;
    const n = tocados + 1;
    setTocados(n);
    if (n >= secuencia.length) setHechas((h) => h + 1);
  };
  const max = e.maxLargo ?? e.largo;

  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.nota ?? `${e.accion} Tocá cada color en pantalla cuando lo haga.`}</Nota>
      {(fijas.length > 0 || max > e.largo) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {fijas.map((f, i) => (
            <Boton key={f.etiqueta} tono={modo === i ? "claro" : "suave"} onClick={() => elegirModo(i)}>
              {f.etiqueta}
            </Boton>
          ))}
          {fijas.length > 0 && (
            <Boton tono={modo < 0 ? "claro" : "suave"} onClick={() => elegirModo(-1)}>
              {e.memorizar ? "De memoria" : "Al azar"}
            </Boton>
          )}
          {modo < 0 && max > e.largo && (
            <span className="inline-flex items-center gap-2 ml-1">
              <span className={`text-tinta-suave ${t.chico}`}>Colores:</span>
              {Array.from({ length: max - e.largo + 1 }, (_, k) => e.largo + k).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setLargo(n);
                    nueva(n);
                  }}
                  aria-pressed={largo === n}
                  className={`w-11 h-11 rounded-full font-semibold cursor-pointer ${largo === n ? "border-0 bg-verde-profundo text-white" : "border-[1.5px] border-borde bg-white text-tinta"} ${t.chico}`}
                >
                  {n}
                </button>
              ))}
            </span>
          )}
        </div>
      )}

      <section className="mt-5 rounded-[28px] bg-white border border-borde px-4 py-6 shadow-elevada">
        {memoria && fase === "ver" && tocados === 0 && (
          <p className={`m-0 mb-4 text-center font-semibold text-tinta ${t.cuerpo}`}>{quedan > 0 ? `Mirá bien el orden… ${quedan}` : "¿Listo para recordarlo?"}</p>
        )}
        {memoria && fase === "tapada" && !completa && <p className={`m-0 mb-4 text-center font-semibold text-tinta ${t.cuerpo}`}>Ahora, de memoria.</p>}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
          {secuencia.map((c, i) => (
            <Disco
              key={`${modo}-${i}-${c}-${hechas}`}
              color={c}
              tam={secuencia.length > 4 ? 56 : 68}
              numero={i + 1}
              hecho={i < tocados}
              activo={i === tocados && !completa}
              oculto={memoria && fase === "tapada" && i >= tocados}
              onClick={() => tocar(i)}
            />
          ))}
        </div>
        <p key={`${tocados}-${hechas}`} className={`ses-sube m-0 mt-5 min-h-[1.6em] text-center font-semibold text-tinta ${t.cuerpo}`} aria-live="polite">
          {completa ? "¡Secuencia completa!" : tocados === 0 ? (participante ? "Tocá el primero cuando lo hagas." : "Tocá cada color cuando lo haga.") : `Ahora, el ${COLORES[secuencia[tocados]].nombre.toLowerCase()}.`}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {memoria && fase === "ver" && tocados === 0 && (
            <Boton tono="principal" onClick={() => setFase("tapada")}>
              Tapar los colores
            </Boton>
          )}
          {memoria && fase === "tapada" && !completa && <Boton onClick={() => setFase("ver")}>Ver de nuevo</Boton>}
          {completa && (
            <Boton tono="principal" onClick={() => (modo >= 0 ? setTocados(0) : nueva())}>
              {modo >= 0 ? "Otra vez" : "Otra secuencia"}
            </Boton>
          )}
          {!completa && tocados > 0 && <Boton onClick={() => setTocados(0)}>Empezar de nuevo</Boton>}
        </div>
      </section>
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className={`text-tinta-suave ${t.chico}`}>{hechas === 0 ? "Secuencias hechas: ninguna" : `Secuencias hechas: ${hechas}${e.meta ? ` de ${e.meta}` : ""}`}</span>
        {e.meta && <Puntos hechos={Math.min(hechas, e.meta)} total={e.meta} etiqueta={`${hechas} de ${e.meta}`} />}
      </div>
      <Pie etiqueta={e.meta && hechas >= e.meta ? "Terminamos" : "Seguir"} tono={e.meta && hechas >= e.meta ? "principal" : "suave"} />
    </>
  );
}

// ─── Orientación: ¿qué color quedó al frente? ───
type FaseOrientacion = "armar" | "observar" | "girar" | "responder" | "resultado";

function Mapa({ colores, ocultos, mira, sentado, onTocar }: { colores: (ColorId | null)[]; ocultos: boolean; mira: number; sentado?: boolean; onTocar?: (pos: number) => void }) {
  const { tema } = useSesion();
  // Posiciones en pantalla: 0 arriba (frente), 1 derecha, 2 abajo, 3 izquierda.
  const lugar = ["left-1/2 top-0 -translate-x-1/2", "right-0 top-1/2 -translate-y-1/2", "left-1/2 bottom-0 -translate-x-1/2", "left-0 top-1/2 -translate-y-1/2"];
  const etiqueta = ["Frente", "Derecha", "Atrás", "Izquierda"];
  return (
    <div className="relative mx-auto w-[260px] h-[260px]">
      <span className="absolute inset-[62px] rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tema.claro})` }} />
      {/* La persona, mirando hacia la marca `mira`. */}
      <span className="absolute inset-[62px] flex items-center justify-center transition-transform duration-700" style={{ transform: `rotate(${mira * 90}deg)` }} aria-hidden="true">
        <svg viewBox="0 0 48 48" className="w-20 h-20">
          <path d="M24 6l7 12h-14z" fill={tema.fuerte} />
          <circle cx="24" cy="28" r="9" fill="#fff" stroke="#1f3338" strokeWidth="2.4" />
          <path d="M18 27l6-4 6 4" fill="none" stroke="#1f3338" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {colores.map((c, pos) =>
        c ? (
          <span key={pos} className={`absolute ${lugar[pos]} flex flex-col items-center`}>
            {onTocar ? (
              <button type="button" onClick={() => onTocar(pos)} aria-label={`${etiqueta[pos]}: ${COLORES[c].nombre}. Tocá para cambiar`} className="border-0 bg-transparent p-0 cursor-pointer">
                <Disco color={c} tam={sentado ? 54 : 50} oculto={ocultos} />
              </button>
            ) : (
              <Disco color={c} tam={sentado ? 54 : 50} oculto={ocultos} />
            )}
          </span>
        ) : null,
      )}
    </div>
  );
}

export function Orientacion({ e }: { e: De<"orientacion"> }) {
  const { participante } = useSesion();
  const t = useTam();
  const sentado = !!e.sentado;
  const inicial = (): (ColorId | null)[] => {
    const cs = e.colores;
    return sentado ? [cs[0], cs[1], null, cs[2]] : [cs[0], cs[1], cs[2], cs[3]];
  };
  const [marcas, setMarcas] = useState<(ColorId | null)[]>(inicial);
  const [fase, setFase] = useState<FaseOrientacion>("armar");
  const [mira, setMira] = useState(0);
  const [giros, setGiros] = useState<Giro[]>([]);
  const [mirada, setMirada] = useState<number>(0); // sentado: índice en MIRADAS
  const [dos, setDos] = useState(false);
  const [respuesta, setRespuesta] = useState<ColorId | null>(null);
  const [hechos, setHechos] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [serie, setSerie] = useState(1);
  const quedan = useCuenta(sentado ? 10 : 20, fase === "observar");

  const posObjetivo = sentado ? MIRADAS[mirada].pos : mira;
  const correcto = marcas[posObjetivo];
  const opciones = [...new Set(marcas.filter((c): c is ColorId => !!c))];

  const cambiarColor = (pos: number) => {
    const actual = marcas[pos];
    if (!actual) return;
    const sig = e.colores[(e.colores.indexOf(actual) + 1) % e.colores.length];
    setMarcas((m) => m.map((c, i) => (i === pos ? sig : c)));
  };
  const nuevoGiro = () => {
    if (sentado) {
      setMirada((m) => {
        const otras = MIRADAS.map((_, i) => i).filter((i) => i !== m);
        return otras[Math.floor(Math.random() * otras.length)];
      });
    } else {
      const g1 = giroAlAzar(giros.at(-1) ?? null);
      const lista = dos ? [g1, giroAlAzar(g1)] : [g1];
      setGiros(lista);
      setMira((m) => lista.reduce((x, g) => girar(x, g), m));
    }
    setRespuesta(null);
    setFase("girar");
  };
  const responder = (c: ColorId) => {
    setRespuesta(c);
    if (c === correcto) setAciertos((a) => a + 1);
    setHechos((h) => h + 1);
    setFase("resultado");
  };
  const serieLista = hechos >= e.cambios;

  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      {fase === "armar" && (
        <>
          <Nota className="mt-2">{e.nota ?? (sentado ? "Pongan tres colores en la mesa, así. Tocá un color para que coincida con los suyos." : "Pongan las cuatro marcas alrededor, así. Tocá un color para que coincida con los suyos.")}</Nota>
          <div className="mt-5">
            <Mapa colores={marcas} ocultos={false} mira={0} sentado={sentado} onTocar={cambiarColor} />
          </div>
          {!sentado && (
            <label className={`mt-4 flex items-center justify-center gap-2.5 text-tinta cursor-pointer ${t.chico}`}>
              <input type="checkbox" checked={dos} onChange={(ev) => setDos(ev.target.checked)} className="w-5 h-5 accent-[#2f5d62]" />
              Desafío: dos giros antes de responder
            </label>
          )}
          <div className="mt-5 flex justify-center">
            <Boton tono="principal" onClick={() => setFase("observar")}>
              Ya están puestas
            </Boton>
          </div>
        </>
      )}

      {fase === "observar" && (
        <>
          <Nota className="mt-2">{participante ? "Mirá dónde está cada color y recordalo." : "Que mire dónde está cada color y lo recuerde."}</Nota>
          <div className="mt-5">
            <Mapa colores={marcas} ocultos={false} mira={0} sentado={sentado} />
          </div>
          <p className={`m-0 mt-4 text-center font-semibold text-tinta ${t.cuerpo}`}>{quedan > 0 ? `Observen… ${quedan}` : "¿Listos?"}</p>
          <div className="mt-4 flex justify-center">
            <Boton tono="principal" onClick={nuevoGiro}>
              Taparlas y empezar
            </Boton>
          </div>
        </>
      )}

      {fase === "girar" && (
        <>
          <div className="mt-5">
            <Mapa colores={marcas} ocultos mira={sentado ? 0 : mira} sentado={sentado} />
          </div>
          <section className="ses-sube mt-4 rounded-[24px] bg-white border border-borde px-5 py-4 text-center">
            {sentado ? (
              <p className={`m-0 font-serif text-tinta ${t.grande}`}>{MIRADAS[mirada].texto}.</p>
            ) : (
              giros.map((g, i) => (
                <p key={i} className={`m-0 font-serif text-tinta ${t.grande}`}>
                  {giros.length > 1 ? `${i + 1}. ` : ""}
                  {GIROS[g].texto}.
                </p>
              ))
            )}
            <p className={`m-0 mt-2 text-tinta-suave ${t.chico}`}>{sentado ? "Sin girar el cuerpo." : "Con pasos cortos, sin girar sobre un solo pie."}</p>
          </section>
          <div className="mt-4 flex justify-center">
            <Boton tono="principal" onClick={() => setFase("responder")}>
              {sentado ? "Ya está mirando" : "Ya está quieto y estable"}
            </Boton>
          </div>
        </>
      )}

      {fase === "responder" && (
        <>
          <Nota className="mt-2">{participante ? "Decilo en voz alta y tocalo." : "Que lo diga en voz alta. Tocá el color que dijo."}</Nota>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            {opciones.map((c) => (
              <Disco key={c} color={c} tam={70} onClick={() => responder(c)} />
            ))}
          </div>
        </>
      )}

      {fase === "resultado" && correcto && (
        <>
          <div className="mt-5">
            <Mapa colores={marcas} ocultos={false} mira={sentado ? 0 : mira} sentado={sentado} />
          </div>
          <p key={hechos} className={`ses-sube m-0 mt-4 text-center font-semibold text-tinta ${t.cuerpo}`} aria-live="polite">
            {respuesta === correcto ? "¡Exacto!" : `Era el ${COLORES[correcto].nombre.toLowerCase()}. ¡Bien intentado!`}
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`text-tinta-suave ${t.chico}`}>
              Serie {serie}: {Math.min(hechos, e.cambios)} de {e.cambios}
            </span>
            <Puntos hechos={Math.min(hechos, e.cambios)} total={e.cambios} etiqueta={`${hechos} de ${e.cambios} cambios`} />
          </div>
          {serieLista ? (
            <DescansoEntre
              segundos={45}
              siguiente="Otra serie"
              onSeguir={() => {
                setSerie((s) => s + 1);
                setHechos(0);
                setFase("observar");
              }}
            />
          ) : (
            <div className="mt-4 flex justify-center">
              <Boton tono="principal" onClick={nuevoGiro}>
                {sentado ? "Otra mirada" : "Otro giro"}
              </Boton>
            </div>
          )}
          {aciertos > 0 && <p className={`m-0 mt-3 text-center text-tinta-tenue ${t.chico}`}>Aciertos hoy: {aciertos}</p>}
        </>
      )}
      <Pie etiqueta={serie > 1 || serieLista ? "Terminamos" : "Seguir"} tono={serie > 1 || serieLista ? "principal" : "suave"} />
    </>
  );
}

// ─── Objetos: ¿qué cambió en la mesa? ───
type FaseObjetos = "elegir" | "observar" | "mover" | "responder" | "resultado";

export function Objetos({ e }: { e: De<"objetos"> }) {
  const { tema, participante } = useSesion();
  const t = useTam();
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [intercambiar, setIntercambiar] = useState(false);
  const [fase, setFase] = useState<FaseObjetos>("elegir");
  const [cambio, setCambio] = useState<Cambio | null>(null);
  const [verCambio, setVerCambio] = useState(false);
  const [reps, setReps] = useState(0);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [ronda, setRonda] = useState(1);
  const quedan = useCuenta(e.observar, fase === "observar");
  const de = (id: string) => e.objetos.find((o) => o.id === id)!;

  const empezarRonda = () => {
    setCambio(cambioAlAzar(elegidos, intercambiar));
    setVerCambio(false);
    setReps(0);
    setMarcados([]);
    setFase("observar");
  };
  // Cómo quedó la mesa, con el hueco del que se sacó.
  const despues: (string | null)[] = !cambio ? elegidos : cambio.tipo === "falta" ? elegidos.map((o) => (o === cambio.objeto ? null : o)) : mesaDespues(elegidos, cambio);
  const necesita = cambio?.tipo === "cambio" ? 2 : 1;
  const acierto = cambio ? (cambio.tipo === "falta" ? marcados[0] === cambio.objeto : marcados.length === 2 && marcados.includes(cambio.a) && marcados.includes(cambio.b)) : false;

  const Fila = ({ ids, numerar = false }: { ids: (string | null)[]; numerar?: boolean }) => (
    <div className="flex flex-wrap justify-center gap-3">
      {ids.map((id, i) =>
        id === null ? (
          <span key={`hueco-${i}`} className="flex flex-col items-center w-[84px]">
            <span className="w-[72px] h-[72px] rounded-2xl border-2 border-dashed border-borde" />
            <span className="mt-1 text-[13px] font-semibold text-tinta-tenue">Vacío</span>
          </span>
        ) : (
        <span key={`${id}-${i}`} className="flex flex-col items-center w-[84px]">
          <span className="relative w-[72px] h-[72px] rounded-2xl bg-white border border-borde flex items-center justify-center">
            <Icono nombre={de(id).icono} className="w-12 h-12 text-tinta" relleno={tema.relleno} />
            {numerar && <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-verde-profundo text-white text-[14px] font-semibold flex items-center justify-center">{i + 1}</span>}
          </span>
          <span className="mt-1 text-center text-[13px] leading-tight font-semibold text-tinta">{de(id).texto}</span>
        </span>
        ),
      )}
    </div>
  );

  return (
    <>
      <Titulo>{e.titulo}</Titulo>

      {fase === "elegir" && (
        <>
          <Nota className="mt-2">{e.nota ?? `Tocá ${e.cuantos} objetos que tengan a mano. Van en la mesa en ese orden.`}</Nota>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {e.objetos.map((o) => {
              const i = elegidos.indexOf(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setElegidos((xs) => (i >= 0 ? xs.filter((x) => x !== o.id) : xs.length < 5 ? [...xs, o.id] : xs))}
                  aria-pressed={i >= 0}
                  className={`relative w-[92px] flex flex-col items-center gap-1 rounded-2xl border-[1.5px] px-2 py-3 cursor-pointer ${i >= 0 ? "border-verde-profundo bg-verde-tenue" : "border-borde bg-white"}`}
                >
                  <Icono nombre={o.icono} className="w-11 h-11 text-tinta" relleno={tema.relleno} />
                  <span className="text-[13px] leading-tight font-semibold text-tinta">{o.texto}</span>
                  {i >= 0 && <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-verde-profundo text-white text-[14px] font-semibold flex items-center justify-center">{i + 1}</span>}
                </button>
              );
            })}
          </div>
          {elegidos.length >= 2 && (
            <section className="ses-sube mt-5 rounded-[24px] bg-white border border-borde px-4 py-4">
              <p className={`m-0 mb-3 text-center font-semibold text-tinta ${t.chico}`}>Así van en la mesa, de izquierda a derecha:</p>
              <Fila ids={elegidos} numerar />
              <label className={`mt-4 flex items-center justify-center gap-2.5 text-tinta cursor-pointer ${t.chico}`}>
                <input type="checkbox" checked={intercambiar} onChange={(ev) => setIntercambiar(ev.target.checked)} className="w-5 h-5 accent-[#2f5d62]" />
                Desafío: cambiar dos de lugar, sin sacar ninguno
              </label>
            </section>
          )}
          <div className="mt-5 flex justify-center">
            <Boton tono="principal" disabled={elegidos.length < 2} onClick={empezarRonda}>
              Ya están en la mesa
            </Boton>
          </div>
        </>
      )}

      {fase === "observar" && (
        <>
          <Nota className="mt-2">{participante ? "Mirá qué hay y dónde está cada uno." : "Que mire qué hay y dónde está cada uno."}</Nota>
          <div className="mt-5">
            <Fila ids={elegidos} />
          </div>
          <p className={`m-0 mt-5 text-center font-semibold text-tinta ${t.cuerpo}`}>{quedan > 0 ? `Observen… ${quedan}` : "¿Listos?"}</p>
          <div className="mt-4 flex justify-center">
            <Boton tono="principal" onClick={() => setFase("mover")}>
              A darse vuelta
            </Boton>
          </div>
        </>
      )}

      {fase === "mover" && cambio && (
        <>
          <Nota className="mt-2">{participante ? "De espaldas a la mesa: la pelota al pecho, extendé los brazos y volvé." : "De espaldas a la mesa: la pelota al pecho, que extienda los brazos y vuelva."}</Nota>
          <div className="mt-5 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setReps((r) => Math.min(r + 1, e.repeticiones))}
              aria-label={`Sumar una. Van ${reps}`}
              className="w-[180px] h-[180px] rounded-full border-0 cursor-pointer flex flex-col items-center justify-center active:scale-[0.97] transition-transform"
              style={{ background: `conic-gradient(${tema.fuerte} ${(reps / e.repeticiones) * 360}deg, #efeada 0deg)` }}
            >
              <span className="w-[140px] h-[140px] rounded-full bg-white flex flex-col items-center justify-center">
                <span key={reps} className="ses-marca font-serif text-[56px] leading-none text-tinta">{reps}</span>
                <span className="text-[14px] font-semibold text-tinta-tenue">de {e.repeticiones}</span>
              </span>
            </button>
            <p className={`m-0 mt-3 font-semibold text-tinta ${t.chico}`}>{reps >= e.repeticiones ? "¡Listo! Ya puede volver a la mesa." : "Tocá el círculo en cada extensión."}</p>
          </div>
          <section className="mt-5 rounded-[24px] border-[1.5px] border-dashed border-verde-serenidad bg-verde-tenue/60 px-4 py-4">
            <p className={`m-0 font-semibold text-verde-profundo ${t.chico}`}>Para quien acompaña (que no lo vea)</p>
            {verCambio ? (
              <p className={`ses-sube m-0 mt-2 font-serif text-tinta ${t.grande}`}>
                {cambio.tipo === "falta" ? `Sacá: ${de(cambio.objeto).texto.toLowerCase()}.` : `Cambiá de lugar: ${de(cambio.a).texto.toLowerCase()} y ${de(cambio.b).texto.toLowerCase()}.`}
              </p>
            ) : (
              <Boton tono="claro" className="mt-2" onClick={() => setVerCambio(true)}>
                Ver qué cambiar
              </Boton>
            )}
          </section>
          <div className="mt-5 flex justify-center">
            <Boton tono="principal" onClick={() => setFase("responder")}>
              Volver a la mesa
            </Boton>
          </div>
        </>
      )}

      {fase === "responder" && cambio && (
        <>
          <p className={`m-0 mt-3 font-serif text-tinta ${t.grande}`}>{cambio.tipo === "falta" ? "¿Qué objeto falta?" : "¿Cuáles cambiaron de lugar?"}</p>
          <Nota className="mt-1">{cambio.tipo === "falta" ? "Tocá el que dice." : "Tocá los dos que dice."}</Nota>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {elegidos.map((id) => {
              const m = marcados.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const xs = m ? marcados.filter((x) => x !== id) : [...marcados, id].slice(-necesita);
                    setMarcados(xs);
                    if (xs.length === necesita) setFase("resultado");
                  }}
                  aria-pressed={m}
                  className={`w-[92px] flex flex-col items-center gap-1 rounded-2xl border-[1.5px] px-2 py-3 cursor-pointer ${m ? "border-verde-profundo bg-verde-tenue" : "border-borde bg-white"}`}
                >
                  <Icono nombre={de(id).icono} className="w-11 h-11 text-tinta" relleno={tema.relleno} />
                  <span className="text-[13px] leading-tight font-semibold text-tinta">{de(id).texto}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {fase === "resultado" && cambio && (
        <>
          <p key={ronda} className={`ses-sube m-0 mt-3 text-center font-semibold text-tinta ${t.cuerpo}`} aria-live="polite">
            {acierto ? "¡Exacto!" : cambio.tipo === "falta" ? `Faltaba: ${de(cambio.objeto).texto.toLowerCase()}. ¡Bien intentado!` : `Eran: ${de(cambio.a).texto.toLowerCase()} y ${de(cambio.b).texto.toLowerCase()}. ¡Bien intentado!`}
          </p>
          <section className="mt-4 grid gap-4 rounded-[24px] bg-white border border-borde px-4 py-4">
            <div>
              <p className={`m-0 mb-2 text-center text-tinta-suave ${t.chico}`}>Así estaba</p>
              <Fila ids={elegidos} />
            </div>
            <div>
              <p className={`m-0 mb-2 text-center text-tinta-suave ${t.chico}`}>Así quedó</p>
              <Fila ids={despues} />
            </div>
          </section>
          <p className={`m-0 mt-3 text-center text-tinta-suave ${t.chico}`}>Un reto más: {participante ? "acomodá" : "que acomode"} los objetos como estaban.</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`text-tinta-suave ${t.chico}`}>
              Ronda {Math.min(ronda, e.rondas)} de {e.rondas}
            </span>
            <Puntos hechos={Math.min(ronda, e.rondas)} total={e.rondas} etiqueta={`Ronda ${ronda} de ${e.rondas}`} />
          </div>
          {ronda < e.rondas && (
            <DescansoEntre
              segundos={45}
              siguiente="Otra ronda"
              onSeguir={() => {
                setRonda((r) => r + 1);
                empezarRonda();
              }}
            />
          )}
        </>
      )}
      <Pie etiqueta={fase === "resultado" && ronda >= e.rondas ? "Terminamos" : "Seguir"} tono={fase === "resultado" && ronda >= e.rondas ? "principal" : "suave"} />
    </>
  );
}

// ─── Reacción: qué mano (globo) o cuándo soltar (pelota) ───
export function Reaccion({ e }: { e: De<"reaccion"> }) {
  return e.modo === "manos" ? <Manos e={e} /> : <Soltar e={e} />;
}

function Manos({ e }: { e: De<"reaccion"> }) {
  const { tema, participante } = useSesion();
  const t = useTam();
  const [modo, setModo] = useState<ModoManos>("alternar");
  const [mano, setMano] = useState<Mano | null>(null);
  const [pases, setPases] = useState(0);
  const [inicio, setInicio] = useState<number | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [serie, setSerie] = useState(1);
  const [descansando, setDescansando] = useState(false);
  useEffect(() => {
    if (inicio === null || descansando) return;
    const id = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(id);
  }, [inicio, descansando]);
  const seg = inicio === null ? 0 : Math.floor((ahora - inicio) / 1000);
  const serieLista = seg >= e.min;

  const pase = () => {
    if (inicio === null) setInicio(Date.now());
    setMano((m) => siguienteMano(modo, m));
    setPases((p) => p + 1);
  };
  const terminarSerie = () => {
    setDescansando(true);
  };
  const etiquetaMano = (m: Mano) => (modo === "numeros" ? (m === "derecha" ? "«Uno»" : "«Dos»") : m === "derecha" ? "Derecha" : "Izquierda");

  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.nota ?? (participante ? "Tocá «Siguiente pase» y devolvé con la mano que aparece." : "Antes de cada pase, tocá «Siguiente pase» y decile la mano.")}</Nota>
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["alternar", "Alternar"],
            ["azar", "Al azar"],
            ["numeros", "Uno y dos"],
          ] as [ModoManos, string][]
        ).map(([m, l]) => (
          <Boton
            key={m}
            tono={modo === m ? "claro" : "suave"}
            onClick={() => {
              setModo(m);
              setMano(null);
            }}
          >
            {l}
          </Boton>
        ))}
      </div>
      {modo === "numeros" && <Nota className="mt-2">Reto: «uno» es la mano derecha y «dos», la izquierda. Decí solo el número.</Nota>}

      <section className="mt-5 rounded-[28px] bg-white border border-borde px-5 py-6 shadow-elevada flex flex-col items-center">
        {mano ? (
          <div key={pases} className="ses-sube flex flex-col items-center">
            <span className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tema.claro})` }}>
              <Icono nombre="mano" className={`w-16 h-16 text-tinta ${mano === "izquierda" ? "-scale-x-100" : ""}`} relleno={tema.relleno} />
            </span>
            <span className={`mt-2 font-serif text-tinta ${t.titulo}`}>{etiquetaMano(mano)}</span>
            {modo === "numeros" && <span className={`text-tinta-tenue ${t.chico}`}>(mano {mano})</span>}
          </div>
        ) : (
          <span className={`font-serif text-tinta-suave ${t.grande}`}>¿Listos?</span>
        )}
        {!descansando && (
          <button
            type="button"
            onClick={pase}
            className={`mt-5 min-h-16 px-8 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta ${t.cuerpo}`}
          >
            {mano ? "Siguiente pase" : "Primer pase"}
          </button>
        )}
        <p className={`m-0 mt-4 text-tinta-suave ${t.chico}`} aria-live="polite">
          Serie {serie} de {e.series} · {pases} {pases === 1 ? "pase" : "pases"}
          {inicio !== null ? ` · ${seg} s` : ""}
        </p>
        {!descansando && serieLista && (
          <p className={`ses-sube m-0 mt-1 font-semibold text-tinta ${t.chico}`}>{seg >= e.max ? "¡Serie completa!" : "Pueden terminar la serie cuando quieran."}</p>
        )}
        {!descansando && serieLista && serie < e.series && (
          <Boton tono="claro" className="mt-3" onClick={terminarSerie}>
            Terminar la serie
          </Boton>
        )}
      </section>
      {descansando && (
        <div className="flex justify-center">
          <DescansoEntre
            segundos={45}
            siguiente={`Serie ${serie + 1}`}
            onSeguir={() => {
              setSerie((s) => s + 1);
              setDescansando(false);
              setInicio(null);
              setPases(0);
              setMano(null);
            }}
          />
        </div>
      )}
      <Pie etiqueta={serie >= e.series && serieLista ? "Terminamos" : "Terminar acá"} tono={serie >= e.series && serieLista ? "principal" : "suave"} />
    </>
  );
}

function Soltar({ e }: { e: De<"reaccion"> }) {
  const { tema } = useSesion();
  const t = useTam();
  const [aviso, setAviso] = useState(true);
  const [fase, setFase] = useState<"listo" | "cuenta" | "espera" | "ahora" | "anotar">("listo");
  const [cuenta, setCuenta] = useState(3);
  const [intentos, setIntentos] = useState(0);
  const [atrapadas, setAtrapadas] = useState(0);
  const [serie, setSerie] = useState(1);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (espera.current) clearTimeout(espera.current);
  }, []);
  useEffect(() => {
    if (fase !== "cuenta") return;
    if (cuenta <= 0) {
      setFase("ahora");
      return;
    }
    const id = setTimeout(() => setCuenta((c) => c - 1), 900);
    return () => clearTimeout(id);
  }, [fase, cuenta]);
  useEffect(() => {
    if (fase === "ahora") navigator.vibrate?.(180);
  }, [fase]);

  const preparar = () => {
    if (aviso) {
      setCuenta(3);
      setFase("cuenta");
    } else {
      setFase("espera");
      espera.current = setTimeout(() => setFase("ahora"), 1500 + Math.random() * 3000);
    }
  };
  const anotar = (atrapo: boolean) => {
    setIntentos((i) => i + 1);
    if (atrapo) setAtrapadas((a) => a + 1);
    setFase("listo");
  };
  const serieLista = intentos >= e.min;
  const grande = useMemo(() => (fase === "ahora" ? "¡Soltá!" : fase === "cuenta" ? (cuenta > 0 ? String(cuenta) : "") : fase === "espera" ? "Esperá…" : ""), [fase, cuenta]);

  return (
    <>
      <Titulo>{e.titulo}</Titulo>
      <Nota className="mt-2">{e.nota ?? "Para quien acompaña: sostené la pelota sobre sus manos, a la vista. La pantalla te dice cuándo soltarla."}</Nota>
      <div className="mt-4 flex flex-wrap gap-2">
        <Boton tono={aviso ? "claro" : "suave"} onClick={() => setAviso(true)}>
          Con aviso: 3, 2, 1
        </Boton>
        <Boton tono={!aviso ? "claro" : "suave"} onClick={() => setAviso(false)}>
          Sin aviso
        </Boton>
      </div>
      <section
        className="mt-5 rounded-[28px] border border-borde px-5 py-7 shadow-elevada flex flex-col items-center transition-colors"
        style={{ background: fase === "ahora" ? tema.claro : "#fff" }}
      >
        {fase === "listo" || fase === "anotar" ? (
          <>
            <Icono nombre="figura-atrapa" className="w-24 h-24 text-tinta" relleno={tema.relleno} />
            <button type="button" onClick={preparar} className={`mt-4 min-h-16 px-8 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer hover:bg-tinta ${t.cuerpo}`}>
              {intentos === 0 ? "Preparar la suelta" : "Siguiente intento"}
            </button>
          </>
        ) : (
          <span key={grande} className={`ses-marca font-serif leading-none text-tinta ${fase === "ahora" ? "text-[72px]" : "text-[60px]"}`} aria-live="assertive">
            {grande}
          </span>
        )}
        {fase === "ahora" && (
          <div className="ses-sube mt-5 flex flex-wrap justify-center gap-2">
            <Boton tono="principal" onClick={() => anotar(true)}>
              La atrapó
            </Boton>
            <Boton onClick={() => anotar(false)}>Esta vez no</Boton>
          </div>
        )}
        <p className={`m-0 mt-5 text-tinta-suave ${t.chico}`} aria-live="polite">
          Serie {serie} de {e.series} · intento {Math.min(intentos + 1, e.max)} de {e.max} · atrapadas: {atrapadas}
        </p>
        {e.contarDeDos && intentos > 0 && fase === "listo" && (
          <p className={`ses-sube m-0 mt-2 text-tinta ${t.chico}`}>
            Reto de dos en dos: que diga <strong>{intentos * 2}</strong>.
          </p>
        )}
      </section>
      {serieLista && serie < e.series && fase === "listo" && (
        <div className="flex justify-center">
          <DescansoEntre
            segundos={45}
            siguiente={`Serie ${serie + 1}`}
            onSeguir={() => {
              setSerie((s) => s + 1);
              setIntentos(0);
              setAtrapadas(0);
            }}
          />
        </div>
      )}
      <Pie etiqueta={serie >= e.series && serieLista ? "Terminamos" : "Terminar acá"} tono={serie >= e.series && serieLista ? "principal" : "suave"} />
    </>
  );
}
