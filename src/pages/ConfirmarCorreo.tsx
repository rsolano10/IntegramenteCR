import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { useEmailLinkVerification } from "../lib/useEmailLinkVerification";
import { authErrorMessage, confirmEmailRedirect, emailIssue, PENDING_SIGNUP_EMAIL_KEY } from "../lib/authErrors";
import { AuthCard } from "../components/auth/AuthCard";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";

// Landing page for the "Confirmar mi correo" button in the signup email.
// The link itself proves who the person is — so instead of a login form
// asking for an email and password they just typed minutes ago, this page
// verifies the token, signs them in, and hands off to RouteGuard, which
// sends a brand-new account straight into consent → cuestionario.
export function ConfirmarCorreo() {
  const navigate = useNavigate();
  const link = useEmailLinkVerification();
  const session = useSession();
  const signedIn = link.status === "ok" && session.status === "authed";

  useEffect(() => {
    if (!signedIn) return;
    const t = setTimeout(() => navigate("/app/login", { replace: true }), 1600);
    return () => clearTimeout(t);
  }, [signedIn, navigate]);

  if (link.status === "verifying" || (link.status === "ok" && session.status === "loading")) {
    return (
      <AuthCard>
        <div className="py-6 text-center">
          <span className="inline-block w-8 h-8 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin mb-4" />
          <p className="m-0 text-[16px] text-tinta-suave">Confirmando tu correo…</p>
        </div>
      </AuthCard>
    );
  }

  if (signedIn) {
    const nombre = session.profile.nombre.split(" ")[0];
    return (
      <AuthCard>
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full bg-verde-tenue border border-borde mx-auto mb-5 flex items-center justify-center text-verde-profundo text-2xl">
            ✓
          </div>
          <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">
            ¡Listo{nombre ? `, ${nombre}` : ""}!
          </h1>
          <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">
            Tu correo quedó confirmado y ya iniciaste sesión. Te llevamos a crear el perfil de tu familiar.
          </p>
          <Button variant="ink" fullWidth onClick={() => navigate("/app/login", { replace: true })}>
            Continuar
          </Button>
        </div>
      </AuthCard>
    );
  }

  return <EnlaceInvalido expired={link.status === "invalid" && link.expired} />;
}

function EnlaceInvalido({ expired }: { expired: boolean }) {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const emailError = emailIssue(email);

  async function resend() {
    setTouched(true);
    if (emailError) return;
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: confirmEmailRedirect() } });
    setLoading(false);
    setMsg(
      error
        ? { ok: false, text: authErrorMessage(error, "No pudimos reenviarlo. Probá de nuevo en un minuto.") }
        : { ok: true, text: `Listo — te enviamos un enlace nuevo a ${email.trim()}.` },
    );
  }

  return (
    <AuthCard>
      <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">
        {expired ? "Este enlace ya se usó o venció" : "Este enlace no es válido"}
      </h1>
      <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">
        Si ya habías confirmado tu correo, simplemente iniciá sesión. Si no, te mandamos un enlace nuevo — solo funciona una vez y vence
        en una hora.
      </p>
      <div className="grid gap-4">
        <FormField
          label="Tu correo"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched ? (emailError ?? undefined) : undefined}
          placeholder="nombre@correo.com"
        />
        <Button variant="ink" fullWidth onClick={resend} disabled={loading}>
          {loading ? "Enviando…" : "Enviarme un enlace nuevo"}
        </Button>
        {msg && <p className={`m-0 text-[14px] ${msg.ok ? "text-semaforo-verde-texto" : "text-alerta-texto"}`}>{msg.text}</p>}
        <Link to="/ingresar" className="text-[15px] text-verde-profundo justify-self-start">
          Ya confirmé — iniciar sesión
        </Link>
      </div>
    </AuthCard>
  );
}
