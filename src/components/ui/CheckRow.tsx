interface Props {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  // Selection-cap reached (EMO-01/RUT-06/INT-03 style "hasta N") — unchecked
  // rows go inert instead of silently no-op'ing on click, so it's clear why
  // nothing happens; an already-checked row stays toggleable so it can be
  // deselected to free up a slot.
  disabled?: boolean;
}

export function CheckRow({ checked, onToggle, children, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !checked}
      className={`grid grid-cols-[28px_1fr] gap-3.5 items-start text-left p-3.5 rounded-2xl border-[1.5px] font-sans text-tinta cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
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
