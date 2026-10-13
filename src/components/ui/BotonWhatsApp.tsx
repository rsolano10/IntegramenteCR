import type { ReactNode } from "react";
import { WhatsAppIcon } from "./WhatsAppIcon";

// Botón que abre WhatsApp (único canal con el equipo clínico).
export function BotonWhatsApp({
  href,
  children = "Escribir por WhatsApp",
  fullWidth = false,
  variant = "solid",
  className = "",
}: {
  href: string;
  children?: ReactNode;
  fullWidth?: boolean;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const tono =
    variant === "solid"
      ? "bg-[#25d366] text-white hover:brightness-95"
      : "bg-white text-tinta border-[1.5px] border-borde hover:border-[#25d366]";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${fullWidth ? "flex w-full" : "inline-flex"} items-center justify-center gap-2 min-h-11 px-4.5 rounded-full text-[14.5px] font-semibold no-underline ${tono} ${className}`}
    >
      <WhatsAppIcon size={18} className={variant === "outline" ? "text-[#1fa855]" : undefined} />
      {children}
    </a>
  );
}
