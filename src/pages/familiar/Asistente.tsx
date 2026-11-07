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
import { ChatBubble } from "../../components/ui/ChatBubble";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";

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

const sugerenciasIniciales = ["¿Cómo registro una actividad?", "Repite la misma pregunta", "Se resiste al baño", "No quiere comer", "Necesito un respiro"];

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

export function Asistente({ embedded = false }: { embedded?: boolean }) {
  const manejadores = useRef<Manejadores | null>(null);
  return (
    <ConversationProvider
      onConnect={() => manejadores.current?.onConnect()}
      onDisconnect={() => manejadores.current?.onDisconnect()}
      onMessage={(m) => manejadores.current?.onMessage(m)}
      onAgentChatResponsePart={(p) => manejadores.current?.onParte(p)}
      onError={(m) => manejadores.current?.onError(m)}
    >
      <Clara embedded={embedded} manejadores={manejadores} />
    </ConversationProvider>
  );
}

function Clara({ embedded, manejadores }: { embedded: boolean; manejadores: React.MutableRefObject<Manejadores | null> }) {
  const navigate = useNavigate();
  const session = useSession();
  const firstName = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const { data: myPatient } = useMyPatient();
  const { startSession, endSession, sendUserMessage, sendContextualUpdate } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();
  const { canSendFeedback, sendFeedback } = useConversationFeedback();

  const [burbujas, setBurbujas] = useState<Burbuja[]>(leerGuardado);
  const [input, setInput] = useState("");
  const [modo, setModo] = useState<"texto" | "voz" | null>(null);
  const [error, setError] = useState("");
  const [calificada, setCalificada] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    try {
      sessionStorage.setItem(GUARDADO, JSON.stringify(burbujas.slice(-40)));
    } catch {
      // sin sessionStorage la conversación vive solo en pantalla
    }
  }, [burbujas]);

  const ultimoTexto = burbujas[burbujas.length - 1]?.texto;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [burbujas.length, ultimoTexto]);

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
      setModo(null);
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
      startSession({ agentId: CLARA_AGENT_ID, textOnly: true, dynamicVariables: variables() });
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
    if (status !== "disconnected") endSession();
    respuestaKey.current = null;
    setModo("voz");
    // Un instante para que se cierre la sesión de texto, si había.
    window.setTimeout(() => startSession({ agentId: CLARA_AGENT_ID, dynamicVariables: variables() }), status !== "disconnected" ? 400 : 0);
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
  const ultimaRespuesta = [...burbujas].reverse().find((b) => b.rol === "asistente" && !b.escribiendo && b.texto);
  const chips = ocupado || enVoz ? [] : burbujas.length === 0 ? sugerenciasIniciales : [];

  return (
    <div className="flex flex-col" style={{ minHeight: "min(60vh, 520px)" }}>
      {!embedded && <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Clara · Asistente IntegraMente</p>}

      <div className="grid gap-3 mb-4">
        <ChatBubble role="bot">
          Hola{firstName ? `, ${firstName}` : ""}. Soy Clara, la asistente de IntegraMente en Casa. Te ayudo con la app y con el día a día del cuidado
          {paciente ? ` de ${paciente.split(" ")[0]}` : ""}. Escribime tu duda o tocá «Hablar con Clara» para conversar con tu voz.
        </ChatBubble>
        {burbujas.map((b) =>
          b.rol === "usuario" ? (
            <ChatBubble key={b.key} role="user">
              {b.porVoz && <span className="sr-only">Dijiste: </span>}
              <span className="whitespace-pre-line">{b.texto}</span>
            </ChatBubble>
          ) : (
            <RespuestaClara
              key={b.key}
              b={b}
              paciente={paciente}
              onAccion={(to) => navigate(to)}
              calificar={
                canSendFeedback && b.key === ultimaRespuesta?.key && !calificada[b.key]
                  ? (v) => {
                      sendFeedback(v);
                      setCalificada((c) => ({ ...c, [b.key]: v }));
                    }
                  : null
              }
              calificacion={calificada[b.key]}
            />
          ),
        )}
        <div ref={endRef} />
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="px-3.5 py-2 rounded-full border border-borde bg-white text-[13px] font-semibold text-tinta hover:border-verde-serenidad cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversación por voz en curso */}
      {enVoz && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-verde-serenidad bg-verde-tenue px-4 py-3" role="status">
          <span className="relative flex w-10 h-10 shrink-0 items-center justify-center" aria-hidden="true">
            <span className={`absolute inset-0 rounded-full bg-verde-serenidad/40 ${status === "connected" ? "animate-ping" : ""}`} style={{ animationDuration: isSpeaking ? "1s" : "2.2s" }} />
            <span className="relative w-8 h-8 rounded-full bg-verde-profundo" />
          </span>
          <p className="m-0 flex-1 min-w-[10em] text-[15px] font-semibold text-tinta">
            {status === "connecting" ? "Conectando con Clara…" : status !== "connected" ? "Terminando…" : isMuted ? "Micrófono en silencio" : isSpeaking ? "Clara está hablando…" : "Te escucho…"}
          </p>
          {status === "connected" && (
            <button
              type="button"
              onClick={() => setMuted(!isMuted)}
              className="min-h-10 px-4 rounded-full border-[1.5px] border-borde bg-white text-[14px] font-semibold text-tinta cursor-pointer"
            >
              {isMuted ? "Activar micrófono" : "Silenciar"}
            </button>
          )}
          <button type="button" onClick={() => endSession()} className="min-h-10 px-4 rounded-full border-0 bg-semaforo-rojo text-white text-[14px] font-semibold cursor-pointer">
            Terminar
          </button>
        </div>
      )}

      {error && <p className="m-0 mb-3 text-[14px] text-alerta-texto">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={enVoz ? "También podés escribirle…" : "Escribí tu duda…"}
          aria-label="Tu mensaje"
          className="flex-1 min-w-0 min-h-13 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
        />
        <button
          type="submit"
          disabled={ocupado || !input.trim()}
          className="min-h-13 px-5 rounded-xl bg-tinta text-white font-semibold text-[15px] disabled:opacity-50 cursor-pointer hover:bg-verde-profundo"
        >
          Enviar
        </button>
      </form>

      {!enVoz && (
        <button
          type="button"
          onClick={hablar}
          className="mt-2.5 inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl border-[1.5px] border-verde-serenidad bg-white text-verde-profundo font-semibold text-[15px] cursor-pointer hover:bg-verde-tenue"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
          </svg>
          Hablar con Clara
        </button>
      )}

      <div className="mt-3 text-[12.5px] leading-relaxed text-tinta-tenue">
        Clara es una inteligencia artificial: puede equivocarse y no reemplaza a nuestro equipo de salud. Ante una urgencia, llamá al 9-1-1 o usá el botón SOS.{" "}
        {burbujas.length > 0 && !enVoz && (
          <button type="button" onClick={nuevaConversacion} className="bg-transparent border-none p-0 cursor-pointer text-verde-profundo underline decoration-dotted">
            Empezar una conversación nueva
          </button>
        )}
      </div>
    </div>
  );
}

