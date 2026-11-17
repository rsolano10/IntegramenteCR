import { Suspense, lazy, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { RegistroJuegoContexto, type RegistroJuego, type ValorRegistro } from "../../../lib/actividades/registroJuego";
import { DIFICULTADES, dificultadLabel, type Dificultad } from "../../../lib/actividades/nivelSugerido";
import { nuevaSemilla } from "../../../lib/actividades/azar";
import type { ExtrasInteractiva } from "../../../lib/actividades/contrato";
import { prepararSesion } from "../../../lib/actividades/registro";
import { detenerVoz } from "../../../lib/voz";
import { Boton, IconoAmpliar, IconoPista, IconoReducir, IconoSalir, IconoSiguiente } from "./ui";
import { MensajeJuego, esperaMensaje, type Aviso, type Control } from "./comun";
import { Letrero, Rotulo, RuedaProgreso } from "../pueblo/Ornamento";

// Marco común de las actividades «Un día en el pueblo»: cada actividad es un
// lugar con su rótulo pintado. Inicio con la escena y la consigna; un
// ejercicio por vez con la rueda de carreta que se pinta como progreso
// (para lectores: «Ejercicio 2 de 5»); la consigna en un letrero de
// madera dentro de la escena, donde también se escriben los mensajes un
// rato (y en una región aria-live para lectores);
// «Ver una pista» tras 2 intentos en el mismo paso; «Terminar por hoy»
// siempre a mano; cierre con el momento final del lugar, sin resumen de
// desempeño. Si la pantalla da un registro (actividad de hoy sin
// registrar), el cierre pregunta «¿Cómo le resultó?» y «¿Lo pudieron
// hacer?» y lo guarda; si no, no guarda nada.

export interface PropsJuego {
  ejercicio: unknown;
  config: Record<string, unknown>;
  ctl: Control;
}

// Cada escena se carga solo cuando se abre su actividad.
type ModuloEscena = { Juego: ComponentType<PropsJuego>; Portada: ComponentType<{ final?: boolean; config?: Record<string, unknown> }> };
function escena(cargar: () => Promise<ModuloEscena>) {
  return {
    Juego: lazy(() => cargar().then((m) => ({ default: m.Juego }))),
    Portada: lazy(() => cargar().then((m) => ({ default: m.Portada }))),
  };
}
const ESCENAS: Record<string, ReturnType<typeof escena>> = {
  "clasificar-objetos": escena(() => import("../pueblo/Feria") as unknown as Promise<ModuloEscena>),
  "pago-exacto": escena(() => import("../pueblo/Pulperia") as unknown as Promise<ModuloEscena>),
  "ordenar-pasos": escena(() => import("../pueblo/Cafe") as unknown as Promise<ModuloEscena>),
  "ordenar-secuencia": escena(() => import("../pueblo/Estacion") as unknown as Promise<ModuloEscena>),
  "formar-palabra": escena(() => import("../pueblo/Rotulista") as unknown as Promise<ModuloEscena>),
  parejas: escena(() => import("../pueblo/Mosaico") as unknown as Promise<ModuloEscena>),
  "recordar-posiciones": escena(() => import("../pueblo/Ventanas") as unknown as Promise<ModuloEscena>),
  "encontrar-iguales": escena(() => import("../pueblo/Taller") as unknown as Promise<ModuloEscena>),
  "contar-por-tipo": escena(() => import("../pueblo/Canasto") as unknown as Promise<ModuloEscena>),
  "orientacion-hoy": escena(() => import("../pueblo/Almanaque") as unknown as Promise<ModuloEscena>),
  // Fase 2
  intruso: escena(() => import("../pueblo/Olla") as unknown as Promise<ModuloEscena>),
  "que-cambio": escena(() => import("../pueblo/Corredor") as unknown as Promise<ModuloEscena>),
  "pintar-rueda": escena(() => import("../pueblo/CarretaPintar") as unknown as Promise<ModuloEscena>),
  senas: escena(() => import("../pueblo/Senas") as unknown as Promise<ModuloEscena>),
  dichos: escena(() => import("../pueblo/Banca") as unknown as Promise<ModuloEscena>),
  mandado: escena(() => import("../pueblo/Mercado") as unknown as Promise<ModuloEscena>),
  comprension: escena(() => import("../pueblo/RadioCorreo") as unknown as Promise<ModuloEscena>),
  pizarra: escena(() => import("../pueblo/Escuela") as unknown as Promise<ModuloEscena>),
  corral: escena(() => import("../pueblo/Corral") as unknown as Promise<ModuloEscena>),
  agenda: escena(() => import("../pueblo/CocinaAgenda") as unknown as Promise<ModuloEscena>),
};

// Portada de un juego (la escena de su lugar), para las tarjetas de la
// Biblioteca. Sin la escena (juegos anteriores), nada.
export function PortadaDeJuego({ tipo }: { tipo: string }) {
  const lugar = ESCENAS[tipo];
  if (!lugar) return null;
  const { Portada } = lugar;
  return (
    <Suspense fallback={<Cargando />}>
      <Portada />
    </Suspense>
  );
}

type Mensaje = Aviso | null;
let idAviso = 0;
const avisar = (tipo: Aviso["tipo"], texto: string): Aviso => ({ id: ++idAviso, tipo, texto });

const Cargando = () => <div className="min-h-[280px] rounded-[20px] bg-beige-serenidad/60" aria-busy="true" />;

// Dentro de la sesión guiada: el juego arranca directo (la portada y
// «Empezar» son los de la sesión), avisa cuando terminó para habilitar
// «Siguiente», y «Terminar por hoy» lleva al cierre de la sesión.
export interface EnSesion {
  onTerminado: () => void;
  onReiniciar: () => void;
  onDificultad: (d: Dificultad | null) => void;
  onTerminarPorHoy: () => void;
}

export default function ActividadInteractiva({ extras, size = "compact", enSesion }: { extras: ExtrasInteractiva; size?: "compact" | "large"; enSesion?: EnSesion }) {
  const large = size === "large";
  const [semilla, setSemilla] = useState(nuevaSemilla);
  const sesion = useMemo(() => prepararSesion(extras, semilla), [extras, semilla]);
  const [fase, setFase] = useState<"inicio" | "juego" | "cierre">(enSesion ? "juego" : "inicio");
  const [dificultad, setDificultad] = useState<Dificultad | null>(null);
  const [indice, setIndice] = useState(0);
  const [intentos, setIntentos] = useState(0);
  const [pista, setPista] = useState(0);
  const [resuelto, setResuelto] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [hechos, setHechos] = useState(0);
  // El mensaje que se ve en el letrero (se borra solo, a los pocos segundos).
  const [enLetrero, setEnLetrero] = useState<Aviso | null>(null);
  useEffect(() => {
    setEnLetrero(mensaje);
    if (!mensaje) return;
    const t = window.setTimeout(() => setEnLetrero(null), esperaMensaje(mensaje.texto));
    return () => window.clearTimeout(t);
  }, [mensaje]);
  const [barra, setBarra] = useState<HTMLDivElement | null>(null);
  const zona = useRef<HTMLDivElement>(null);
  const cine = usePantallaCompleta();
  const ajuste = useAjusteAPantalla(!!enSesion && !cine.activo);
  const registro = useContext(RegistroJuegoContexto);
  useEffect(() => () => detenerVoz(), []);

  // Al cambiar de ejercicio, el foco vuelve al comienzo (teclado y lectores).
  useEffect(() => {
    if (fase === "juego") zona.current?.focus({ preventScroll: true });
  }, [indice, fase]);

  const total = sesion.ok ? sesion.ejercicios.length : 0;
  const ctl: Control = useMemo(
    () => ({
      acierto: (texto = "Muy bien.") => {
        setIntentos(0);
        setMensaje(avisar("ok", texto));
      },
      reintento: (texto = "Probemos otra vez.") => {
        setIntentos((n) => n + 1);
        setMensaje(avisar("reintento", texto));
      },
      aviso: (texto) => setMensaje(avisar("info", texto)),
      listo: () => {
        setResuelto(true);
        setHechos((n) => n + 1);
        setIntentos(0);
        setMensaje(avisar("ok", "¡Muy bien!"));
      },
      pista,
      large,
      indice,
      total,
      barra,
    }),
    [pista, large, indice, total, barra],
  );

  const lugar = sesion.ok ? ESCENAS[sesion.def.tipo] : undefined;
  if (!sesion.ok || !lugar)
    return (
      <section className="rounded-[26px] bg-white border border-borde p-6 text-center">
        <p className={`m-0 text-tinta ${large ? "text-[22px]" : "text-[20px]"}`}>Esta actividad no está disponible por ahora.</p>
        <p className="m-0 mt-1 text-[16px] text-tinta-suave">Podés seguir con las demás actividades del día.</p>
      </section>
    );

  const { def, config, ejercicios } = sesion;
  const { Juego, Portada } = lugar;
  const consigna = def.consigna(config);
  const ultimo = indice + 1 >= total;

  function empezar() {
    setIndice(0);
    setHechos(0);
    setIntentos(0);
    setResuelto(false);
    setMensaje(null);
    setDificultad(null);
    setFase("juego");
    enSesion?.onReiniciar();
    enSesion?.onDificultad(null);
  }
  function terminarJuego() {
    setFase("cierre");
    enSesion?.onTerminado();
  }
  function terminarPorHoy() {
    if (enSesion) enSesion.onTerminarPorHoy();
    else setFase("cierre");
  }
  function siguiente() {
    if (ultimo) return terminarJuego();
    setIndice((i) => i + 1);
    setIntentos(0);
    setResuelto(false);
    setMensaje(null);
  }

  const botonCine = (
    <button
      type="button"
      onClick={cine.alternar}
      aria-label={cine.activo ? "Salir de pantalla completa" : "Pantalla completa"}
      title={cine.activo ? "Salir de pantalla completa" : "Pantalla completa"}
      className="-mr-2 inline-flex items-center justify-center w-12 h-12 rounded-2xl border-0 bg-transparent text-tinta-suave cursor-pointer hover:bg-black/[0.04] hover:text-tinta focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
    >
      {cine.activo ? <IconoReducir /> : <IconoAmpliar />}
    </button>
  );
  const texto = large ? "text-[20px]" : "text-[18px]";

  return (
    <section
      ref={cine.ref}
      aria-label={def.nombre}
      className={cine.activo ? `${cine.nativo ? "" : "fixed inset-0 z-[70]"} overflow-y-auto overscroll-contain bg-fondo-papel` : "min-w-0"}
    >
      <div style={ajuste.externo}>
      <div ref={ajuste.ref} style={ajuste.interno} className={cine.activo ? "mx-auto w-full max-w-[880px] min-h-full px-4 py-5 sm:px-8 sm:py-8 flex flex-col gap-2" : "grid gap-2"}>
        {/* El cuadro del juego: todo lo del juego va adentro (rótulo, avance,
            consigna, mensajes, pista y el pase al siguiente ejercicio). */}
        <div className={`rounded-[28px] border border-borde bg-white/85 shadow-[0_18px_40px_-30px_rgba(31,51,56,0.55)] ${enSesion ? "p-3 sm:p-5" : "p-4 sm:p-5"}`}>
          {fase === "inicio" && (
            <div className="flex flex-col items-center text-center gap-4 py-1">
              <h3 className="m-0 -mb-1">
                <Rotulo texto={def.nombre} size="lg" />
              </h3>
              <Suspense fallback={<Cargando />}>
                <Portada config={config} />
              </Suspense>
              <Letrero large={large} className="-mt-6" detalle={`Son ${total} ${total === 1 ? "ejercicio" : "ejercicios"}. Sin apuro.`}>
                {consigna}
              </Letrero>
              <Boton onClick={empezar} large={large} className="w-full max-w-sm">
                Empezar
              </Boton>
            </div>
          )}

          {fase === "juego" && (
            <div className={`grid ${enSesion ? "gap-3" : "gap-4"}`}>
              <div ref={zona} tabIndex={-1} className="outline-none flex items-center justify-between gap-3">
                <h3 className="m-0 min-w-0">
                  <Rotulo texto={def.nombre} />
                </h3>
                <RuedaProgreso total={total} completados={hechos} actual={indice + 1} size={enSesion ? 50 : 60} />
              </div>

              {/* El juego, con su letrero: los mensajes se escriben en él. */}
              {/* El alto del juego nunca baja mientras se juega (las piezas que se
                  acomodan o el cambio de ejercicio no hacen «brincar» la pantalla). */}
              <SinEncoger reinicio={semilla}>
                <MensajeJuego.Provider value={enLetrero}>
                  <Suspense fallback={<Cargando />}>
                    <Juego key={`${semilla}-${indice}`} ejercicio={ejercicios[indice]} config={config} ctl={ctl} />
                  </Suspense>
                </MensajeJuego.Provider>
              </SinEncoger>
              <p aria-live="polite" className="sr-only">
                {mensaje?.texto ?? ""}
              </p>

              {/* Acciones del juego (Listo, Vaciar…) y la pista; o el pase cuando se
                  resolvió. La fila tiene siempre su alto, aunque esté vacía: que
                  aparezca «Siguiente ejercicio» no mueve nada. */}
              {resuelto ? (
                <Boton onClick={siguiente} autoFocus large={large} icono={ultimo ? undefined : <IconoSiguiente />} className="w-full flex-row-reverse">
                  {ultimo ? "Ver cómo terminó" : "Siguiente ejercicio"}
                </Boton>
              ) : (
                <div className="flex gap-3 min-h-14">
                  <div ref={setBarra} className="flex flex-1 min-w-0 gap-3 empty:hidden [&>*]:shrink-0 [&>*:first-child]:flex-1 [&>*:first-child]:shrink [&>*:first-child]:min-w-[6rem]" />
                  {intentos >= 2 && (
                    <Boton
                      variante="secundario"
                      large={large}
                      icono={<IconoPista />}
                      className="shrink-0 !px-4"
                      onClick={() => {
                        setPista((n) => n + 1);
                        setIntentos(0);
                      }}
                    >
                      Pista
                    </Boton>
                  )}
                </div>
              )}
            </div>
          )}

          {fase === "cierre" && (
            <div className="flex flex-col items-center text-center gap-3 py-1" role="status">
              <div className="self-stretch flex items-center justify-between gap-3">
                <Rotulo texto={def.nombre} />
                {hechos >= total && <RuedaProgreso total={total} completados={total} actual={total} />}
              </div>
              <Suspense fallback={<Cargando />}>
                <Portada final config={config} />
              </Suspense>
              <Letrero grande large={large} className="-mt-6" detalle={hechos >= total ? `Terminaron los ${total} ejercicios.` : "Gracias por tu tiempo."}>
                {hechos >= total ? "¡Listo!" : "Listo por hoy."}
              </Letrero>

              {/* En la sesión: cómo le resultó (opcional; sirve para sugerir el nivel). */}
              {enSesion && (
                <fieldset className="m-0 p-0 border-0 w-full max-w-md grid gap-2.5 mt-1">
                  <legend className={`mx-auto mb-2 font-semibold text-tinta ${large ? "text-[21px]" : "text-[18px]"}`}>¿Cómo le resultó? (opcional)</legend>
                  <div className="flex gap-2" role="radiogroup">
                    {DIFICULTADES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={dificultad === d}
                        onClick={() => {
                          const v = dificultad === d ? null : d;
                          setDificultad(v);
                          enSesion.onDificultad(v);
                        }}
                        className={`flex-1 min-h-14 px-3 rounded-2xl border-2 font-sans font-semibold whitespace-nowrap cursor-pointer focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${texto} ${
                          dificultad === d ? "border-verde-profundo bg-verde-tenue text-verde-profundo" : "border-borde bg-white text-tinta hover:border-verde-serenidad"
                        }`}
                      >
                        {dificultadLabel[d]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {!enSesion && registro && <CierreConRegistro registro={registro} large={large} />}
              <Boton
                variante={enSesion || registro ? "texto" : "secundario"}
                large={large}
                className="w-full max-w-sm mt-1"
                onClick={() => {
                  setSemilla(nuevaSemilla());
                  if (enSesion) empezar();
                  else setFase("inicio");
                }}
              >
                Jugar otra vez
              </Boton>
            </div>
          )}
        </div>

        {/* Fuera del cuadro, solo «Terminar por hoy» y la pantalla completa. */}
        <div className="flex items-center justify-between gap-2 px-1">
          {fase === "juego" ? (
            <Boton variante="texto" large={large} onClick={terminarPorHoy} icono={<IconoSalir />} className="-ml-3">
              Terminar por hoy
            </Boton>
          ) : (
            <span />
          )}
          {botonCine}
        </div>
      </div>
      </div>
    </section>
  );
}

// Registro en el cierre: cómo le resultó (opcional) y si lo pudieron hacer.
// «En parte» pide qué ayuda necesitó, como en el resto de la app.
function CierreConRegistro({ registro, large }: { registro: RegistroJuego; large: boolean }) {
  const [dificultad, setDificultad] = useState<Dificultad | null>(null);
  const [paso, setPaso] = useState<"preguntas" | "ayuda" | "listo">("preguntas");
  const [ayuda, setAyuda] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const texto = large ? "text-[20px]" : "text-[18px]";
  const titulo = `m-0 font-semibold text-tinta ${large ? "text-[22px]" : "text-[19px]"}`;

  async function guardar(v: ValorRegistro, comentario?: string) {
    setGuardando(true);
    setError("");
    try {
      await registro.guardar(v, dificultad, comentario);
      setPaso("listo");
    } catch {
      setError("No pudimos guardar. Probá de nuevo.");
    }
    setGuardando(false);
  }

  if (paso === "listo")
    return (
      <div className="w-full max-w-md grid gap-3 mt-2">
        <p className={`m-0 rounded-2xl bg-fila-fria px-4 py-3 text-semaforo-verde-texto ${texto}`}>Registrado. ¡Gracias por contarnos!</p>
        {registro.onListo && (
          <Boton large={large} className="w-full" onClick={registro.onListo} autoFocus>
            {registro.textoListo ?? "Volver"}
          </Boton>
        )}
      </div>
    );

  if (paso === "ayuda")
    return (
      <div className="w-full max-w-md grid gap-3 mt-2 text-left">
        <label className={titulo} htmlFor="ayuda-juego">
          ¿Qué ayuda necesitó?
        </label>
        <textarea
          id="ayuda-juego"
          value={ayuda}
          onChange={(e) => setAyuda(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Ej.: hubo que recordarle la consigna, le ayudamos a tocar las piezas…"
          className={`w-full rounded-2xl border-[1.5px] border-borde-campo bg-white px-4 py-3 font-sans leading-relaxed text-tinta resize-y ${large ? "text-[19px]" : "text-[17px]"}`}
        />
        {error && <p className="m-0 text-[15px] text-alerta-texto">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Boton variante="secundario" large={large} onClick={() => setPaso("preguntas")} disabled={guardando}>
            Atrás
          </Boton>
          <Boton large={large} onClick={() => ayuda.trim() && guardar("partial", ayuda.trim())} disabled={!ayuda.trim() || guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </Boton>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-md grid gap-5 mt-3 rounded-[24px] bg-white/80 border border-borde px-4 py-5 sm:px-6">
      <fieldset className="m-0 p-0 border-0 grid gap-2.5">
        <legend className={`${titulo} mb-2.5 mx-auto`}>¿Cómo le resultó?</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {DIFICULTADES.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={dificultad === d}
              onClick={() => setDificultad(dificultad === d ? null : d)}
              className={`min-h-14 rounded-2xl border-2 font-sans font-semibold cursor-pointer focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${texto} ${
                dificultad === d ? "border-tinta bg-tinta text-white" : "border-borde-campo bg-white text-tinta hover:border-verde-serenidad"
              }`}
            >
              {dificultadLabel[d]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-2.5">
        <p className={titulo}>¿Lo pudieron hacer?</p>
        <div className="grid gap-2">
          <Boton large={large} onClick={() => guardar("done")} disabled={guardando}>
            Sí
          </Boton>
          <div className="grid grid-cols-2 gap-2">
            <Boton variante="secundario" large={large} onClick={() => setPaso("ayuda")} disabled={guardando}>
              En parte
            </Boton>
            <Boton variante="secundario" large={large} onClick={() => guardar("no")} disabled={guardando}>
              No
            </Boton>
          </div>
        </div>
        {error && <p className="m-0 text-[15px] text-alerta-texto">{error}</p>}
      </div>
    </div>
  );
}

// Un contenedor que nunca se achica: guarda el alto más grande que tuvo
// su contenido y lo usa de mínimo. Se reinicia al empezar otra partida.
function SinEncoger({ reinicio, children }: { reinicio: unknown; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const c = caja.current;
    const d = dentro.current;
    if (!c || !d) return;
    let max = 0;
    c.style.minHeight = "";
    const medir = () => {
      if (d.offsetHeight > max) {
        max = d.offsetHeight;
        c.style.minHeight = `${max}px`;
      }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(d);
    return () => ro.disconnect();
  }, [reinicio]);
  return (
    <div ref={caja}>
      <div ref={dentro}>{children}</div>
    </div>
  );
}

// En la sesión, el juego entra entero en la pantalla, sin scroll: si no
// cabe entre su borde de arriba y la barra de abajo de la sesión
// (data-pie), se achica parejo (como mucho al 70 %). En el celular además
// gana ancho, para que el contenido se acomode mejor; en pantallas anchas se
// centra (ahí, más ancho haría más altas las escenas). No mide desempeño ni cambia el juego.
const ESCALA_MINIMA = 0.7;
function useAjusteAPantalla(activo: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [alto, setAlto] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!activo || !el) {
      setEscala(1);
      return;
    }
    let actual = 1;
    // Cuando cambia el contenido, la escala solo puede bajar (si subiera y
    // bajara, el juego «respiraría»); al cambiar el tamaño de la ventana, se
    // recalcula entera.
    const medir = (libre = false) => {
      const natural = el.offsetHeight; // sin la transformación
      const arriba = el.parentElement!.getBoundingClientRect().top + window.scrollY;
      const pie = document.querySelector<HTMLElement>("[data-pie]");
      const margenPie = pie ? parseFloat(getComputedStyle(pie).marginTop) || 0 : 0;
      const altoPie = (pie?.offsetHeight ?? 0) + (window.matchMedia("(min-width: 640px)").matches ? margenPie : 0);
      const disponible = window.innerHeight - arriba - altoPie - 10;
      const s = Math.max(ESCALA_MINIMA, Math.min(1, disponible / Math.max(1, natural)));
      setAlto(natural);
      // Con margen, para no oscilar al cambiar el ancho.
      if (!libre && s > actual) return;
      if (Math.abs(s - actual) > 0.015 || (s === 1 && actual !== 1)) {
        actual = s;
        setEscala(s);
      }
    };
    const alCambiarVentana = () => medir(true);
    medir(true);
    const ro = new ResizeObserver(() => medir());
    ro.observe(el);
    window.addEventListener("resize", alCambiarVentana);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", alCambiarVentana);
    };
  }, [activo]);
  const achica = activo && escala < 1;
  const angosta = typeof window !== "undefined" && window.innerWidth < 640;
  return {
    ref,
    externo: achica ? { height: alto * escala } : undefined,
    interno: achica ? (angosta ? { width: `${100 / escala}%`, transform: `scale(${escala})`, transformOrigin: "top left" } : { transform: `scale(${escala})`, transformOrigin: "top center" }) : undefined,
  };
}

// Pantalla completa («modo cine»): usa la API del navegador cuando existe
// (computadora, Android); en iPhone, donde no está disponible para páginas,
// la actividad cubre la pantalla con una capa fija. Escape siempre sale.
function usePantallaCompleta() {
  const ref = useRef<HTMLElement | null>(null);
  const [activo, setActivo] = useState(false);
  const [nativo, setNativo] = useState(false);

  useEffect(() => {
    const cambio = () => {
      if (!document.fullscreenElement && nativo) {
        setActivo(false);
        setNativo(false);
      }
    };
    document.addEventListener("fullscreenchange", cambio);
    return () => document.removeEventListener("fullscreenchange", cambio);
  }, [nativo]);

  // Capa fija: bloquea el scroll de la página y sale con Escape.
  useEffect(() => {
    if (!activo || nativo) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setActivo(false);
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", tecla);
    };
  }, [activo, nativo]);

  async function alternar() {
    if (activo) {
      if (nativo && document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      setActivo(false);
      setNativo(false);
      return;
    }
    const el = ref.current;
    if (el && document.fullscreenEnabled && el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
        setNativo(true);
        setActivo(true);
        return;
      } catch {
        // Si el navegador no deja, se usa la capa fija.
      }
    }
    setNativo(false);
    setActivo(true);
  }

  return { ref, activo, nativo, alternar };
}
