import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import type { Answers } from "../../lib/onboardingSchema";
import { FamiliarNav } from "./FamiliarNav";

function PendienteRevision({ nombre }: { nombre: string }) {
  return (
    <div className="max-w-[560px] mx-auto px-5 pt-10 pb-16 sm:px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#edf4f4] mx-auto mb-6 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <circle cx="13" cy="13" r="9" stroke="#3F6A70" strokeWidth="1.6" />
          <path d="M13 8.5v5l3.2 1.9" stroke="#3F6A70" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-serif font-normal text-[26px] sm:text-[30px] leading-[1.18] m-0 mb-3">Estamos armando el programa de {nombre}</h1>
      <p className="m-0 text-base sm:text-[17px] leading-relaxed text-tinta-suave">
        Tu información ya llegó al equipo clínico de IntegraMente. La están revisando para armar un programa personalizado. Te vamos a
        avisar por correo electrónico en cuanto esté listo.
      </p>
    </div>
  );
}

export function FamiliarShell() {
  const session = useSession();
  const { data: myPatient, isLoading } = useMyPatient();
  const hydrateOnboarding = useAppStore((s) => s.hydrateOnboarding);

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

  const pendiente = myPatient?.plan_status === "pendiente";
  const nombreFamiliar = session.status === "authed" ? session.profile.nombre.split(" ")[0] : "";

  if (isLoading) return <div className="min-h-[40vh]" />;

  return (
    <div className="im-in min-h-full pb-24 md:pb-0">
      <div className="bg-verde-profundo text-white px-5 pt-6 pb-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="m-0 mb-1 text-sm text-[#c4dbdb]">Miércoles 12 de agosto</p>
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
        {pendiente ? <PendienteRevision nombre={myPatient?.nombre ?? "tu familiar"} /> : <Outlet />}
      </div>
    </div>
  );
}
