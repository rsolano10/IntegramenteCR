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
import { Modal } from "../../components/ui/Modal";
import { bloquesDeTexto, destinos as destinosApp, destinosEnTexto, trozosDeLinea, type Destino } from "../../lib/claraTexto";
import { abrirVentanaCuenta } from "../../lib/abrirCuenta";

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
// Preguntas para empezar (desde tablet), sobre lo que Clara responde: el
// uso de la app. Mismos íconos y colores de la paleta oficial.
const preguntasIniciales = [
  { t: "¿Cómo registro una actividad?", icono: "check", fondo: "#6a969c", tinta: "#ffffff" },
  { t: "¿Cómo recibo avisos en el teléfono?", icono: "campana", fondo: "#e8b5a1", tinta: "#1f3338" },
  { t: "¿Qué es la semana gratis?", icono: "sol", fondo: "#f4d096", tinta: "#1f3338" },
  { t: "¿Cómo cambio de programa?", icono: "ajuste", fondo: "#a9c49f", tinta: "#1f3338" },
];

// Ejemplos que rotan en el campo vacío: una pista de qué preguntar sin
// ocupar lugar (sobre todo en el celular, donde no hay tarjetas).
// Cortos, para que entren en una línea en el celular.
const ejemplos = ["¿qué es la semana gratis?", "¿cómo registro algo?", "¿cómo recibo avisos?", "¿cómo veo mi semana?", "¿cómo cambio la clave?"];

