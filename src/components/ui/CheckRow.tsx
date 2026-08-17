interface Props {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CheckRow({ checked, onToggle, children }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`grid grid-cols-[28px_1fr] gap-3.5 items-start text-left p-3.5 rounded-2xl border-[1.5px] font-sans text-tinta cursor-pointer ${
        checked ? "border-verde-serenidad bg-[#f5f9f9]" : "border-borde bg-white"
      }`}
    >
      <span
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[17px] text-white border-[1.5px] shrink-0 ${
          checked ? "bg-verde-serenidad border-verde-serenidad" : "bg-white border-[#c7c0a4]"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="text-[16px] leading-snug">{children}</span>
    </button>
  );
}

export function RadioRow({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid grid-cols-[26px_1fr] gap-3.5 items-center text-left min-h-14 px-4 rounded-2xl border-[1.5px] font-sans text-tinta cursor-pointer ${
        checked ? "border-verde-serenidad bg-[#f5f9f9]" : "border-borde bg-white"
      }`}
    >
      <span
        className={`w-[22px] h-[22px] rounded-full border-2 ${
          checked ? "border-verde-serenidad bg-verde-serenidad shadow-[inset_0_0_0_4px_#ffffff]" : "border-[#c7c0a4] bg-white"
        }`}
      />
      <span className="text-[16px]">{children}</span>
    </button>
  );
}
