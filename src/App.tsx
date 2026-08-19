import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader";
import { FamiliarShell } from "./components/layout/FamiliarShell";
import { ParticipantShell } from "./components/layout/ParticipantShell";
import { ProfesionalShell } from "./components/layout/ProfesionalShell";
import { useSession, roleHome } from "./lib/useSession";
import { useAppStore } from "./lib/store";

import { Landing } from "./pages/Landing";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { CompletarCuenta } from "./pages/CompletarCuenta";
import { PlanCheckout } from "./pages/PlanCheckout";
import { LegalPage } from "./pages/LegalPage";
import { Login } from "./pages/Login";
import { Consent } from "./pages/Consent";
import { OnboardingStep } from "./pages/onboarding/OnboardingStep";
import { PerfilResumen } from "./pages/onboarding/PerfilResumen";

import { Hoy } from "./pages/familiar/Hoy";
import { Actividad } from "./pages/familiar/Actividad";
import { Plan } from "./pages/familiar/Plan";
import { Actividades } from "./pages/familiar/Actividades";
import { Asistente } from "./pages/familiar/Asistente";
import { Revision } from "./pages/familiar/Revision";
import { Resumen } from "./pages/familiar/Resumen";
import { Emergencia } from "./pages/familiar/Emergencia";
import { Mensajes } from "./pages/familiar/Mensajes";

import { Gustos } from "./pages/participante/Gustos";
import { ParticipanteHoy } from "./pages/participante/Hoy";
import { Pasos } from "./pages/participante/Pasos";
import { Ayuda } from "./pages/participante/Ayuda";

import { Panel } from "./pages/profesional/Panel";
import { Ficha } from "./pages/profesional/Ficha";
import { Editor } from "./pages/profesional/Editor";
import { ProfesionalAlerta } from "./pages/profesional/Alerta";
import { Usuarios } from "./pages/profesional/Usuarios";
import { Biblioteca } from "./pages/profesional/Biblioteca";

import { Ideacion } from "./pages/alertas/Ideacion";
import { Maltrato } from "./pages/alertas/Maltrato";
import { Caida } from "./pages/alertas/Caida";
import { Cambio } from "./pages/alertas/Cambio";
import { Extravio } from "./pages/alertas/Extravio";
import { Rechazo } from "./pages/alertas/Rechazo";

import { Offline } from "./pages/estados/Offline";
import { Vacio } from "./pages/estados/Vacio";

// Every /app/* route needs a real session; /app/participante/* and
// /app/profesional/* additionally need the matching role. Everything else
// under /app (familiar pages, the shared alert/estado screens, consent,
// perfil) just needs "signed in as someone" — those still read/write the
// shared demo data in Zustand regardless of exact role in this phase.
function RouteGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const session = useSession();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  if (session.status === "loading") {
    return <div className="min-h-[40vh]" />;
  }
  if (session.status === "anon") {
    return pathname === "/app/login" ? <>{children}</> : <Navigate to="/app/login" replace />;
  }
  const { role } = session.profile;
  if (pathname === "/app/login") {
    const home = role === "familiar" && !onboardingComplete ? "/app/consent" : roleHome(role);
    return <Navigate to={home} replace />;
  }
  if (pathname.startsWith("/app/participante") && role !== "paciente") {
    return <Navigate to="/app/login" replace />;
  }
  if (pathname.startsWith("/app/profesional") && role !== "profesional") {
    return <Navigate to="/app/login" replace />;
  }
  return <>{children}</>;
}

function AppLayout() {
  return (
    <div className="min-h-screen grid" style={{ gridTemplateRows: "auto 1fr" }}>
      <AppHeader />
      <RouteGuard>
      <Routes>
        <Route index element={<Navigate to="/app/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="consent" element={<Consent />} />
        <Route path="perfil/resumen" element={<PerfilResumen />} />
        <Route path="perfil/:step" element={<OnboardingStep />} />

        <Route element={<FamiliarShell />}>
          <Route path="hoy" element={<Hoy />} />
          <Route path="hoy/actividad" element={<Actividad />} />
          <Route path="plan" element={<Plan />} />
          <Route path="actividades" element={<Actividades />} />
          <Route path="asistente" element={<Asistente />} />
          <Route path="emergencia" element={<Emergencia />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="revision" element={<Revision />} />
          <Route path="resumen" element={<Resumen />} />
        </Route>

        <Route path="participante" element={<ParticipantShell />}>
          <Route path="gustos" element={<Gustos />} />
          <Route path="hoy" element={<ParticipanteHoy />} />
          <Route path="pasos" element={<Pasos />} />
          <Route path="ayuda" element={<Ayuda />} />
        </Route>

        <Route path="profesional" element={<ProfesionalShell />}>
          <Route path="panel" element={<Panel />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="ficha" element={<Ficha />} />
          <Route path="editor" element={<Editor />} />
          <Route path="alerta" element={<ProfesionalAlerta />} />
        </Route>

        <Route path="alerta/ideacion" element={<Ideacion />} />
        <Route path="alerta/maltrato" element={<Maltrato />} />
        <Route path="alerta/caida" element={<Caida />} />
        <Route path="alerta/cambio" element={<Cambio />} />
        <Route path="alerta/extravio" element={<Extravio />} />
        <Route path="alerta/rechazo" element={<Rechazo />} />

        <Route path="estado/offline" element={<Offline />} />
        <Route path="estado/vacio" element={<Vacio />} />

        <Route path="*" element={<Navigate to="/app/login" replace />} />
      </Routes>
      </RouteGuard>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/olvide-password" element={<ForgotPassword />} />
      <Route path="/restablecer-contrasena" element={<ResetPassword />} />
      <Route path="/completar-cuenta" element={<CompletarCuenta />} />
      <Route path="/planes/:plan" element={<PlanCheckout />} />
      <Route path="/legal/:doc" element={<LegalPage />} />
      <Route path="/app/*" element={<AppLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