function RespuestaClara({
  b,
  paciente,
  onAccion,
  calificar,
  calificacion,
}: {
  b: Burbuja;
  paciente?: string;
  onAccion: (to: string) => void;
  calificar: ((v: boolean) => void) | null;
  calificacion?: boolean;
}) {
  const texto = useEscritura(b.texto, !!b.animar && !b.porVoz);
  const [leyendo, setLeyendo] = useState(false);
  const esperando = b.escribiendo && !b.texto;

  return (
    <div>
      <ChatBubble role="bot">
        {esperando ? (
          <span className="inline-flex gap-1 py-1" aria-label="Clara está escribiendo">
            <span className="w-1.5 h-1.5 rounded-full bg-tinta-tenue animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-tinta-tenue animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-tinta-tenue animate-bounce" />
          </span>
        ) : (
          <span className="whitespace-pre-line">{texto}</span>
        )}
        {b.accion && !b.escribiendo && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => onAccion(b.accion!.to)}
              className="min-h-9 px-3.5 rounded-full text-white text-[13px] font-bold cursor-pointer border-none bg-semaforo-rojo"
            >
              {b.accion.label}
            </button>
          </div>
        )}
      </ChatBubble>
      {b.whatsapp && !b.escribiendo && <BorradorWhatsApp inicial={b.whatsapp} paciente={paciente} />}
      {!b.escribiendo && b.texto && !b.porVoz && (lecturaDisponible || calificar || calificacion !== undefined) && (
        <div className="flex items-center gap-1 mt-1 ml-1">
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
        activo ? "bg-verde-tenue text-verde-profundo" : "bg-transparent text-tinta-tenue hover:text-tinta"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

// El mensaje para el equipo, ya redactado: la persona lo revisa y lo cambia
// antes de abrir WhatsApp. Nada se envía solo.
function BorradorWhatsApp({ inicial, paciente }: { inicial: string; paciente?: string }) {
  const [texto, setTexto] = useState(inicial);
  const [editando, setEditando] = useState(false);
  return (
    <div className="mt-2 max-w-[85%] sm:max-w-[75%] rounded-2xl border-[1.5px] border-[#25d366]/50 bg-[#f1fbf4] p-3.5">
      <p className="m-0 mb-2 text-[12px] tracking-[0.08em] uppercase font-semibold text-[#1a7f43]">Mensaje para nuestro equipo</p>
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
