import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { classifyMessage, detectarRiesgo } from "../../lib/chatbot";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { WHATSAPP_EQUIPO, waEquipo, waLink } from "../../lib/whatsapp";
import { borrarHistorialAsistente, calificarRespuesta, preguntarAsistente, useHistorialAsistente, type MensajeAsistente } from "../../lib/asistente";
import { dictadoDisponible, detenerVoz, lecturaDisponible, leerEnVoz, useDictado } from "../../lib/voz";
import { ChatBubble } from "../../components/ui/ChatBubble";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";

const sugerenciasIniciales = ["Repite la misma pregunta", "Se resiste al baño", "No quiere comer", "No duerme bien", "Necesito un respiro"];

interface Burbuja {
  key: string;
  id: string | null; // id en el servidor (para 👍/👎)
  rol: "usuario" | "asistente";
  texto: string;
  categoria?: string | null;
  whatsapp?: string | null;
  sugerencias?: string[];
  feedback?: -1 | 1 | null;
  escribiendo?: boolean; // esperando o recibiendo la respuesta
  animar?: boolean; // nueva en esta sesión: se revela con efecto de escritura
  accion?: { label: string; to: string }; // guía de emergencia
}

const desdeServidor = (m: MensajeAsistente): Burbuja => ({
  key: m.id,
  id: m.id,
  rol: m.rol,
  texto: m.texto,
  categoria: m.categoria,
  whatsapp: m.whatsapp,
  sugerencias: m.sugerencias,
  feedback: m.feedback,
  accion: m.rol === "asistente" && m.categoria === "emergencia" ? { label: "Ver qué hacer ahora", to: "/app/emergencia" } : undefined,
});

let seq = 0;
const clave = () => `local-${++seq}`;

