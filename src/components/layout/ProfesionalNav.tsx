import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
  match: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
}

const iconProps = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none" as const, "aria-hidden": true };

const items: NavItem[] = [
  {
    label: "Panel",
    to: "/app/profesional/panel",
    match: (p) => p === "/app/profesional/panel",
    icon: (active) => (
      <svg {...iconProps}>
        <rect x="3" y="3" width="6" height="7.5" rx="1.4" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <rect x="11" y="3" width="6" height="4.5" rx="1.4" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <rect x="11" y="9.5" width="6" height="7.5" rx="1.4" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <rect x="3" y="12.5" width="6" height="4.5" rx="1.4" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
      </svg>
    ),
  },
  {
    label: "Pacientes",
    to: "/app/profesional/pacientes",
    match: (p) => p.startsWith("/app/profesional/pacientes"),
    icon: (active) => (
      <svg {...iconProps}>
        <circle cx="7.2" cy="6.8" r="2.6" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <path d="M2.5 17c0-2.9 2.1-4.8 4.7-4.8s4.7 1.9 4.7 4.8" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" />
        <circle cx="14.3" cy="6" r="1.9" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <path d="M13 12.7c2.4.2 4 1.8 4 4.3" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Cuentas",
    to: "/app/profesional/cuentas",
    match: (p) => p.startsWith("/app/profesional/cuentas"),
    icon: (active) => (
      <svg {...iconProps}>
        <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <circle cx="7.3" cy="9.5" r="1.6" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <path d="M4.8 13.2c.4-1.4 1.4-2.1 2.5-2.1s2.1.7 2.5 2.1" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" />
        <path d="M12.3 8.8h3M12.3 11h3" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Biblioteca",
    to: "/app/profesional/biblioteca",
    match: (p) => p.startsWith("/app/profesional/biblioteca"),
    icon: (active) => (
      <svg {...iconProps}>
        <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} />
        <path d="M8 7.2v5.6l4.5-2.8-4.5-2.8Z" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function ProfesionalNav() {
  const { pathname } = useLocation();

  return (
    <>
      {/* Desktop / large tablet: fixed left rail */}
      <nav className="hidden lg:flex flex-col gap-1 w-[220px] shrink-0 px-3 py-6 border-r border-borde bg-white">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-sans text-[15px] font-semibold ${
                active ? "bg-campo text-tinta" : "text-tinta-tenue hover:bg-campo/60 hover:text-tinta"
              }`}
            >
              {item.icon(active)}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Phone / small tablet: horizontal pill row under the header */}
      <nav className="lg:hidden flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-borde bg-white overflow-x-auto">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`inline-flex items-center gap-2 shrink-0 px-4 py-2 rounded-full font-sans text-[14px] font-semibold whitespace-nowrap ${
                active ? "bg-tinta text-white" : "bg-campo text-tinta-tenue"
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
