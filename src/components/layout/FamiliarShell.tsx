import { useEffect, useState } from "react";
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
import { useCurrentPlanMeta, usePlan } from "../../lib/usePlan";
import { semanaTerminada } from "../../lib/planWeek";
import { NuevaSemanaModal } from "../ui/NuevaSemanaModal";
import { semanaNuevaPendiente } from "../../lib/calendarPrompt";
import { waEquipo } from "../../lib/whatsapp";
import { BotonWhatsApp } from "../ui/BotonWhatsApp";
import { AvisoEstadoCuenta, CuentaRechazada } from "./EstadoCuentaAviso";
import { AvisoReferidor } from "../familiar/AvisoReferidor";
import { useAplicarReferido } from "../../lib/referidos";
import { terminarNuevoFamiliar } from "../../lib/pacienteActivo";
import { useAlturaChat } from "../../lib/useAlturaChat";

const pasosRevision = [
  { titulo: "Cuestionario recibido", detalle: "Ya tenemos toda la información que nos compartiste.", estado: "hecho" },
  {
    titulo: "Revisión del equipo clínico",
    detalle: "Una profesional revisa cada respuesta para entender las necesidades y fortalezas de tu familiar.",
    estado: "actual",
  },
  {
    titulo: "Programa personalizado",
    detalle: "Te avisamos por correo en cuanto esté listo. Ese día se habilitan las actividades y el plan semanal.",
    estado: "pendiente",
  },
] as const;

