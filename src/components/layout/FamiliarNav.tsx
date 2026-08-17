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
    match: (p) => p === "/app/hoy" || p === "/app/hoy/actividad",
    icon: (active) => (
      <svg {...iconProps}>
        <path
          d="M11 3v2M4.5 6.5l1.4 1.4M17.5 6.5l-1.4 1.4M11 8a5 5 0 0 0-5 5c0 2 1 3.4 2 4.5h6c1-1.1 2-2.5 2-4.5a5 5 0 0 0-5-5Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Plan",
    to: "/app/plan",
    match: (p) => p === "/app/plan",
    icon: (active) => (
      <svg {...iconProps}>
        <rect x="3.5" y="4.5" width="15" height="14" rx="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path d="M3.5 9h15M7.5 3v3M14.5 3v3" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Actividades",
    to: "/app/actividades",
    match: (p) => p === "/app/actividades",
    icon: (active) => (
      <svg {...iconProps}>
        <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <rect x="12" y="3.5" width="6.5" height="6.5" rx="1.6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <rect x="3.5" y="12" width="6.5" height="6.5" rx="1.6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <rect x="12" y="12" width="6.5" height="6.5" rx="1.6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      </svg>
    ),
  },
  {
    label: "Dudas",
    to: "/app/asistente",
    match: (p) => p === "/app/asistente",
    icon: (active) => (
      <svg {...iconProps}>
        <path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h9A2.5 2.5 0 0 1 18 6.5v6A2.5 2.5 0 0 1 15.5 15H10l-3.5 3v-3H6.5A2.5 2.5 0 0 1 4 12.5v-6Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function FamiliarNav() {
  const { pathname } = useLocation();

  return (
    <>
      {/* Phone: fixed bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-borde grid grid-cols-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 min-h-[60px] pt-1.5 ${
                active ? "text-verde-profundo" : "text-tinta-tenue"
              }`}
            >
              {item.icon(active)}
              <span className={`text-[11px] ${active ? "font-bold" : "font-semibold"}`}>{item.label}</span>
              <span className={`h-[3px] w-6 rounded-full ${active ? "bg-verde-serenidad" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </nav>

      {/* Tablet / desktop: top tab row */}
      <nav className="hidden md:flex items-center gap-1 border-b border-borde">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`inline-flex items-center gap-2 px-4 lg:px-5 py-3.5 border-b-[3px] font-sans text-[15px] font-semibold ${
                active ? "text-tinta border-verde-serenidad" : "text-tinta-tenue border-transparent hover:text-tinta"
              }`}
            >
              {item.icon(active)}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
