import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { nuevaSemilla } from "../../../lib/actividades/azar";
import type { ExtrasInteractiva } from "../../../lib/actividades/contrato";
import { prepararSesion } from "../../../lib/actividades/registro";
import { detenerVoz } from "../../../lib/voz";
import { BotonEscuchar } from "../ClasificarNumeros";
import { Boton } from "./ui";
import { TemaJuego, type Control } from "./comun";
import { JuegoClasificar } from "./JuegoClasificar";
import { JuegoOrdenar } from "./JuegoOrdenar";
import { JuegoIguales } from "./JuegoIguales";
import { JuegoContar } from "./JuegoContar";
import { JuegoParejas } from "./JuegoParejas";
import { JuegoVentanas, PortadaVentanas } from "./JuegoVentanas";
import { JuegoPalabra } from "./JuegoPalabra";
import { JuegoPago } from "./JuegoPago";
import { JuegoOrientacion } from "./JuegoOrientacion";

// Marco común de las actividades interactivas: inicio con la consigna, un
// ejercicio por vez con progreso neutro («Ejercicio 2 de 5»), mensajes en una
// región aria-live, «Ver una pista» tras 2 intentos en el mismo paso,
// «Terminar por hoy» siempre a mano y un cierre sin resumen de desempeño.
// No guarda nada ni toca el registro Sí / En parte / No.

