import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { foco, type Control } from "./comun";

// Botones de las actividades. Tres jerarquías claras y un solo tamaño de
// toque (56 px de alto):
// - primario: la acción que avanza (Listo, Siguiente, Empezar). Sólido, con
//   sombra corta de papel; ocupa el ancho disponible en la barra.
// - secundario: una acción de apoyo (Vaciar, Ver una pista). Contorno.
// - texto: salidas y opciones (Terminar por hoy, Pantalla completa). Sin
//   caja, con ícono; no compite con la acción principal.
export function Boton({
  children,
  onClick,
  variante = "primario",
  disabled,
  className = "",
  autoFocus,
  large,
  icono,
}: {
  children: ReactNode;
  onClick: () => void;
  variante?: "primario" | "secundario" | "texto";
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  large?: boolean;
  icono?: ReactNode;
}) {
  const estilo =
    variante === "primario"
      ? `border-0 bg-verde-profundo text-white shadow-[0_3px_0_#1f3338] hover:bg-tinta active:translate-y-[2px] active:shadow-[0_1px_0_#1f3338] disabled:bg-tinta-tenue disabled:shadow-none ${large ? "text-[20px]" : "text-[18px]"} px-6`
      : variante === "secundario"
        ? `border-2 border-verde-serenidad/70 bg-white text-verde-profundo hover:border-verde-profundo hover:bg-verde-tenue ${large ? "text-[19px]" : "text-[17px]"} px-4`
        : `border-0 bg-transparent text-tinta-suave hover:text-tinta hover:bg-black/[0.04] ${large ? "text-[18px]" : "text-[16px]"} px-3`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`inline-flex items-center justify-center gap-2 min-h-14 rounded-2xl font-sans font-semibold leading-tight cursor-pointer transition-[transform,background-color,box-shadow] duration-150 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-default ${estilo} ${foco} ${className}`}
    >
      {icono}
      {children}
    </button>
  );
}

// Los juegos ponen sus acciones (Listo, Vaciar, Continuar…) en la barra del
// marco, para que todas las actividades tengan los botones en el mismo lugar.
export function Acciones({ ctl, children }: { ctl: Control; children: ReactNode }) {
  return ctl.barra ? createPortal(children, ctl.barra) : null;
}

const svg = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const IconoSalir = () => (
  <svg {...svg}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l-4 4 4 4M5 12h11" />
  </svg>
);
export const IconoPista = () => (
  <svg {...svg}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
  </svg>
);
export const IconoAmpliar = () => (
  <svg {...svg}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconoReducir = () => (
  <svg {...svg}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);
export const IconoSiguiente = () => (
  <svg {...svg}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
