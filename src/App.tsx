import { Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader";
import { FamiliarShell } from "./components/layout/FamiliarShell";
import { ParticipantShell } from "./components/layout/ParticipantShell";

import { Landing } from "./pages/Landing";
import { ForgotPassword } from "./pages/ForgotPassword";
import { PlanCheckout } from "./pages/PlanCheckout";
import { LegalPage } from "./pages/LegalPage";
import { Login } from "./pages/Login";
import { Consent } from "./pages/Consent";
import { OnboardingStep } from "./pages/onboarding/OnboardingStep";

import { Hoy } from "./pages/familiar/Hoy";
import { Actividad } from "./pages/familiar/Actividad";
import { Plan } from "./pages/familiar/Plan";
import { Actividades } from "./pages/familiar/Actividades";
import { Asistente } from "./pages/familiar/Asistente";
import { Revision } from "./pages/familiar/Revision";
import { Resumen } from "./pages/familiar/Resumen";

import { Gustos } from "./pages/participante/Gustos";
import { ParticipanteHoy } from "./pages/participante/Hoy";
import { Pasos } from "./pages/participante/Pasos";
import { Ayuda } from "./pages/participante/Ayuda";

import { Panel } from "./pages/profesional/Panel";
import { Ficha } from "./pages/profesional/Ficha";
import { Editor } from "./pages/profesional/Editor";
import { ProfesionalAlerta } from "./pages/profesional/Alerta";

import { Ideacion } from "./pages/alertas/Ideacion";
import { Maltrato } from "./pages/alertas/Maltrato";
import { Caida } from "./pages/alertas/Caida";
import { Cambio } from "./pages/alertas/Cambio";
import { Extravio } from "./pages/alertas/Extravio";
import { Rechazo } from "./pages/alertas/Rechazo";

import { Offline } from "./pages/estados/Offline";
import { Vacio } from "./pages/estados/Vacio";

function AppLayout() {
  return (
    <div className="min-h-screen grid" style={{ gridTemplateRows: "auto 1fr" }}>
      <AppHeader />
      <Routes>
        <Route index element={<Navigate to="/app/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="consent" element={<Consent />} />
        <Route path="perfil/:step" element={<OnboardingStep />} />

        <Route element={<FamiliarShell />}>
          <Route path="hoy" element={<Hoy />} />
          <Route path="hoy/actividad" element={<Actividad />} />
          <Route path="plan" element={<Plan />} />
          <Route path="actividades" element={<Actividades />} />
          <Route path="asistente" element={<Asistente />} />
          <Route path="revision" element={<Revision />} />
          <Route path="resumen" element={<Resumen />} />
        </Route>

        <Route path="participante" element={<ParticipantShell />}>
          <Route path="gustos" element={<Gustos />} />
          <Route path="hoy" element={<ParticipanteHoy />} />
          <Route path="pasos" element={<Pasos />} />
          <Route path="ayuda" element={<Ayuda />} />
        </Route>

        <Route path="profesional/panel" element={<Panel />} />
        <Route path="profesional/ficha" element={<Ficha />} />
        <Route path="profesional/editor" element={<Editor />} />
        <Route path="profesional/alerta" element={<ProfesionalAlerta />} />

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
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/olvide-password" element={<ForgotPassword />} />
      <Route path="/planes/:plan" element={<PlanCheckout />} />
      <Route path="/legal/:doc" element={<LegalPage />} />
      <Route path="/app/*" element={<AppLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
