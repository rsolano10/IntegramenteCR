interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}

export function OptionGroup<T extends string>({ options, value, onChange, columns = 3 }: Props<T>) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-h-14 rounded-2xl border-[1.5px] font-sans text-[15px] font-semibold leading-snug px-2 cursor-pointer transition-colors ${
              active
                ? "border-verde-serenidad bg-verde-serenidad text-white"
                : "border-borde bg-white text-tinta hover:border-verde-serenidad"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
