import { useState } from "react";
import { supabase } from "./supabase";

export const MIN_PASSWORD_LENGTH = 8;

// Mirrors the server-side policy (supabase/config.toml: minimum_password_length
// = 8, password_requirements = "letters_digits") so a user sees the same rule
// client-side instead of discovering it only after a rejected submit.
export function passwordIssue(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return "Debe combinar letras y números.";
  return null;
}

export function passwordStrength(password: string): "débil" | "aceptable" | "fuerte" {
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score >= 3) return "fuerte";
  if (score >= 1) return "aceptable";
  return "débil";
}

// A logged-in user changing their own password voluntarily (as opposed to
// the forced-first-login flow in SetPasswordForm, which arrives via an
// already-fresh invite/recovery session) — Supabase's updateUser() trusts
// whatever session is active, so proving "you still know the current
// password" has to happen explicitly here via a real sign-in call before the
// update, rather than depending on a global `secure_password_change` config
// flag that would also affect the unrelated forced-change flow.
export function useChangePassword(email: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    setError("");
    const issue = passwordIssue(newPassword);
    if (issue) {
      setError(issue);
      return false;
    }
    setLoading(true);
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) {
      setLoading(false);
      setError("Tu contraseña actual no es correcta.");
      return false;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    return true;
  }

  return { changePassword, loading, error, setError };
}
