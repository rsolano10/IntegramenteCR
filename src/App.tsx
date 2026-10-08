import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Landing } from "./pages/Landing";

// El home se carga de inmediato; el resto (la app, el registro, las páginas
// legales) en archivos separados que se piden recién cuando se visitan.
const AppLayout = lazy(() => import("./AppLayout"));
const Ingresar = lazy(() => import("./pages/Ingresar").then((m) => ({ default: m.Ingresar })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));
const CompletarCuenta = lazy(() => import("./pages/CompletarCuenta").then((m) => ({ default: m.CompletarCuenta })));
const ConfirmarCorreo = lazy(() => import("./pages/ConfirmarCorreo").then((m) => ({ default: m.ConfirmarCorreo })));
const LegalPage = lazy(() => import("./pages/LegalPage").then((m) => ({ default: m.LegalPage })));

// React Router doesn't reset scroll position on navigation by itself, and
// the browser's own back/forward scroll restoration (default "auto") tries
// to restore whatever position a route was at last time — neither knows
// that the previous page (e.g. Biblioteca's long resource grid) and the
// next one can be wildly different heights, so landing on a short page
// already scrolled deep into where the old page's content used to be left
// a long stretch of blank, still-scrollable space below the real content.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// If an auth email's redirect target ever isn't on Supabase's allow-list,
// Supabase falls back to the bare site URL — the email template still
// appends ?token_hash=…&type=…, so route those to the page that can verify
// them instead of silently showing the landing page.
const LINK_DESTINATIONS: Record<string, string> = {
  signup: "/confirmar-correo",
  email: "/confirmar-correo",
  recovery: "/restablecer-contrasena",
  invite: "/completar-cuenta",
};

function EmailLinkFallback() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const dest = params.get("token_hash") ? LINK_DESTINATIONS[params.get("type") ?? ""] : undefined;
  if (dest) return <Navigate to={`${dest}${search}`} replace />;
  return <Landing />;
}

export function App() {
  return (
    <>
    <ScrollToTop />
    <Suspense fallback={<div className="min-h-screen bg-fondo-papel" />}>
    <Routes>
      <Route path="/" element={<EmailLinkFallback />} />
      <Route path="/ingresar" element={<Ingresar />} />
      <Route path="/olvide-password" element={<ForgotPassword />} />
      <Route path="/restablecer-contrasena" element={<ResetPassword />} />
      <Route path="/completar-cuenta" element={<CompletarCuenta />} />
      <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
      {/* La vieja pantalla de "checkout" por plan era un registro falso —
          los programas se eligen dentro de la app, al final del cuestionario. */}
      <Route path="/planes/*" element={<Navigate to="/ingresar?mode=register" replace />} />
      <Route path="/legal/:doc" element={<LegalPage />} />
      <Route path="/app/*" element={<AppLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}
