import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";

interface Mensaje {
  id: string;
  texto: string;
  autor_id: string | null;
  created_at: string;
}

export function Mensajes() {
  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const { data: myPatient, isLoading: loadingPatient } = useMyPatient();
  const queryClient = useQueryClient();

  const { data: mensajes, isLoading } = useQuery({
    queryKey: ["mensajes", myPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("id, texto, autor_id, created_at")
        .eq("patient_id", myPatient!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Mensaje[];
    },
    enabled: !!myPatient,
  });

  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!texto.trim() || !myPatient || !myUserId) return;
    setError("");
    setSending(true);
    const { error: sendError } = await supabase
      .from("mensajes")
      .insert({ patient_id: myPatient.id, texto: texto.trim(), autor_id: myUserId });
    setSending(false);
    if (sendError) {
      setError("No pudimos enviar el mensaje. Probá de nuevo.");
      return;
    }
    setTexto("");
    queryClient.invalidateQueries({ queryKey: ["mensajes", myPatient.id] });
  }

  return (
    <div>
      <p className="m-0 mb-1.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Mensajes</p>
      <h3 className="font-serif font-normal text-[23px] m-0 mb-4.5">Conversación con tu clínica</h3>

      {(loadingPatient || isLoading) && <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>}

      {!loadingPatient && !isLoading && (
        <>
          {!mensajes || mensajes.length === 0 ? (
            <p className="m-0 mb-4.5 text-[15px] text-tinta-tenue">Todavía no tenés mensajes.</p>
          ) : (
            <div className="grid gap-3 mb-4.5">
              {mensajes.map((m) => {
                const mine = m.autor_id === myUserId;
                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl p-4.5 max-w-[85%] ${mine ? "justify-self-end border-[1.5px] border-verde-serenidad bg-[#f5f9f9]" : "justify-self-start border border-borde bg-white"}`}
                  >
                    <p className="m-0 mb-1.5 text-[13px] text-tinta-tenue">
                      {mine ? "Vos" : "Tu equipo clínico"} ·{" "}
                      {new Date(m.created_at).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    <p className="m-0 text-[16px] leading-relaxed text-tinta">{m.texto}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-borde pt-4.5">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribí un mensaje para tu equipo clínico…"
              rows={3}
              className="w-full min-h-[90px] rounded-2xl border-[1.5px] border-[#ddd7be] bg-campo px-4 py-3.5 font-sans text-[16px] leading-relaxed text-tinta resize-y"
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
        </>
      )}
    </div>
  );
}
