import { createPortal } from "react-dom";
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
import { MiProgramaModal } from "../ui/MiProgramaModal";
import { ContactanosModal } from "../ui/ContactanosModal";
import { CalendarModal } from "../ui/CalendarSyncCard";
import { Logo, LogoEnCasa } from "../ui/Logo";
import { ROL_ETIQUETA } from "../../lib/areasSalud";
import { SumarAcompanante } from "../familiar/SumarAcompanante";
import { PerfilPersonaModal } from "../familiar/PerfilPersonaModal";
import { elegirPacienteActivo, useMisPacientes } from "../../lib/pacienteActivo";
import { PestanasFamilia } from "./FamiliarNav";

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
  ["/app/resumen-medico", "Resumen para el médico"],
  ["/app/resumen", "Resumen de la semana"],
  ["/app/equipo", "Equipo clínico"],
  ["/app/referidor", "Profesional referidor"],
  ["/app/profesional/tareas", "Tareas del equipo"],
  ["/app/participante/hoy", "Hoy"],
  ["/app/participante/actividad", "Actividad"],
  ["/app/participante/ayuda", "Pidió ayuda"],
  ["/app/profesional/panel", "Panel"],
  ["/app/profesional/usuarios", "Usuarios"],
  ["/app/profesional/biblioteca", "Biblioteca"],
  ["/app/profesional/plantillas", "Plantillas"],
  ["/app/profesional/admin", "Administración"],
  ["/app/profesional/paciente", "Ficha del paciente"],
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

// Las pantallas de la app de la familia (con su propio encabezado).
const RUTAS_FAMILIA = ["/app/hoy", "/app/plan", "/app/historial", "/app/ayuda", "/app/emergencia", "/app/revision", "/app/resumen", "/app/resumen-medico"];

function crumbFor(pathname: string): string {
  const hit = crumbs.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? hit[1] : "";
}

type OpenModal = "mi-perfil" | "mi-programa" | "contacto" | "calendario" | "auditoria" | "acompanante" | "perfil-persona" | null;

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
  const { data: misPacientes } = useMisPacientes();
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

  const menuCuenta = (etiqueta?: string) => (
        <AccountMenu
          etiqueta={etiqueta}
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
          // Agrupado: lo de la cuenta de quien entra, lo de la persona del
          // programa, y al final contacto y salir.
          // Con varias personas, el encabezado del menú cambia entre ellas.
          cambio={
            role === "familiar" && myPatient && session.status === "authed"
              ? {
                  opciones: (misPacientes ?? []).filter((p) => p.id !== myPatient.id).map((p) => ({ id: p.id, texto: p.nombre })),
                  onElegir: (id) => {
                    if (session.status !== "authed") return;
                    elegirPacienteActivo(session.session.user.id, id);
                    navigate("/app/hoy");
                  },
                }
              : undefined
          }
          // Lo de quien entra, y «Perfil de …» para todo lo de la persona
          // que acompaña (su ventana con pestañas). Para la cuenta de la
          // propia persona, sus opciones directo en el menú.
          items={[
            { label: "Mi cuenta", onClick: () => setModal("mi-perfil") },
            // Todo lo de la persona que acompaña, en su propia ventana.
            ...(myPatient && role === "familiar" ? [{ label: `Perfil de ${myPatient.nombre.split(" ")[0]}`, onClick: () => setModal("perfil-persona") }] : []),
            { label: "Mis datos y permisos", onClick: () => navigate("/app/mis-datos") },
            ...(myPatient && role === "paciente"
              ? [
                  { label: "Mi perfil", onClick: () => navigate("/app/perfil/resumen") },
                  { label: "Resumen para el médico", onClick: () => navigate("/app/resumen-medico") },
                  { label: "Quiénes me acompañan", onClick: () => setModal("acompanante") },
                ]
              : []),
            { label: "Contactanos", onClick: () => setModal("contacto") },
            { label: "Cerrar sesión", onClick: () => doLogout(), danger: true },
          ]}
        />
  );

  // Las ventanas van directo al body: dentro del encabezado (que tiene
  // backdrop-blur) un elemento fixed queda encerrado en su franja y se corta.
  const ventanas = createPortal(
    <>
      {modal === "mi-perfil" && (role === "familiar" || role === "paciente" || role === "profesional") && (
        <MiPerfilModal onClose={() => setModal(null)} isSelf={role === "paciente"} onLogoutAll={() => doLogout("global")} />
      )}

      {modal === "mi-programa" && <MiProgramaModal onClose={() => setModal(null)} nombreCuenta={nombre} />}
      {modal === "contacto" && <ContactanosModal onClose={() => setModal(null)} />}
      {modal === "acompanante" && <SumarAcompanante onClose={() => setModal(null)} />}
      {modal === "perfil-persona" && <PerfilPersonaModal onClose={() => setModal(null)} />}
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
    </>,
    document.body,
  );

  // La app de la familia: una sola barra del crema de la página, alineada
  // al mismo contenedor que el contenido. Logo con «en casa», las pestañas
  // al lado (en escritorio; en el celular van abajo) y, a la derecha, el
  // avatar con el nombre de la persona del programa (el resto, en el menú).
  // El perfil (y su edición) también, una vez terminada la inscripción;
  // durante la inscripción esas mismas pantallas siguen con su encabezado.
  const inscripcionHecha = !!myPatient && myPatient.programa_elegido && !myPatient.needsReregistration;
  const enAppFamilia =
    role === "familiar" && (RUTAS_FAMILIA.some((r) => pathname === r || pathname.startsWith(`${r}/`)) || (inscripcionHecha && pathname.startsWith("/app/perfil/")));
  if (enAppFamilia) {
    const pendiente = !!myPatient && (myPatient.estado_cuenta === "rechazada" || (myPatient.plan_status === "pendiente" && !myPatient.tiene_plan_visible));
    return (
      <header className="sticky top-0 z-20 bg-fondo-papel/95 backdrop-blur-sm border-b border-borde">
        {/* A todo el ancho: logo a la izquierda y avatar a la derecha, con
            aire; las pestañas centradas sobre la columna del contenido. */}
        <div className="relative h-16 lg:h-[76px] px-5 sm:px-8 lg:px-10 flex items-center justify-between gap-4">
          <span className="shrink-0">
            <LogoEnCasa />
          </span>
          {!pendiente && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <PestanasFamilia />
            </div>
          )}
          {/* Con varios familiares: a quién acompaña ahora, y cambiar.
              El botón de la cuenta dice quién entró. */}
          <div className="shrink-0">{menuCuenta(nombre.split(" ")[0] || "Mi cuenta")}</div>
        </div>
        {ventanas}
      </header>
    );
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

      {(role === "familiar" || (role === "paciente" && myPatient?.vista_completa)) && <div className="flex items-center gap-2 sm:gap-3 shrink-0">{menuCuenta()}</div>}

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
            { label: "Condiciones y privacidad", onClick: () => window.open("/legal/privacidad", "_blank") },
            { label: "Cerrar sesión", onClick: () => doLogout(), danger: true },
          ]}
        />
      )}

      {(role === "equipo" || role === "referidor") && (
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
          subtitle={[ROL_ETIQUETA[role], especialidad].filter(Boolean).join(" · ")}
          items={[
            { label: "Mi cuenta", onClick: () => setModal("mi-perfil") },
            { label: "Condiciones y privacidad", onClick: () => window.open("/legal/privacidad", "_blank") },
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

      {ventanas}
    </header>
  );
}
