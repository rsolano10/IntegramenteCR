// Single-select pill group — the app's standing alternative to a native
// <select> for any fixed, small set of options (2-5). Native selects render
// with browser chrome that doesn't match this app's rounded, hand-styled
// controls, so anywhere the option set is small and known, this is what to
// reach for instead. Genuinely unbounded lists (e.g. "pick an existing
// account") still belong in a real <select>.
//
// Three components cover "pick from a small set" — pick the one that
// matches the shape of the choice, don't reimplement any of them by hand:
//   - PillToggle (acá): 2-5 short labels, single choice, segmented-control
//     look — tabs, quick settings, a toggle between two short modes.
//   - OptionGroup: single choice where labels need more reading room than a
//     pill fits (e.g. "Sí / En parte / No") — a grid of bordered cards,
//     `columns` configurable (use `columns={1}` for a vertical list).
//   - ChipToggle: independent multi-select pills (each one toggles on its
//     own, not mutually exclusive).
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
    <div className="inline-flex flex-wrap gap-1.5 bg-pastilla-fondo p-1.5 rounded-full">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-9 px-4 rounded-full border-none font-sans text-[13px] font-semibold cursor-pointer whitespace-nowrap ${
            value === o.value ? "bg-white text-tinta shadow-[0_2px_8px_-4px_rgba(31,51,56,.6)]" : "bg-transparent text-pastilla-texto"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
