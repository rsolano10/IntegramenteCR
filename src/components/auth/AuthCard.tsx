import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen flex items-center justify-center px-5 py-14 sm:px-8">
      <div className="w-full max-w-[480px] bg-white border border-borde rounded-3xl p-6 sm:p-9 shadow-elevada">
        <Link to="/" className="inline-flex items-baseline gap-2 font-serif text-xl text-tinta mb-6 no-underline">
          Integra<em className="italic text-verde-profundo">Mente</em>
        </Link>
        {children}
      </div>
    </div>
  );
}