interface Burbuja {
  key: string;
  rol: "usuario" | "asistente";
  texto: string;
  whatsapp?: string | null;
  escribiendo?: boolean;
  animar?: boolean;
  accion?: { label: string; to: string };
  porVoz?: boolean;
  hora?: number;
  // Pantallas que el agente pidió ofrecer (herramienta ir_a).
  destinos?: Destino[];
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
  const scroller = useRef<HTMLDivElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  // Alto de la barra flotante, para dejarle lugar al final de la conversación.
  const barra = useRef<HTMLDivElement>(null);
  const [altoBarra, setAltoBarra] = useState(110);
  useEffect(() => {
    const el = barra.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAltoBarra(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  // Solo la conversación se desplaza (como en WhatsApp). Mientras la
  // persona esté al final, sigue al texto que va apareciendo; si subió a
  // leer algo anterior, no la interrumpe y aparece «Ir al último mensaje».
  // Vacía, la conversación se lee desde arriba; con mensajes, desde el último.
  const pegado = useRef(burbujas.length > 0);
  const [lejos, setLejos] = useState(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const alFinal = () => (el.scrollTop = el.scrollHeight);
    const onScroll = () => {
      const d = el.scrollHeight - el.scrollTop - el.clientHeight;
      pegado.current = d < 80;
      setLejos(d > 240);
    };
    const ro = new ResizeObserver(() => pegado.current && alFinal());
    if (contenido.current) ro.observe(contenido.current);
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    // Con una conversación guardada se abre en el último mensaje; vacía, arriba.
    if (burbujasRef.current.length) alFinal();
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);
  const irAlFinal = (suave = true) => {
    const el = scroller.current;
    if (!el) return;
    pegado.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: suave ? "smooth" : "auto" });
  };
  useEffect(() => {
    if (!vacio) irAlFinal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burbujas.length]);

  // Al salir de Ayuda se corta la conversación.
  useEffect(() => () => endSession(), [endSession]);

  const actualizar = (key: string, cambios: Partial<Burbuja>) => setBurbujas((bs) => bs.map((b) => (b.key === key ? { ...b, ...cambios } : b)));
  const agregar = (...nuevas: Burbuja[]) => setBurbujas((bs) => [...bs, ...nuevas.map((n) => ({ hora: Date.now(), ...n }))]);
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

  // La primera vez que toca el micrófono: qué va a pasar, antes de que el
  // navegador pida permiso (que no tome por sorpresa).
  const [explicarVoz, setExplicarVoz] = useState(false);
  function pedirVoz() {
    let vista = false;
    try {
      vista = localStorage.getItem("clara-voz-explicada") === "1";
    } catch {
      // sin almacenamiento: se explica cada vez
    }
    if (vista) hablar();
    else setExplicarVoz(true);
  }

  async function hablar() {
    if (modo === "voz") {
      endSession();
      return;
    }
    setExplicarVoz(false);
    try {
      localStorage.setItem("clara-voz-explicada", "1");
    } catch {
      // no pasa nada
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
  useConversationClientTool("ir_a", (params: Record<string, unknown>) => {
    const d = params.pantalla as Destino;
    if (!destinosApp[d]) return `Pantalla desconocida. Opciones: ${Object.keys(destinosApp).join(", ")}.`;
    const ultima = [...burbujasRef.current].reverse().find((b) => b.rol === "asistente");
    if (ultima) actualizar(ultima.key, { destinos: [...new Set([...(ultima.destinos ?? []), d])] });
    return `Listo: la persona ve el botón «${destinosApp[d].label}».`;
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

  // El campo crece con el texto, hasta 5 líneas.
  useEffect(() => {
    const t = campo.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 132)}px`;
  }, [input]);
  const tactil = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  // Letra más grande para los mensajes (se recuerda en este dispositivo).
  const [grande, setGrande] = useState(() => {
    try {
      return localStorage.getItem("clara-letra") === "grande";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("clara-letra", grande ? "grande" : "normal");
    } catch {
      // no pasa nada
    }
  }, [grande]);
  const letra = grande ? "text-[19px] leading-[1.55]" : "text-[16px] leading-relaxed";

  const [ejemplo, setEjemplo] = useState(0);
  useEffect(() => {
    if (input || enVoz) return;
    const id = window.setInterval(() => setEjemplo((n) => (n + 1) % ejemplos.length), 4000);
    return () => window.clearInterval(id);
  }, [input, enVoz]);

  const irA = (d: Destino) => {
    const destino = destinosApp[d];
    if (destino.ventana) abrirVentanaCuenta(destino.ventana);
    else if (destino.ruta) navigate(destino.ruta);
  };
  const hayTexto = input.trim().length > 0;

  return (
    <section aria-label="Conversación con Clara" className="relative h-full flex flex-col">
      {/* Conversación: lo único que se desplaza */}
      <div
        ref={scroller}
        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        {/* Mismo contenedor y márgenes que el resto de las secciones. El
            relleno de abajo deja lugar a la barra flotante. */}
        <div ref={contenido} className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-6" style={{ paddingBottom: altoBarra + 16 }}>
          {/* Una línea discreta: persona por WhatsApp y tamaño de letra. */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <a
              href={waEquipo(undefined, paciente)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 min-h-11 text-[14.5px] font-semibold text-[#1a7f43] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo rounded-full"
            >
              <span aria-hidden="true" className="w-8 h-8 rounded-full bg-[#25d366] text-white flex items-center justify-center">
                <WhatsAppIcon size={16} />
              </span>
              <span>
                <span className="sm:hidden underline decoration-[#25d366]/50 underline-offset-4">Hablar con una persona</span>
                <span className="hidden sm:inline">
                  ¿Preferís una persona? <span className="underline decoration-[#25d366]/50 underline-offset-4">Escribinos por WhatsApp</span>
                </span>
                <span className="sr-only"> por WhatsApp (se abre en otra pestaña)</span>
              </span>
            </a>
            <div role="group" aria-label="Tamaño de la letra" className="flex items-center gap-1 rounded-full bg-white border border-borde p-1">
              {(
                [
                  [false, "Letra normal", "text-[14px]"],
                  [true, "Letra grande", "text-[19px]"],
                ] as const
              ).map(([g, etiqueta, tam]) => (
                <button
                  key={etiqueta}
                  type="button"
                  aria-pressed={grande === g}
                  aria-label={etiqueta}
                  title={etiqueta}
                  onClick={() => setGrande(g)}
                  className={`w-10 h-9 rounded-full border-0 cursor-pointer font-serif leading-none ${tam} ${
                    grande === g ? "bg-verde-profundo text-white" : "bg-transparent text-tinta-suave hover:text-tinta"
                  } focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-verde-profundo`}
                >
                  A
                </button>
              ))}
            </div>
          </div>
          <p className="m-0 mb-4 flex justify-center">
            <span className="rounded-full bg-white/90 border border-borde-suave px-3 py-1 text-[12px] font-semibold text-tinta-suave shadow-sm">Hoy</span>
          </p>
          <div role="log" aria-live="polite" aria-relevant="additions" aria-busy={ocupado} aria-label="Mensajes">
            <Bienvenida nombre={firstName} paciente={nombrePaciente} enVoz={enVoz} conPreguntas={vacio} onPregunta={submit} extras={vacio ? extras : null} letra={letra} />
            {!vacio && (
              <ol className="list-none m-0 mt-4 p-0 grid gap-1.5">
                {burbujas.map((b, i) => {
                  const primeraDelGrupo = i === 0 || burbujas[i - 1].rol !== b.rol;
                  return (
                    <li key={b.key} className={`clara-entra ${primeraDelGrupo && i > 0 ? "mt-3" : ""}`}>
                      {b.rol === "usuario" ? (
                        <div className="flex justify-end">
                          <div className="max-w-[84%] sm:max-w-[72%]">
                            <div
                              className={`rounded-[20px] ${primeraDelGrupo ? "rounded-tr-md" : ""} px-4 pt-2.5 pb-1.5 ${letra} text-white`}
                              style={{ backgroundImage: "linear-gradient(135deg, #4f7d83, #3f6a70)" }}
                            >
                              <span className="sr-only">{b.porVoz ? "Dijiste por voz: " : "Vos: "}</span>
                              <span className="whitespace-pre-line">{b.texto}</span>
                              <Hora hora={b.hora} clara={false} porVoz={b.porVoz} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <RespuestaClara
                          b={b}
                          conAvatar={primeraDelGrupo}
                          paciente={paciente}
                          onAccion={(to) => navigate(to)}
                          onDestino={irA}
                          letra={letra}
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
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

      </div>

      {/* Barra flotante sobre la conversación (sin franja de pie): para
          escribir o, en una llamada, los controles de voz. Respeta los
          márgenes de la sección; la conversación se desvanece por debajo. */}
      <div ref={barra} className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-fondo-papel from-55% to-transparent pt-8">
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pb-2.5 [&>*]:pointer-events-auto">
          {lejos && (
            <button
              type="button"
              onClick={() => irAlFinal()}
              aria-label="Ir al último mensaje"
              className="absolute right-5 sm:right-8 lg:right-12 -top-12 w-11 h-11 rounded-full border border-borde bg-white text-verde-profundo shadow-elevada cursor-pointer flex items-center justify-center hover:bg-verde-tenue focus-visible:outline-2 focus-visible:outline-verde-profundo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5.5 12.5L12 19l6.5-6.5" />
              </svg>
            </button>
          )}
          {error && (
            <p className="m-0 mb-2 px-2 text-[13.5px] text-alerta-texto" role="alert">
              {error}
            </p>
          )}
          {enVoz ? (
            <div className="flex items-center gap-3 rounded-[28px] bg-white border border-borde p-2 pl-2.5 shadow-elevada" role="status">
              <div ref={orbe} className="relative shrink-0 w-12 h-12 flex items-center justify-center" style={{ ["--nivel" as string]: 0 }}>
                {conectada && <span aria-hidden="true" className="clara-onda absolute inset-1 rounded-full bg-verde-serenidad/30" />}
                <span aria-hidden="true" className="absolute inset-1 rounded-full bg-verde-tenue ring-1 ring-borde transition-transform duration-75" style={{ transform: "scale(calc(1 + var(--nivel) * 0.25))" }} />
                <span className="relative transition-transform duration-75" style={{ transform: "scale(calc(1 + var(--nivel) * 0.3))" }}>
                  <ClaraAvatar tam={26} animado={status === "connecting"} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 font-serif text-[18px] leading-tight text-tinta truncate">{estadoVoz}</p>
                <p className="m-0 mt-0.5 text-[13px] text-tinta-suave">{llamada ? `En llamada · ${llamada}` : "Hablá con naturalidad"}</p>
              </div>
              <BotonRedondo etiqueta={isMuted ? "Activar micrófono" : "Silenciar micrófono"} activo={isMuted} deshabilitado={!conectada} onClick={() => setMuted(!isMuted)}>
                {isMuted ? <IconoMicApagado /> : <IconoMic grande />}
              </BotonRedondo>
              <button
                type="button"
                onClick={() => endSession()}
                aria-label="Terminar la llamada"
                className="shrink-0 w-12 h-12 rounded-full border-0 bg-semaforo-rojo text-white cursor-pointer flex items-center justify-center hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
              >
                <IconoColgar />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (hayTexto) {
                  submit(input);
                  campo.current?.focus();
                }
              }}
              className="flex items-end gap-2 rounded-[28px] bg-white border border-borde p-1.5 pl-1.5 shadow-elevada focus-within:border-verde-serenidad"
            >
              <label htmlFor="mensaje-clara" className="sr-only">
                Escribí un mensaje para Clara
              </label>
              <textarea
                id="mensaje-clara"
                ref={campo}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // En computadora, Enter envía y Shift+Enter hace un salto de línea.
                  if (e.key === "Enter" && !e.shiftKey && !tactil && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (hayTexto && !ocupado) submit(input);
                  }
                }}
                placeholder={`Probá: ${ejemplos[ejemplo]}`}
                enterKeyHint="send"
                className="flex-1 min-w-0 min-h-11 max-h-[132px] resize-none border-0 bg-transparent px-3.5 py-[10px] font-sans text-[16px] leading-[1.4] text-tinta placeholder:text-tinta-tenue focus:outline-none"
              />
              {hayTexto ? (
                <button
                  type="submit"
                  disabled={ocupado}
                  aria-label="Enviar mensaje"
                  className="shrink-0 w-11 h-11 rounded-full border-0 bg-verde-profundo text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-tinta disabled:opacity-60 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pedirVoz}
                  aria-label="Hablar con Clara por voz"
                  title="Hablar con Clara por voz"
                  className="shrink-0 w-11 h-11 rounded-full border-0 bg-verde-profundo text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
                >
                  <IconoMic grande />
                </button>
              )}
            </form>
          )}
          <p className="m-0 mt-2 px-2 text-center text-[12px] leading-snug text-tinta-suave">
            Clara es una IA y puede equivocarse. Ante una urgencia, 9-1-1 o el botón SOS.
            {!vacio && !enVoz && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={nuevaConversacion}
                  className="bg-transparent border-none p-0 cursor-pointer font-semibold text-verde-profundo underline decoration-dotted focus-visible:outline-2 focus-visible:outline-verde-profundo"
                >
                  Empezar de nuevo
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {explicarVoz && (
        <Modal onClose={() => setExplicarVoz(false)}>
          <div className="flex flex-col items-center text-center pt-2">
            <span className="w-16 h-16 rounded-[22px] bg-verde-tenue ring-1 ring-borde flex items-center justify-center">
              <ClaraAvatar tam={40} animado />
            </span>
            <h2 className="m-0 mt-4 font-serif font-normal text-[26px] leading-tight text-tinta">Hablá con Clara como en una llamada</h2>
            <ul className="list-none m-0 mt-4 p-0 grid gap-2.5 text-left text-[16px] leading-relaxed text-tinta-suave">
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="text-verde-profundo font-bold">1</span>Tu navegador te va a pedir permiso para usar el micrófono: tocá «Permitir».
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="text-verde-profundo font-bold">2</span>Hablá con naturalidad. Lo que digan las dos queda escrito en el chat.
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="text-verde-profundo font-bold">3</span>Podés silenciarte o colgar cuando quieras con el botón rojo.
              </li>
            </ul>
            <div className="mt-6 grid gap-2.5 w-full sm:flex sm:justify-center">
              <button
                type="button"
                onClick={hablar}
                autoFocus
                className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full border-0 bg-verde-profundo text-white text-[16px] font-semibold cursor-pointer hover:bg-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
              >
                <IconoMic grande /> Empezar a hablar
              </button>
              <button
                type="button"
                onClick={() => setExplicarVoz(false)}
                className="min-h-12 px-6 rounded-full border-[1.5px] border-borde bg-white text-tinta text-[16px] font-semibold cursor-pointer hover:border-verde-serenidad"
              >
                Prefiero escribir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

// Respuesta con formato: párrafos, listas numeradas y viñetas reales, y en
// negrita los nombres de botones y pantallas (lo que viene entre comillas).
function TextoClara({ texto }: { texto: string }) {
  const linea = (l: string) =>
    trozosDeLinea(l).map((t, i) =>
      t.destacado ? (
        <strong key={i} className="font-semibold text-tinta">
          {t.texto}
        </strong>
      ) : (
        <span key={i}>{t.texto}</span>
      ),
    );
  return (
    <div className="grid gap-2">
      {bloquesDeTexto(texto).map((b, i) =>
        b.tipo === "parrafo" ? (
          <p key={i} className="m-0 whitespace-pre-line">
            {linea(b.texto)}
          </p>
        ) : b.tipo === "numerada" ? (
          <ol key={i} className="m-0 p-0 list-none grid gap-1.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2.5">
                <span aria-hidden="true" className="shrink-0 mt-[3px] w-[1.35em] h-[1.35em] rounded-full bg-verde-tenue text-verde-profundo text-[0.78em] font-bold flex items-center justify-center">
                  {j + 1}
                </span>
                <span className="min-w-0">
                  <span className="sr-only">{j + 1}. </span>
                  {linea(it)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="m-0 pl-5 grid gap-1 list-disc marker:text-verde-serenidad">
            {b.items.map((it, j) => (
              <li key={j}>{linea(it)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

// Botones para ir a la pantalla que Clara acaba de nombrar.
function AccesosDirectos({ destinos, onDestino }: { destinos: Destino[]; onDestino: (d: Destino) => void }) {
  if (!destinos.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {destinos.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDestino(d)}
          className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full border-[1.5px] border-verde-serenidad/60 bg-white text-[14.5px] font-semibold text-verde-profundo cursor-pointer hover:bg-verde-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
        >
          {destinosApp[d].label}
          <span aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  );
}

// Hora del mensaje, abajo a la derecha (como en WhatsApp).
function Hora({ hora, clara, porVoz }: { hora?: number; clara: boolean; porVoz?: boolean }) {
  if (!hora) return null;
  const t = new Date(hora).toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" });
  return (
    <span className={`flex items-center justify-end gap-1 -mr-1 mt-0.5 text-[11.5px] leading-none ${clara ? "text-tinta-suave" : "text-white/85"}`}>
      {porVoz && (
        <>
          <IconoMic />
          <span className="sr-only">por voz,</span>
        </>
      )}
      <time dateTime={new Date(hora).toISOString()}>{t}</time>
    </span>
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
  conPreguntas,
  onPregunta,
  extras,
  letra,
}: {
  nombre: string;
  paciente?: string;
  enVoz: boolean;
  conPreguntas: boolean;
  onPregunta: (t: string) => void;
  extras?: ReactNode;
  letra: string;
}) {
  return (
    <div>
      {/* El saludo es el primer mensaje de Clara. */}
      <div className="flex items-start gap-2 max-w-[92%] sm:max-w-[80%]">
        <span className="w-8 shrink-0 flex justify-center pt-1.5">
          <ClaraAvatar tam={26} />
        </span>
        <div className={`rounded-[20px] rounded-tl-md bg-white border border-borde-suave px-4 py-2.5 ${letra} text-tinta shadow-[0_8px_20px_-18px_rgba(31,51,56,0.6)]`}>
          <span className="sr-only">Clara: </span>
          Hola{nombre ? `, ${nombre}` : ""}. Soy Clara y te ayudo con la app y con el día a día del cuidado{paciente ? ` de ${paciente}` : ""}.{" "}
          {enVoz ? (
            "Ya podés hablarme."
          ) : conPreguntas ? (
            <>
              <span className="md:hidden">Escribime tu duda abajo o tocá el micrófono para hablar.</span>
              <span className="hidden md:inline">Escribime, tocá el micrófono para hablar o elegí una pregunta:</span>
            </>
          ) : null}
        </div>
      </div>
      {conPreguntas && !enVoz && (
        <div className="clara-entra pl-10">
          {/* En el celular las tarjetas desplazaban el saludo: solo desde tablet. */}
          <ul className="list-none m-0 mt-3 p-0 hidden md:grid grid-cols-2 gap-2">
            {preguntasIniciales.map((q) => (
              <li key={q.t}>
                <button
                  type="button"
                  onClick={() => onPregunta(q.t)}
                  className="w-full h-full flex flex-col items-start gap-2 rounded-[18px] border border-borde bg-white p-3 cursor-pointer font-sans text-left transition-all hover:-translate-y-0.5 hover:shadow-elevada hover:border-verde-serenidad/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
                >
                  <span aria-hidden="true" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: q.fondo, color: q.tinta }}>
                    <Icono name={q.icono} className="w-5 h-5" />
                  </span>
                  <span className="text-[14.5px] font-semibold leading-snug text-tinta">{q.t}</span>
                </button>
              </li>
            ))}
          </ul>
          {extras && <div className="mt-5">{extras}</div>}
        </div>
      )}
    </div>
  );
}

function RespuestaClara({
  b,
  conAvatar,
  paciente,
  onAccion,
  onDestino,
  letra,
  calificar,
  calificacion,
}: {
  b: Burbuja;
  conAvatar: boolean;
  paciente?: string;
  onAccion: (to: string) => void;
  onDestino: (d: Destino) => void;
  letra: string;
  calificar: ((v: boolean) => void) | null;
  calificacion?: boolean;
}) {
  const texto = useEscritura(b.texto, !!b.animar && !b.porVoz);
  const [leyendo, setLeyendo] = useState(false);
  const esperando = b.escribiendo && !b.texto;
  // Las guías de urgencia (caída, extravío…) se destacan en coral.
  const urgente = !!b.accion;

  return (
    <div className="flex items-start gap-2 max-w-[92%] sm:max-w-[80%]">
      <span className="w-8 shrink-0 flex justify-center pt-1.5">{conAvatar && <ClaraAvatar tam={26} animado={esperando} />}</span>
      <div className="min-w-0">
        <div
          className={`rounded-[20px] ${conAvatar ? "rounded-tl-md" : ""} px-4 pt-2.5 pb-1.5 ${letra} text-tinta shadow-[0_8px_20px_-18px_rgba(31,51,56,0.6)] ${
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
            <>
              <span className="sr-only">Clara{b.porVoz ? " dijo por voz" : ""}: </span>
              <TextoClara texto={texto} />
            </>
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
          {!esperando && <Hora hora={b.hora} clara porVoz={b.porVoz} />}
        </div>
        {!b.escribiendo && b.texto && !b.accion && <AccesosDirectos destinos={[...new Set([...(b.destinos ?? []), ...destinosEnTexto(b.texto)])].slice(0, 2)} onDestino={onDestino} />}
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
