import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { NivelCognitivo } from "../../lib/mediaResources";
import { nivelCognitivoLabel } from "../../lib/mediaResources";
import { moduloTheme } from "../../lib/modulos";
import { ayudaDeEtapa, escenasVisibles, opcionDe, plantilla, textoPrincipal, valorUno, type Guion, type Progreso, type Respuestas } from "../../lib/sesiones";
import { cuandoParar } from "../../lib/bloquesGerontogimnasia";
import { BotonVoz, Hoja } from "./comun";
import { SesionContexto, type CtxSesion, type DatosSesion } from "./contexto";
import { Portada, VistaEscena } from "./Escenas";

export type { DatosSesion } from "./contexto";

// La sesión guiada: portada y una escena por pantalla, a pantalla completa.
// Arriba: salir, el avance, escuchar y (en ejercicios) «Parar». Abajo, en
// cada escena: atrás, ayuda y la acción principal.
export function SesionGuiada({
  guion,
  datos,
  etapas,
  size = "compact",
  participante = false,
  progreso,
  onProgreso,
  onSalir,
  onTerminar,
  textoTerminar = "Registrar cómo les fue",
  rutaEmergencia,
  inicio = -1,
}: {
  guion: Guion;
  datos: DatosSesion;
  etapas: NivelCognitivo[];
  size?: "compact" | "large";
  participante?: boolean;
  progreso?: Progreso | null;
  // Guarda el avance (la misión de la semana) mientras se hace.
  onProgreso?: (p: Progreso) => void;
  onSalir: () => void;
  onTerminar: (p: Progreso) => void;
  textoTerminar?: string;
  rutaEmergencia?: string;
  // Escena con que abre (-1: la portada). Para revisar una escena suelta.
  inicio?: number;
}) {
  const large = size === "large";
  const [idx, setIdx] = useState(inicio); // -1: portada
  const [respuestas, setRespuestas] = useState<Respuestas>(() => progreso?.respuestas ?? {});
  const escenaMision = guion.escenas.find((e) => e.tipo === "mision");
  const veces = escenaMision?.tipo === "mision" ? escenaMision.veces : 0;
  const [marcas, setMarcas] = useState<boolean[]>(() => Array.from({ length: veces }, (_, i) => !!progreso?.mision?.marcas[i]));
  const [panel, setPanel] = useState<null | "ayuda" | "parar">(null);

  const escenas = useMemo(() => escenasVisibles(guion, respuestas), [guion, respuestas]);
  const escena = idx >= 0 ? escenas[Math.min(idx, escenas.length - 1)] : null;
  const m = datos.modulo ? moduloTheme[datos.modulo] : moduloTheme.bienvenida;
  const tema = { claro: m.from, fuerte: m.to, tinta: m.ink, relleno: `${m.to}80` };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [idx]);

  const armarProgreso = useCallback(
    (r: Respuestas, mk: boolean[], extra?: Partial<Progreso>): Progreso => {
      const p: Progreso = { respuestas: r, ...extra };
      if (escenaMision?.tipo === "mision") {
        // Lo elegido antes de la misión, para recordarlo en la semana.
        const elegidas = guion.escenas.flatMap((e) => {
          const v = e.tipo === "elegir" ? valorUno(r, e.clave) : null;
          const o = v && e.tipo === "elegir" ? opcionDe(guion, e.clave, v, r) : null;
          return o ? [o] : [];
        });
        const detalle = elegidas.map((o) => o.texto).join(" · ");
        p.mision = {
          clave: escenaMision.clave,
          veces,
          marcas: mk,
          texto: plantilla(escenaMision.texto, guion, r),
          detalle,
          icono: elegidas.find((o) => o.icono !== "otra")?.icono ?? guion.icono,
        };
      }
      return p;
    },
    [escenaMision, guion, veces],
  );

  // «Ayuda»: lo del guion y, si no trae, la ayuda validada de la ficha.
  const consejos = guion.ayuda.length ? guion.ayuda : datos.ayuda ? [datos.ayuda] : [];
  const porEtapa = ayudaDeEtapa(guion.ayudaPorEtapa ?? datos.adaptacionPorEtapa, etapas);

  const ctx: CtxSesion = {
    guion,
    datos,
    etapas,
    large,
    participante,
    tema,
    respuestas,
    responder: (clave, valor) => setRespuestas((r) => ({ ...r, [clave]: valor })),
    marcas,
    marcar: (i) => {
      const mk = marcas.map((v, k) => (k === i ? !v : v));
      setMarcas(mk);
      onProgreso?.(armarProgreso(respuestas, mk));
    },
    siguiente: () => setIdx((i) => Math.min(i + 1, escenas.length - 1)),
    anterior: idx >= 0 ? () => setIdx((i) => i - 1) : null,
    abrirAyuda: consejos.length || porEtapa.length || datos.adaptacion ? () => setPanel("ayuda") : null,
    abrirParar: () => setPanel("parar"),
    terminar: (extra) => onTerminar(armarProgreso(respuestas, marcas, { terminada: new Date().toISOString(), ...extra })),
    textoTerminar,
  };

  // Lo que se lee con «Escuchar».
  const voz = !escena
    ? `${datos.titulo}. ${guion.frase}`
    : escena.tipo === "seguridad"
      ? cuandoParar
      : escena.tipo === "elegir"
        ? `${escena.titulo} ${escena.opciones.map((o) => o.texto).join(", ")}.`
        : plantilla(textoPrincipal(escena), guion, respuestas);

  const pista = escena && "pista" in escena && escena.pista ? plantilla(escena.pista, guion, respuestas) : null;

  return (
    <SesionContexto.Provider value={ctx}>
      <div
        className="min-h-dvh flex flex-col overflow-x-clip bg-fondo-papel"
        style={{ backgroundImage: `radial-gradient(120% 60% at 50% -10%, ${tema.claro}55 0%, transparent 60%)` }}
      >
        <header className="sticky top-0 z-20 px-4 pt-3 pb-2 bg-fondo-papel/85 backdrop-blur-sm">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onSalir}
              aria-label="Salir de la actividad"
              className="shrink-0 w-11 h-11 inline-flex items-center justify-center rounded-full border-0 bg-transparent text-tinta-suave cursor-pointer hover:bg-campo"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div
              className="flex-1 flex gap-1"
              role="progressbar"
              aria-label="Avance de la actividad"
              aria-valuemin={0}
              aria-valuemax={escenas.length}
              aria-valuenow={Math.max(0, idx + 1)}
            >
              {escenas.map((_, i) => (
                <span key={i} className="flex-1 h-1.5 rounded-full transition-colors duration-300" style={{ background: i <= idx ? tema.fuerte : "#e4dfc7" }} />
              ))}
            </div>
            <BotonVoz texto={voz} />
            {guion.ejercicio && idx >= 0 && (
              <button
                type="button"
                onClick={() => setPanel("parar")}
                className="shrink-0 min-h-11 px-4 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-alerta-borde bg-alerta text-alerta-texto font-bold text-[15px] cursor-pointer hover:bg-[#f7e0d8]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" />
                </svg>
                Parar
              </button>
            )}
          </div>
        </header>

        <main key={idx} className="im-paso flex-1 w-full max-w-xl mx-auto px-5 pt-3 sm:pt-8 flex flex-col sm:justify-center">
          {escena ? <VistaEscena e={escena} /> : <Portada />}
        </main>
      </div>

      {panel === "ayuda" && (
        <Hoja titulo="Si necesita ayuda" onClose={() => setPanel(null)}>
          <div className="grid gap-3 text-[16px] leading-relaxed text-tinta">
            {pista && (
              <div className="rounded-2xl bg-beige-serenidad px-4 py-3">
                <p className="m-0 mb-1 text-[12.5px] tracking-[0.14em] uppercase font-semibold text-tinta-tenue">Una pista</p>
                <p className="m-0">{pista}</p>
              </div>
            )}
            <ul className="m-0 p-0 list-none grid gap-2.5">
              {consejos.map((a) => (
                <li key={a} className="flex items-start gap-2.5">
                  <span className="mt-2 w-2 h-2 shrink-0 rounded-full" style={{ background: tema.fuerte }} aria-hidden="true" />
                  {a}
                </li>
              ))}
            </ul>
            {!porEtapa.length && datos.adaptacion && <p className="m-0 rounded-2xl bg-fila-fria px-4 py-3 whitespace-pre-line">{datos.adaptacion}</p>}
            {porEtapa.length > 0 && (
              <div className="rounded-2xl bg-fila-fria px-4 py-3 grid gap-1.5">
                <p className="m-0 text-[12.5px] tracking-[0.14em] uppercase font-semibold text-tinta-tenue">{etapas.length ? "Para su etapa" : "Según la etapa"}</p>
                {porEtapa.map((a) => (
                  <p key={a.etapa} className="m-0">
                    {!etapas.length && <strong className="font-semibold">{nivelCognitivoLabel[a.etapa]}: </strong>}
                    {etapas.length ? a.texto.charAt(0).toUpperCase() + a.texto.slice(1) : a.texto}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Hoja>
      )}

      {panel === "parar" && (
        <Hoja titulo="Paremos acá" tono="alerta" onClose={() => setPanel(null)}>
          <p className="m-0 text-[17px] leading-relaxed text-tinta">Si hay dolor, mareo, falta de aire o no se siente bien, paren y descansen. No insistan.</p>
          <div className="mt-4 rounded-2xl bg-alerta border border-alerta-borde px-4 py-3.5 text-alerta-texto text-[16px] leading-snug">
            <strong>Urgente:</strong> dolor en el pecho, desmayo, mucha falta de aire o un síntoma súbito.
            <div className="mt-3 flex flex-wrap gap-2">
              {rutaEmergencia && (
                <Link to={rutaEmergencia} className="inline-flex items-center min-h-11 px-4 rounded-full bg-semaforo-rojo text-white font-bold no-underline hover:bg-alerta-texto">
                  Pedir ayuda ahora
                </Link>
              )}
              <a href="tel:911" className="inline-flex items-center min-h-11 px-4 rounded-full border-[1.5px] border-alerta-texto/40 bg-white text-alerta-texto font-bold no-underline">
                Llamar al 911
              </a>
            </div>
          </div>
          <div className="mt-5 grid gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPanel(null);
                ctx.terminar({ terminada: `parada:${new Date().toISOString()}` });
              }}
              className="min-h-[54px] rounded-full border-0 bg-tinta text-white font-semibold text-[17px] cursor-pointer hover:bg-verde-profundo"
            >
              Terminar por hoy
            </button>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="min-h-[54px] rounded-full border-[1.5px] border-borde bg-white text-tinta font-semibold text-[17px] cursor-pointer hover:border-verde-serenidad"
            >
              Ya pasó, seguir
            </button>
          </div>
        </Hoja>
      )}
    </SesionContexto.Provider>
  );
}
