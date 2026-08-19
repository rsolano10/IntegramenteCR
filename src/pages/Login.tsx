import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { roleHome } from "../lib/useSession";
import { Button } from "../components/ui/Button";

export function Login() {
  const navigate = useNavigate();
  const email = useAppStore((s) => s.email);
  const authError = useAppStore((s) => s.authError);
  const setEmail = useAppStore((s) => s.setEmail);
  const setAuthError = useAppStore((s) => s.setAuthError);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setAuthError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) {
      setLoading(false);
      setAuthError("Correo o contraseña incorrectos.");
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
            />
          </label>
          <Button variant="ink" fullWidth onClick={submit} disabled={loading || !email.trim() || !password}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
          <p className="m-0 text-[15px] text-alerta-texto min-h-[22px]">{authError}</p>
          <Link to="/olvide-password" className="text-[15px] text-verde-profundo justify-self-start">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
