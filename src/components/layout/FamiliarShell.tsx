import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { getPatientName } from "../../lib/patient";
import { FamiliarNav } from "./FamiliarNav";
import { EditBasicInfoModal } from "../ui/EditBasicInfoModal";

export function FamiliarShell() {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="im-in min-h-full pb-24 md:pb-0">
      <div className="bg-verde-profundo text-white px-5 pt-6 pb-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="m-0 mb-1 text-sm text-[#c4dbdb]">Miércoles 12 de agosto</p>
            <h1 className="font-serif font-normal text-2xl sm:text-[28px] m-0 text-white">Hola, Marcela</h1>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="mt-1 shrink-0 border-none bg-transparent font-sans text-[13px] text-[#c4dbdb] hover:text-white cursor-pointer underline"
          >
            Editar datos de {getPatientName(onboarding2).split(" ")[0]}
          </button>
        </div>
      </div>

      <div className="bg-white md:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <FamiliarNav />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <Outlet />
      </div>

      {editOpen && <EditBasicInfoModal onClose={() => setEditOpen(false)} />}
    </div>
  );
}
