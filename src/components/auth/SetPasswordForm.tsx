import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { roleHome } from "../../lib/useSession";
import { useAppStore } from "../../lib/store";
import { Button } from "../ui/Button";

// Shared by CompletarCuenta (first login after a clinic invite) and
// ResetPassword (after a recovery link) — both land here with an active
// session established purely by clicking the emailed link, and the only
// thing left to do is have the person choose a password and continue in.
export function SetPasswordForm({ title, subtitle, cta }: { title: string; subtitle: string; cta: string }) {
  const navigate = useNavigate();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id ?? "").single();
    setLoading(false);
    if (!profile) {
      navigate("/app/login");
      return;
    }
    if (profile.role === "familiar") navigate(onboardingComplete ? "/app/hoy" : "/app/consent");
    else navigate(roleHome(profile.role));
  }

  return (
    <>
      <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">{title}</h1>
      <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">{subtitle}</p>
      <div className="grid gap-4.5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Nueva contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          />
        </label>
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Confirmar contraseña
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[17px] text-tinta"
          />
        </label>
        {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
        <Button variant="ink" fullWidth onClick={submit} disabled={loading || !password || !confirm}>
          {loading ? "Guardando…" : cta}
        </Button>
      </div>
    </>
  );
}
