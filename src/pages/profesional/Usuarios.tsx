import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { PillToggle } from "../../components/ui/PillToggle";
import { CuentasTab } from "../../components/profesional/CuentasTab";
import { PacientesTab } from "../../components/profesional/PacientesTab";

type Tab = "cuentas" | "pacientes";

const tabOptions: { value: Tab; label: string }[] = [
  { value: "cuentas", label: "Cuentas" },
  { value: "pacientes", label: "Pacientes" },
];

export function Usuarios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab: Tab = searchParams.get("tab") === "pacientes" ? "pacientes" : "cuentas";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingPatientId, setPendingPatientId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const queryClient = useQueryClient();

  function switchTab(next: Tab) {
    setTab(next);
    setCreateOpen(false);
    setSearchParams(next === "cuentas" ? {} : { tab: next }, { replace: true });
  }

  function handleChanged(message: string, isError?: boolean) {
    setStatusMsg({ text: message, error: isError });
    queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  function viewPatient(patientId: string) {
    switchTab("pacientes");
    setPendingPatientId(patientId);
  }

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="flex items-end justify-between gap-5 flex-wrap mb-5">
        <div>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Usuarios</p>
          <h1 className="font-serif font-normal text-[32px] sm:text-[36px] m-0">{tab === "cuentas" ? "Cuentas" : "Pacientes"}</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>{tab === "cuentas" ? "Crear cuenta" : "Nuevo paciente"}</Button>
      </div>

      <div className="mb-5">
        <PillToggle value={tab} onChange={switchTab} options={tabOptions} />
      </div>

      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        {statusMsg && (
          <div className={`flex items-center justify-between gap-4 px-5 py-3 sm:px-8 border-b border-[#efeada] text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-[#edf4f4] text-verde-profundo"}`}>
            <span>{statusMsg.text}</span>
            <button type="button" onClick={() => setStatusMsg(null)} className="border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
              Cerrar
            </button>
          </div>
        )}

        {/* Both tabs stay mounted, just hidden — switching tabs used to fully
            unmount/remount the inactive one, which re-triggered its
            useQuery on every switch. That remount fetch could resolve
            *after* a delete's invalidation refetch and silently overwrite
            fresh data with stale, since React Query has no way to know a
            just-unmounted request is now outdated. Keeping both mounted
            gives each query one stable subscription instead of a fresh
            one per switch. */}
        <div className={tab === "cuentas" ? "" : "hidden"}>
          <CuentasTab createOpen={createOpen && tab === "cuentas"} onCreateOpenChange={setCreateOpen} onChanged={handleChanged} onViewPatient={viewPatient} />
        </div>
        <div className={tab === "pacientes" ? "" : "hidden"}>
          <PacientesTab
            createOpen={createOpen && tab === "pacientes"}
            onCreateOpenChange={setCreateOpen}
            onChanged={handleChanged}
            pendingPatientId={pendingPatientId}
            onConsumePending={() => setPendingPatientId(null)}
          />
        </div>
      </div>
    </div>
  );
}
