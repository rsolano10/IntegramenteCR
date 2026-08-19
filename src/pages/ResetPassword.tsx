import { Link } from "react-router-dom";
import { useSession } from "../lib/useSession";
import { AuthCard } from "../components/auth/AuthCard";
import { SetPasswordForm } from "../components/auth/SetPasswordForm";

// Landing page for the link inside a "¿Olvidaste tu contraseña?" email.
export function ResetPassword() {
  const session = useSession();

  if (session.status === "loading") {
    return <AuthCard>{null}</AuthCard>;
  }

  if (session.status === "anon") {
    return (
      <AuthCard>
        <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">Este enlace ya no es válido</h1>
        <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">
          Puede que ya lo hayas usado antes, o que haya pasado demasiado tiempo desde que lo pediste. Pedí uno nuevo.
        </p>
        <Link to="/olvide-password" className="inline-block text-[15px] text-verde-profundo">
          ‹ Pedir un nuevo enlace
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <SetPasswordForm title="Creá una nueva contraseña" subtitle="Elegí una contraseña nueva para tu cuenta." cta="Guardar y entrar" />
    </AuthCard>
  );
}
