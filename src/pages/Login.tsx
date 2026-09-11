import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { isUnconfirmedEmailError } from "../lib/authErrors";
import { Button } from "../components/ui/Button";
import { PasswordInput } from "../components/ui/PasswordInput";

export function Login() {
  const email = useAppStore((s) => s.email);
  const authError = useAppStore((s) => s.authError);
  const setEmail = useAppStore((s) => s.setEmail);
  const setAuthError = useAppStore((s) => s.setAuthError);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  async function submit() {
    setAuthError("");
    setUnconfirmed(false);
    setResendMsg("");
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
    // Deliberately no navigate() here: RouteGuard (src/App.tsx) already
    // redirects away from /app/login the moment useSession()/useMyPatient()
    // resolve for an authed user, and it's the one place that correctly
    // knows whether this account still needs onboarding, re-registration,
    // etc. Navigating straight to roleHome(role) here used to skip all of
    // that — sending a not-yet-onboarded account straight to its normal
    // home before bouncing back to /app/consent, a wasted round trip that
    // briefly flashed the wrong screen.
  }

  async function resendConfirmation() {
    setResendMsg("");
    setResendLoading(true);
    await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/app/login` } });
    setResendLoading(false);
    setResendMsg("Te reenviamos el correo de confirmación.");
  }

  return (
    <div className="im-in max-w-[480px] mx-auto px-5 py-14 pb-20 sm:px-8 lg:py-20">
      <div className="bg-white border border-borde rounded-3xl p-6 sm:p-8 lg:p-9 shadow-elevada">
        <h2 className="font-serif font-normal text-2xl lg:text-[28px] m-0 mb-2">Iniciar sesión</h2>
        <p className="m-0 mb-6 text-[15px] leading-relaxed text-tinta-tenue">Entrá con tu correo y contraseña.</p>
        <div className="grid gap-4.5">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com"
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
            />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Contraseña
            <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" />
          </label>
          <Button variant="ink" fullWidth onClick={submit} disabled={loading || !email.trim() || !password}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
          <p className="m-0 text-[15px] text-alerta-texto min-h-[22px]">{authError}</p>
          {unconfirmed && (
            <div className="-mt-2.5 grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={resendLoading}
                  className="text-[14px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer disabled:opacity-60"
                >
                  {resendLoading ? "Reenviando…" : "Reenviar correo de confirmación"}
                </button>
                {resendMsg && <span className="text-[13px] text-tinta-tenue">{resendMsg}</span>}
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-tinta-tenue">
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
          <Link to="/olvide-password" className="text-[15px] text-verde-profundo justify-self-start">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
