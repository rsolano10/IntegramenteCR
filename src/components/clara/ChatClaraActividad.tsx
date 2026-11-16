import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationProvider, useConversationClientTool, useConversationControls, useConversationStatus, type MessagePayload } from "@elevenlabs/react";
import { supabase } from "../../lib/supabase";
import { detectarRiesgo } from "../../lib/chatbot";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { waEquipo } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { ClaraAvatar } from "./ClaraAvatar";

// El chat de Clara dentro de una actividad (se carga recién con la primera
// pregunta: el SDK de ElevenLabs pesa). El mismo agente que en Ayuda, solo
// texto. Antes de cada pregunta, la app le manda el contexto (actividad,
// paso, ayuda validada) con sendContextualUpdate; si cambió de paso, se
// manda de nuevo. Agente público: solo el agentId, nunca una API key.
//
// Seguridad, igual que en Ayuda: las urgencias se detectan acá primero, sin
// IA, y muestran el acceso a la guía (o a «Necesito ayuda», al participante).

const CLARA_AGENT_ID = "agent_6101m6vtn05pf4mtqvys2jnavkt4";

interface Burbuja {
  key: string;
  rol: "persona" | "clara";
  texto: string;
  escribiendo?: boolean;
  enlace?: { label: string; to: string };
  whatsapp?: string;
}

interface Manejadores {
  onConnect: (p: { conversationId: string }) => void;
  onDisconnect: () => void;
  onMessage: (m: MessagePayload) => void;
  onParte: (p: { text: string; type: "start" | "delta" | "stop" }) => void;
  onError: (m: string) => void;
}

export interface PropsChat {
  contexto: string;
  inicial: string;
  quien: "familia" | "participante";
  large?: boolean;
}

export default function ChatClaraActividad(props: PropsChat) {
  const manejadores = useRef<Manejadores | null>(null);
  return (
    <ConversationProvider
      onConnect={(p) => manejadores.current?.onConnect(p)}
      onDisconnect={() => manejadores.current?.onDisconnect()}
      onMessage={(m) => manejadores.current?.onMessage(m)}
      onAgentChatResponsePart={(p) => manejadores.current?.onParte(p)}
      onError={(m) => manejadores.current?.onError(m)}
    >
      <Chat {...props} manejadores={manejadores} />
    </ConversationProvider>
  );
}

let seq = 0;
const clave = () => `c-${Date.now()}-${++seq}`;

