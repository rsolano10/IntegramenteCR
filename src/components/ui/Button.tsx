import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ink" | "urgency" | "caution";

const base = "inline-flex items-center justify-center rounded-full font-sans font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

// Mutually exclusive size classes — never combine two of these on one
// element. min-height utilities don't "override" each other by source
// order the way you'd expect; having two on the same button leaves which
// one wins up to Tailwind's internal cascade order, not call-site intent.
const sizes = {
  lg: "min-h-[56px] px-8 text-[17px]",
  // Still a standalone tap target (settings screens, modal footers).
  md: "min-h-[48px] px-5 text-[15px]",
  // Compact — table rows, inline toolbars, anywhere several controls sit
  // close together.
  sm: "min-h-[30px] px-3 text-[13px]",
};

const variants: Record<Variant, string> = {
  primary: "bg-verde-serenidad text-white hover:bg-verde-profundo",
  ink: "bg-tinta text-white hover:bg-verde-profundo",
  secondary: "bg-transparent border-[1.5px] border-borde text-tinta hover:border-verde-serenidad",
  urgency: "bg-semaforo-rojo text-white hover:bg-alerta-texto font-bold",
  caution: "bg-aviso text-semaforo-amarillo-texto border-2 border-mostaza-vital font-bold hover:bg-mostaza-vital",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  to?: string;
  fullWidth?: boolean;
  dense?: boolean;
  // Compact size for tight spaces — table rows, inline toolbars. Smaller
  // than `dense`, which is still sized for a standalone tap target.
  size?: "sm";
  children: ReactNode;
}

export function Button({ variant = "primary", to, fullWidth, dense, size, className = "", children, ...rest }: Props) {
  const sizeClass = size === "sm" ? sizes.sm : dense ? sizes.md : sizes.lg;
  const cls = `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${sizeClass} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
