import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
  match: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
}

const iconProps = { width: 22, height: 22, viewBox: "0 0 22 22", fill: "none" as const, "aria-hidden": true };

const items: NavItem[] = [
  {
    label: "Hoy",
    to: "/app/hoy",
    match: (p) => p === "/app/hoy" || p.startsWith("/app/hoy/"),
    icon: (active) => (
      <svg {...iconProps}>
        <path
          d="M11 3v2M4.5 6.5l1.4 1.4M17.5 6.5l-1.4 1.4M11 8a5 5 0 0 0-5 5c0 2 1 3.4 2 4.5h6c1-1.1 2-2.5 2-4.5a5 5 0 0 0-5-5Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity={active ? 0.22 : 0}
        />
      </svg>
    ),
  },
  {
    label: "Mi semana",
    to: "/app/plan",
    match: (p) => p === "/app/plan" || p.startsWith("/app/plan/actividad") || p === "/app/historial" || p === "/app/revision" || p === "/app/resumen",
    icon: (active) => (
      <svg {...iconProps}>
        <rect x="3.5" y="4.5" width="15" height="14" rx="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} fill="currentColor" fillOpacity={active ? 0.22 : 0} />
        <path d="M3.5 9h15M7.5 3v3M14.5 3v3" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Ayuda",
    to: "/app/ayuda",
    match: (p) => p === "/app/ayuda",
    icon: (active) => (
      <svg {...iconProps}>
        <path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h9A2.5 2.5 0 0 1 18 6.5v6A2.5 2.5 0 0 1 15.5 15H10l-3.5 3v-3H6.5A2.5 2.5 0 0 1 4 12.5v-6Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity={active ? 0.22 : 0}
        />
      </svg>
    ),
  },
];

// Tres pestañas: Hoy, Mi semana y Ayuda.
// · Celular: barra inferior fija, tres botones grandes (ícono y texto, 64 px),
//   donde llega el pulgar y como en WhatsApp.
// · Computadora (desde 1024 px; las tablets usan la barra inferior): las pestañas van en el encabezado, junto al logo
//   (PestanasFamilia, en AppHeader); la activa es una pastilla rellena.
export function FamiliarNav() {
  const { pathname } = useLocation();
  return (
    <nav
      data-menu-inferior
      aria-label="Secciones"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-borde grid grid-cols-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-16 no-underline ${active ? "text-verde-profundo" : "text-tinta-suave"}`}
          >
            <span className={`inline-flex items-center justify-center w-14 h-8 rounded-full transition-colors ${active ? "bg-verde-serenidad/20" : ""}`}>{item.icon(active)}</span>
            <span className={`text-[14px] leading-none ${active ? "font-bold" : "font-semibold"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PestanasFamilia() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Secciones" className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/70 border border-borde">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 min-h-10 px-4 lg:px-5 rounded-full font-sans text-[15px] font-semibold whitespace-nowrap no-underline transition-colors ${
              active ? "bg-verde-profundo text-white shadow-[0_6px_14px_-8px_rgba(31,51,56,0.6)]" : "text-tinta-suave hover:text-tinta hover:bg-campo"
            }`}
          >
            {item.icon(active)}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
