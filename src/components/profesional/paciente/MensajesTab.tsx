import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../ui/Button";
import type { PatientRow } from "../../../lib/patients";

interface Mensaje {
  id: string;
  texto: string;
  autor_id: string | null;
  created_at: string;
}

export function MensajesTab({ patient, myUserId }: { patient: PatientRow; myUserId: string | null }) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const { data: mensajes, isLoading } = useQuery({
    queryKey: ["mensajes", patient.id],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("mensajes")
        .select("id, texto, autor_id, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: true });
      if (fetchError) throw fetchError;
      return data as Mensaje[];
    },
  });

  // Names come from the patient's links (list_patients, security definer) —
  // a profiles join would be nulled out by RLS for anyone the clinic isn't
  // linked to.
  const names = new Map(patient.links.map((l) => [l.profile_id, l.nombre]));
  const authorLabel = (id: string | null) => (id === myUserId ? "Vos" : (id && names.get(id)) || "Equipo clínico");

  async function send() {
    if (!texto.trim() || !myUserId) return;
    setError("");
    setSending(true);
    const { error: sendError } = await supabase.from("mensajes").insert({ patient_id: patient.id, texto: texto.trim(), autor_id: myUserId });
    setSending(false);
    if (sendError) {
      setError("No pudimos enviar el mensaje. Probá de nuevo.");
      return;
    }
    setTexto("");
    queryClient.invalidateQueries({ queryKey: ["mensajes", patient.id] });
    queryClient.invalidateQueries({ queryKey: ["pending-threads"] });
  }

  return (
    <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 max-w-[760px]">
      {isLoading && <p className="m-0 text-[14px] text-tinta-tenue">Cargando…</p>}
      {!isLoading && (!mensajes || mensajes.length === 0) && (
        <p className="m-0 mb-4 text-[14.5px] text-tinta-tenue">Todavía no hay mensajes con esta familia.</p>
      )}
      {mensajes && mensajes.length > 0 && (
        <div className="grid gap-2.5 mb-5 max-h-[55vh] overflow-y-auto pr-1">
          {mensajes.map((m) => {
            const mine = m.autor_id === myUserId;
            const clinica = mine || !names.has(m.autor_id ?? "") || patient.links.find((l) => l.profile_id === m.autor_id)?.relation === "profesional_asignado";
            return (
              <div
                key={m.id}
                className={`rounded-2xl p-3.5 max-w-[85%] ${clinica ? "justify-self-end border-[1.5px] border-verde-serenidad bg-verde-tenue" : "justify-self-start border border-borde bg-campo"}`}
              >
                <p className="m-0 mb-1 text-[12px] text-tinta-tenue">
                  {authorLabel(m.autor_id)} · {new Date(m.created_at).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p className="m-0 text-[14.5px] leading-relaxed text-tinta whitespace-pre-wrap">{m.texto}</p>
              </div>
            );
          })}
        </div>
      )}
      <div className="grid gap-2.5 border-t border-borde-suave pt-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribir a la familia…"
          rows={3}
          className="w-full rounded-2xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans text-[14.5px] leading-relaxed text-tinta resize-y focus:border-verde-serenidad"
        />
        {error && <p className="m-0 text-[13.5px] text-alerta-texto">{error}</p>}
        <Button variant="ink" dense onClick={send} disabled={sending || !texto.trim()} className="justify-self-start">
          {sending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </section>
  );
}
