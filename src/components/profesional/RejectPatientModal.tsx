import { useState } from "react";
import { callAdminAccounts } from "../../lib/adminAccounts";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function RejectPatientModal({
  patientId,
  patientNombre,
  onClose,
  onRejected,
}: {
  patientId: string;
  patientNombre: string;
  onClose: () => void;
  onRejected: (message: string) => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!mensaje.trim()) {
      setError("Escribí el motivo — se le va a compartir a la familia.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const result = await callAdminAccounts("reject_patient", { patientId, mensaje: mensaje.trim() });
      onRejected(result.message ?? result.warning ?? `${patientNombre} fue rechazado.`);
    } catch (err) {
      setSending(false);
      setError(err instanceof Error ? err.message : "No pudimos rechazar la cuenta.");
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5 text-alerta-texto">¿Rechazar a {patientNombre}?</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        Se borra el registro del paciente y no se puede deshacer. La familia recibe el mensaje que escribas acá.
      </p>

      {!confirming ? (
        <>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51] mb-5">
            Mensaje para la familia
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              className="w-full rounded-xl border-[1.5px] border-[#ddd7be] bg-campo px-4 py-3 font-sans text-[15px] leading-relaxed text-tinta resize-y"
            />
          </label>
          {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!mensaje.trim()) {
                  setError("Escribí el motivo — se le va a compartir a la familia.");
                  return;
                }
                setError("");
                setConfirming(true);
              }}
            >
              Continuar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl p-4.5 mb-5">
            <p className="m-0 text-[15px] leading-relaxed text-riesgo-texto">
              Confirmá que querés rechazar a {patientNombre} y enviar este mensaje. Esta acción no se puede deshacer.
            </p>
          </div>
          {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={sending}>
              Atrás
            </Button>
            <Button variant="urgency" onClick={submit} disabled={sending}>
              {sending ? "Rechazando…" : "Sí, rechazar"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