// Asistente IntegraMente: conversación con IA que conoce a la persona
// participante y recuerda lo hablado. Las urgencias se detectan primero
// sin IA (detectarRiesgo); lo clínico se deriva a WhatsApp con un mensaje
// redactado que la persona revisa antes de enviar.
export function Asistente({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const firstName = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const { data: myPatient } = useMyPatient();
  const { data: historial, isLoading } = useHistorialAsistente();
  const [burbujas, setBurbujas] = useState<Burbuja[] | null>(null);
  const [input, setInput] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const dictado = useDictado(setInput);

  useEffect(() => {
    if (historial && burbujas === null) setBurbujas(historial.map(desdeServidor));
  }, [historial, burbujas]);

  const lista = burbujas ?? [];
  const ultimoTexto = lista[lista.length - 1]?.texto;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lista.length, ultimoTexto]);

  const actualizar = (key: string, cambios: Partial<Burbuja>) => setBurbujas((bs) => (bs ?? []).map((b) => (b.key === key ? { ...b, ...cambios } : b)));
  const agregar = (...nuevas: Burbuja[]) => setBurbujas((bs) => [...(bs ?? []), ...nuevas]);

  async function submit(text: string) {
    const pregunta = text.trim();
    if (!pregunta || ocupado) return;
    setInput("");
    detenerVoz();
    agregar({ key: clave(), id: null, rol: "usuario", texto: pregunta });

    // 1) Urgencia: la guía aparece al instante, sin esperar a la IA. La IA
    //    solo suma una frase de acompañamiento después.
    const riesgo = detectarRiesgo(pregunta);
    const tipoRiesgo = riesgo?.escalate?.to.split("/").pop() ?? null;
    if (riesgo) agregar({ key: clave(), id: null, rol: "asistente", texto: riesgo.text, accion: riesgo.escalate, animar: true });

    const key = clave();
    agregar({ key, id: null, rol: "asistente", texto: "", escribiendo: true, animar: true });
    setOcupado(true);
    let acumulado = "";
    await preguntarAsistente(pregunta, tipoRiesgo, (e) => {
      if (e.t === "delta") {
        acumulado += e.texto;
        actualizar(key, { texto: acumulado.trimStart() });
      } else if (e.t === "fin") {
        actualizar(key, {
          id: e.id,
          texto: e.texto,
          categoria: e.categoria,
          whatsapp: e.derivar ? e.whatsapp : null,
          sugerencias: e.sugerencias,
          escribiendo: false,
          accion: e.emergencia ? { label: "Ver qué hacer ahora", to: "/app/emergencia" } : undefined,
        });
      } else if (e.t === "limite") {
        actualizar(key, { texto: e.texto, escribiendo: false, whatsapp: `Hola, les escribo por ${myPatient?.nombre ?? "mi familiar"}. Tengo una consulta: ${pregunta}` });
      } else {
        // Sin IA: respuestas fijas de siempre (si la urgencia ya se mostró, no se repite).
        if (riesgo) {
          setBurbujas((bs) => (bs ?? []).filter((b) => b.key !== key));
          return;
        }
        const fijo = classifyMessage(pregunta);
        const esWhatsApp = fijo.escalate && /^https?:/.test(fijo.escalate.to);
        actualizar(key, {
          texto: fijo.text,
          escribiendo: false,
          accion: esWhatsApp ? undefined : fijo.escalate,
          whatsapp: esWhatsApp ? `Hola, les escribo por ${myPatient?.nombre ?? "mi familiar"}. Tengo una consulta: ${pregunta}` : null,
        });
      }
    });
    setOcupado(false);
    queryClient.invalidateQueries({ queryKey: ["asistente-historial"] });
  }

  async function borrar() {
    if (await borrarHistorialAsistente()) {
      setBurbujas([]);
      queryClient.setQueryData(["asistente-historial"], []);
    }
    setConfirmarBorrar(false);
  }

  const ultimaRespuesta = [...lista].reverse().find((b) => b.rol === "asistente" && !b.escribiendo);
  const chips = ocupado ? [] : lista.length === 0 ? sugerenciasIniciales : (ultimaRespuesta?.sugerencias ?? []);

  return (
    <div className="flex flex-col" style={{ minHeight: "min(60vh, 520px)" }}>
      {!embedded && <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Asistente IntegraMente</p>}

      <div className="grid gap-3 mb-4">
        {!isLoading && lista.length === 0 && (
          <ChatBubble role="bot">
            Hola{firstName ? `, ${firstName}` : ""}. Soy el Asistente IntegraMente, una inteligencia artificial que te acompaña con el día a día del cuidado
            {myPatient?.nombre ? ` de ${myPatient.nombre.split(" ")[0]}` : ""}. Contame qué está pasando, o elegí una de las dudas de abajo.
          </ChatBubble>
        )}
        {lista.map((b) =>
          b.rol === "usuario" ? (
            <ChatBubble key={b.key} role="user">
              <span className="whitespace-pre-line">{b.texto}</span>
            </ChatBubble>
          ) : (
            <RespuestaAsistente
              key={b.key}
              b={b}
              paciente={myPatient?.nombre}
              onAccion={(to) => navigate(to)}
              onCalificar={(v) => {
                if (!b.id) return;
                actualizar(b.key, { feedback: v });
                calificarRespuesta(b.id, v);
              }}
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dictado.escuchando ? "Te escucho…" : "Escribí tu duda…"}
            aria-label="Tu mensaje"
            className={`w-full min-h-13 pl-4 ${dictadoDisponible ? "pr-12" : "pr-4"} rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta`}
          />
          {dictadoDisponible && (
            <button
              type="button"
              onClick={() => dictado.alternar(input)}
              aria-label={dictado.escuchando ? "Detener dictado" : "Dictar por voz"}
              title={dictado.escuchando ? "Detener dictado" : "Dictar por voz"}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center ${
                dictado.escuchando ? "bg-semaforo-rojo text-white animate-pulse" : "bg-transparent text-tinta-suave hover:text-verde-profundo"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={ocupado || !input.trim()}
          className="min-h-13 px-5 rounded-xl bg-tinta text-white font-semibold text-[15px] disabled:opacity-50 cursor-pointer hover:bg-verde-profundo"
        >
          Enviar
        </button>
      </form>

      <div className="mt-3 text-[12.5px] leading-relaxed text-tinta-tenue">
        Soy una IA: puedo equivocarme y no reemplazo a nuestro equipo de salud. Recuerdo nuestras conversaciones para ayudarte mejor, y si algo es
        delicado el equipo clínico puede revisarlo.{" "}
        {lista.length > 0 &&
          (confirmarBorrar ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="text-tinta-suave font-semibold">¿Borrar todo el historial y lo que recuerdo?</span>
              <button type="button" onClick={borrar} className="bg-transparent border-none p-0 cursor-pointer font-semibold text-alerta-texto underline">
                Sí, borrar
              </button>
              <button type="button" onClick={() => setConfirmarBorrar(false)} className="bg-transparent border-none p-0 cursor-pointer font-semibold text-tinta-suave underline">
                Cancelar
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmarBorrar(true)} className="bg-transparent border-none p-0 cursor-pointer text-verde-profundo underline decoration-dotted">
              Borrar historial
            </button>
          ))}
      </div>
    </div>
  );
}

function RespuestaAsistente({
  b,
  paciente,
  onAccion,
  onCalificar,
}: {
  b: Burbuja;
  paciente?: string;
  onAccion: (to: string) => void;
  onCalificar: (v: -1 | 1 | null) => void;
}) {
  const texto = useEscritura(b.texto, !!b.animar);
  const [leyendo, setLeyendo] = useState(false);
  const esperando = b.escribiendo && !b.texto;

  return (
    <div>
      <ChatBubble role="bot">
        {esperando ? (
          <span className="inline-flex gap-1 py-1" aria-label="Escribiendo">
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
      {!b.escribiendo && b.texto && (b.id || lecturaDisponible) && (
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
          {b.id && (
            <>
              <BotonIcono label="Me sirvió" activo={b.feedback === 1} onClick={() => onCalificar(b.feedback === 1 ? null : 1)}>
                <path d="M7 10.5V20H4.5v-9.5H7zm0 0 3.8-6.3c.9 0 1.7.8 1.6 1.7l-.5 3.6h5.4a1.8 1.8 0 0 1 1.8 2.1l-1.2 6.7a1.8 1.8 0 0 1-1.8 1.5H7" />
              </BotonIcono>
              <BotonIcono label="No me sirvió" activo={b.feedback === -1} onClick={() => onCalificar(b.feedback === -1 ? null : -1)}>
                <path d="M17 13.5V4h2.5v9.5H17zm0 0-3.8 6.3c-.9 0-1.7-.8-1.6-1.7l.5-3.6H6.7a1.8 1.8 0 0 1-1.8-2.1l1.2-6.7A1.8 1.8 0 0 1 7.9 4H17" />
              </BotonIcono>
              {b.feedback === -1 && <span className="text-[12px] text-tinta-tenue ml-1">Gracias, el equipo lo va a revisar.</span>}
            </>
          )}
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

// El mensaje para el equipo, ya redactado por el asistente: la persona lo
// revisa y lo cambia antes de abrir WhatsApp. Nada se envía solo.
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

// Revela el texto con un ritmo de escritura. Lo que llega en bloque (una
// respuesta verificada antes de mostrarse) se ve igual de natural que lo
// que llega en vivo. El historial se muestra completo, sin animación.
function useEscritura(objetivo: string, animar: boolean) {
  const [visible, setVisible] = useState(animar ? 0 : objetivo.length);
  const prev = useRef(objetivo);

  useEffect(() => {
    // Si el texto cambió por completo (reemplazo final), se reinicia.
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
