import { Outlet } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { getPatientName } from "../../lib/patient";
import { FamiliarNav } from "./FamiliarNav";

function PendienteRevision() {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  return (
    <div className="max-w-[560px] mx-auto px-5 pt-10 pb-16 sm:px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#edf4f4] mx-auto mb-6 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <circle cx="13" cy="13" r="9" stroke="#3F6A70" strokeWidth="1.6" />
          <path d="M13 8.5v5l3.2 1.9" stroke="#3F6A70" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-serif font-normal text-[26px] sm:text-[30px] leading-[1.18] m-0 mb-3">
        Estamos armando el programa de {getPatientName(onboarding2)}
      </h1>
      <p className="m-0 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
        Tu información ya llegó al equipo clínico de IntegraMente. La están revisando para armar un programa personalizado. Te vamos a
        avisar por correo electrónico en cuanto esté listo.
      </p>
    </div>
  );
}

export function FamiliarShell() {
  const planStatus = useAppStore((s) => s.planStatus);
  const pendiente = planStatus === "pendiente";

  return (
    <div className="im-in min-h-full pb-24 md:pb-0">
      <div className="bg-verde-profundo text-white px-5 pt-6 pb-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="m-0 mb-1 text-sm text-[#c4dbdb]">Miércoles 12 de agosto</p>
          <h1 className="font-serif font-normal text-2xl sm:text-[28px] m-0 text-white">Hola, Marcela</h1>
        </div>
      </div>

      {!pendiente && (
        <div className="bg-white md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <FamiliarNav />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 py-6 sm:px-8 lg:px-12 lg:py-8">{pendiente ? <PendienteRevision /> : <Outlet />}</div>
    </div>
  );
}
