import type { ButtonHTMLAttributes, ReactNode } from "react";

// A deliberately separate visual register from Button.tsx — large,
// rounded-2xl, thick-bordered touch targets for the participante role (low
// cognitive load, no fine-motor precision assumed). Several screens
// (StepByStepActivity, participante/Actividad, participante/Ayuda,
// ParticipantShell's AvatarMenu) used to hand-roll this same set of classes;
// this just gives the already-existing pattern one home. Not meant to
// replace Button — the two registers coexist on purpose (e.g.
// StepByStepActivity uses Button for "Siguiente/Anterior" nav and
// BigActionButton for the big yes/no decision at the end of each activity).
type Variant = "ink" | "primary" | "secondary" | "soft" | "caution" | "tertiary";

const base = "border-none rounded-2xl font-sans font-bold cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const sizes = {
  md: "min-h-17 text-xl",
  lg: "min-h-19 text-2xl",
};

const variants: Record<Variant, string> = {
  ink: "bg-tinta text-white hover:bg-verde-profundo",
  primary: "bg-verde-serenidad text-white hover:bg-verde-profundo",
  secondary: "border-2 border-borde bg-white text-tinta",
  soft: "border-2 border-verde-serenidad bg-verde-tenue text-verde-profundo",
  caution: "border-2 border-mostaza-vital bg-aviso text-semaforo-amarillo-texto hover:bg-mostaza-vital",
  tertiary: "bg-beige-serenidad text-tinta",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function BigActionButton({ variant = "ink", size = "lg", fullWidth = true, className = "", children, ...rest }: Props) {
  // `border-2` already occupies the space a plain `border` would, so
  // `secondary`/`soft`/`caution` read at the same size as the borderless
  // variants despite the extra border width.
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
