import type { ReactNode } from "react";
import { useReveal } from "../../lib/useScrollFx";

// Fades a section into place the first time it scrolls into view. One-shot
// (not scroll-scrubbed) — for the continuous, reversible effect used on the
// weekly-plan preview, see useScrollProgress instead.
export function Reveal({
  children,
  delay = 0,
  className = "",
  id,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  // La cascada solo tiene sentido con tarjetas lado a lado (escritorio). En
  // celular cada tarjeta entra sola a la pantalla y el retraso solo la
  // hacía aparecer más tarde.
  const conCascada = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  const retraso = conCascada ? Math.min(delay, 200) : 0;
  return (
    <div
      ref={ref}
      id={id}
      // Corto y sutil: 450 ms, 16 px, y la cascada entre tarjetas nunca
      // pasa de 200 ms para que ninguna quede esperando.
      className={`transition-[opacity,transform] duration-[450ms] ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
      style={{ transitionDelay: visible ? `${retraso}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
