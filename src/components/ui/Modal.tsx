import { useEffect } from "react";
import type { ReactNode } from "react";

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 bg-tinta/40 flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[520px] max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-elevada"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="float-right -mt-1 -mr-1 w-9 h-9 inline-flex items-center justify-center rounded-full text-tinta-tenue hover:bg-fondo-papel cursor-pointer"
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
