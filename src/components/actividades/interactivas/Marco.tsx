import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { nuevaSemilla } from "../../../lib/actividades/azar";
import type { ExtrasInteractiva } from "../../../lib/actividades/contrato";
import { prepararSesion } from "../../../lib/actividades/registro";
import { detenerVoz } from "../../../lib/voz";
import { BotonEscuchar } from "../ClasificarNumeros";
import { Boton } from "./ui";
import type { Control } from "./comun";
import { Rotulo, RuedaProgreso } from "../pueblo/Ornamento";

// Marco común de las actividades «Un día en el pueblo»: cada actividad es un
// lugar con su rótulo pintado. Inicio con la escena y la consigna; un
// ejercicio por vez con la rueda de carreta que se pinta como progreso
// (para lectores: «Ejercicio 2 de 5»); mensajes en una región aria-live;
// «Ver una pista» tras 2 intentos en el mismo paso; «Terminar por hoy»
// siempre a mano; cierre con el momento final del lugar, sin resumen de
// desempeño. No guarda nada ni toca el registro Sí / En parte / No.

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
};

type Mensaje = { tipo: "ok" | "reintento" | "info"; texto: string } | null;

const Cargando = () => <div className="min-h-[280px] rounded-[20px] bg-beige-serenidad/60" aria-busy="true" />;

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
  const [hechos, setHechos] = useState(0);
  const zona = useRef<HTMLDivElement>(null);
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
        setMensaje({ tipo: "ok", texto });
      },
      reintento: (texto = "Probemos otra vez.") => {
        setIntentos((n) => n + 1);
        setMensaje({ tipo: "reintento", texto });
      },
      aviso: (texto) => setMensaje({ tipo: "info", texto }),
      listo: () => {
        setResuelto(true);
        setHechos((n) => n + 1);
        setIntentos(0);
        setMensaje({ tipo: "ok", texto: "Muy bien." });
      },
      pista,
      large,
      indice,
      total,
    }),
    [pista, large, indice, total],
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
    <section aria-label={def.nombre} className="min-w-0">
      {fase === "inicio" && (
        <div className="flex flex-col items-center text-center gap-4 py-1">
          <h3 className="m-0 -mb-1">
            <Rotulo texto={def.nombre} size="lg" />
          </h3>
          <Suspense fallback={<Cargando />}>
            <Portada config={config} />
          </Suspense>
          <p className={`m-0 leading-snug text-tinta ${large ? "text-[26px]" : "text-[24px]"}`}>{consigna}</p>
          <BotonEscuchar texto={consigna} />
          <p className={`m-0 text-tinta-suave ${large ? "text-[20px]" : "text-[18px]"}`}>
            Son {total} {total === 1 ? "ejercicio" : "ejercicios"}. Sin apuro: podés terminar cuando quieras.
          </p>
          <Boton onClick={empezar} large={large} className="w-full max-w-xs">
            Empezar
          </Boton>
        </div>
      )}

      {fase === "juego" && (
        <div className="grid gap-4">
          <div ref={zona} tabIndex={-1} className="outline-none flex items-center justify-between gap-3">
            <h3 className="m-0 min-w-0">
              <Rotulo texto={def.nombre} />
            </h3>
            <RuedaProgreso total={total} completados={hechos} actual={indice + 1} />
          </div>

          <Suspense fallback={<Cargando />}>
            <Juego key={`${semilla}-${indice}`} ejercicio={ejercicios[indice]} config={config} ctl={ctl} />
          </Suspense>

          {/* Lo que pasó, en palabras (también para lectores de pantalla). */}
          <p
            aria-live="polite"
            className={`m-0 flex items-center gap-2.5 rounded-2xl ${mensaje ? "min-h-14 px-4 py-2" : "min-h-0 p-0"} ${large ? "text-[22px]" : "text-[20px]"} ${
              mensaje?.tipo === "ok" ? "bg-mostaza-vital/45 text-tinta font-semibold" : mensaje?.tipo === "reintento" ? "bg-aviso text-aviso-texto font-semibold" : "text-tinta-suave"
            }`}
          >
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
        <div className="flex flex-col items-center text-center gap-3 py-1" role="status">
          <div className="self-stretch flex items-center justify-between gap-3">
            <Rotulo texto={def.nombre} />
            {hechos >= total && <RuedaProgreso total={total} completados={total} actual={total} />}
          </div>
          <Suspense fallback={<Cargando />}>
            <Portada final config={config} />
          </Suspense>
          <p className={`m-0 font-serif leading-tight text-tinta ${large ? "text-[32px]" : "text-[28px]"}`}>Listo por hoy.</p>
          <p className={`m-0 text-tinta-suave ${large ? "text-[22px]" : "text-[20px]"}`}>Gracias por tu tiempo.</p>
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
  );
}
