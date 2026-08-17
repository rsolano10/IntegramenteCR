import type { ReactNode } from "react";

export function NavListItem({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left grid grid-cols-[1fr_auto] gap-3 items-center min-h-14 px-4.5 rounded-2xl border-[1.5px] border-borde bg-white font-sans text-[16px] cursor-pointer hover:border-verde-serenidad"
    >
      {children}
      <span className="text-verde-serenidad">›</span>
    </button>
  );
}
