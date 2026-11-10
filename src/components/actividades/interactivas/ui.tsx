import type { ReactNode } from "react";
import { foco } from "./comun";

// Piezas visuales comunes de las actividades interactivas. Toques de 56 px o
// más, 12 px entre elementos, texto de 20 px o más; la selección y la
// confirmación nunca dependen solo del color (borde grueso, ícono o texto).

export function Boton({
  children,
  onClick,
  variante = "primario",
  disabled,
  className = "",
  autoFocus,
  large,
}: {
  children: ReactNode;
  onClick: () => void;
  variante?: "primario" | "secundario";
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`inline-flex items-center justify-center gap-2 min-h-14 px-6 rounded-full font-sans font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-default ${large ? "text-[22px]" : "text-[20px]"} ${
        variante === "primario"
          ? "border-0 bg-verde-profundo text-white hover:bg-tinta"
          : "border-2 border-verde-serenidad bg-white text-verde-profundo hover:bg-verde-tenue"
      } ${foco} ${className}`}
    >
      {children}
    </button>
  );
}

// Insignia de «bien ubicado» (ícono, no solo color).
export function Check({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-semaforo-verde-texto text-white flex items-center justify-center ${className}`}>
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2l2.2 2.2 4.8-4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Marca de «elegido» (tocado, esperando el destino o «Listo»).
export function Elegido({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-verde-profundo text-white flex items-center justify-center ${className}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="6" cy="6" r="3" />
      </svg>
    </span>
  );
}
