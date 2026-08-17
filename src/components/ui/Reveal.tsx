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
  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
