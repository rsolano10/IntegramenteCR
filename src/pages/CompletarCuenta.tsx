import { Link } from "react-router-dom";
import { useSession } from "../lib/useSession";
import { AuthCard } from "../components/auth/AuthCard";
import { SetPasswordForm } from "../components/auth/SetPasswordForm";

// Landing page for the link inside a clinic invite email. Clicking it
// already confirmed the account and signed them in — the only thing left
// is choosing a password for future logins.
export function CompletarCuenta() {
  const session = useSession();

  if (session.status === "loading") {
    return <AuthCard>{null}</AuthCard>;
  }

  if (session.status === "anon") {
    return (
      <AuthCard>
        <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">Este enlace ya no es válido</h1>
        <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">
          Puede que ya lo hayas usado antes, o que haya pasado demasiado tiempo desde que te lo enviaron. Contactá a tu clínica para
          que te reenvíe la invitación.
        </p>
        <Link to="/app/login" className="inline-block text-[15px] text-verde-profundo">
          ‹ Volver a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <SetPasswordForm
        title="¡Bienvenido a IntegraMente en Casa!"
        subtitle="Tu clínica ya creó tu cuenta. Elegí una contraseña para poder entrar de ahora en adelante."
        cta="Crear contraseña y entrar"
      />
    </AuthCard>
  );
}
