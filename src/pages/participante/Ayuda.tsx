import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";

export function Ayuda() {
  const navigate = useNavigate();
  const location = useLocation();
  // Coming from "No pude" on an activity pre-fills the reason instead of
  // making the person retype what already happened — still fully editable.
  const draft = (location.state as { draft?: string } | null)?.draft ?? "";
  const session = useSession();
  const myUserId = session.status === "authed" ? session.session.user.id : null;
  const { data: myPatient } = useMyPatient();

  // Only when there's no familiar to relay through does this screen need to
  // reach the clinic directly — otherwise the family already handles it.
  const { data: hasFamiliar, isLoading: loadingHasFamiliar } = useQuery({
    queryKey: ["has-familiar-admin", myPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_familiar_admin", { p_patient_id: myPatient!.id });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!myPatient,
  });

  const [confirmed, setConfirmed] = useState(false);
  const [texto, setTexto] = useState(draft);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function enviar() {
    if (!texto.trim() || !myPatient || !myUserId) return;
    setError("");
    setSending(true);
    const { error: sendError } = await supabase.from("mensajes").insert({ patient_id: myPatient.id, texto: texto.trim(), autor_id: myUserId });
    setSending(false);
    if (sendError) {
      setError("No pudimos enviar el mensaje. Probá de nuevo.");
      return;
    }
    setSent(true);
  }

  if (loadingHasFamiliar) return <div className="flex-1" />;

  if (!confirmed && !sent) {
    return (
      <div className="flex flex-col gap-6 flex-1 justify-center text-center">
        <p className="m-0 text-[30px] leading-snug font-serif">
          {hasFamiliar ? "Vamos a avisarle a tu familiar" : "Vamos a escribirle a tu equipo clínico"}
        </p>
        <p className="m-0 text-[20px] leading-relaxed text-tinta-suave">¿Querés continuar?</p>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="min-h-17 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-[22px] font-bold cursor-pointer hover:bg-verde-profundo"
          >
            Sí, continuar
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/participante/hoy")}
            className="min-h-17 border-2 border-borde rounded-2xl bg-white text-tinta font-sans text-[20px] font-bold cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (sent || hasFamiliar) {
    return (
      <div className="flex flex-col gap-6 flex-1 justify-center text-center">
        <p className="m-0 text-[32px] leading-snug font-serif">
          {sent ? "Ya le avisamos a tu equipo clínico" : "Ya le avisamos a tu familiar"}
        </p>
        <p className="m-0 text-[22px] leading-relaxed text-tinta-suave">Esperá tranquilo. No hace falta hacer nada más.</p>
        <button
          type="button"
          onClick={() => navigate("/app/participante/hoy")}
          className="min-h-17 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-[22px] font-bold cursor-pointer hover:bg-verde-profundo"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 flex-1 justify-center">
      <p className="m-0 text-[28px] leading-snug font-serif text-center">¿Qué necesitás?</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        placeholder="Contanos qué pasa…"
        className="w-full rounded-2xl border-[1.5px] border-[#ddd7be] bg-campo px-5 py-4 font-sans text-[20px] leading-relaxed text-tinta resize-y"
      />
      {error && <p className="m-0 text-[16px] text-alerta-texto text-center">{error}</p>}
      <button
        type="button"
        onClick={enviar}
        disabled={sending || !texto.trim()}
        className="min-h-17 border-none rounded-2xl bg-verde-serenidad text-white font-sans text-[22px] font-bold cursor-pointer hover:bg-verde-profundo disabled:opacity-50"
      >
        {sending ? "Enviando…" : "Enviar a mi equipo clínico"}
      </button>
    </div>
  );
}
