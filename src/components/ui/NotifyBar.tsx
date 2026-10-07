import { useAppStore } from "../../lib/store";
import { Button } from "./Button";

export function NotifyButton() {
  const notifySent = useAppStore((s) => s.notifySent);
  const notifyNow = useAppStore((s) => s.notifyNow);
  return (
    <Button
      variant="urgency"
      onClick={notifyNow}
      className={notifySent ? "!bg-semaforo-verde-texto hover:!bg-semaforo-verde-texto" : ""}
    >
      {notifySent ? "Aviso enviado" : "Avisar a la Dra. Solano"}
    </Button>
  );
}

export function NotifyState() {
  const notify = useAppStore((s) => s.notify);
  const notifySent = useAppStore((s) => s.notifySent);
  const state = notifySent
    ? "La Dra. Solano recibió el aviso. Queda registrado con fecha y hora."
    : notify === "si"
      ? "Tu preferencia guardada es avisar. Todavía no se envió nada."
      : "Tu preferencia guardada es no avisar automáticamente.";
  return <p className="m-0 text-[15px] text-tinta-tenue">{state}</p>;
}

// Ideación / maltrato: notify + explicit skip + state, all together.
export function NotifyBar() {
  const notifySkip = useAppStore((s) => s.notifySkip);
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <NotifyButton />
      <Button variant="secondary" onClick={notifySkip}>
        No avisar por ahora
      </Button>
      <NotifyState />
    </div>
  );
}
