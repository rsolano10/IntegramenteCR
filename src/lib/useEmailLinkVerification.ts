import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type EmailLinkState = { status: "verifying" } | { status: "ok" } | { status: "invalid"; expired: boolean };

// Token hashes are single-use — React StrictMode (and any remount) would
// otherwise fire a second verifyOtp with the same hash, which fails and
// flips an already-successful confirmation to "enlace inválido".
const inflight = new Map<string, Promise<boolean>>();

const VALID_TYPES: EmailOtpType[] = ["signup", "email", "invite", "recovery", "email_change", "magiclink"];

// Every auth email (supabase/templates/*.html) links straight to an app page
// with ?token_hash=…&type=… instead of to Supabase's own /verify endpoint.
// Verifying here, with a POST from JS, is what makes the link sign the
// person in directly — and keeps corporate mail scanners (which "click"
// every link in advance) from burning the one-time token before the person
// ever opens it, which used to drop them on a plain login form.
//
// Links in emails sent before this change still arrive the old way
// (#access_token=… or #error_code=…) — supabase-js consumes the first on its
// own; the second is surfaced here as "invalid".
export function useEmailLinkVerification(): EmailLinkState {
  const [state, setState] = useState<EmailLinkState>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token_hash") ? { status: "verifying" } : initialFromHash();
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    if (!tokenHash) return;
    if (!type || !VALID_TYPES.includes(type)) {
      setState({ status: "invalid", expired: false });
      return;
    }
    let cancelled = false;
    let promise = inflight.get(tokenHash);
    if (!promise) {
      promise = supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(async ({ error }) => {
        if (!error) return true;
        // Already used, but by this same browser a moment ago (double
        // mount, or a second tap on the link): a live session means the
        // person is in, which is all the link was for.
        const { data } = await supabase.auth.getSession();
        return !!data.session;
      });
      inflight.set(tokenHash, promise);
    }
    promise.then((ok) => {
      if (cancelled) return;
      // Strip the spent token from the address bar so a reload or a shared
      // screenshot doesn't carry it around.
      window.history.replaceState(null, "", window.location.pathname);
      setState(ok ? { status: "ok" } : { status: "invalid", expired: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function initialFromHash(): EmailLinkState {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = hash.get("error_code");
  if (code) return { status: "invalid", expired: code === "otp_expired" };
  return { status: "ok" };
}
