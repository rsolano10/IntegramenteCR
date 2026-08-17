import { useAppStore } from "../../lib/store";

export function NotifyButton() {
  const notifySent = useAppStore((s) => s.notifySent);
  const notifyNow = useAppStore((s) => s.notifyNow);
  return (
    <button
      type="button"
      onClick={notifyNow}
      className={`min-h-13 px-5.5 rounded-full border-none font-sans text-[16px] font-bold text-white cursor-pointer ${
        notifySent ? "bg-[#4c7a4c]" : "bg-semaforo-rojo hover:bg-alerta-texto"
      }`}
    >
      {notifySent ? "Aviso enviado" : "Avisar a la Dra. Solano"}
    </button>
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
      <button
        type="button"
        onClick={notifySkip}
        className="min-h-13 px-5.5 rounded-full border-[1.5px] border-borde bg-transparent font-sans text-[16px] font-semibold cursor-pointer hover:border-verde-serenidad"
      >
        No avisar por ahora
      </button>
      <NotifyState />
    </div>
  );
}
