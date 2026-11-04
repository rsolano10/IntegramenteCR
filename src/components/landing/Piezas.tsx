import type { ReactNode } from "react";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { flotanteBase, flotanteBottom, useOcultoEnElPie } from "../../lib/flotantes";

// Piezas visuales compartidas por el home y las páginas para médicos.
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="m-0 mb-3 text-xs sm:text-sm tracking-[0.16em] uppercase text-tinta-suave font-semibold">{children}</p>;
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-serif font-normal text-[30px] sm:text-[36px] lg:text-[46px] leading-[1.12] m-0 ${className}`} style={{ textWrap: "balance" }}>
      {children}
    </h2>
  );
}

// Íconos de línea propios (mismo trazo en todo el home).
export function Icono({ name, className = "w-7 h-7" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    charla: (
      <>
        <path {...p} d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h0a2.5 2.5 0 0 1-2-2.5z" />
        <path {...p} d="M9 9h6M9 11.5h3.5" />
      </>
    ),
    elegir: (
      <>
        <rect {...p} x="3.5" y="5" width="7.5" height="14" rx="2" />
        <rect {...p} x="13" y="5" width="7.5" height="14" rx="2" />
        <path {...p} d="M15 12l1.5 1.5L19 10.5" />
      </>
    ),
    profesional: (
      <>
        <circle {...p} cx="12" cy="8" r="3.5" />
        <path {...p} d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
        <path {...p} d="M16.5 4.5l1 1 2-2" />
      </>
    ),
    semana: (
      <>
        <rect {...p} x="4" y="5" width="16" height="15" rx="3" />
        <path {...p} d="M4 9.5h16M8.5 3v4M15.5 3v4" />
        <path {...p} d="M9.5 15.2l1.6 1.6 3.4-3.4" />
      </>
    ),
    sol: (
      <>
        <circle {...p} cx="12" cy="12" r="4" />
        <path {...p} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </>
    ),
    campana: (
      <>
        <path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
        <path {...p} d="M10 20.5a2 2 0 0 0 4 0" />
      </>
    ),
    check: (
      <>
        <circle {...p} cx="12" cy="12" r="8.5" />
        <path {...p} d="M8.3 12.3l2.5 2.5 4.9-5" />
      </>
    ),
    ajuste: (
      <>
        <path {...p} d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle {...p} cx="16" cy="7" r="2" />
        <circle {...p} cx="8" cy="17" r="2" />
      </>
    ),
    corazon: <path {...p} d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z" />,
    cerebro: (
      <>
        <path {...p} d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3.2 3.2 0 0 0 7 18h2V4.5z" />
        <path {...p} d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2A3.2 3.2 0 0 1 17 18h-2V4.5z" />
        <path {...p} d="M9 4.5h6M9 18v2M15 18v2M9 11h1.5M13.5 11H15" />
      </>
    ),
    manzana: (
      <>
        <path {...p} d="M12 7.5c-2-1.6-6-1.4-6.8 2.6-.9 4.4 2 9.4 4.3 9.4 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.3 0 5.2-5 4.3-9.4C18 6.1 14 5.9 12 7.5z" />
        <path {...p} d="M12 7.5c0-2 1-3.5 3-4" />
      </>
    ),
    fisio: (
      <>
        <circle {...p} cx="13" cy="4.5" r="1.8" />
        <path {...p} d="M8 11l3-3.5h3l2.5 3M11 7.5l-1 6 3.5 2.5V21M10 13.5L7 21" />
      </>
    ),
    equilibrio: (
      <>
        <circle {...p} cx="12" cy="4.5" r="1.8" />
        <path {...p} d="M12 7v7M12 14l-3 6.5M12 14h4.5M5.5 9.5l6.5-1 6.5 1" />
      </>
    ),
    estrella: <path {...p} d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />,
    escudo: (
      <>
        <path {...p} d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
        <path {...p} d="M12 8.5v4M12 15.5v.5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}



// Ayuda por WhatsApp: discreta, en la esquina derecha.
export function AyudaWhatsApp({ href }: { href: string }) {
  const oculto = useOcultoEnElPie();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="¿Necesitás ayuda? Escribinos por WhatsApp"
      tabIndex={oculto ? -1 : undefined}
      className={`${flotanteBase} right-3 sm:right-6 inline-flex items-center gap-2 min-h-11 pl-1.5 pr-3.5 rounded-full text-tinta text-[14px] font-semibold no-underline hover:border-verde-serenidad ${
        oculto ? "opacity-0 translate-y-3 pointer-events-none" : ""
      }`}
      style={flotanteBottom}
    >
      <span className="w-8 h-8 rounded-full bg-[#25d366] text-white flex items-center justify-center">
        <WhatsAppIcon size={18} />
      </span>
      ¿Necesitás ayuda?
    </a>
  );
}

