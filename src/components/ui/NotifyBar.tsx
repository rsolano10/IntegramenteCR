import { useEffect, useRef, useState } from "react";
import { useSession } from "../../lib/useSession";
import { useAlertaRiesgo, type TipoAlerta } from "../../lib/useAlertaRiesgo";
import { Button } from "./Button";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" });

// Aviso real a la clínica (alertas_riesgo + correo al equipo + mensaje en
// el chat). Si la cuenta tiene "avisar automáticamente" activado, se envía
// solo al abrir la pantalla — una vez: el servidor reutiliza un aviso del
// mismo tipo de los últimos 30 min en vez de duplicarlo.
function useAviso(tipo: TipoAlerta, auto: boolean) {
  const session = useSession();
  const { alerta, loading, enviar, hasPatient } = useAlertaRiesgo(tipo);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [omitido, setOmitido] = useState(false);
  const autoTried = useRef(false);
  const prefAuto = session.status === "authed" && session.profile.avisar_riesgo_auto;
  const reciente = alerta && !alerta.atendida_at && Date.now() - new Date(alerta.created_at).getTime() < 30 * 60 * 1000;

  async function send(automatica = false) {
    setError(false);
    setSending(true);
    const ok = await enviar(automatica);
    setSending(false);
    if (!ok) setError(true);
  }

  useEffect(() => {
    if (!auto || autoTried.current || loading || !hasPatient || !prefAuto || reciente) return;
    autoTried.current = true;
    send(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, loading, hasPatient, prefAuto, reciente]);

  return { alerta, reciente: !!reciente, sending, error, send, prefAuto, omitido, setOmitido, hasPatient };
}

function Estado({ alerta, reciente, error, prefAuto, omitido }: ReturnType<typeof useAviso>) {
  let texto: string;
  let tone = "text-tinta-tenue";
  if (error) {
    texto = "No pudimos enviar el aviso. Revisá tu conexión y probá de nuevo — si es urgente, llamá al 9-1-1.";
    tone = "text-alerta-texto";
  } else if (alerta && reciente) {
    tone = "text-semaforo-verde-texto";
    texto = alerta.vista_at
      ? `✓ Tu profesional ya vio el aviso (enviado a las ${hora(alerta.created_at)}). Te va a contactar.`
      : `✓ Aviso enviado a tu profesional (${hora(alerta.created_at)}). También quedó en tus mensajes.`;
  } else if (alerta?.atendida_at) {
    texto = `Tu profesional atendió el último aviso (${hora(alerta.atendida_at)}).`;
  } else if (omitido) {
    texto = "No se envió ningún aviso. Podés hacerlo cuando quieras con el botón.";
  } else {
    texto = prefAuto ? "Tu preferencia es avisar automáticamente." : "Tu preferencia es no avisar automáticamente — usá el botón si querés avisar.";
  }
  return <p className={`m-0 text-[15px] leading-relaxed ${tone}`} aria-live="polite">{texto}</p>;
}

function Boton({ aviso }: { aviso: ReturnType<typeof useAviso> }) {
  const enviado = !!aviso.alerta && aviso.reciente;
  if (!aviso.hasPatient) return null;
  return (
    <Button
      variant="urgency"
      onClick={() => aviso.send(false)}
      disabled={aviso.sending || enviado}
      className={enviado ? "!bg-semaforo-verde-texto hover:!bg-semaforo-verde-texto !opacity-100" : ""}
    >
      {aviso.sending ? "Enviando…" : enviado ? "Aviso enviado" : aviso.error ? "Reintentar aviso" : "Avisar a tu profesional"}
    </Button>
  );
}

// Caída / cambio agudo / extravío: el botón (con aviso automático según la
// preferencia de la cuenta) y el estado van en lugares distintos de la
// pantalla — ambos leen la misma consulta, así que se mantienen en sync.
export function NotifyButton({ tipo }: { tipo: TipoAlerta }) {
  const aviso = useAviso(tipo, true);
  return <Boton aviso={aviso} />;
}

export function NotifyState({ tipo }: { tipo: TipoAlerta }) {
  const aviso = useAviso(tipo, false);
  return <Estado {...aviso} />;
}

// Ideación / maltrato: nunca automático — son situaciones delicadas donde
// la persona decide explícitamente; por eso también "No avisar por ahora".
export function NotifyBar({ tipo }: { tipo: TipoAlerta }) {
  const aviso = useAviso(tipo, false);
  const enviado = !!aviso.alerta && aviso.reciente;
  return (
    <div className="grid gap-3">
      <div className="flex gap-3 flex-wrap items-center">
        <Boton aviso={aviso} />
        {!enviado && (
          <Button variant="secondary" onClick={() => aviso.setOmitido(true)}>
            No avisar por ahora
          </Button>
        )}
      </div>
      <Estado {...aviso} />
    </div>
  );
}
