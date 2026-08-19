import { useEffect, useState } from "react";

export interface AccountMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export function AccountMenu({
  initials,
  name,
  subtitle,
  items,
}: {
  initials: string;
  name: string;
  subtitle: string;
  items: AccountMenuItem[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2.5 pl-1 pr-2.5 sm:pr-3.5 py-1 rounded-full border-[1.5px] border-borde bg-white cursor-pointer hover:border-verde-serenidad"
      >
        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-verde-serenidad text-white flex items-center justify-center font-serif font-bold text-[13px] sm:text-sm shrink-0">
          {initials}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-[13px] font-semibold text-tinta">{name}</span>
          <span className="block text-[11px] text-tinta-tenue">{subtitle}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-tinta-tenue">
          <path d="M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default border-none bg-transparent p-0"
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 bg-white border border-borde rounded-2xl shadow-elevada overflow-hidden"
          >
            <div className="px-4 py-3.5 border-b border-[#efeada] bg-campo">
              <p className="m-0 text-[14px] font-semibold text-tinta">{name}</p>
              <p className="m-0 text-[12px] text-tinta-tenue">{subtitle}</p>
            </div>
            <div className="grid py-1.5">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`text-left min-h-11 px-4 font-sans text-[14px] cursor-pointer hover:bg-campo ${
                    item.danger ? "text-alerta-texto font-semibold" : "text-tinta"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
