import { useEffect, useState } from "react";
import { EVENTO_ABRIR_CUENTA, type VentanaCuenta } from "../../lib/abrirCuenta";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { useEsAdmin } from "../../lib/useEsAdmin";
import { AccountMenu } from "../ui/AccountMenu";
import { Modal } from "../ui/Modal";
import { MiPerfilModal } from "../ui/MiPerfilModal";
import { ContactanosModal } from "../ui/ContactanosModal";
import { CalendarModal } from "../ui/CalendarSyncCard";
import { Logo } from "../ui/Logo";

const crumbs: [string, string][] = [
  ["/app/login", "Ingreso"],
  ["/app/consent", "Consentimiento"],
  ["/app/perfil/resumen", "Tu cuestionario"],
  ["/app/perfil", "Perfil funcional"],
  ["/app/ayuda", "Ayuda"],
  ["/app/emergencia", "Emergencia"],
  ["/app/hoy/actividad", "Actividad"],
  ["/app/hoy", "Hoy"],
  ["/app/plan", "Mi semana"],
  ["/app/revision", "Evaluación semanal"],
  ["/app/resumen", "Resumen de la semana"],
  ["/app/participante/hoy", "Hoy"],
  ["/app/participante/actividad", "Actividad"],
  ["/app/participante/ayuda", "Pidió ayuda"],
  ["/app/profesional/panel", "Panel"],
  ["/app/profesional/usuarios", "Usuarios"],
  ["/app/profesional/biblioteca", "Biblioteca"],
  ["/app/profesional/ficha", "Ficha"],
  ["/app/profesional/editor", "Editor"],
  ["/app/profesional/alerta", "Alerta"],
  ["/app/alerta/ideacion", "Urgencia"],
  ["/app/alerta/maltrato", "Protección"],
  ["/app/alerta/caida", "Alerta · caída"],
  ["/app/alerta/cambio", "Alerta · cambio agudo"],
  ["/app/alerta/extravio", "Riesgo · extravío"],
  ["/app/alerta/rechazo", "Ajuste"],
  ["/app/estado/offline", "Sin conexión"],
  ["/app/estado/vacio", "Sin plan"],
];

function crumbFor(pathname: string): string {
  const hit = crumbs.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? hit[1] : "";
}

