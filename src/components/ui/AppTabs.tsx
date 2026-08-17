import { Link, useLocation } from "react-router-dom";

export interface TabDef {
  label: string;
  to: string;
  match: (pathname: string) => boolean;
}

export function AppTabs({ tabs }: { tabs: TabDef[] }) {
  const { pathname } = useLocation();
  return (
    <div className="grid border-b border-[#efeada]" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`min-h-13 border-none font-sans text-[14px] font-semibold text-center flex items-center justify-center border-b-[3px] ${
              active ? "bg-white text-tinta border-verde-serenidad" : "bg-[#fbf9f0] text-tinta-tenue border-transparent"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
