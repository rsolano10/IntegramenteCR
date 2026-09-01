// Supabase returns the same shape (an AuthError with a message, and on
// recent versions a `code`) for "wrong password" and "email not confirmed" —
// callers need to tell them apart to show the right recovery action.
export function isUnconfirmedEmailError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "email_not_confirmed") return true;
  return (error.message ?? "").toLowerCase().includes("not confirmed");
}