export interface PropsJuego {
  ejercicio: unknown;
  config: Record<string, unknown>;
  ctl: Control;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JUEGOS: Record<string, ComponentType<any>> = {
  "clasificar-objetos": JuegoClasificar,
  "ordenar-pasos": JuegoOrdenar,
  "ordenar-secuencia": JuegoOrdenar,
  "encontrar-iguales": JuegoIguales,
  "contar-por-tipo": JuegoContar,
  parejas: JuegoParejas,
  "recordar-posiciones": JuegoVentanas,
  "formar-palabra": JuegoPalabra,
  "pago-exacto": JuegoPago,
  "orientacion-hoy": JuegoOrientacion,
};

// Actividades con escena propia: portada ilustrada y marco de noche.
const PORTADAS: Record<string, ComponentType<{ final?: boolean }>> = {
  "recordar-posiciones": PortadaVentanas,
};
const NOCHE = new Set(["recordar-posiciones"]);

type Mensaje = { tipo: "ok" | "reintento" | "info"; texto: string } | null;

export default function ActividadInteractiva({ extras, size = "compact" }: { extras: ExtrasInteractiva; size?: "compact" | "large" }) {
  const large = size === "large";
  const [semilla, setSemilla] = useState(nuevaSemilla);
  const sesion = useMemo(() => prepararSesion(extras, semilla), [extras, semilla]);
  const [fase, setFase] = useState<"inicio" | "juego" | "cierre">("inicio");
  const [indice, setIndice] = useState(0);
  const [intentos, setIntentos] = useState(0);
  const [pista, setPista] = useState(0);
  const [resuelto, setResuelto] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const zona = useRef<HTMLDivElement>(null);
  useEffect(() => () => detenerVoz(), []);

  // Al cambiar de ejercicio, el foco vuelve al comienzo (teclado y lectores).
  useEffect(() => {
    if (fase === "juego") zona.current?.focus({ preventScroll: true });
  }, [indice, fase]);

  const ctl: Control = useMemo(
    () => ({
      acierto: (texto = "Muy bien.") => {
        setIntentos(0);
        setMensaje({ tipo: "ok", texto });
      },
      reintento: (texto = "Probemos otra vez.") => {
        setIntentos((n) => n + 1);
        setMensaje({ tipo: "reintento", texto });
      },
      aviso: (texto) => setMensaje({ tipo: "info", texto }),
      listo: () => {
        setResuelto(true);
        setIntentos(0);
        setMensaje({ tipo: "ok", texto: "Muy bien." });
      },
      pista,
      large,
    }),
    [pista, large],
  );

  if (!sesion.ok)
    return (
      <section className="rounded-[26px] bg-white border border-borde p-6 text-center">
        <p className={`m-0 text-tinta ${large ? "text-[22px]" : "text-[20px]"}`}>Esta actividad no está disponible por ahora.</p>
        <p className="m-0 mt-1 text-[16px] text-tinta-suave">Podés seguir con las demás actividades del día.</p>
      </section>
    );

  const { def, config, ejercicios } = sesion;
  const Juego = JUEGOS[def.tipo];
  const consigna = def.consigna(config);
  const total = ejercicios.length;
  const ultimo = indice + 1 >= total;
  const noche = NOCHE.has(def.tipo);
  const Portada = PORTADAS[def.tipo];
  const c = noche
    ? {
        seccion: "rounded-[28px] p-4 sm:p-6 min-w-0 overflow-hidden text-white bg-[radial-gradient(130%_90%_at_85%_0%,var(--color-verde-profundo)_0%,var(--color-tinta)_62%)] shadow-elevada",
        tinta: "text-white",
        suave: "text-white/75",
        ok: "bg-verde-serenidad/30 text-white font-semibold ring-1 ring-verde-serenidad/60",
        reintento: "bg-mostaza-vital/15 text-mostaza-vital font-semibold ring-1 ring-mostaza-vital/40",
        info: "text-white/85",
      }
    : {
        seccion: "rounded-[26px] bg-white border border-borde p-4 sm:p-6 min-w-0",
        tinta: "text-tinta",
        suave: "text-tinta-suave",
        ok: "bg-[#e3efe3] text-semaforo-verde-texto font-semibold",
        reintento: "bg-aviso text-aviso-texto font-semibold",
        info: "text-tinta-suave",
      };

  function empezar() {
    setIndice(0);
    setIntentos(0);
    setResuelto(false);
    setMensaje(null);
    setFase("juego");
  }
  function siguiente() {
    if (ultimo) return setFase("cierre");
    setIndice((i) => i + 1);
    setIntentos(0);
    setResuelto(false);
    setMensaje(null);
  }

  return (
    <TemaJuego.Provider value={noche ? "noche" : "claro"}>
    <section aria-label={def.nombre} className={c.seccion}>
      {fase === "inicio" && (
        <div className="flex flex-col items-center text-center gap-4 py-2">
          {Portada && <Portada />}
          <h3 className={`m-0 font-serif font-normal leading-tight ${c.tinta} ${large ? "text-[34px]" : "text-[30px]"}`}>{def.nombre}</h3>
          <p className={`m-0 leading-snug ${c.tinta} ${large ? "text-[26px]" : "text-[24px]"}`}>{consigna}</p>
          <BotonEscuchar texto={consigna} />
          <p className={`m-0 ${c.suave} ${large ? "text-[20px]" : "text-[18px]"}`}>
            Son {total} {total === 1 ? "ejercicio" : "ejercicios"}. Sin apuro: podés terminar cuando quieras.
          </p>
          <Boton onClick={empezar} large={large} className="w-full max-w-xs">
            Empezar
          </Boton>
        </div>
      )}

      {fase === "juego" && Juego && (
        <div className="grid gap-4">
          <div ref={zona} tabIndex={-1} className="outline-none">
            <p className={`m-0 font-semibold ${c.suave} ${large ? "text-[20px]" : "text-[18px]"}`}>
              Ejercicio {indice + 1} de {total}
            </p>
          </div>

          <Juego key={`${semilla}-${indice}`} ejercicio={ejercicios[indice]} config={config} ctl={ctl} />

          {/* Lo que pasó, en palabras (también para lectores de pantalla). */}
          <p
            aria-live="polite"
            className={`m-0 flex items-center gap-2.5 rounded-2xl ${mensaje ? "min-h-14 px-4 py-2" : "min-h-0 p-0"} ${large ? "text-[22px]" : "text-[20px]"} ${
              mensaje?.tipo === "ok" ? c.ok : mensaje?.tipo === "reintento" ? c.reintento : c.info
            }`}
          >
            {mensaje?.tipo === "ok" && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            )}
            <span>{mensaje?.texto ?? ""}</span>
          </p>

          {resuelto && (
            <Boton onClick={siguiente} autoFocus large={large} className="w-full">
              {ultimo ? "Terminar" : "Siguiente ejercicio"}
            </Boton>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {intentos >= 2 && !resuelto && (
              <Boton
                variante="secundario"
                large={large}
                onClick={() => {
                  setPista((n) => n + 1);
                  setIntentos(0);
                }}
              >
                Ver una pista
              </Boton>
            )}
            {!(resuelto && ultimo) && (
              <Boton variante="secundario" large={large} onClick={() => setFase("cierre")}>
                Terminar por hoy
              </Boton>
            )}
          </div>
        </div>
      )}

      {fase === "cierre" && (
        <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
          {Portada ? (
            <Portada final />
          ) : (
            <span aria-hidden="true" className="w-16 h-16 rounded-full bg-[#e3efe3] text-semaforo-verde-texto flex items-center justify-center">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            </span>
          )}
          <p className={`m-0 font-serif leading-tight ${c.tinta} ${large ? "text-[32px]" : "text-[28px]"}`}>Listo por hoy.</p>
          <p className={`m-0 ${c.suave} ${large ? "text-[22px]" : "text-[20px]"}`}>Gracias por tu tiempo.</p>
          <Boton
            variante="secundario"
            large={large}
            className="mt-2 w-full max-w-xs"
            onClick={() => {
              setSemilla(nuevaSemilla());
              setFase("inicio");
            }}
          >
            Volver al inicio
          </Boton>
        </div>
      )}
    </section>
    </TemaJuego.Provider>
  );
}
