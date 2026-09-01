import { AuthCard } from "../components/auth/AuthCard";
import { SetPasswordForm } from "../components/auth/SetPasswordForm";

// Forced on first login for accounts created with the generic starter
// password (alta asistida, Fase 7) — RouteGuard redirects here whenever
// must_change_password is true, before any other route is reachable.
export function CambiarPassword() {
  return (
    <AuthCard>
      <SetPasswordForm
        title="Elegí tu contraseña"
        subtitle="Tu clínica creó tu cuenta con una contraseña provisional. Elegí una nueva antes de continuar."
        cta="Guardar y continuar"
      />
    </AuthCard>
  );
}