function PendienteRevision({ nombre, desdeAyuda, programaElegido }: { nombre: string; desdeAyuda: boolean; programaElegido: boolean }) {
  return (
    <div className="max-w-[560px] mx-auto pt-4 pb-16">
      {!programaElegido && (
        <div className="bg-white border-[1.5px] border-verde-serenidad rounded-3xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="m-0 mb-1 text-[16px] font-semibold text-tinta">Falta un paso: elegir el programa</p>
            <p className="m-0 text-[14px] leading-relaxed text-tinta-suave">
              Autoguiado o con sesiones profesionales: te mostramos qué incluye cada uno para que decidas con calma.
            </p>
          </div>
          <Button variant="ink" dense to="/app/perfil/programa" className="shrink-0">
            Elegir programa
          </Button>
        </div>
      )}
      {desdeAyuda && (
        <div className="bg-white border border-borde rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="m-0 mb-1 text-[16px] font-semibold text-tinta">¿Tenés una duda mientras tanto?</p>
            <p className="m-0 text-[14px] leading-relaxed text-tinta-suave">Nuestro equipo de salud te atiende por WhatsApp.</p>
          </div>
          <BotonWhatsApp href={waEquipo(undefined, nombre)} className="shrink-0" />
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
          No tenés que hacer nada más por ahora. Te avisamos en cuanto esté listo.
        </p>
      </div>
      <ol className="list-none m-0 p-0 grid gap-0 bg-white border border-borde rounded-3xl px-5 py-5 sm:px-6">
        {pasosRevision.map((paso, i) => (
          <li key={paso.titulo} className="grid grid-cols-[28px_1fr] gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0 ${
                  paso.estado === "hecho"
                    ? "bg-verde-profundo text-white"
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
                {paso.estado === "actual" && <span className="ml-2 text-[14px] font-normal text-aviso-texto">en curso</span>}
              </p>
              <p className="m-0 mt-0.5 text-[14px] leading-relaxed text-tinta-suave">{paso.detalle}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Hoy: la fecha (confirma que son las actividades de hoy) y el saludo, sin
// fondo y en chico, como parte del contenido.
// El saludo de Hoy: la fecha como la ficha de calendario de Mi semana, un
// saludo según la hora y «El plan de …» como etiqueta, que ancla para quién
// es todo lo que sigue (sin «don/doña»: no sabemos el género de la persona).
function SaludoDelDia({ nombre, paciente }: { nombre: string; paciente: string | null }) {
  const ahora = new Date();
  const tz = "America/Costa_Rica";
  const hora = Number(ahora.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false })) % 24;
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const parte = (o: Intl.DateTimeFormatOptions) => ahora.toLocaleDateString("es-CR", { timeZone: tz, ...o }).replace(".", "");
  const fecha = parte({ weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="mb-5 flex items-center gap-4">
      <div
        className="shrink-0 w-[60px] rounded-2xl bg-verde-profundo text-white text-center py-2 shadow-[0_10px_22px_-14px_rgba(31,51,56,0.7)]"
        role="img"
        aria-label={fecha}
        title={fecha.charAt(0).toUpperCase() + fecha.slice(1)}
      >
        <span className="block text-[12px] font-bold uppercase tracking-[0.12em] text-[#c4dbdb]">{parte({ weekday: "short" }).slice(0, 3)}</span>
        <span className="block font-serif text-[26px] leading-none my-0.5">{ahora.toLocaleDateString("es-CR", { timeZone: tz, day: "numeric" })}</span>
        <span className="block text-[12px] font-bold uppercase tracking-[0.12em] text-mostaza-vital">{parte({ month: "short" }).slice(0, 3)}</span>
      </div>
      <div className="min-w-0">
        <p className="m-0 font-serif text-[26px] leading-tight text-tinta">
          {saludo}, {nombre}
        </p>
        {paciente && (
          <p className="m-0 mt-1.5 inline-flex items-center gap-2 rounded-full bg-white border border-borde pl-2 pr-3.5 py-1 text-[15px] text-tinta-suave">
            <img src="/marca/isotipo.png" alt="" aria-hidden="true" className="w-[18px] h-auto" />
            Hoy acompañás a <strong className="font-semibold text-tinta">{paciente}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export function FamiliarShell() {
  const session = useSession();
  // isPending, not isLoading — see the comment on the same call in App.tsx's RouteGuard.
  const { data: myPatient, isPending: isLoading } = useMyPatient();
  const hydrateOnboarding = useAppStore((s) => s.hydrateOnboarding);
  const { pathname } = useLocation();
  // Pendiente sin nada para ver todavía. Con los recursos de bienvenida
  // (Fase 3.3) la cuenta ya tiene un plan visible antes de la aprobación,
  // y se muestra la app normal con un aviso arriba.
  const rechazada = myPatient?.estado_cuenta === "rechazada";
  const pendiente = rechazada || (myPatient?.plan_status === "pendiente" && !myPatient?.tiene_plan_visible);
  // The tour walks through Hoy/Plan/Semana — none of which exist yet while
  // the program is still being prepared, so it waits for the real dashboard.
  const tour = useProductTour(!!myPatient && !pendiente);
  const { data: planMeta } = useCurrentPlanMeta(!pendiente ? myPatient?.id : undefined);
  const { data: planDias } = usePlan(!pendiente ? myPatient?.id : undefined);
  const [semanaCerrada, setSemanaCerrada] = useState<string | null>(null);
  useAplicarReferido(myPatient?.id);
  // Si empezó a registrar a otro familiar y volvió sin terminar, se cancela.
  useEffect(() => terminarNuevoFamiliar(), []);

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
  // El aviso de la semana gratis, solo donde se mira el plan: nunca en una
  // emergencia ni en medio de una actividad.
  const conAvisoCuenta = pathname === "/app/hoy" || pathname === "/app/plan";
  // Ayuda es una pantalla de chat (como WhatsApp): encabezado y barra para
  // escribir fijos, solo la conversación se desplaza.
  const modoChat = pathname === "/app/ayuda" && !pendiente && !isLoading;
  const altoChat = useAlturaChat(modoChat);

  if (isLoading) return <div className="min-h-[40vh]" />;

  return (
    <div
      className={modoChat ? "im-in flex flex-col overflow-hidden" : "im-in min-h-full pb-24 lg:pb-0"}
      style={modoChat ? { height: altoChat ?? "calc(100dvh - 72px)" } : undefined}
    >
      {/* La franja con el saludo solo mientras la cuenta está pendiente
          (es casi lo único en pantalla). Con la app en uso, el saludo y la
          fecha van dentro de Hoy, sin fondo: el contenido empieza arriba. */}
      {pendiente && (
      <div className="shrink-0 bg-verde-profundo text-white px-5 pt-6 pb-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="m-0 mb-1 text-sm text-[#c4dbdb] first-letter:uppercase">
            {new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Costa_Rica" })}
          </p>
          <h1 className="font-serif font-normal text-2xl sm:text-[28px] m-0 text-white">Hola, {nombreFamiliar}</h1>
        </div>
      </div>
      )}

      {/* Celular: la barra inferior. En escritorio las pestañas están en el encabezado. */}
      {!pendiente && <FamiliarNav />}

      {modoChat ? (
        // El aviso de estado de la cuenta va dentro de la conversación (Ayuda).
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      ) : (
      <div className="max-w-3xl mx-auto px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        {rechazada && myPatient ? (
          <CuentaRechazada patient={myPatient} />
        ) : pendiente ? (
          <PendienteRevision nombre={myPatient?.nombre ?? "tu familiar"} desdeAyuda={pathname === "/app/ayuda"} programaElegido={myPatient?.programa_elegido ?? true} />
        ) : (
          <>
            {pathname === "/app/hoy" && <SaludoDelDia nombre={nombreFamiliar} paciente={myPatient?.nombre?.split(" ")[0] ?? null} />}
            {pathname === "/app/hoy" && myPatient && session.status === "authed" && (session.profile.role === "familiar" || session.profile.role === "paciente") && <AvisoReferidor rol={session.profile.role} />}
            {myPatient && conAvisoCuenta && <AvisoEstadoCuenta patient={myPatient} nombreCuenta={session.status === "authed" ? session.profile.nombre : ""} />}
            <Outlet />
          </>
        )}
      </div>
      )}

      {(() => {
        // Tour first, welcome-message second — never stack two full-screen
        // modals when a brand-new account's plan gets assigned before their
        // very first dashboard visit.
        if (tour.pending) return <ProductTour steps={familiarTourSteps} onFinish={tour.dismiss} />;
        if (!pendiente && myPatient?.welcome_message_pending) return <WelcomeMessageModal patientId={myPatient.id} />;
        // One full-screen thing at a time: tour → welcome message → new week.
        const userId = session.status === "authed" ? session.session.user.id : null;
        if (
          myPatient &&
          userId &&
          planMeta &&
          planDias &&
          planDias.some((d) => d.tasks.length > 0) &&
          // Una semana que ya terminó no se anuncia como «nueva».
          !semanaTerminada(planMeta.publish_at) &&
          semanaCerrada !== planMeta.id &&
          semanaNuevaPendiente(userId, planMeta.id)
        ) {
          return (
            <NuevaSemanaModal
              userId={userId}
              planId={planMeta.id}
              patientId={myPatient.id}
              patientNombre={myPatient.nombre}
              plan={planDias}
              onClose={() => setSemanaCerrada(planMeta.id)}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
