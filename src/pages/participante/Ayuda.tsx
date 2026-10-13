import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { waEquipo } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";
import { useMyPatient } from "../../lib/useMyPatient";
import { BigActionButton } from "../../components/ui/BigActionButton";

export function Ayuda() {
  const navigate = useNavigate();
  const location = useLocation();
  // Coming from "No pude" on an activity pre-fills the reason instead of
  // making the person retype what already happened — editable in WhatsApp.
  const draft = (location.state as { draft?: string } | null)?.draft ?? "";
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

  if (loadingHasFamiliar) return <div className="flex-1" />;

  if (!confirmed) {
    return (
      <div className="flex flex-col gap-6 flex-1 justify-center text-center">
        <p className="m-0 text-[30px] leading-snug font-serif">
          {hasFamiliar ? "Vamos a avisarle a tu familiar" : "Vamos a escribirle a tu equipo por WhatsApp"}
        </p>
        <p className="m-0 text-[20px] leading-relaxed text-tinta-suave">¿Querés continuar?</p>
        <div className="grid gap-3">
          <BigActionButton variant="primary" size="md" onClick={() => setConfirmed(true)}>
            Sí, continuar
          </BigActionButton>
          <BigActionButton variant="secondary" size="md" onClick={() => navigate("/app/participante/hoy")}>
            Cancelar
          </BigActionButton>
        </div>
      </div>
    );
  }

  if (hasFamiliar) {
    return (
      <div className="flex flex-col gap-6 flex-1 justify-center text-center">
        <p className="m-0 text-[32px] leading-snug font-serif">
          Ya le avisamos a tu familiar
        </p>
        <p className="m-0 text-[22px] leading-relaxed text-tinta-suave">Esperá tranquilo. No hace falta hacer nada más.</p>
        <BigActionButton variant="primary" size="md" onClick={() => navigate("/app/participante/hoy")}>
          Volver
        </BigActionButton>
      </div>
    );
  }

  // Sin familiar que haga de puente: WhatsApp, el único canal con el
  // equipo. El mensaje ya va escrito (con lo que pasó en la actividad, si
  // viene de "No pude"); solo falta tocar enviar en WhatsApp.
  const texto = draft.trim() ? `Necesito ayuda. ${draft.trim()}` : "Necesito ayuda.";
  return (
    <div className="flex flex-col gap-6 flex-1 justify-center text-center">
      <p className="m-0 text-[30px] leading-snug font-serif">Escribile a tu equipo por WhatsApp</p>
      <p className="m-0 text-[20px] leading-relaxed text-tinta-suave">Se abre WhatsApp con el mensaje listo. Solo tocá enviar.</p>
      <a
        href={waEquipo(texto, myPatient?.nombre)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 min-h-[72px] rounded-3xl bg-[#25d366] text-white font-sans font-bold text-[22px] no-underline"
      >
        <WhatsAppIcon size={28} /> Abrir WhatsApp
      </a>
      <BigActionButton variant="secondary" size="md" onClick={() => navigate("/app/participante/hoy")}>
        Volver
      </BigActionButton>
    </div>
  );
}
