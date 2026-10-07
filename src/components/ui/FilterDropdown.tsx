export interface FilterDropdownOption {
  value: string;
  label: string;
}

// One dropdown per facet — replaces a row of toggle chips per category
// (that got noisy once Cuentas needed 3 facet groups at once). Single-
// select per facet plus an explicit "Todos" is the standard, compact
// pattern for this; combining several facets still narrows the same way
// chips did, just without a wall of buttons.
export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  allLabel = "Todos",
}: {
  label: string;
  options: FilterDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <label className="grid gap-1.5 text-[12px] font-semibold text-tinta-tenue">
      <span className="tracking-[0.08em] uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 px-3 rounded-lg border-[1.5px] border-borde-campo bg-white font-sans text-[14px] font-semibold text-tinta cursor-pointer"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
