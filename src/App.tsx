import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Landing } from "./pages/Landing";

// Landing ("/") is the one route that must paint with the least possible
// JS — every other public page (auth screens, legal, plan checkout) only
// matters once someone has actually navigated there, so each gets its own
// chunk instead of riding along on the home page's initial bundle.
const Ingresar = lazy(() => import("./pages/Ingresar").then((m) => ({ default: m.Ingresar })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));
const CompletarCuenta = lazy(() => import("./pages/CompletarCuenta").then((m) => ({ default: m.CompletarCuenta })));
const PlanCheckout = lazy(() => import("./pages/PlanCheckout").then((m) => ({ default: m.PlanCheckout })));
const LegalPage = lazy(() => import("./pages/LegalPage").then((m) => ({ default: m.LegalPage })));

// The entire authenticated app (every /app/* page, Supabase-backed hooks,
// ~40 page components, React Query) lives in its own chunk, fetched only
// once someone actually navigates past /app/* — the public marketing site
// used to ship all of that just to paint the home page.
const AppLayout = lazy(() => import("./AppLayout"));

const fallback = <div className="min-h-screen" />;

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

export function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/ingresar" element={<Suspense fallback={fallback}><Ingresar /></Suspense>} />
      <Route path="/olvide-password" element={<Suspense fallback={fallback}><ForgotPassword /></Suspense>} />
      <Route path="/restablecer-contrasena" element={<Suspense fallback={fallback}><ResetPassword /></Suspense>} />
      <Route path="/completar-cuenta" element={<Suspense fallback={fallback}><CompletarCuenta /></Suspense>} />
      <Route path="/planes/:plan" element={<Suspense fallback={fallback}><PlanCheckout /></Suspense>} />
      <Route path="/legal/:doc" element={<Suspense fallback={fallback}><LegalPage /></Suspense>} />
      <Route path="/app/*" element={<Suspense fallback={fallback}><AppLayout /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
