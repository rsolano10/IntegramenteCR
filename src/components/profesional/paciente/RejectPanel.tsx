import { useState } from "react";
import { callAdminAccounts } from "../../../lib/adminAccounts";
import { Button } from "../../ui/Button";

const MIN_CHARS = 30;

// Starting points, not canned answers — each one still needs the clinic's
// own words before it can be sent (the minimum length enforces that).
const SUGERENCIAS = [
  "Por lo que nos contaste, en este momento necesita una valoración presencial antes de empezar un programa en casa. ",
  "Las necesidades actuales requieren un acompañamiento médico más cercano que el que ofrece el programa en casa. ",
  "Nos gustaría conversar primero con ustedes para entender mejor la situación. ",
];

// Rechazo con comentario obligatorio: es lo único que la familia va a
// recibir (correo + WhatsApp cuando esté activo), así que no se puede
// enviar vacío ni con dos palabras. Dos pasos — escribir, después
// confirmar — porque borra la solicitud y no se puede deshacer.
export function RejectPanel({
  patientId,
  patientNombre,
  onCancel,
  onRejected,
}: {
  patientId: string;
  patientNombre: string;
  onCancel: () => void;
  onRejected: (message: string) => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const largo = mensaje.trim().length;
  const valido = largo >= MIN_CHARS;

  async function submit() {
    setError("");
    setSending(true);
    try {
      const result = await callAdminAccounts("reject_patient", { patientId, mensaje: mensaje.trim() });
      onRejected(result.message ?? result.warning ?? `Solicitud de ${patientNombre} rechazada.`);
    } catch (err) {
      setSending(false);
      setError(err instanceof Error ? err.message : "No pudimos rechazar la solicitud.");
    }
  }

  if (confirming) {
    return (
      <div className="grid gap-4">
        <h3 className="font-serif font-normal text-[22px] m-0 text-alerta-texto">¿Confirmás el rechazo?</h3>
        <div className="rounded-2xl bg-campo border border-borde-suave p-4">
          <p className="m-0 mb-1.5 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue font-semibold">La familia va a recibir</p>
          <p className="m-0 text-[14px] leading-relaxed text-tinta whitespace-pre-wrap">{mensaje.trim()}</p>
        </div>
        <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
          Se borra la solicitud de {patientNombre} y no se puede deshacer.
        </p>
        {error && <p className="m-0 text-[13.5px] text-alerta-texto">{error}</p>}
        <div className="grid gap-2.5">
          <Button variant="urgency" fullWidth onClick={submit} disabled={sending}>
            {sending ? "Enviando…" : "Sí, rechazar y avisar"}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirming(false)} disabled={sending}>
            Volver a editar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3.5">
      <h3 className="font-serif font-normal text-[22px] m-0">Rechazar solicitud</h3>
      <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
        Escribile a la familia por qué y qué les recomendás. Le llega por <strong>correo</strong> y <strong>WhatsApp</strong>.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setMensaje((m) => (m.trim() ? m : s))}
            className="text-left text-[12.5px] leading-snug px-3 py-1.5 rounded-xl border border-borde bg-campo text-tinta-suave cursor-pointer hover:border-verde-serenidad"
          >
            {s.split(" ").slice(0, 6).join(" ")}…
          </button>
        ))}
      </div>
      <label className="grid gap-1.5">
        <span className="sr-only">Mensaje para la familia</span>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={6}
          placeholder="Ej.: Gracias por confiar en nosotros. Por lo que nos contaron…"
          className="w-full rounded-2xl border-[1.5px] border-borde-campo bg-campo px-4 py-3 font-sans text-[14.5px] leading-relaxed text-tinta resize-y focus:border-verde-serenidad"
        />
        <span className={`text-[12.5px] ${valido ? "text-semaforo-verde-texto" : "text-tinta-tenue"}`}>
          {valido ? "✓ Listo para enviar" : `Mínimo ${MIN_CHARS} caracteres · faltan ${MIN_CHARS - largo}`}
        </span>
      </label>
      <div className="grid gap-2.5">
        <Button variant="ink" fullWidth disabled={!valido} onClick={() => setConfirming(true)}>
          Revisar y enviar
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
