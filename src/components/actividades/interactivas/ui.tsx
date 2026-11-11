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
  const estilo =
    variante === "primario"
      ? "border-0 bg-verde-profundo text-white hover:bg-tinta"
      : "border-2 border-verde-serenidad bg-white text-verde-profundo hover:bg-verde-tenue";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`inline-flex items-center justify-center gap-2 min-h-14 px-6 rounded-full font-sans font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-default ${large ? "text-[22px]" : "text-[20px]"} ${estilo} ${foco} ${className}`}
    >
      {children}
    </button>
  );
}
