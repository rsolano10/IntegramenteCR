import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { getPatientName } from "../../lib/patient";
import { professional } from "../../lib/mockData";
import { AccountMenu } from "../ui/AccountMenu";
import { Modal } from "../ui/Modal";
import { EditBasicInfoModal } from "../ui/EditBasicInfoModal";
import { SettingsModal } from "../ui/SettingsModal";
import { EmergencyContactsModal } from "../ui/EmergencyContactsModal";

const crumbs: [string, string][] = [
  ["/app/login", "Ingreso"],
  ["/app/consent", "Consentimiento"],
  ["/app/perfil/resumen", "Marcela · Tu cuestionario"],
  ["/app/perfil", "Perfil funcional"],
  ["/app/mensajes", "Marcela · Mensajes"],
  ["/app/emergencia", "Marcela · Emergencia"],
  ["/app/hoy/actividad", "Marcela · Actividad"],
  ["/app/hoy", "Marcela · Hoy"],
  ["/app/plan", "Marcela · Plan"],
  ["/app/actividades", "Marcela · Actividades"],
  ["/app/asistente", "Marcela · Dudas"],
  ["/app/revision", "Marcela · Revisión"],
  ["/app/resumen", "Marcela · Resumen"],
  ["/app/participante/gustos", "Rosa · Sus gustos"],
  ["/app/participante/hoy", "Rosa · Hoy"],
  ["/app/participante/pasos", "Rosa · Paso a paso"],
  ["/app/participante/ayuda", "Rosa · Pidió ayuda"],
  ["/app/profesional/panel", "Dra. Solano · Panel"],
  ["/app/profesional/pacientes", "Dra. Solano · Pacientes"],
  ["/app/profesional/cuentas", "Dra. Solano · Cuentas"],
  ["/app/profesional/biblioteca", "Dra. Solano · Biblioteca"],
  ["/app/profesional/ficha", "Dra. Solano · Ficha"],
  ["/app/profesional/editor", "Dra. Solano · Editor"],
  ["/app/profesional/alerta", "Dra. Solano · Alerta"],
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

type OpenModal = "mi-perfil" | "editar-rosa" | "configuraciones" | "emergencia" | "auditoria" | null;

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const role = session.status === "authed" ? session.profile.role : null;
  const email = session.status === "authed" ? session.session.user.email ?? "" : "";
  const resetSessionState = useAppStore((s) => s.resetSessionState);
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const auditLog = useAppStore((s) => s.auditLog);
  const [modal, setModal] = useState<OpenModal>(null);

  // The participant experience is deliberately minimal — large touch
  // targets, no navigation, no risk data. A generic header with an account
  // menu sitting above it works against that on purpose, so it's hidden
  // here instead of inside ParticipantShell (which never sees it mount).
  if (pathname.startsWith("/app/participante")) return null;

  async function doLogout() {
    await supabase.auth.signOut();
    resetSessionState();
    navigate("/");
  }

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3.5 bg-white border-b border-borde sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <Link to="/" className="flex items-baseline gap-1.5 sm:gap-2 font-serif text-lg sm:text-[22px] text-tinta no-underline shrink-0">
          Integra<em className="italic text-verde-profundo">Mente</em>{" "}
          <span className="hidden sm:inline font-sans text-[11px] tracking-[0.16em] uppercase text-tinta-tenue">en Casa</span>
        </Link>
        {crumbFor(pathname) && (
          <span className="hidden sm:inline text-sm text-tinta-tenue pl-5 border-l border-borde truncate">{crumbFor(pathname)}</span>
        )}
      </div>

      {role === "familiar" && (
        <AccountMenu
          initials="M"
          name="Marcela"
          subtitle={`Familiar de ${getPatientName(onboarding2)}`}
          items={[
            { label: "Mi perfil", onClick: () => setModal("mi-perfil") },
            { label: `Editar datos básicos de ${getPatientName(onboarding2).split(" ")[0]}`, onClick: () => setModal("editar-rosa") },
            { label: "Ver el cuestionario completo", onClick: () => navigate("/app/perfil/resumen") },
            { label: "Mensajes de tu profesional", onClick: () => navigate("/app/mensajes") },
            { label: "Configuraciones", onClick: () => setModal("configuraciones") },
            { label: "Contactos de emergencia", onClick: () => setModal("emergencia") },
            { label: "Cerrar sesión", onClick: doLogout, danger: true },
          ]}
        />
      )}

      {role === "profesional" && (
        <AccountMenu
          initials="GS"
          name={professional.nombre}
          subtitle={professional.especialidad}
          items={[
            { label: "Mi perfil", onClick: () => setModal("mi-perfil") },
            { label: "Historial de auditoría", onClick: () => setModal("auditoria") },
            { label: "Cerrar sesión", onClick: doLogout, danger: true },
          ]}
        />
      )}

      {role === null && pathname !== "/app/login" && (
        <button
          type="button"
          onClick={doLogout}
          className="shrink-0 min-h-10 sm:min-h-11 px-3.5 sm:px-4.5 rounded-full border-[1.5px] border-borde bg-transparent font-sans text-sm sm:text-[15px] font-semibold cursor-pointer hover:border-verde-serenidad"
        >
          Cerrar sesión
        </button>
      )}

      {modal === "mi-perfil" && role === "familiar" && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Mi perfil</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">Datos de tu cuenta como familiar administradora.</p>
          <div className="grid gap-3">
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Nombre</strong>
              Marcela Jiménez
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Correo</strong>
              {email || "familiar@test.com"}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Rol</strong>
              Familiar administradora de {getPatientName(onboarding2)}
            </div>
          </div>
        </Modal>
      )}

      {modal === "mi-perfil" && role === "profesional" && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Mi perfil</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">Datos de tu cuenta profesional.</p>
          <div className="grid gap-3">
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Nombre</strong>
              {professional.nombre}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Especialidad</strong>
              {professional.especialidad}
            </div>
            <div className="bg-campo border border-[#efeada] rounded-2xl p-4">
              <strong className="block text-sm text-tinta-tenue mb-1">Correo</strong>
              {email || "clinica@test.com"}
            </div>
          </div>
        </Modal>
      )}

      {modal === "editar-rosa" && <EditBasicInfoModal onClose={() => setModal(null)} />}
      {modal === "configuraciones" && <SettingsModal onClose={() => setModal(null)} />}
      {modal === "emergencia" && <EmergencyContactsModal onClose={() => setModal(null)} />}

      {modal === "auditoria" && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Historial de auditoría</h2>
          <p className="m-0 mb-5 text-sm text-tinta-tenue">Toda edición queda registrada con autor, fecha y acción.</p>
          {auditLog.length === 0 ? (
            <p className="m-0 text-sm text-tinta-tenue">Todavía no hay actividad registrada en esta sesión.</p>
          ) : (
            <div className="grid gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {auditLog.map((entry) => (
                <div key={entry.id} className="bg-campo border border-[#efeada] rounded-xl px-3.5 py-3">
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
