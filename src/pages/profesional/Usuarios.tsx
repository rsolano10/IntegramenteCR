import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Metric } from "../../components/ui/Metric";
import { CuentasTab } from "../../components/profesional/CuentasTab";
import { PacientesTab } from "../../components/profesional/PacientesTab";
import { patientPath, type PatientRow } from "../../lib/patients";
import { AccountDetailModal } from "../../components/profesional/AccountDetailModal";
import { attentionFor } from "../../lib/patientAttention";
import type { ManagedAccount } from "../../lib/adminAccounts";

export function Usuarios() {
  const [searchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const openPatient = (p: PatientRow) => navigate(patientPath(p.id));
  const [openAccount, setOpenAccount] = useState<ManagedAccount | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Both PacientesTab and CuentasTab run their own useQuery on these same
  // keys — this read only drives the KPI strip and the two cross-navigation
  // lookups below, it doesn't trigger an extra request.
  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });

  // Legacy deep link (older builds sent the assisted questionnaire back
  // here) — forward to the patient screen.
  useEffect(() => {
    const encuestaGuardada = searchParams.get("encuestaGuardada");
    if (encuestaGuardada) navigate(patientPath(encuestaGuardada, "evaluacion"), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleChanged(message: string, isError?: boolean) {
    setStatusMsg({ text: message, error: isError });
    queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  const stats = useMemo(() => {
    const totalPacientes = patients?.length ?? 0;
    const necesitanAccion = (patients ?? []).filter((p) => attentionFor(p) !== null).length;
    const familiasVinculadas = (patients ?? []).filter((p) => p.links.some((l) => l.relation !== "profesional_asignado")).length;
    const equipoClinico = (accounts ?? []).filter((a) => a.role === "profesional").length;
    return { totalPacientes, necesitanAccion, familiasVinculadas, equipoClinico };
  }, [patients, accounts]);

  const existingPatients = (patients ?? []).map((p) => ({ id: p.id, nombre: p.nombre }));

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="flex items-end justify-between gap-5 flex-wrap mb-6">
        <div>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Usuarios</p>
          <h1 className="font-serif font-normal text-[32px] sm:text-[36px] m-0">Pacientes y familias</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Nuevo paciente</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Metric value={String(stats.totalPacientes)} label="pacientes" />
        <Metric value={String(stats.necesitanAccion)} label="necesitan acción" tone={stats.necesitanAccion > 0 ? "amarillo" : "verde"} />
        <Metric value={String(stats.familiasVinculadas)} label="con familia vinculada" />
        <Metric value={String(stats.equipoClinico)} label="cuentas de clínica" />
      </div>

      {statusMsg && (
        <div
          className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl mb-5 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-verde-tenue text-verde-profundo"}`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
            Cerrar
          </button>
        </div>
      )}

      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente por nombre, familiar vinculado…"
          className="w-full min-h-13 px-4.5 rounded-full border-[1.5px] border-borde-campo bg-white font-sans text-[16px] text-tinta shadow-elevada"
        />
      </div>

      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada mb-8">
        <PacientesTab
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
          onChanged={handleChanged}
          onOpenPatient={openPatient}
          onOpenAccount={setOpenAccount}
          search={search}
        />
      </div>

      <div>
        <p className="m-0 mb-3 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Clínica y administración</p>
        <div className="bg-campo/60 border border-borde-suave rounded-3xl overflow-hidden">
          <CuentasTab patients={existingPatients} onChanged={handleChanged} onOpenAccount={setOpenAccount} />
        </div>
      </div>

      {openAccount && (
        <AccountDetailModal
          account={openAccount}
          onClose={() => setOpenAccount(null)}
          onChanged={handleChanged}
          onViewPatient={(patientId) => {
            setOpenAccount(null);
            navigate(patientPath(patientId));
          }}
        />
      )}
    </div>
  );
}