type OpenModal = "mi-perfil" | "contacto" | "calendario" | "auditoria" | null;

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const role = session.status === "authed" ? session.profile.role : null;
  const nombre = session.status === "authed" ? session.profile.nombre : "";
  const especialidad = session.status === "authed" ? session.profile.especialidad : null;
  const { data: myPatient } = useMyPatient();
  const esAdmin = useEsAdmin();
  const resetSessionState = useAppStore((s) => s.resetSessionState);
  const auditLog = useAppStore((s) => s.auditLog);
  const [modal, setModal] = useState<OpenModal>(null);
  // Otras pantallas (los botones de Clara en Ayuda) pueden pedir abrir una
  // ventana del menú de la cuenta.
  useEffect(() => {
    const on = (e: Event) => setModal((e as CustomEvent<VentanaCuenta>).detail);
    window.addEventListener(EVENTO_ABRIR_CUENTA, on);
    return () => window.removeEventListener(EVENTO_ABRIR_CUENTA, on);
  }, []);

  // The participant experience is deliberately minimal — large touch
  // targets, no navigation, no risk data. A generic header with an account
  // menu sitting above it works against that on purpose, so it's hidden
  // here instead of inside ParticipantShell (which never sees it mount).
  // Same reasoning as the participante check just below: the step-by-step
  // activity mode is deliberately full-screen (see StepByStepActivity.tsx)
  // — a persistent top bar would undercut "open directly into the
  // beautiful screen" from a WhatsApp tap.
  if (pathname.startsWith("/app/participante") || pathname.endsWith("/pasos")) return null;

  async function doLogout(scope: "local" | "global" = "local") {
    // Navigate away FIRST: signOut() flips the session to "anon" and
    // RouteGuard reacts to that by itself redirecting any /app/* path to
    // /app/login. If that fires while we're still mounted there, it races
    // this navigate("/") and (last-write-wins) can leave you on the login
    // screen instead of home. Unmounting RouteGuard before signOut ever
    // starts its async work removes the race entirely.
    navigate("/");
    resetSessionState();
    await supabase.auth.signOut({ scope });
  }

  const isAuthed = session.status === "authed";
  // Logo del libro de marca (isotipo + logotipo), igual que en el home.
  const logoContent = <Logo size="sm" />;

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3.5 bg-white border-b border-borde sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        {/* Logged in, the logo is a label, not an exit — leaving the app is
            only ever "Cerrar sesión" so a stray tap can't drop someone out
            of their session without meaning to. */}
        {isAuthed ? (
          <span className="flex items-center shrink-0">{logoContent}</span>
        ) : (
          <Link to="/" aria-label="IntegraMente en Casa, ir al inicio" className="flex items-center no-underline shrink-0">
            {logoContent}
          </Link>
        )}
        {crumbFor(pathname) && (
          <span className="hidden sm:inline text-sm text-tinta-tenue pl-5 border-l border-borde truncate">{crumbFor(pathname)}</span>
        )}
      </div>

      {(role === "familiar" || (role === "paciente" && myPatient?.vista_completa)) && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <AccountMenu
          initials={
            nombre
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "F"
          }
          name={nombre}
          subtitle={
            role === "paciente"
              ? "Tu cuenta"
              : myPatient
                ? `Familiar de ${myPatient.nombre}`
                : "Completá el perfil de tu familiar"
          }
          items={[
            { label: "Mi cuenta", onClick: () => setModal("mi-perfil") },
            ...(myPatient
              ? [{ label: role === "paciente" ? "Mi perfil" : `Perfil de ${myPatient.nombre.split(" ")[0]}`, onClick: () => navigate("/app/perfil/resumen") }]
              : []),
            ...(myPatient && myPatient.plan_status !== "pendiente"
              ? [{ label: "Calendario en tu teléfono", onClick: () => setModal("calendario") }]
              : []),
            { label: "Contactanos", onClick: () => setModal("contacto") },
            { label: "Cerrar sesión", onClick: () => doLogout(), danger: true },
          ]}
        />
        </div>
      )}

      {role === "profesional" && (
        <AccountMenu
          initials={
            nombre
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "P"
          }
          name={nombre}
          subtitle={esAdmin ? "Administrador del sistema" : (especialidad ?? "Equipo clínico")}
          badge={esAdmin ? "Administrador" : undefined}
          items={[
            { label: "Mi cuenta", onClick: () => setModal("mi-perfil") },
            { label: "Historial de auditoría", onClick: () => setModal("auditoria") },
            { label: "Cerrar sesión", onClick: () => doLogout(), danger: true },
          ]}
        />
      )}

      {role === null && pathname !== "/app/login" && (
        <button
          type="button"
          onClick={() => doLogout()}
          className="shrink-0 min-h-10 sm:min-h-11 px-3.5 sm:px-4.5 rounded-full border-[1.5px] border-borde bg-transparent font-sans text-sm sm:text-[15px] font-semibold cursor-pointer hover:border-verde-serenidad"
        >
          Cerrar sesión
        </button>
      )}

      {modal === "mi-perfil" && (role === "familiar" || role === "paciente" || role === "profesional") && (
        <MiPerfilModal onClose={() => setModal(null)} isSelf={role === "paciente"} onLogoutAll={() => doLogout("global")} />
      )}

      {modal === "contacto" && <ContactanosModal onClose={() => setModal(null)} />}
      {modal === "calendario" && myPatient && session.status === "authed" && (
        <CalendarModal patientId={myPatient.id} userId={session.session.user.id} onClose={() => setModal(null)} />
      )}

      {modal === "auditoria" && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Historial de auditoría</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">Toda edición queda registrada con autor, fecha y acción.</p>
          {auditLog.length === 0 ? (
            <p className="m-0 text-sm text-tinta-tenue">Todavía no hay actividad registrada en esta sesión.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {auditLog.map((entry) => (
                <div key={entry.id} className="bg-campo border border-borde-suave rounded-xl px-3.5 py-3">
                  <p className="m-0 text-[13px] text-tinta-tenue">
                    {entry.creadoEn} · <strong className="text-tinta">{entry.autor}</strong>
                  </p>
                  <p className="m-0 mt-0.5 text-[14px] text-tinta">
                    {entry.entidad}: {entry.accion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </header>
  );
}
