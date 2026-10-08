import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { useSession } from "../../lib/useSession";
import { ChatBubble } from "../../components/ui/ChatBubble";

const suggestions = [
  { label: "Repite la misma pregunta", text: "Repite la misma pregunta muchas veces" },
  { label: "Se resiste al baño", text: "Se resiste al baño" },
  { label: "No quiere comer", text: "No quiere comer" },
  { label: "No duerme bien", text: "No duerme bien" },
];

export function Asistente({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const session = useSession();
  const firstName = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";
  const messages = useAppStore((s) => s.chatMessages);
  const sendChatMessage = useAppStore((s) => s.sendChatMessage);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, typing]);

  function submit(text: string) {
    if (!text.trim() || typing) return;
    setInput("");
    setTyping(true);
    // Small delay before the bot reply lands, for a natural chat feel.
    window.setTimeout(() => {
      sendChatMessage(text);
      setTyping(false);
    }, 500);
  }

  function handleEscalate(to: string) {
    navigate(to);
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "min(60vh, 520px)" }}>
      {!embedded && <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Asistente guiado</p>}
      <p className="m-0 mb-4 text-[14px] text-tinta-tenue">
        Respuestas basadas en protocolos revisados. Para lo demás, escribile a tu profesional.
      </p>

      {/* No independent scroll region here — the page itself scrolls, so
          there's only ever one scrollbar instead of two nested ones. */}
      <div className="grid gap-3 mb-4">
        <ChatBubble role="bot">
          Hola{firstName ? `, ${firstName}` : ""}. Contame qué está pasando y te ayudo, o elegí una de las dudas frecuentes de abajo.
        </ChatBubble>
        {messages.map((m) => (
          <div key={m.id}>
            <ChatBubble role={m.role}>
              {m.text}
              {m.escalate && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleEscalate(m.escalate!.to)}
                    className="min-h-9 px-3.5 rounded-full bg-semaforo-rojo text-white text-[13px] font-bold cursor-pointer"
                  >
                    {m.escalate.label}
                  </button>
                </div>
              )}
            </ChatBubble>
          </div>
        ))}
        {typing && (
          <ChatBubble role="bot">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tinta-tenue animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-tinta-tenue animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-tinta-tenue animate-bounce" />
            </span>
          </ChatBubble>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => submit(s.text)}
            disabled={typing}
            className="px-3.5 py-2 rounded-full border border-borde bg-white text-[13px] font-semibold text-tinta hover:border-verde-serenidad disabled:opacity-50 cursor-pointer"
          >
            {s.label}
          </button>
        ))}
      </div>

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
          placeholder="Escribí tu duda…"
          className="flex-1 min-h-13 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta"
        />
        <button
          type="submit"
          disabled={typing || !input.trim()}
          className="min-h-13 px-5 rounded-xl bg-tinta text-white font-semibold text-[15px] disabled:opacity-50 cursor-pointer hover:bg-verde-profundo"
        >
          Enviar
        </button>
      </form>

      {!embedded && (
        <Link
          to="/app/emergencia"
          className="mt-3.5 text-center text-[13.5px] text-tinta-tenue underline decoration-dotted hover:text-alerta-texto"
        >
          ¿Es una emergencia o una situación de riesgo? Tocá acá
        </Link>
      )}
    </div>
  );
}
