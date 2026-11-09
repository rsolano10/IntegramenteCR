import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans text-tinta bg-fondo-papel min-h-screen flex items-center justify-center px-5 py-14 sm:px-8">
      <div className="w-full max-w-[480px] bg-white border border-borde rounded-3xl p-6 sm:p-9 shadow-elevada">
        <Link to="/" aria-label="IntegraMente en Casa, ir al inicio" className="inline-flex mb-6 no-underline">
          <Logo size="sm" />
        </Link>
        {children}
      </div>
    </div>
  );
}
