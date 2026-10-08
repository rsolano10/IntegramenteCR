import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { markMensajesLeidos, useMensajes } from "../../lib/useMensajes";

// La conversación con el equipo clínico — vive dentro de la pestaña Ayuda.
export function ConversacionProfesional({ patientId }: { patientId: string }) {
  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const queryClient = useQueryClient();
  const { data: mensajes, isLoading } = useMensajes(patientId);
  const endRef = useRef<HTMLDivElement>(null);

  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Verlos = leídos (apaga el contador de la pestaña).
  useEffect(() => {
    if (myUserId && mensajes) markMensajesLeidos(patientId, myUserId);
  }, [patientId, myUserId, mensajes]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [mensajes?.length]);

  async function send() {
    if (!texto.trim() || !myUserId) return;
    setError("");
    setSending(true);
    const { error: sendError } = await supabase.from("mensajes").insert({ patient_id: patientId, texto: texto.trim(), autor_id: myUserId });
    setSending(false);
    if (sendError) {
      setError("No pudimos enviar el mensaje. Probá de nuevo.");
      return;
    }
    setTexto("");
    queryClient.invalidateQueries({ queryKey: ["mensajes", patientId] });
  }

  return (
    <div>
      {isLoading && <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>}
      {!isLoading && (!mensajes || mensajes.length === 0) && (
        <div className="rounded-2xl bg-campo border border-borde-suave p-4.5 mb-4.5">
          <p className="m-0 text-[15px] leading-relaxed text-tinta-suave">
            Todavía no hay mensajes. Escribile a tu profesional cualquier duda sobre las actividades o el cuidado.
          </p>
        </div>
      )}
      {mensajes && mensajes.length > 0 && (
        <div className="grid gap-3 mb-4.5">
          {mensajes.map((m) => {
            const mine = m.autor_id === myUserId;
            return (
              <div
                key={m.id}
                className={`rounded-2xl p-4.5 max-w-[85%] ${mine ? "justify-self-end border-[1.5px] border-verde-serenidad bg-verde-tenue" : "justify-self-start border border-borde bg-white"}`}
              >
                <p className="m-0 mb-1.5 text-[13px] text-tinta-tenue">
                  {mine ? "Vos" : "Tu equipo clínico"} · {new Date(m.created_at).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p className="m-0 text-[16px] leading-relaxed text-tinta whitespace-pre-wrap">{m.texto}</p>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      <div className="border-t border-borde pt-4.5">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un mensaje para tu equipo clínico…"
          rows={3}
          className="w-full min-h-[90px] rounded-2xl border-[1.5px] border-borde-campo bg-campo px-4 py-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
        />
        {error && <p className="m-0 mt-2 text-[14px] text-alerta-texto">{error}</p>}
        <button
          type="button"
          onClick={send}
          disabled={sending || !texto.trim()}
          className="mt-3 min-h-12 px-6 rounded-full bg-tinta text-white font-sans font-semibold text-[16px] cursor-pointer hover:bg-verde-profundo disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
