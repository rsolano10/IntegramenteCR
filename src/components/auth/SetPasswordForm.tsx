import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { PasswordInput } from "../ui/PasswordInput";

// Shared by CompletarCuenta (first login after a clinic invite) and
// ResetPassword (after a recovery link) — both land here with an active
// session established purely by clicking the emailed link, and the only
// thing left to do is have the person choose a password and continue in.
export function SetPasswordForm({ title, subtitle, cta }: { title: string; subtitle: string; cta: string }) {
  const navigate = useNavigate();
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
    // Harmless no-op for accounts that were never gated by this flag
    // (invite-link/recovery-link flows) — only the alta asistida path (a
    // generic starter password) actually needs it cleared.
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", user?.id ?? "");
    setLoading(false);
    // RouteGuard (src/App.tsx) is the one place that knows whether this
    // account still needs onboarding/re-registration before it can go to
    // its normal role home — routing straight there via roleHome() here
    // used to skip that check entirely (see Login.tsx for the same fix).
    navigate("/app/login");
  }

  return (
    <>
      <h1 className="font-serif font-normal text-[28px] sm:text-[32px] leading-tight m-0 mb-3">{title}</h1>
      <p className="text-base leading-relaxed text-tinta-suave m-0 mb-6">{subtitle}</p>
      <div className="grid gap-4.5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Nueva contraseña
          <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" />
        </label>
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Confirmar contraseña
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="••••••••" />
        </label>
        {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
        <Button variant="ink" fullWidth onClick={submit} disabled={loading || !password || !confirm}>
          {loading ? "Guardando…" : cta}
        </Button>
      </div>
    </>
  );
}
