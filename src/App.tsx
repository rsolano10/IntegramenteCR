import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader";
import { FamiliarShell } from "./components/layout/FamiliarShell";
import { ParticipantShell } from "./components/layout/ParticipantShell";
import { ProfesionalShell } from "./components/layout/ProfesionalShell";
import { useSession, roleHome } from "./lib/useSession";
import { supabase } from "./lib/supabase";
import { useMyPatient } from "./lib/useMyPatient";
import { useAppStore } from "./lib/store";

import { Landing } from "./pages/Landing";
import { Ingresar } from "./pages/Ingresar";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { CompletarCuenta } from "./pages/CompletarCuenta";
import { PlanCheckout } from "./pages/PlanCheckout";
import { LegalPage } from "./pages/LegalPage";
import { Login } from "./pages/Login";
import { CambiarPassword } from "./pages/CambiarPassword";
import { Consent } from "./pages/Consent";
import { OnboardingStep } from "./pages/onboarding/OnboardingStep";
import { PerfilResumen } from "./pages/onboarding/PerfilResumen";
import { ResumenFinal } from "./pages/onboarding/ResumenFinal";
import { InvitarContraparte } from "./pages/onboarding/InvitarContraparte";

import { Hoy } from "./pages/familiar/Hoy";
import { Actividad } from "./pages/familiar/Actividad";
import { Plan } from "./pages/familiar/Plan";
import { Actividades } from "./pages/familiar/Actividades";
import { Asistente } from "./pages/familiar/Asistente";
import { Revision } from "./pages/familiar/Revision";
import { Resumen } from "./pages/familiar/Resumen";
import { Emergencia } from "./pages/familiar/Emergencia";
import { Mensajes } from "./pages/familiar/Mensajes";

import { ParticipanteHoy } from "./pages/participante/Hoy";
import { ParticipanteActividad } from "./pages/participante/Actividad";
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
//
// "Has this familiar account finished onboarding" is answered by whether a
// real patient_links row exists (useMyPatient()), not by a local flag — a
// local flag persisted across every account sharing a browser, which is
// exactly how a brand new signup ended up seeing the demo account's name
// and patient. A real per-account DB row can't leak that way.
function DesactivadaGate() {
  useEffect(() => {
    supabase.auth.signOut();
  }, []);
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 text-center">
      <p className="max-w-sm text-[16px] leading-relaxed text-tinta-suave">
        Esta cuenta fue desactivada. Si creés que es un error, contactá a tu clínica.
      </p>
    </div>
  );
}

function RouteGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const session = useSession();
  const { data: myPatient, isLoading: patientLoading } = useMyPatient();
  const currentUserId = session.status === "authed" ? session.session.user.id : null;
  const lastUserId = useAppStore((s) => s.lastUserId);
  const resetOnboardingForNewAccount = useAppStore((s) => s.resetOnboardingForNewAccount);

  useEffect(() => {
    if (currentUserId && lastUserId !== currentUserId) resetOnboardingForNewAccount(currentUserId);
  }, [currentUserId, lastUserId, resetOnboardingForNewAccount]);

  if (session.status === "loading") {
    return <div className="min-h-[40vh]" />;
  }
  if (session.status === "anon") {
    return pathname === "/app/login" ? <>{children}</> : <Navigate to="/app/login" replace />;
  }
  const { role } = session.profile;

  // A deactivated account (integramente_flujos_interaccion_usuarios.md §6
  // punto 6) can still be carrying a still-valid JWT — the Auth-level ban
  // only blocks the NEXT sign-in, it doesn't revoke an already-issued
  // token. Signing out here closes that gap immediately instead of waiting
  // for the token to expire on its own.
  if (!session.profile.is_active) {
    return <DesactivadaGate />;
  }

  // Accounts created with the generic starter password (alta asistida)
  // can't reach anything else until they set a real one.
  if (session.profile.must_change_password && pathname !== "/app/cambiar-password") {
    return <Navigate to="/app/cambiar-password" replace />;
  }
  if (!session.profile.must_change_password && pathname === "/app/cambiar-password") {
    return <Navigate to={roleHome(role)} replace />;
  }
  // Reaching here means we're legitimately on cambiar-password (the check
  // above already sent anyone who shouldn't be here elsewhere) — stop
  // before the onboarding-gate rules below, which don't know about this
  // route and would otherwise bounce a patient-less familiar/paciente to
  // /app/consent, ping-ponging against the redirect above forever.
  if (pathname === "/app/cambiar-password") {
    return <>{children}</>;
  }

  if ((role === "familiar" || role === "paciente") && patientLoading) {
    return <div className="min-h-[40vh]" />;
  }

  // Fase 11: un paciente ya evaluado con el cuestionario viejo
  // (schema_version < 2) debe volver a completarlo por completo antes de
  // seguir usando la app — decisión ya tomada con el usuario (re-registro
  // forzado, sin migración best-effort). Salta directo al cuestionario, sin
  // pasar de nuevo por /app/consent (el consentimiento ya se dio la
  // primera vez).
  const needsReregistration = (role === "familiar" || role === "paciente") && myPatient?.needsReregistration === true;

  if (pathname === "/app/login") {
    const home =
      (role === "familiar" || role === "paciente") && !myPatient
        ? "/app/consent"
        : needsReregistration
          ? "/app/perfil/bienvenida"
          : role === "paciente" && myPatient?.vista_completa
            ? "/app/hoy"
            : roleHome(role);
    return <Navigate to={home} replace />;
  }
  const onOnboardingPath = pathname === "/app/consent" || pathname.startsWith("/app/perfil");
  if ((role === "familiar" || role === "paciente") && !myPatient && !onOnboardingPath) {
    return <Navigate to="/app/consent" replace />;
  }
  if (needsReregistration && !pathname.startsWith("/app/perfil")) {
    return <Navigate to="/app/perfil/bienvenida" replace />;
  }
  if ((role === "familiar" || role === "paciente") && myPatient && !needsReregistration && pathname === "/app/consent") {
    return <Navigate to={roleHome(role)} replace />;
  }
  // A patient with no familiar can be granted the same full access a
  // familiar gets (clinic's call, at accept time) — send them into the
  // familiar route tree instead of the deliberately minimal participant one.
  if (role === "paciente" && myPatient?.vista_completa && pathname.startsWith("/app/participante")) {
    return <Navigate to="/app/hoy" replace />;
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
        <Route path="cambiar-password" element={<CambiarPassword />} />
        <Route path="consent" element={<Consent />} />
        <Route path="perfil/resumen" element={<PerfilResumen />} />
        <Route path="perfil/final" element={<ResumenFinal />} />
        <Route path="perfil/invitar" element={<InvitarContraparte />} />
        <Route path="perfil/:step" element={<OnboardingStep />} />

        <Route element={<FamiliarShell />}>
          <Route path="hoy" element={<Hoy />} />
          <Route path="hoy/actividad/:taskId" element={<Actividad />} />
          <Route path="plan" element={<Plan />} />
          <Route path="actividades" element={<Actividades />} />
          <Route path="asistente" element={<Asistente />} />
          <Route path="emergencia" element={<Emergencia />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="revision" element={<Revision />} />
          <Route path="resumen" element={<Resumen />} />
        </Route>

        <Route path="participante" element={<ParticipantShell />}>
          <Route path="hoy" element={<ParticipanteHoy />} />
          <Route path="actividad/:taskId" element={<ParticipanteActividad />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="revision" element={<Revision />} />
          <Route path="resumen" element={<Resumen />} />
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
      <Route path="/ingresar" element={<Ingresar />} />
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
