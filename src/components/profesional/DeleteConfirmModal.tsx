import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { WarningIcon } from "../ui/Icons";

export function DeleteConfirmModal({
  title,
  message,
  warningNote,
  confirmLabel = "Sí, eliminar",
  confirmLoadingLabel = "Eliminando…",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  warningNote?: string;
  confirmLabel?: string;
  confirmLoadingLabel?: string;
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
    <Modal onClose={onCancel} tone="danger" className="sm:max-w-[440px]">
      <div className="flex items-start gap-3 mb-3">
        <span className="shrink-0 w-9 h-9 rounded-full bg-alerta flex items-center justify-center text-alerta-texto">
          <WarningIcon />
        </span>
        <h2 className="font-serif font-normal text-2xl leading-snug m-0 mt-1">{title}</h2>
      </div>
      <p className="m-0 mb-4 text-[16px] leading-relaxed text-tinta-suave">{message}</p>
      {warningNote && <p className="m-0 mb-5 text-[14px] leading-relaxed text-aviso-texto bg-aviso rounded-xl px-4 py-3">{warningNote}</p>}
      <div className="flex gap-3 flex-wrap">
        <Button variant="urgency" onClick={confirm} disabled={loading}>
          {loading ? confirmLoadingLabel : confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
