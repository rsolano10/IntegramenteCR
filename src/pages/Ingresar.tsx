import { Link, useSearchParams } from "react-router-dom";
import { LoginSignupCard } from "../components/auth/LoginSignupCard";
import { Logo } from "../components/ui/Logo";

// Full-page destination for the mobile landing's CTA buttons — on mobile
// there's no inline auth card to scroll to (see Landing.tsx), so "Crear mi
// perfil gratuito" / "Iniciar sesión" land here instead.
export function Ingresar() {
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get("mode") === "register" ? "register" : "login";
  // Desde las tarjetas "Para quién es" del home: modalidad ya elegida.
  const para = searchParams.get("para");
  const defaultPara = para === "mi" || para === "ser-querido" ? para : undefined;

  return (
    <div className="im-in min-h-full bg-fondo-papel">
      <div className="px-5 py-5 sm:px-8">
        <Link to="/" aria-label="IntegraMente en Casa, volver al inicio" className="inline-flex no-underline">
          <Logo size="sm" />
        </Link>
      </div>
      <div className="max-w-[480px] mx-auto px-5 pb-16">
        <div className="bg-white border border-borde rounded-3xl p-6 sm:p-8 shadow-elevada">
          <LoginSignupCard defaultMode={defaultMode} defaultPara={defaultPara} />
        </div>
      </div>
    </div>
  );
}