function Chat({ contexto, inicial, quien, large = false, manejadores }: PropsChat & { manejadores: React.MutableRefObject<Manejadores | null> }) {
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const queryClient = useQueryClient();
  const { startSession, endSession, sendUserMessage, sendContextualUpdate } = useConversationControls();
  const { status } = useConversationStatus();
  const participante = quien === "participante";

  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [input, setInput] = useState("");
  const burbujasRef = useRef(burbujas);
  burbujasRef.current = burbujas;
  const pendiente = useRef<string | null>(null);
  const saludoPorOmitir = useRef(false);
  const respuestaKey = useRef<string | null>(null);
  const espera = useRef<number | null>(null);
  const contextoEnviado = useRef("");
  const contextoRef = useRef(contexto);
  contextoRef.current = contexto;
  const fin = useRef<HTMLDivElement>(null);

  const agregar = (...b: Burbuja[]) => setBurbujas((bs) => [...bs, ...b]);
  const actualizar = (key: string, cambios: Partial<Burbuja>) => setBurbujas((bs) => bs.map((b) => (b.key === key ? { ...b, ...cambios } : b)));
  // Entre llaves: en Chrome nuevo scrollIntoView devuelve una promesa, y un
  // efecto no puede devolver otra cosa que su limpieza.
  useEffect(() => {
    fin.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [burbujas]);
  // Al cerrar la ayuda (o salir de la actividad) se corta la conversación.
  useEffect(() => () => endSession(), [endSession]);

  const paciente = myPatient?.nombre?.split(" ")[0];
  const mensajeEquipo = (pregunta: string) =>
    `Hola, les escribo por ${myPatient?.nombre ?? "mi familiar"}. Tengo una consulta sobre una actividad${pregunta.trim() ? `: ${pregunta.trim()}` : "."}`;

  function burbujaRespuesta(): string {
    if (respuestaKey.current && burbujasRef.current.some((b) => b.key === respuestaKey.current)) return respuestaKey.current;
    const key = clave();
    respuestaKey.current = key;
    agregar({ key, rol: "clara", texto: "", escribiendo: true });
    return key;
  }

  function sinRespuesta(pregunta: string) {
    const datos: Partial<Burbuja> = {
      texto: participante
        ? "No pude responder ahora. Probá de nuevo en un momento, o tocá «Necesito ayuda»."
        : "No pude responder ahora. Probá de nuevo en un momento; mientras, mirá los consejos de abajo o escribile al equipo.",
      escribiendo: false,
      ...(participante ? { enlace: { label: "Necesito ayuda", to: "/app/participante/ayuda" } } : { whatsapp: mensajeEquipo(pregunta) }),
    };
    const key = respuestaKey.current;
    if (key) actualizar(key, datos);
    else agregar({ key: clave(), rol: "clara", texto: "", ...datos });
    respuestaKey.current = null;
  }

  function limpiarEspera() {
    if (espera.current) window.clearTimeout(espera.current);
    espera.current = null;
  }

  // El contexto de la actividad, solo si cambió desde la última vez.
  function mandarContexto() {
    if (contextoEnviado.current === contextoRef.current) return;
    sendContextualUpdate(contextoRef.current);
    contextoEnviado.current = contextoRef.current;
  }

  function esperarRespuesta(pregunta: string, ms = 20_000) {
    limpiarEspera();
    espera.current = window.setTimeout(() => {
      const b = burbujasRef.current.find((x) => x.key === respuestaKey.current);
      if (b?.texto) return;
      sinRespuesta(pregunta);
      endSession();
    }, ms);
  }

  function enviarPendiente() {
    const texto = pendiente.current;
    if (!texto) return;
    pendiente.current = null;
    mandarContexto();
    sendUserMessage(texto);
    esperarRespuesta(texto);
  }

  // Memoria de Clara por usuario (clara-session; el user_id sale del token
  // verificado en el servidor). Las variables son las mismas que en Ayuda.
  const memoria = () =>
    queryClient
      .fetchQuery({
        queryKey: ["clara-session"],
        staleTime: 60_000,
        queryFn: async () => {
          const { data, error } = await supabase.functions.invoke<{ user_id: string; nombre: string; resumen_previo: string }>("clara-session", { method: "GET" });
          if (error || !data) throw error ?? new Error("Sin datos");
          return data;
        },
      })
      .catch(() => null);

  manejadores.current = {
    onConnect({ conversationId }) {
      if (conversationId) supabase.functions.invoke("clara-session", { method: "POST", body: { conversation_id: conversationId } }).catch(() => {});
      mandarContexto();
      saludoPorOmitir.current = true;
      window.setTimeout(() => {
        if (!saludoPorOmitir.current) return;
        saludoPorOmitir.current = false;
        enviarPendiente();
      }, 1500);
    },
    onDisconnect() {
      limpiarEspera();
      contextoEnviado.current = "";
      queryClient.invalidateQueries({ queryKey: ["clara-session"] });
      const b = burbujasRef.current.find((x) => x.key === respuestaKey.current);
      if (b && !b.texto) setBurbujas((bs) => bs.filter((x) => x.key !== b.key));
      else if (b) actualizar(b.key, { escribiendo: false });
      respuestaKey.current = null;
    },
    onMessage(m) {
      if (m.role === "user") return;
      if (saludoPorOmitir.current) {
        // El saludo del agente no se muestra: la pregunta ya está en pantalla.
        saludoPorOmitir.current = false;
        enviarPendiente();
        return;
      }
      limpiarEspera();
      const key = burbujaRespuesta();
      actualizar(key, { texto: m.message, escribiendo: false });
      respuestaKey.current = null;
    },
    onParte(p) {
      if (saludoPorOmitir.current || p.type !== "delta") return;
      const key = burbujaRespuesta();
      setBurbujas((bs) => bs.map((b) => (b.key === key ? { ...b, texto: (b.texto + p.text).trimStart() } : b)));
    },
    onError(m) {
      console.warn("Clara (actividad):", m);
    },
  };

  function preguntar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta) return;
    setInput("");
    agregar({ key: clave(), rol: "persona", texto: pregunta });

    // 1) Urgencia: la guía, al instante y sin IA.
    const riesgo = detectarRiesgo(pregunta);
    if (riesgo) {
      agregar({
        key: clave(),
        rol: "clara",
        texto: participante ? "Si te sentís mal o pasó algo, pará ahora y pedí ayuda. Si es urgente, llamá al 9-1-1." : riesgo.text,
        enlace: participante ? { label: "Necesito ayuda", to: "/app/participante/ayuda" } : riesgo.escalate,
      });
    }

    // 2) Clara, con el contexto de la actividad.
    burbujaRespuesta();
    if (status === "connected") {
      mandarContexto();
      sendUserMessage(pregunta);
      esperarRespuesta(pregunta);
      return;
    }
    pendiente.current = pregunta;
    memoria()
      .then((m) =>
        startSession({
          agentId: CLARA_AGENT_ID,
          textOnly: true,
          stripAudioTags: true,
          ...(m?.user_id ? { userId: m.user_id } : {}),
          dynamicVariables: {
            nombre: m?.nombre ?? "",
            resumen_previo: m?.resumen_previo || "ninguno",
            nombre_usuario: session.status === "authed" ? session.profile.nombre.split(" ")[0] : "",
            nombre_paciente: paciente ?? "",
            programa: myPatient?.modalidad === "orientado" ? "Con sesiones profesionales" : "Autoguiado",
            estado_cuenta: myPatient?.estado_cuenta ?? "",
          },
        }),
      )
      .catch(() => {
        pendiente.current = null;
        sinRespuesta(pregunta);
      });
    // Si no conecta en 12 s, se dice y se corta.
    espera.current = window.setTimeout(() => {
      if (pendiente.current !== pregunta) return;
      pendiente.current = null;
      sinRespuesta(pregunta);
      endSession();
    }, 12_000);
  }

  // La primera pregunta llega desde afuera (la parte liviana).
  const arrancado = useRef(false);
  useEffect(() => {
    if (arrancado.current) return;
    arrancado.current = true;
    preguntar(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Herramientas del agente (las mismas que en Ayuda).
  useConversationClientTool("derivar_whatsapp", (params: Record<string, unknown>) => {
    if (participante) return "En la actividad del participante no hay WhatsApp: sugerí tocar «Necesito ayuda».";
    const mensaje = typeof params.mensaje === "string" && params.mensaje.trim() ? params.mensaje.trim() : mensajeEquipo("");
    agregar({ key: clave(), rol: "clara", texto: "Te dejo el mensaje listo para el equipo:", whatsapp: mensaje });
    return "Listo: la persona ve el mensaje para el equipo con el botón de WhatsApp.";
  });
  useConversationClientTool("mostrar_emergencia", () => {
    agregar({
      key: clave(),
      rol: "clara",
      texto: "Si es una urgencia, llamá al 9-1-1.",
      enlace: participante ? { label: "Necesito ayuda", to: "/app/participante/ayuda" } : { label: "Ver qué hacer ahora", to: "/app/emergencia" },
    });
    return "Listo: la persona ve el acceso a la ayuda de urgencia.";
  });
  useConversationClientTool("ir_a", () => "Dentro de una actividad no se cambia de pantalla: respondé acá mismo.");

  const ocupado = burbujas.some((b) => b.escribiendo);
  const t = large ? { texto: "text-[19px]" } : { texto: "text-[16px]" };

  return (
    <div className="grid gap-3">
      <ul className="m-0 p-0 list-none grid gap-2.5" aria-live="polite">
        {burbujas.map((b) =>
          b.rol === "persona" ? (
            <li key={b.key} className={`justify-self-end max-w-[85%] rounded-[18px] rounded-br-md bg-verde-tenue px-4 py-2.5 leading-snug text-tinta ${t.texto}`}>
              {b.texto}
            </li>
          ) : (
            <li key={b.key} className="flex items-start gap-2.5 max-w-[95%]">
              <span className="mt-1">
                <ClaraAvatar tam={26} animado={!!b.escribiendo} />
              </span>
              <div className={`min-w-0 rounded-[18px] rounded-tl-md border border-borde bg-white px-4 py-2.5 leading-relaxed text-tinta ${t.texto}`}>
                {b.texto ? (
                  b.texto.split(/\n+/).map((p, i) => (
                    <p key={i} className="m-0 [&+p]:mt-2">
                      {p}
                    </p>
                  ))
                ) : (
                  <span className="text-tinta-suave">Clara está escribiendo…</span>
                )}
                {b.enlace && (
                  <Link to={b.enlace.to} className="mt-2.5 inline-flex items-center min-h-11 px-4 rounded-full bg-semaforo-rojo text-white font-bold no-underline">
                    {b.enlace.label}
                  </Link>
                )}
                {b.whatsapp && (
                  <a
                    href={waEquipo(b.whatsapp, myPatient?.nombre)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-[#25d366] text-white font-bold no-underline"
                  >
                    <WhatsAppIcon size={18} /> Escribir al equipo
                  </a>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
      <div ref={fin} />

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ocupado) preguntar(input);
        }}
      >
        <label className="sr-only" htmlFor="clara-actividad-campo">
          Otra pregunta para Clara
        </label>
        <textarea
          id="clara-actividad-campo"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!ocupado) preguntar(input);
            }
          }}
          rows={1}
          placeholder="Escribí tu duda…"
          className={`flex-1 min-h-12 max-h-32 resize-none rounded-2xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans leading-snug text-tinta ${t.texto}`}
        />
        <button
          type="submit"
          disabled={ocupado || !input.trim()}
          className="shrink-0 min-h-12 px-5 rounded-full border-0 bg-verde-profundo text-white font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
