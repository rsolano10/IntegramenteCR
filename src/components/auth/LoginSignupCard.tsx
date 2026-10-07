import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { isUnconfirmedEmailError } from "../../lib/authErrors";
import { PasswordInput } from "../ui/PasswordInput";
import { PillToggle } from "../ui/PillToggle";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";

// The login/signup form — lifted out of Landing.tsx so it can render both
// inline on desktop (scrolled to from the hero CTAs) and as the sole
// content of a dedicated full-page route on mobile (see Ingresar.tsx).
// Not to be confused with AuthCard.tsx, the generic auth-page shell used by
// CompletarCuenta/ResetPassword — different component, same-sounding name.
export function LoginSignupCard({ defaultMode = "login" }: { defaultMode?: "login" | "register" }) {
  const navigate = useNavigate();
  const email = useAppStore((s) => s.email);
  const setEmail = useAppStore((s) => s.setEmail);
  const authError = useAppStore((s) => s.authError);
  const setAuthError = useAppStore((s) => s.setAuthError);
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const isRegister = mode === "register";

  function switchMode(next: "login" | "register") {
    setMode(next);
    setAuthError("");
    setSignupSent(false);
    setUnconfirmed(false);
    setResendMsg("");
  }

  async function submit() {
    setAuthError("");
    setUnconfirmed(false);
    setResendMsg("");
    if (isRegister) {
      if (!nombre.trim() || !email.trim() || !password) {
        setAuthError("Completá nombre, correo y contraseña.");
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role: "familiar", nombre: nombre.trim() }, emailRedirectTo: `${window.location.origin}/app/login` },
      });
      setLoading(false);
      if (error) {
        setAuthError(
          error.message.toLowerCase().includes("already registered")
            ? "Ese correo ya tiene una cuenta. Iniciá sesión en vez de crear una nueva."
            : "No pudimos crear la cuenta. Intentá de nuevo.",
        );
        return;
      }
      setSignupSent(true);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) {
      setLoading(false);
      if (isUnconfirmedEmailError(error)) {
        setUnconfirmed(true);
        setAuthError("Todavía no confirmaste tu correo — revisá tu bandeja de entrada.");
      } else {
        setAuthError("No pudimos iniciar sesión — revisá tu correo y contraseña.");
      }
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single();
    setLoading(false);
    if (profileError || !profile) {
      setAuthError("No pudimos cargar tu cuenta. Intentá de nuevo.");
      return;
    }
    // RouteGuard (src/App.tsx) is the one place that knows whether this
    // account still needs onboarding/re-registration before going to its
    // normal role home — see Login.tsx for the same fix and why.
    navigate("/app/login");
  }

  async function resendSignup() {
    setResendMsg("");
    setResendLoading(true);
    await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/app/login` } });
    setResendLoading(false);
    setResendMsg("Te reenviamos el correo de confirmación.");
  }

  return (
    <>
      <div className="mb-7">
        <PillToggle
          value={mode}
          onChange={switchMode}
          options={[
            { value: "login", label: "Iniciar sesión" },
            { value: "register", label: "Crear cuenta" },
          ]}
        />
      </div>

      {isRegister && signupSent ? (
        <>
          <h3 className="font-serif font-normal text-2xl m-0 mb-2">Revisá tu correo</h3>
          <p className="m-0 mb-4 text-[15px] leading-relaxed text-tinta-suave">
            Te enviamos un enlace de confirmación a <strong>{email}</strong>. Hacé clic ahí para activar tu cuenta y empezar el perfil
            funcional.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={resendSignup}
              disabled={resendLoading}
              className="text-[14px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer disabled:opacity-60"
            >
              {resendLoading ? "Reenviando…" : "Reenviar el correo"}
            </button>
            {resendMsg && <span className="text-[13px] text-tinta-tenue">{resendMsg}</span>}
          </div>
          <div className="pt-4 border-t border-borde-suave">
            <p className="m-0 text-sm leading-relaxed text-pastilla-texto">
              ¿No te llega? Escribinos a{" "}
              <a href="mailto:info@integramente.com" className="text-verde-profundo">
                info@integramente.com
              </a>{" "}
              o llamanos al{" "}
              <a href="tel:+50683435772" className="text-verde-profundo">
                +506 8343 5772
              </a>{" "}
              y lo revisamos.
            </p>
          </div>
        </>
      ) : (
        <>
          {isRegister && (
            <div className="grid gap-4.5 mb-1.5">
              <FormField label="Nombre completo" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          )}

          <div className="grid gap-4.5">
            <FormField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com"
            />
            <label className="grid gap-2 text-[15px] font-semibold text-tinta-suave">
              Contraseña
              <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" />
            </label>
            <Button
              variant="ink"
              fullWidth
              onClick={submit}
              disabled={loading || (isRegister ? !nombre.trim() || !email.trim() || !password : !email.trim() || !password)}
            >
              {loading ? (isRegister ? "Creando…" : "Entrando…") : isRegister ? "Crear cuenta y empezar" : "Entrar"}
            </Button>
            {authError && <p className="m-0 text-[14px] text-alerta-texto">{authError}</p>}
            {unconfirmed && (
              <div className="grid gap-2 -mt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={resendSignup}
                    disabled={resendLoading}
                    className="text-[14px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer disabled:opacity-60"
                  >
                    {resendLoading ? "Reenviando…" : "Reenviar correo de confirmación"}
                  </button>
                  {resendMsg && <span className="text-[13px] text-tinta-tenue">{resendMsg}</span>}
                </div>
                <p className="m-0 text-[13px] leading-relaxed text-pastilla-texto">
                  ¿No te llega? Escribinos a{" "}
                  <a href="mailto:info@integramente.com" className="text-verde-profundo">
                    info@integramente.com
                  </a>{" "}
                  o llamanos al{" "}
                  <a href="tel:+50683435772" className="text-verde-profundo">
                    +506 8343 5772
                  </a>
                  .
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 mt-4.5 text-[15px]">
            <Link to="/olvide-password" className="text-verde-profundo">
              ¿Olvidaste tu contraseña?
            </Link>
            {isRegister ? (
              <span className="text-tinta-tenue">Gratis, sin tarjeta</span>
            ) : (
              <button type="button" onClick={() => switchMode("register")} className="text-tinta-tenue underline decoration-dotted cursor-pointer">
                ¿Primera vez? Creá tu cuenta
              </button>
            )}
          </div>

          <div className="mt-6.5 pt-5.5 border-t border-borde-suave grid gap-2.5">
            <p className="m-0 text-sm leading-relaxed text-pastilla-texto">
              ¿Sos paciente o familiar del programa IntegraMente? Tu cuenta la crea la clínica: entrá con el correo que registraste en
              consulta.
            </p>
          </div>
        </>
      )}
    </>
  );
}
