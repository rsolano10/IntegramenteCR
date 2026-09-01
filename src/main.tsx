import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { App } from "./App.tsx";
import { supabase } from "./lib/supabase.ts";

const queryClient = new QueryClient();

// A self-signup email-confirmation link auto-establishes a session (Supabase's
// default detectSessionInUrl behavior) — but the person only meant to confirm
// their address, not get silently logged in, and it would silently replace
// any OTHER account's session already active in this browser. Sign back out
// before the app ever renders, so confirming always lands on a clean login
// screen. Recovery/invite links are untouched — SetPasswordForm relies on
// their session to let the person set a password.
async function bootstrap() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, "") || window.location.search);
  const type = params.get("type");
  if (type === "signup" || type === "email_change") {
    await supabase.auth.signOut();
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap();
