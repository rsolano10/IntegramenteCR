import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { roleHome } from "../../lib/useSession";
import { isUnconfirmedEmailError } from "../../lib/authErrors";
import { PasswordInput } from "../ui/PasswordInput";

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

  const tabClass = (active: boolean) =>
    `min-h-[46px] rounded-full border-none font-sans text-[16px] font-semibold cursor-pointer ${
      active ? "bg-white text-tinta shadow-[0_2px_8px_-4px_rgba(31,51,56,.6)]" : "bg-transparent text-[#6b7c80]"
    }`;

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
    navigate(roleHome(profile.role));
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
      <div className="grid grid-cols-2 gap-1.5 bg-[#f2eede] p-1.5 rounded-full mb-7">
        <button type="button" onClick={() => switchMode("login")} className={tabClass(!isRegister)}>
          Iniciar sesión
        </button>
        <button type="button" onClick={() => switchMode("register")} className={tabClass(isRegister)}>
          Crear cuenta
        </button>
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
          <div className="pt-4 border-t border-[#efeada]">
            <p className="m-0 text-sm leading-relaxed text-[#6b7c80]">
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
              <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                Nombre completo
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
                />
              </label>
            </div>
          )}

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
            <button
              type="button"
              onClick={submit}
              disabled={loading || (isRegister ? !nombre.trim() || !email.trim() || !password : !email.trim() || !password)}
              className="inline-flex items-center justify-center min-h-14 rounded-full bg-tinta text-white font-semibold text-[17px] hover:bg-verde-profundo transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              {loading ? (isRegister ? "Creando…" : "Entrando…") : isRegister ? "Crear cuenta y empezar" : "Entrar"}
            </button>
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
                <p className="m-0 text-[13px] leading-relaxed text-[#6b7c80]">
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

          <div className="mt-6.5 pt-5.5 border-t border-[#efeada] grid gap-2.5">
            <p className="m-0 text-sm leading-relaxed text-[#6b7c80]">
              ¿Sos paciente o familiar del programa IntegraMente? Tu cuenta la crea la clínica: entrá con el correo que registraste en
              consulta.
            </p>
          </div>
        </>
      )}
    </>
  );
}
