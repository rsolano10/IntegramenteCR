import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, className = "", ...rest }: Props) {
  return (
    <label className="grid gap-2 text-[15px] font-semibold text-tinta-suave">
      {label}
      <input
        className={`min-h-[52px] px-4 rounded-xl border-[1.5px] font-sans text-[17px] text-tinta bg-campo ${
          error ? "border-semaforo-rojo bg-alerta" : "border-[#ddd7be] focus:border-verde-serenidad"
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-sm font-normal text-alerta-texto">{error}</span>}
    </label>
  );
}
