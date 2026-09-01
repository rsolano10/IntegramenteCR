import { useState } from "react";

// Drop-in replacement for a bare <input type="password">, styled to match
// this app's existing text inputs, with a show/hide toggle so people can
// check what they actually typed before submitting.
export function PasswordInput({
  value,
  onChange,
  placeholder,
  className = "min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pr-12 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tinta-tenue hover:text-tinta cursor-pointer"
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M2.5 2.5l15 15M8.3 8.4a2.3 2.3 0 0 0 3.3 3.3M6 4.9A9.2 9.2 0 0 1 10 4c4 0 7.3 2.6 8.5 6a10 10 0 0 1-2.6 3.8M4.2 6.2A9.9 9.9 0 0 0 1.5 10c1.2 3.4 4.5 6 8.5 6 1 0 1.9-.15 2.8-.44"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M1.5 10c1.2-3.4 4.5-6 8.5-6s7.3 2.6 8.5 6c-1.2 3.4-4.5 6-8.5 6s-7.3-2.6-8.5-6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
