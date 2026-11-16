import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { waEquipo } from "../../lib/whatsapp";
import { WhatsAppIcon } from "../../components/ui/WhatsAppIcon";
import { useMyPatient } from "../../lib/useMyPatient";
import { BigActionButton } from "../../components/ui/BigActionButton";
import { Cargando } from "../../components/ui/Cargando";
import { PhoneIcon } from "../../components/ui/Icons";
import { normalizeCrPhone } from "../../lib/phone";

const botonGrande = "flex items-center justify-center gap-3 min-h-17 rounded-2xl font-sans font-bold text-xl no-underline";

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

  // Nombre y teléfono del familiar a cargo, para el botón «Llamar a …».
  const { data: familiar } = useQuery({
    queryKey: ["familiar-de-contacto", myPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("familiar_de_contacto", { p_patient_id: myPatient!.id });
      if (error) throw error;
      return ((data as { nombre: string | null; telefono: string | null }[] | null) ?? [])[0] ?? null;
    },
    enabled: !!myPatient && hasFamiliar === true,
  });

  const [confirmed, setConfirmed] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(false);

  // El pedido se guarda de verdad: el familiar lo ve al abrir Hoy y la
  // clínica, en la ficha. Solo si se guardó se dice que se dejó el aviso.
  async function pedirAyuda() {
    if (!hasFamiliar) {
      setConfirmed(true);
      return;
    }
    setEnviando(true);
    setFallo(false);
    const { error } = await supabase.rpc("pedir_ayuda", { p_nota: draft.trim() || null });
    setEnviando(false);
    if (error) setFallo(true);
    else setConfirmed(true);
  }

  if (loadingHasFamiliar) return <Cargando />;

  const nombreFamiliar = familiar?.nombre?.split(" ")[0] ?? null;
  const tel = familiar?.telefono ? normalizeCrPhone(familiar.telefono) : null;
  const llamar = (
    <div className="grid gap-3">
      {tel && (
        <a href={`tel:${tel}`} className={`${botonGrande} bg-verde-profundo text-white`}>
          <PhoneIcon className="w-7 h-7" /> Llamar a {nombreFamiliar ?? "tu familiar"}
        </a>
      )}
      <a href="tel:911" className={`${botonGrande} border-2 border-semaforo-rojo bg-white text-semaforo-rojo`}>
        Es una emergencia: 9-1-1
      </a>
    </div>
  );

  if (!confirmed) {
    return (
      <div className="flex flex-col gap-6 flex-1 justify-center text-center">
        <p className="m-0 text-[30px] leading-snug font-serif">
          {hasFamiliar ? `Vamos a avisarle a ${nombreFamiliar ?? "tu familiar"}` : "Vamos a escribirle a tu equipo por WhatsApp"}
        </p>
        <p className="m-0 text-[20px] leading-relaxed text-tinta-suave">¿Querés continuar?</p>
        <div className="grid gap-3">
          <BigActionButton variant="principal" size="md" onClick={pedirAyuda} disabled={enviando}>
            {enviando ? "Avisando…" : "Sí, continuar"}
          </BigActionButton>
          <BigActionButton variant="secondary" size="md" onClick={() => navigate("/app/participante/hoy")}>
            Cancelar
          </BigActionButton>
        </div>
        {fallo && (
          <div role="alert" className="grid gap-4">
            <p className="m-0 text-[19px] leading-relaxed text-alerta-texto">No pudimos dejar el aviso. Revisá la conexión, o llamá directamente.</p>
            {llamar}
          </div>
        )}
      </div>
    );
  }

  if (hasFamiliar) {
    return (
      <div className="flex flex-col gap-6 flex-1 justify-center text-center">
        <p className="m-0 text-[32px] leading-snug font-serif">Le dejamos el aviso a {nombreFamiliar ?? "tu familiar"}</p>
        <p className="m-0 text-[21px] leading-relaxed text-tinta-suave">
          Lo va a ver cuando abra la app. Si necesitás ayuda ya, llamá.
        </p>
        {llamar}
        <BigActionButton variant="secondary" size="md" onClick={() => navigate("/app/participante/hoy")}>
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
