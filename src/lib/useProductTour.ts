import { useState } from "react";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

// Module-level, not component state: every Shell (and every remount of the
// same Shell — e.g. coming back from /app/perfil/resumen, which lives
// outside FamiliarShell) calls useSession() fresh, and that hook's profile
// snapshot can still say onboarding_tour_seen=false for a moment after the
// write below lands. Remembering the dismissal here (plus localStorage, for
// a reload before the profile refetch) means a dismissed tour can never
// reappear in the same browser, while the DB flag keeps it from reappearing
// on any other device.
const dismissedThisSession = new Set<string>();

function storageKey(userId: string) {
  return `im-tour-seen:${userId}`;
}

function seenLocally(userId: string): boolean {
  if (dismissedThisSession.has(userId)) return true;
  try {
    return localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

// One tour per account, ever — the first time it reaches a dashboard where
// the tour actually describes what's on screen (`ready`).
export function useProductTour(ready = true) {
  const session = useSession();
  const [, rerender] = useState(0);
  const userId = session.status === "authed" ? session.session.user.id : null;

  const pending = ready && session.status === "authed" && !session.profile.onboarding_tour_seen && !!userId && !seenLocally(userId);

  async function dismiss() {
    if (!userId) return;
    dismissedThisSession.add(userId);
    try {
      localStorage.setItem(storageKey(userId), "1");
    } catch {
      // private mode / blocked storage — the module-level set still covers this session
    }
    rerender((n) => n + 1);
    // Awaited on purpose: a supabase-js query builder only runs once it's
    // awaited/then'd — the old fire-and-forget call never actually sent the
    // update, which is why the tour kept coming back.
    await supabase.from("profiles").update({ onboarding_tour_seen: true }).eq("id", userId);
  }

  return { pending, dismiss };
}
