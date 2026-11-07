import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationFeedback,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
  type MessagePayload,
} from "@elevenlabs/react";
import { classifyMessage, detectarRiesgo } from "../../lib/chatbot";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { WHATSAPP_EQUIPO, waEquipo, waLink } from "../../lib/whatsapp";
import { detenerVoz, lecturaDisponible, leerEnVoz } from "../../lib/voz";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";
import { Icono } from "../../components/landing/Piezas";

// Clara: la asistente de la sección Ayuda, un agente de ElevenLabs
// (Conversational AI). Mismo chat de siempre, con dos formas de hablarle:
//   · escribiendo: sesión de solo texto, la respuesta llega en vivo;
//   · con la voz: «Hablar con Clara» abre una conversación hablada y lo que
//     dicen las dos partes aparece en el chat.
// Agente público: alcanza con el agentId (nunca la API key en el navegador).
//
// Seguridad, igual que antes: las urgencias se detectan primero acá, sin IA
// (detectarRiesgo), y muestran la guía de SOS al instante. Si Clara no se
// puede conectar, responden las respuestas fijas de siempre.
//
// Herramientas que el agente puede llamar (configurarlas en ElevenLabs
// como «client tools» con estos nombres):
//   · derivar_whatsapp({ mensaje }): muestra el mensaje para el equipo, ya
//     redactado, con el botón para abrir WhatsApp.
//   · mostrar_emergencia(): muestra el acceso a la guía de SOS.
const CLARA_AGENT_ID = "agent_6101m6vtn05pf4mtqvys2jnavkt4";

// Preguntas para empezar: mismos íconos y colores de la paleta oficial.
const preguntasIniciales = [
  { t: "¿Cómo registro una actividad?", icono: "check", fondo: "#6a969c", tinta: "#ffffff" },
  { t: "Repite la misma pregunta", icono: "cerebro", fondo: "#e8b5a1", tinta: "#1f3338" },
  { t: "No quiere comer", icono: "manzana", fondo: "#a9c49f", tinta: "#1f3338" },
  { t: "Necesito un respiro", icono: "sol", fondo: "#f4d096", tinta: "#1f3338" },
];
const otrasPreguntas = ["Se resiste al baño", "No duerme bien", "¿Qué es la semana gratis?"];

interface Burbuja {
  key: string;
  rol: "usuario" | "asistente";
  texto: string;
  whatsapp?: string | null;
  escribiendo?: boolean;
  animar?: boolean;
  accion?: { label: string; to: string };
  porVoz?: boolean;
}

let seq = 0;
const clave = () => `b-${Date.now()}-${++seq}`;
const GUARDADO = "clara-conversacion";
const SOS = { label: "Ver qué hacer ahora", to: "/app/emergencia" };

function leerGuardado(): Burbuja[] {
  try {
    const b = JSON.parse(sessionStorage.getItem(GUARDADO) ?? "[]") as Burbuja[];
    return b.filter((x) => x.texto).map((x) => ({ ...x, escribiendo: false, animar: false }));
  } catch {
    return [];
  }
}

// Manejadores de los eventos del agente. ConversationProvider recibe los
// callbacks una vez; acá se apunta siempre a la versión actual.
interface Manejadores {
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (m: MessagePayload) => void;
  onParte: (p: { text: string; type: "start" | "delta" | "stop" }) => void;
  onError: (m: string) => void;
}

export function Asistente({ extras }: { extras?: ReactNode }) {
  const manejadores = useRef<Manejadores | null>(null);
  return (
    <ConversationProvider
      onConnect={() => manejadores.current?.onConnect()}
      onDisconnect={() => manejadores.current?.onDisconnect()}
      onMessage={(m) => manejadores.current?.onMessage(m)}
      onAgentChatResponsePart={(p) => manejadores.current?.onParte(p)}
      onError={(m) => manejadores.current?.onError(m)}
    >
      <Clara extras={extras} manejadores={manejadores} />
    </ConversationProvider>
  );
}

