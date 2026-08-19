import { useState } from "react";
import { Button } from "../ui/Button";

export function DeleteConfirmModal({
  title,
  message,
  warningNote,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  warningNote?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-40 bg-tinta/40 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[440px] bg-white border-2 border-semaforo-rojo rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-elevada"
      >
        <h2 className="font-serif font-normal text-2xl leading-snug m-0 mb-3">{title}</h2>
        <p className="m-0 mb-4 text-[16px] leading-relaxed text-tinta-suave">{message}</p>
        {warningNote && <p className="m-0 mb-5 text-[14px] leading-relaxed text-aviso-texto bg-aviso rounded-xl px-4 py-3">{warningNote}</p>}
        <div className="flex gap-3 flex-wrap">
          <Button variant="urgency" onClick={confirm} disabled={loading}>
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
