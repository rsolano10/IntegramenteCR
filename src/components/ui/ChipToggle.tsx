export function ChipToggle({ active, onToggle, children }: { active: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`min-h-12 px-5 rounded-full border-[1.5px] font-sans text-[16px] font-semibold cursor-pointer ${
        active ? "border-verde-serenidad bg-[#edf4f4] text-tinta" : "border-borde bg-white text-tinta"
      }`}
    >
      {children}
    </button>
  );
}
