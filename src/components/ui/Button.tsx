import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ink" | "urgency" | "caution";

const base =
  "inline-flex items-center justify-center min-h-[56px] px-8 rounded-full font-sans font-semibold text-[17px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

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
  children: ReactNode;
}

export function Button({ variant = "primary", to, fullWidth, dense, className = "", children, ...rest }: Props) {
  const cls = `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${dense ? "min-h-[48px] px-5 text-[15px]" : ""} ${className}`;
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
