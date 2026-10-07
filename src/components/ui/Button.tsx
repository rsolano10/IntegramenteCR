import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ink" | "urgency" | "caution" | "accent";

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
  // The one CTA accent for the marketing site (Landing.tsx) — kept out of
  // the app proper (profesional/familiar screens use primary/ink), so it
  // reads as "this is the one thing to click" there without competing with
  // any in-app button language. Text is tinta, not semaforo-amarillo-texto,
  // specifically because the latter only clears ~3.4:1 against mostaza-vital
  // — short of AA's 4.5:1 for this size.
  accent: "bg-mostaza-vital text-tinta font-bold hover:brightness-95 active:brightness-90",
};

interface CommonProps {
  variant?: Variant;
  fullWidth?: boolean;
  dense?: boolean;
  // Compact size for tight spaces — table rows, inline toolbars. Smaller
  // than `dense`, which is still sized for a standalone tap target.
  size?: "sm";
  className?: string;
  children: ReactNode;
}

type Props =
  | (CommonProps & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">)
  | (CommonProps & { to?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">);

export function Button({ variant = "primary", to, fullWidth, dense, size, className = "", children, ...rest }: Props) {
  const sizeClass = size === "sm" ? sizes.sm : dense ? sizes.md : sizes.lg;
  const cls = `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${sizeClass} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
