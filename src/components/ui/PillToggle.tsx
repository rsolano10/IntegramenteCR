// Single-select pill group — the app's standing alternative to a native
// <select> for any fixed, small set of options (2-5). Native selects render
// with browser chrome that doesn't match this app's rounded, hand-styled
// controls, so anywhere the option set is small and known, this is what to
// reach for instead. Genuinely unbounded lists (e.g. "pick an existing
// account") still belong in a real <select>.
export function PillToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-1.5 bg-[#f2eede] p-1.5 rounded-full">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-9 px-4 rounded-full border-none font-sans text-[13px] font-semibold cursor-pointer whitespace-nowrap ${
            value === o.value ? "bg-white text-tinta shadow-[0_2px_8px_-4px_rgba(31,51,56,.6)]" : "bg-transparent text-[#6b7c80]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
