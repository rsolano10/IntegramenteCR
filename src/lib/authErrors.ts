// Supabase returns the same shape (an AuthError with a message, and on
// recent versions a `code`) for "wrong password" and "email not confirmed" —
// callers need to tell them apart to show the right recovery action.
export function isUnconfirmedEmailError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "email_not_confirmed") return true;
  return (error.message ?? "").toLowerCase().includes("not confirmed");
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailIssue(email: string): string | null {
  const v = email.trim();
  if (!v) return "Escribí tu correo electrónico.";
  if (!EMAIL_PATTERN.test(v)) return "Ese correo no parece válido — revisá que tenga @ y un dominio (ej. nombre@correo.com).";
  return null;
}

// Where the signup confirmation link lands — ConfirmarCorreo.tsx verifies
// the token and signs the person in directly, no second login form.
export function confirmEmailRedirect(): string {
  return `${window.location.origin}/confirmar-correo`;
}

// Remembered so the "enlace vencido" screen can resend without asking for
// the address again.
export const PENDING_SIGNUP_EMAIL_KEY = "im-pending-signup-email";

// Supabase's own messages are English and technical — translate the ones a
// person can actually act on.
export function authErrorMessage(error: { message?: string; code?: string; status?: number } | null | undefined, fallback: string): string {
  if (!error) return fallback;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  if (code === "weak_password" || msg.includes("password should")) return "La contraseña no cumple los requisitos: al menos 8 caracteres, con letras y números.";
  if (code === "email_address_invalid" || msg.includes("invalid email") || msg.includes("is invalid"))
    return "Ese correo no es válido. Revisalo e intentá de nuevo.";
  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered"))
    return "Ese correo ya tiene una cuenta. Iniciá sesión en vez de crear una nueva.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error.status === 429)
    return "Hiciste varios intentos seguidos. Esperá un minuto y probá de nuevo.";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "El correo o la contraseña no coinciden. Revisalos e intentá de nuevo.";
  if (code === "same_password" || msg.includes("should be different")) return "La nueva contraseña tiene que ser distinta a la anterior.";
  if (code === "signup_disabled") return "Por ahora no estamos aceptando cuentas nuevas. Escribinos a info@integramente.com.";
  if (msg.includes("failed to fetch") || msg.includes("network")) return "No pudimos conectarnos. Revisá tu conexión a internet e intentá de nuevo.";
  return fallback;
}
