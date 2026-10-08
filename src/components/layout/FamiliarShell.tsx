import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import type { Answers } from "../../lib/onboardingSchema";
import { FamiliarNav } from "./FamiliarNav";
import { WelcomeMessageModal } from "../ui/WelcomeMessageModal";
import { Button } from "../ui/Button";
import { ProductTour } from "../ui/ProductTour";
import { familiarTourSteps } from "../../lib/tourSteps";
import { useProductTour } from "../../lib/useProductTour";

const pasosRevision = [
  { titulo: "Cuestionario recibido", detalle: "Ya tenemos toda la información que nos compartiste.", estado: "hecho" },
  {
    titulo: "Revisión del equipo clínico",
    detalle: "Una profesional revisa cada respuesta para entender las necesidades y fortalezas de tu familiar.",
    estado: "actual",
  },
  {
    titulo: "Programa personalizado",
    detalle: "Te avisamos por correo en cuanto esté listo. Ese día se habilitan las actividades, el plan semanal y los mensajes.",
    estado: "pendiente",
  },
] as const;

function PendienteRevision({ nombre, desdeMensajes, programaElegido }: { nombre: string; desdeMensajes: boolean; programaElegido: boolean }) {
  return (
    <div className="max-w-[560px] mx-auto pt-4 pb-16">
      {!programaElegido && (
        <div className="bg-white border-[1.5px] border-verde-serenidad rounded-3xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="m-0 mb-1 text-[16px] font-semibold text-tinta">Falta un paso: elegir el programa</p>
            <p className="m-0 text-[14px] leading-relaxed text-tinta-suave">
              Autoguiado u Orientado — te mostramos qué incluye cada uno para que decidas con calma.
            </p>
          </div>
          <Button variant="ink" dense to="/app/perfil/programa" className="shrink-0">
            Elegir programa
          </Button>
        </div>
      )}
      {desdeMensajes && (
        <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl p-5 mb-8">
          <p className="m-0 mb-1.5 text-[12px] tracking-[0.14em] uppercase text-riesgo-texto font-semibold">Mensajes con tu profesional</p>
          <p className="m-0 text-[15px] leading-relaxed text-riesgo-texto">
            Esta conversación se abre cuando el programa de {nombre} esté asignado — así la profesional que te escriba ya conoce su caso
            y puede responderte con contexto. Mientras tanto, si tenés una duda urgente, escribinos a{" "}
            <strong>info@integramente.com</strong> o llamanos al <strong>+506 8343 5772</strong>.
          </p>
        </div>
      )}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-verde-tenue mx-auto mb-6 flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" className="text-verde-profundo">
            <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13 8.5v5l3.2 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-serif font-normal text-[26px] sm:text-[30px] leading-[1.18] m-0 mb-3">Estamos armando el programa de {nombre}</h1>
        <p className="m-0 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
          Normalmente tarda entre 1 y 3 días hábiles. No tenés que hacer nada más por ahora.
        </p>
      </div>
      <ol className="list-none m-0 p-0 grid gap-0 bg-white border border-borde rounded-3xl px-5 py-5 sm:px-6">
        {pasosRevision.map((paso, i) => (
          <li key={paso.titulo} className="grid grid-cols-[28px_1fr] gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                  paso.estado === "hecho"
                    ? "bg-verde-serenidad text-white"
                    : paso.estado === "actual"
                      ? "bg-mostaza-vital text-tinta ring-4 ring-aviso"
                      : "bg-pastilla-fondo text-pastilla-texto"
                }`}
              >
                {paso.estado === "hecho" ? "✓" : i + 1}
              </span>
              {i < pasosRevision.length - 1 && <span className="w-px flex-1 bg-borde my-1" />}
            </div>
            <div className={i < pasosRevision.length - 1 ? "pb-5" : ""}>
              <p className={`m-0 text-[16px] font-semibold ${paso.estado === "pendiente" ? "text-tinta-tenue" : "text-tinta"}`}>
                {paso.titulo}
                {paso.estado === "actual" && <span className="ml-2 text-[12px] font-normal text-aviso-texto">en curso</span>}
              </p>
              <p className="m-0 mt-0.5 text-[14px] leading-relaxed text-tinta-suave">{paso.detalle}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FamiliarShell() {
  const session = useSession();
  // isPending, not isLoading — see the comment on the same call in App.tsx's RouteGuard.
  const { data: myPatient, isPending: isLoading } = useMyPatient();
  const hydrateOnboarding = useAppStore((s) => s.hydrateOnboarding);
  const { pathname } = useLocation();
  const pendiente = myPatient?.plan_status === "pendiente";
  // The tour walks through Hoy/Plan/Semana — none of which exist yet while
  // the program is still being prepared, so it waits for the real dashboard.
  const tour = useProductTour(!!myPatient && !pendiente);

  // PerfilResumen / "editar módulo" still only read/write the local
  // onboarding2 copy — this is what makes them show the account's real
  // saved answers instead of staying blank or showing a previous account's.
  const { data: onboardingRow } = useQuery({
    queryKey: ["onboarding-answers", myPatient?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_answers").select("answers").eq("patient_id", myPatient!.id).single();
      if (error) throw error;
      return data.answers as Answers;
    },
    enabled: !!myPatient,
  });
  useEffect(() => {
    if (onboardingRow) hydrateOnboarding(onboardingRow);
  }, [onboardingRow, hydrateOnboarding]);

  const nombreFamiliar = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";

  if (isLoading) return <div className="min-h-[40vh]" />;

  return (
    <div className="im-in min-h-full pb-24 md:pb-0">
      <div className="bg-verde-profundo text-white px-5 pt-6 pb-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="m-0 mb-1 text-sm text-[#c4dbdb] first-letter:uppercase">
            {new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Costa_Rica" })}
          </p>
          <h1 className="font-serif font-normal text-2xl sm:text-[28px] m-0 text-white">Hola, {nombreFamiliar}</h1>
        </div>
      </div>

      {!pendiente && (
        <div className="bg-white md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <FamiliarNav />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        {pendiente ? <PendienteRevision nombre={myPatient?.nombre ?? "tu familiar"} desdeMensajes={pathname === "/app/mensajes"} programaElegido={myPatient?.programa_elegido ?? true} /> : <Outlet />}
      </div>

      {(() => {
        // Tour first, welcome-message second — never stack two full-screen
        // modals when a brand-new account's plan gets assigned before their
        // very first dashboard visit.
        if (tour.pending) return <ProductTour steps={familiarTourSteps} onFinish={tour.dismiss} />;
        if (!pendiente && myPatient?.welcome_message_pending) return <WelcomeMessageModal patientId={myPatient.id} />;
        return null;
      })()}
    </div>
  );
}