function Clara({ extras, manejadores }: { extras?: ReactNode; manejadores: React.MutableRefObject<Manejadores | null> }) {
  const navigate = useNavigate();
  const session = useSession();
  const firstName = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const { data: myPatient } = useMyPatient();
  const { startSession, endSession, sendUserMessage, sendContextualUpdate, getInputVolume, getOutputVolume } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();
  const { canSendFeedback, sendFeedback } = useConversationFeedback();

  const [burbujas, setBurbujas] = useState<Burbuja[]>(leerGuardado);
  const [input, setInput] = useState("");
  const [modo, setModo] = useState<"texto" | "voz" | null>(null);
  const [error, setError] = useState("");
  const [calificada, setCalificada] = useState<Record<string, boolean>>({});
  const lista = useRef<HTMLOListElement>(null);

  // Estado de la sesión de texto: el saludo del agente se omite (ya hay
  // uno en pantalla) y el primer mensaje espera a que conecte.
  const pendiente = useRef<string | null>(null);
  const saludoPorOmitir = useRef(false);
  const respuestaKey = useRef<string | null>(null);
  const modoRef = useRef(modo);
  modoRef.current = modo;
  const burbujasRef = useRef(burbujas);
  burbujasRef.current = burbujas;
  const espera = useRef<number | null>(null);
  // Al pasar de texto a voz se cierra la sesión de texto: ese cierre no
  // tiene que apagar el modo voz que ya se eligió.
  const cambiandoAVoz = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(GUARDADO, JSON.stringify(burbujas.slice(-40)));
    } catch {
      // sin sessionStorage la conversación vive solo en pantalla
    }
  }, [burbujas]);

  const vacio = burbujas.length === 0;
  // La conversación es parte de la página: mientras la persona esté al
  // final, la página sigue al texto que va apareciendo; si subió a leer
  // algo anterior, no la interrumpe.
  const pegado = useRef(true);
  useEffect(() => {
    const alFinal = () => window.scrollTo({ top: document.documentElement.scrollHeight });
    const onScroll = () => (pegado.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160);
    const ro = new ResizeObserver(() => pegado.current && alFinal());
    if (lista.current) ro.observe(lista.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [vacio]);
  useEffect(() => {
    if (vacio) return;
    pegado.current = true;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burbujas.length]);

  // Al salir de Ayuda se corta la conversación.
  useEffect(() => () => endSession(), [endSession]);

  const actualizar = (key: string, cambios: Partial<Burbuja>) => setBurbujas((bs) => bs.map((b) => (b.key === key ? { ...b, ...cambios } : b)));
  const agregar = (...nuevas: Burbuja[]) => setBurbujas((bs) => [...bs, ...nuevas]);
  const paciente = myPatient?.nombre;
  const mensajeEquipo = (pregunta: string) => `Hola, les escribo por ${paciente ?? "mi familiar"}. Tengo una consulta: ${pregunta}`;

  // Respuesta de la IA en curso: una sola burbuja que se va llenando.
  function burbujaRespuesta(): string {
    if (respuestaKey.current && burbujasRef.current.some((b) => b.key === respuestaKey.current)) return respuestaKey.current;
    const key = clave();
    respuestaKey.current = key;
    agregar({ key, rol: "asistente", texto: "", escribiendo: true, animar: true });
    return key;
  }

  // Si Clara no responde: respuestas fijas de siempre.
  function respuestaFija(pregunta: string, key: string | null) {
    const fijo = classifyMessage(pregunta);
    const esWhatsApp = fijo.escalate && /^https?:/.test(fijo.escalate.to);
    const datos = {
      texto: fijo.text,
      escribiendo: false,
      accion: esWhatsApp ? undefined : fijo.escalate,
      whatsapp: esWhatsApp ? mensajeEquipo(pregunta) : null,
    };
    if (key) actualizar(key, datos);
    else agregar({ key: clave(), rol: "asistente", animar: true, ...datos });
  }

  function limpiarEspera() {
    if (espera.current) window.clearTimeout(espera.current);
    espera.current = null;
  }

  // Lo conversado antes (por texto o por voz) para que Clara no pierda el hilo.
  function contextoPrevio() {
    const previas = burbujasRef.current.filter((b) => b.texto && !b.escribiendo).slice(-10);
    if (!previas.length) return;
    sendContextualUpdate(
      `Conversación previa con esta persona en IntegraMente en Casa:\n${previas.map((b) => `${b.rol === "usuario" ? "Persona" : "Clara"}: ${b.texto}`).join("\n")}`,
    );
  }

  const variables = () => ({
    nombre_usuario: firstName || "",
    nombre_paciente: paciente?.split(" ")[0] ?? "",
    programa: myPatient?.modalidad === "orientado" ? "Con sesiones profesionales" : "Autoguiado",
    estado_cuenta: myPatient?.estado_cuenta ?? "",
  });

  manejadores.current = {
    onConnect() {
      setError("");
      contextoPrevio();
      if (modoRef.current === "texto") {
        saludoPorOmitir.current = true;
        // Si el agente no saluda, el mensaje sale igual.
        window.setTimeout(() => {
          if (!saludoPorOmitir.current) return;
          saludoPorOmitir.current = false;
          enviarPendiente();
        }, 1500);
      }
    },
    onDisconnect() {
      limpiarEspera();
      if (cambiandoAVoz.current) cambiandoAVoz.current = false;
      else setModo(null);
      if (respuestaKey.current) {
        const b = burbujasRef.current.find((x) => x.key === respuestaKey.current);
        if (b && !b.texto) setBurbujas((bs) => bs.filter((x) => x.key !== respuestaKey.current));
        else if (b) actualizar(b.key, { escribiendo: false });
      }
      respuestaKey.current = null;
    },
    onMessage(m) {
      if (m.role === "user") {
        // En modo texto el mensaje ya está en pantalla; por voz, es la transcripción.
        if (modoRef.current !== "voz" || !m.message.trim()) return;
        agregar({ key: clave(), rol: "usuario", texto: m.message, porVoz: true });
        const riesgo = detectarRiesgo(m.message);
        if (riesgo) agregar({ key: clave(), rol: "asistente", texto: riesgo.text, accion: riesgo.escalate, animar: true });
        return;
      }
      if (modoRef.current === "texto" && saludoPorOmitir.current) {
        saludoPorOmitir.current = false;
        enviarPendiente();
        return;
      }
      limpiarEspera();
      if (modoRef.current === "voz") {
        respuestaKey.current = null;
        agregar({ key: clave(), rol: "asistente", texto: m.message, porVoz: true });
        return;
      }
      const key = burbujaRespuesta();
      actualizar(key, { texto: m.message, escribiendo: false });
      respuestaKey.current = null;
    },
    onParte(p) {
      if (modoRef.current !== "texto" || saludoPorOmitir.current) return;
      if (p.type === "start") return;
      const key = burbujaRespuesta();
      if (p.type === "delta") setBurbujas((bs) => bs.map((b) => (b.key === key ? { ...b, texto: (b.texto + p.text).trimStart() } : b)));
    },
    onError(m) {
      console.warn("Clara:", m);
      setError("No pudimos conectar con Clara. Probá de nuevo en un momento o escribinos por WhatsApp.");
    },
  };

  function enviarPendiente() {
    const texto = pendiente.current;
    if (!texto) return;
    pendiente.current = null;
    sendUserMessage(texto);
    esperarRespuesta(texto);
  }

  // Si en 20 s no llega nada, se responde con lo fijo y se corta la sesión.
  function esperarRespuesta(pregunta: string) {
    limpiarEspera();
    espera.current = window.setTimeout(() => {
      const key = respuestaKey.current;
      const b = burbujasRef.current.find((x) => x.key === key);
      if (b && b.texto) return;
      respuestaFija(pregunta, key);
      respuestaKey.current = null;
      endSession();
    }, 20_000);
  }

  function submit(text: string) {
    const pregunta = text.trim();
    if (!pregunta) return;
    setInput("");
    detenerVoz();
    agregar({ key: clave(), rol: "usuario", texto: pregunta });

    // 1) Urgencia: la guía aparece al instante, sin esperar a la IA.
    const riesgo = detectarRiesgo(pregunta);
    if (riesgo) agregar({ key: clave(), rol: "asistente", texto: riesgo.text, accion: riesgo.escalate, animar: true });

    // 2) Clara: por voz, el texto se le manda a la conversación hablada.
    if (modo === "voz" && status === "connected") {
      sendUserMessage(pregunta);
      return;
    }
    burbujaRespuesta();
    if (status === "connected" && modo === "texto") {
      sendUserMessage(pregunta);
      esperarRespuesta(pregunta);
      return;
    }
    pendiente.current = pregunta;
    setModo("texto");
    setError("");
    try {
      startSession({ agentId: CLARA_AGENT_ID, textOnly: true, stripAudioTags: true, dynamicVariables: variables() });
    } catch {
      respuestaFija(pregunta, respuestaKey.current);
      respuestaKey.current = null;
      setModo(null);
      return;
    }
    // Si no conecta en 10 s, respuestas fijas.
    espera.current = window.setTimeout(() => {
      if (pendiente.current !== pregunta) return;
      pendiente.current = null;
      respuestaFija(pregunta, respuestaKey.current);
      respuestaKey.current = null;
      endSession();
    }, 10_000);
  }

  async function hablar() {
    if (modo === "voz") {
      endSession();
      return;
    }
    setError("");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Para hablar con Clara, permití el uso del micrófono en tu navegador. También podés escribirle.");
      return;
    }
    detenerVoz();
    const habiaSesion = status !== "disconnected";
    if (habiaSesion) {
      cambiandoAVoz.current = true;
      endSession();
    }
    respuestaKey.current = null;
    setModo("voz");
    // Un instante para que se cierre la sesión de texto, si había.
    window.setTimeout(() => startSession({ agentId: CLARA_AGENT_ID, stripAudioTags: true, dynamicVariables: variables() }), habiaSesion ? 400 : 0);
  }

  // Herramientas que el agente puede usar (ver comentario de arriba).
  useConversationClientTool("derivar_whatsapp", (params: Record<string, unknown>) => {
    const mensaje = typeof params.mensaje === "string" && params.mensaje.trim() ? params.mensaje.trim() : mensajeEquipo("");
    const ultima = [...burbujasRef.current].reverse().find((b) => b.rol === "asistente");
    if (ultima && !ultima.whatsapp) actualizar(ultima.key, { whatsapp: mensaje });
    else agregar({ key: clave(), rol: "asistente", texto: "Te dejo el mensaje listo para nuestro equipo:", whatsapp: mensaje, animar: true });
    return "Listo: la persona ve el mensaje para el equipo con el botón de WhatsApp.";
  });
  useConversationClientTool("mostrar_emergencia", () => {
    agregar({ key: clave(), rol: "asistente", texto: "Si es una urgencia, llamá al 9-1-1. Acá tenés la guía para este momento:", accion: SOS, animar: true });
    return "Listo: la persona ve el acceso a la guía de emergencia.";
  });

  function nuevaConversacion() {
    endSession();
    setBurbujas([]);
    setCalificada({});
  }

  const ocupado = burbujas.some((b) => b.escribiendo);
  const enVoz = modo === "voz";
  const conectada = status === "connected";
  const ultimaRespuesta = [...burbujas].reverse().find((b) => b.rol === "asistente" && !b.escribiendo && b.texto);
  const nombrePaciente = paciente?.split(" ")[0];

  // Duración de la llamada.
  const [inicioLlamada, setInicioLlamada] = useState<number | null>(null);
  const [, setTic] = useState(0);
  useEffect(() => {
    if (enVoz && conectada) setInicioLlamada((t) => t ?? Date.now());
    if (!enVoz) setInicioLlamada(null);
  }, [enVoz, conectada]);
  useEffect(() => {
    if (!inicioLlamada) return;
    const id = window.setInterval(() => setTic((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [inicioLlamada]);
  const duracion = inicioLlamada ? Math.floor((Date.now() - inicioLlamada) / 1000) : 0;
  const reloj = `${Math.floor(duracion / 60)}:${String(duracion % 60).padStart(2, "0")}`;

  // El avatar grande late con el volumen de la voz (de Clara o de la persona).
  const orbe = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enVoz || !conectada) return;
    let raf = 0;
    let suave = 0;
    const paso = () => {
      const v = isSpeaking ? getOutputVolume() : isMuted ? 0 : getInputVolume();
      suave = suave * 0.8 + Math.min(1, v * 2.2) * 0.2;
      orbe.current?.style.setProperty("--nivel", suave.toFixed(3));
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [enVoz, conectada, isSpeaking, isMuted, getInputVolume, getOutputVolume]);

  const estadoVoz = status === "connecting" ? "Conectando con Clara…" : !conectada ? "Terminando…" : isMuted ? "Tu micrófono está en silencio" : isSpeaking ? "Clara está hablando" : "Te escucho…";

  const llamada = enVoz && conectada ? reloj : null;

  return (
    <section aria-label="Clara, asistente de IntegraMente" className="relative">
      {vacio ? (
        <Bienvenida nombre={firstName} paciente={nombrePaciente} enVoz={enVoz} onPregunta={submit} extras={extras} />
      ) : (
        <>
          {/* Quién responde: una línea, sin franja ni caja. */}
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-borde">
            <ClaraAvatar tam={30} animado={ocupado || (enVoz && isSpeaking)} />
            <div className="min-w-0 flex-1">
              <p className="m-0 font-serif text-[21px] leading-none text-tinta">Clara</p>
              <p className="m-0 mt-1 text-[12.5px] text-tinta-tenue">
                {llamada ? `En llamada · ${llamada}` : ocupado ? "Escribiendo…" : "Tu asistente de IntegraMente"}
              </p>
            </div>
            {!enVoz && (
              <button type="button" onClick={nuevaConversacion} className="shrink-0 bg-transparent border-none p-2 -mr-2 cursor-pointer text-[13px] font-semibold text-verde-profundo">
                Empezar de nuevo
              </button>
            )}
          </div>

          <ol ref={lista} className="list-none m-0 p-0 grid gap-4" aria-live="polite">
            {burbujas.map((b, i) => {
              const primeraDelGrupo = i === 0 || burbujas[i - 1].rol !== b.rol;
              return b.rol === "usuario" ? (
                <li key={b.key} className="clara-entra flex justify-end">
                  <div className="max-w-[84%] sm:max-w-[72%]">
                    {b.porVoz && (
                      <p className="m-0 mb-1 mr-1 flex items-center justify-end gap-1 text-[11.5px] font-semibold text-tinta-tenue">
                        <IconoMic /> Por voz
                      </p>
                    )}
                    <div
                      className="rounded-[22px] rounded-br-md px-4 py-3 text-[15.5px] leading-relaxed text-white"
                      style={{ backgroundImage: "linear-gradient(135deg, #4f7d83, #3f6a70)" }}
                    >
                      <span className="whitespace-pre-line">{b.texto}</span>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={b.key} className="clara-entra">
                  <RespuestaClara
                    b={b}
                    conAvatar={primeraDelGrupo}
                    paciente={paciente}
                    onAccion={(to) => navigate(to)}
                    calificar={
                      canSendFeedback && b.key === ultimaRespuesta?.key && !calificada[b.key] && !b.porVoz
                        ? (v) => {
                            sendFeedback(v);
                            setCalificada((c) => ({ ...c, [b.key]: v }));
                          }
                        : null
                    }
                    calificacion={calificada[b.key]}
                  />
                </li>
              );
            })}
          </ol>
          <p className="m-0 mt-6 text-center text-[12px] leading-relaxed text-tinta-tenue">
            Clara es una inteligencia artificial: puede equivocarse y no reemplaza a nuestro equipo de salud. Ante una urgencia, 9-1-1 o el botón SOS.
          </p>
        </>
      )}

      {/* Barra fija al pie de la pantalla (sobre el menú inferior en el
          celular): para escribir o, en una llamada, los controles de voz.
          El margen negativo absorbe el relleno inferior de la página para
          que, al final, quede igual de pegada al menú. */}
      <div className="sticky z-10 -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 pt-6 pb-3 mt-4 -mb-14 md:-mb-6 lg:-mb-8 bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 bg-gradient-to-t from-fondo-papel via-fondo-papel to-transparent">
        {error && <p className="m-0 mb-2 px-2 text-[13.5px] text-alerta-texto">{error}</p>}
        {enVoz ? (
          <div className="flex items-center gap-3 rounded-[28px] bg-white border border-borde p-2.5 pl-3 shadow-elevada" role="status">
            <div ref={orbe} className="relative shrink-0 w-14 h-14 flex items-center justify-center" style={{ ["--nivel" as string]: 0 }}>
              {conectada && <span aria-hidden="true" className="clara-onda absolute inset-1 rounded-full bg-verde-serenidad/30" />}
              <span aria-hidden="true" className="absolute inset-1 rounded-full bg-verde-tenue ring-1 ring-borde transition-transform duration-75" style={{ transform: "scale(calc(1 + var(--nivel) * 0.25))" }} />
              <span className="relative transition-transform duration-75" style={{ transform: "scale(calc(1 + var(--nivel) * 0.3))" }}>
                <ClaraAvatar tam={30} animado={status === "connecting"} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-serif text-[18px] leading-tight text-tinta truncate">{estadoVoz}</p>
              <p className="m-0 mt-0.5 text-[12.5px] text-tinta-tenue">{llamada ? `En llamada · ${llamada}` : "Hablá con naturalidad"}</p>
            </div>
            <BotonRedondo etiqueta={isMuted ? "Activar micrófono" : "Silenciar micrófono"} activo={isMuted} deshabilitado={!conectada} onClick={() => setMuted(!isMuted)}>
              {isMuted ? <IconoMicApagado /> : <IconoMic grande />}
            </BotonRedondo>
            <button
              type="button"
              onClick={() => endSession()}
              aria-label="Terminar la llamada"
              className="shrink-0 w-12 h-12 rounded-full border-0 bg-semaforo-rojo text-white cursor-pointer flex items-center justify-center hover:brightness-95"
            >
              <IconoColgar />
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-1.5 rounded-full bg-white border border-borde p-1.5 shadow-elevada focus-within:border-verde-serenidad"
          >
            <button
              type="button"
              onClick={hablar}
              aria-label="Hablar con Clara"
              title="Hablar con Clara"
              className="shrink-0 w-11 h-11 rounded-full border-0 bg-verde-tenue text-verde-profundo cursor-pointer flex items-center justify-center hover:bg-[#e6f0f0]"
            >
              <IconoMic grande />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribile a Clara…"
              aria-label="Tu mensaje"
              className="flex-1 min-w-0 min-h-11 px-2 border-0 bg-transparent font-sans text-[16px] text-tinta focus:outline-none"
            />
            <button
              type="submit"
              disabled={ocupado || !input.trim()}
              aria-label="Enviar"
              className="shrink-0 w-11 h-11 rounded-full border-0 bg-verde-profundo text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-tinta disabled:bg-borde-campo disabled:cursor-default"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// El avatar de Clara: los tres pétalos del isotipo, apuntando al centro.
function ClaraAvatar({ tam, animado = false }: { tam: number; animado?: boolean }) {
  const p = (color: string, x: number, y: number, s: number, radio: string) => (
    <span
      className="absolute block"
      style={{ left: x * tam, top: y * tam, width: s * tam, height: s * tam, background: color, borderRadius: radio, transformOrigin: "center" }}
    />
  );
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${animado ? "clara-respira" : ""}`} style={{ width: tam, height: tam }}>
      {p("#6a969c", 0.02, 0.02, 0.54, "50% 50% 12% 50%")}
      {p("#ebe6ce", 0.6, 0.1, 0.38, "50% 50% 50% 12%")}
      {p("#f4d096", 0.08, 0.6, 0.38, "50% 12% 50% 50%")}
    </span>
  );
}

function Bienvenida({
  nombre,
  paciente,
  enVoz,
  onPregunta,
  extras,
}: {
  nombre: string;
  paciente?: string;
  enVoz: boolean;
  onPregunta: (t: string) => void;
  extras?: ReactNode;
}) {
  return (
    <div className="clara-entra">
      <div className="flex items-start gap-4">
        <span className="shrink-0 w-16 h-16 rounded-[22px] bg-white ring-1 ring-borde shadow-elevada flex items-center justify-center">
          <ClaraAvatar tam={42} animado />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="m-0 text-[12px] tracking-[0.14em] uppercase font-semibold text-verde-profundo">Clara · tu asistente</p>
          <h2 className="m-0 mt-1 font-serif font-normal text-[26px] sm:text-[30px] leading-[1.15] text-tinta">Hola{nombre ? `, ${nombre}` : ""}. ¿En qué te ayudo?</h2>
        </div>
      </div>
      <p className="m-0 mt-3 text-[15.5px] leading-relaxed text-tinta-suave">
        Te ayudo con la app y con el día a día del cuidado{paciente ? ` de ${paciente}` : ""}. {enVoz ? "Ya podés hablarme." : "Escribime abajo o tocá el micrófono para conversar con tu voz."}
      </p>
      {!enVoz && (
        <>
          <ul className="list-none m-0 mt-6 p-0 grid grid-cols-2 gap-2.5">
            {preguntasIniciales.map((q) => (
              <li key={q.t}>
                <button
                  type="button"
                  onClick={() => onPregunta(q.t)}
                  className="w-full h-full flex flex-col items-start gap-2.5 rounded-[20px] border border-borde bg-white p-3.5 cursor-pointer font-sans text-left transition-all hover:-translate-y-0.5 hover:shadow-elevada hover:border-verde-serenidad/50"
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: q.fondo, color: q.tinta }}>
                    <Icono name={q.icono} className="w-5 h-5" />
                  </span>
                  <span className="text-[14px] font-semibold leading-snug text-tinta">{q.t}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {otrasPreguntas.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onPregunta(t)}
                className="px-3.5 py-2 rounded-full border border-borde bg-white text-[13px] font-semibold text-tinta-suave cursor-pointer hover:border-verde-serenidad hover:text-tinta"
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
      {extras && (
        <div className="mt-8">
          <p className="m-0 mb-3 text-[12px] tracking-[0.14em] uppercase font-semibold text-tinta-tenue">¿Preferís hablar con una persona?</p>
          {extras}
        </div>
      )}
      <p className="m-0 mt-6 text-[12px] leading-relaxed text-tinta-tenue">
        Clara es una inteligencia artificial: puede equivocarse y no reemplaza a nuestro equipo de salud. Ante una urgencia, 9-1-1 o el botón SOS.
      </p>
    </div>
  );
}

function RespuestaClara({
  b,
  conAvatar,
  paciente,
  onAccion,
  calificar,
  calificacion,
}: {
  b: Burbuja;
  conAvatar: boolean;
  paciente?: string;
  onAccion: (to: string) => void;
  calificar: ((v: boolean) => void) | null;
  calificacion?: boolean;
}) {
  const texto = useEscritura(b.texto, !!b.animar && !b.porVoz);
  const [leyendo, setLeyendo] = useState(false);
  const esperando = b.escribiendo && !b.texto;
  // Las guías de urgencia (caída, extravío…) se destacan en coral.
  const urgente = !!b.accion;

  return (
    <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[80%]">
      <span className="w-8 shrink-0 flex justify-center pt-2">{conAvatar && <ClaraAvatar tam={26} animado={esperando} />}</span>
      <div className="min-w-0">
        <div
          className={`rounded-[22px] rounded-bl-md px-4 py-3 text-[15.5px] leading-relaxed text-tinta shadow-[0_12px_28px_-22px_rgba(31,51,56,0.6)] ${
            urgente ? "bg-alerta border-[1.5px] border-alerta-borde" : "bg-white border border-borde-suave"
          }`}
        >
          {esperando ? (
            <span className="inline-flex items-center gap-1.5 py-1.5" aria-label="Clara está escribiendo">
              <span className="clara-punto w-2 h-2 rounded-full bg-verde-serenidad" />
              <span className="clara-punto w-2 h-2 rounded-full bg-[#d8cfa6] [animation-delay:0.15s]" />
              <span className="clara-punto w-2 h-2 rounded-full bg-mostaza-vital [animation-delay:0.3s]" />
            </span>
          ) : (
            <span className="whitespace-pre-line">{texto}</span>
          )}
          {b.accion && !b.escribiendo && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onAccion(b.accion!.to)}
                className="inline-flex items-center gap-2 min-h-10 px-4 rounded-full text-white text-[14px] font-bold cursor-pointer border-none bg-semaforo-rojo hover:brightness-95"
              >
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-white" />
                {b.accion.label}
              </button>
            </div>
          )}
        </div>
        {b.whatsapp && !b.escribiendo && <BorradorWhatsApp inicial={b.whatsapp} paciente={paciente} />}
        {!b.escribiendo && b.texto && !b.porVoz && (lecturaDisponible || calificar || calificacion !== undefined) && (
          <div className="flex items-center gap-0.5 mt-1">
            {lecturaDisponible && (
              <BotonIcono
                label={leyendo ? "Detener lectura" : "Leer en voz alta"}
                activo={leyendo}
                onClick={() => {
                  if (leyendo) {
                    detenerVoz();
                    setLeyendo(false);
                  } else {
                    setLeyendo(true);
                    leerEnVoz(b.texto, () => setLeyendo(false));
                  }
                }}
              >
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
                <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
              </BotonIcono>
            )}
            {calificar && (
              <>
                <BotonIcono label="Me sirvió" onClick={() => calificar(true)}>
                  <path d="M7 10.5V20H4.5v-9.5H7zm0 0 3.8-6.3c.9 0 1.7.8 1.6 1.7l-.5 3.6h5.4a1.8 1.8 0 0 1 1.8 2.1l-1.2 6.7a1.8 1.8 0 0 1-1.8 1.5H7" />
                </BotonIcono>
                <BotonIcono label="No me sirvió" onClick={() => calificar(false)}>
                  <path d="M17 13.5V4h2.5v9.5H17zm0 0-3.8 6.3c-.9 0-1.7-.8-1.6-1.7l.5-3.6H6.7a1.8 1.8 0 0 1-1.8-2.1l1.2-6.7A1.8 1.8 0 0 1 7.9 4H17" />
                </BotonIcono>
              </>
            )}
            {calificacion !== undefined && <span className="text-[12px] text-tinta-tenue ml-1">{calificacion ? "¡Gracias!" : "Gracias, lo vamos a revisar."}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function BotonIcono({ label, activo, onClick, children }: { label: string; activo?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={activo}
      title={label}
      className={`w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center ${
        activo ? "bg-white text-verde-profundo" : "bg-transparent text-tinta-tenue hover:text-tinta hover:bg-white/70"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function BotonRedondo({ etiqueta, activo, deshabilitado, onClick, children }: { etiqueta: string; activo?: boolean; deshabilitado?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={etiqueta}
      className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center border-[1.5px] transition-colors disabled:opacity-50 disabled:cursor-default ${
        activo ? "bg-tinta border-tinta text-white" : "bg-white border-borde text-tinta hover:border-verde-serenidad"
      }`}
    >
      {children}
    </button>
  );
}

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconoMic({ grande = false }: { grande?: boolean }) {
  const t = grande ? 22 : 14;
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" aria-hidden="true">
      <rect {...trazo} x="9" y="3" width="6" height="11" rx="3" />
      <path {...trazo} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}
function IconoMicApagado() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path {...trazo} d="M15 10.5V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.4 5.2M18.5 11a6.4 6.4 0 0 1-.5 2.5M12 17.5V21M4 4l16 16" />
    </svg>
  );
}
function IconoColgar() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 9.5c-2.6 0-5 .7-7 1.9-.6.4-.9 1.1-.7 1.8l.5 1.7c.2.7.9 1.1 1.6 1l2.4-.4c.6-.1 1.1-.6 1.2-1.2l.2-1.3c1.2-.4 2.5-.4 3.7 0l.2 1.3c.1.6.6 1.1 1.2 1.2l2.4.4c.7.1 1.4-.3 1.6-1l.5-1.7c.2-.7-.1-1.4-.7-1.8-2-1.2-4.4-1.9-7-1.9z"
      />
    </svg>
  );
}

// El mensaje para el equipo, ya redactado: la persona lo revisa y lo cambia
// antes de abrir WhatsApp. Nada se envía solo.
function BorradorWhatsApp({ inicial, paciente }: { inicial: string; paciente?: string }) {
  const [texto, setTexto] = useState(inicial);
  const [editando, setEditando] = useState(false);
  return (
    <div className="mt-2 rounded-[20px] border-[1.5px] border-[#25d366]/40 bg-[#f1fbf4] p-3.5">
      <p className="m-0 mb-2 flex items-center gap-1.5 text-[12px] tracking-[0.08em] uppercase font-semibold text-[#1a7f43]">
        <WhatsAppIcon size={14} /> Mensaje para nuestro equipo
      </p>
      {editando ? (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          aria-label="Mensaje para el equipo"
          className="w-full rounded-xl border-[1.5px] border-borde bg-white px-3 py-2 font-sans text-[14.5px] leading-relaxed text-tinta resize-y"
        />
      ) : (
        <p className="m-0 text-[14.5px] leading-relaxed text-tinta whitespace-pre-line">{texto}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <a
          href={texto.trim() ? waLink(WHATSAPP_EQUIPO, texto.trim()) : waEquipo(undefined, paciente)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 min-h-10 px-4 rounded-full bg-[#25d366] text-white text-[14px] font-semibold no-underline hover:brightness-95"
        >
          <WhatsAppIcon size={17} /> Enviar por WhatsApp
        </a>
        <button type="button" onClick={() => setEditando((v) => !v)} className="bg-transparent border-none p-0 cursor-pointer text-[13.5px] font-semibold text-verde-profundo underline decoration-dotted">
          {editando ? "Listo" : "Editar mensaje"}
        </button>
      </div>
    </div>
  );
}

// Revela el texto con ritmo de escritura (respuestas por texto). Lo que ya
// estaba en pantalla, o lo que llegó por voz, se muestra completo.
function useEscritura(objetivo: string, animar: boolean) {
  const [visible, setVisible] = useState(animar ? 0 : objetivo.length);
  const prev = useRef(objetivo);

  useEffect(() => {
    if (!objetivo.startsWith(prev.current.slice(0, Math.min(prev.current.length, visible)))) setVisible(0);
    prev.current = objetivo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objetivo]);

  useEffect(() => {
    if (!animar || visible >= objetivo.length) return;
    const id = window.setTimeout(() => {
      const falta = objetivo.length - visible;
      setVisible((v) => Math.min(objetivo.length, v + Math.max(2, Math.ceil(falta / 14))));
    }, 18);
    return () => window.clearTimeout(id);
  }, [animar, visible, objetivo]);

  return animar ? objetivo.slice(0, visible) : objetivo;
}
