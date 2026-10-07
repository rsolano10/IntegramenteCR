import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useBodyScrollLock } from "../../lib/useBodyScrollLock";

const EXIT_MS = 150;

export function Modal({
  onClose,
  children,
  className = "",
  tone = "default",
  size = "md",
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
  // "danger" softens the destructive-action treatment that used to be a
  // bare `className` hack (a stark 2px solid red border) into a single
  // shared, hairline-bordered variant — DeleteConfirmModal/RejectPatientModal
  // pair it with their own warning-icon medallion in the title.
  tone?: "default" | "danger";
  // "lg" is for forms/content too dense for the 520px default (patient and
  // account detail, media resources, plan assignment) — a pure width swap,
  // every modal's internal layout already wraps responsively.
  size?: "md" | "lg";
}) {
  useBodyScrollLock();
  const [closing, setClosing] = useState(false);

  // Backdrop click / Escape / the × all funnel through this instead of
  // calling onClose directly, so the exit animation below gets to play
  // before the parent actually unmounts us.
  function requestClose() {
    setClosing(true);
  }

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(onClose, EXIT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const sizeClass = size === "lg" ? "sm:max-w-[700px]" : "sm:max-w-[520px]";
  const toneClass = tone === "danger" ? "border-[1.5px] border-alerta-borde" : "";

  return (
    <div
      className={`fixed inset-0 z-40 bg-tinta/45 backdrop-blur-[3px] flex items-end sm:items-center justify-center p-0 sm:p-5 ${closing ? "modal-backdrop-out" : "modal-backdrop-in"}`}
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${sizeClass} max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-elevada ${toneClass} ${closing ? "modal-panel-out" : "modal-panel-in"} ${className}`}
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="Cerrar"
          className="float-right -mt-1 -mr-1 w-9 h-9 inline-flex items-center justify-center rounded-full bg-campo text-tinta-tenue hover:bg-borde-suave hover:text-tinta transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
