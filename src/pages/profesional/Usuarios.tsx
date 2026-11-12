import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { patientPath, type PatientRow } from "../../lib/patients";
import type { ManagedAccount } from "../../lib/adminAccounts";
import { useCuentaPorPaciente } from "../../lib/usePanelCuentas";
import { siguientePaso, type Vista } from "../../lib/siguientePaso";
import { AccountDetailModal } from "../../components/profesional/AccountDetailModal";
import { AjustesCuentasModal } from "../../components/profesional/CuentaSeguimiento";
import { CuentasTab } from "../../components/profesional/CuentasTab";
import { ListaFamilias } from "../../components/profesional/usuarios/ListaFamilias";
import { NewPatientModal } from "../../components/profesional/usuarios/NuevoPacienteModal";
import { RowMenu } from "../../components/ui/RowMenu";

type Pestana = "familias" | "sin_paciente" | "equipo";

// Usuarios: las familias de la clínica, con lo urgente primero. Una fila por
// familia con su siguiente paso; la vista rápida al tocar el nombre; las
// cuentas sueltas y el equipo en sus propias pestañas.
export function Usuarios() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pestana, setPestana] = useState<Pestana>("familias");
  const [crear, setCrear] = useState(false);
  const [ajustes, setAjustes] = useState(false);
  const [openAccount, setOpenAccount] = useState<ManagedAccount | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const { porPaciente: cuentas } = useCuentaPorPaciente();

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_patients");
      if (error) throw error;
      return data as PatientRow[];
    },
  });
  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });

  // Enlace viejo (versiones anteriores volvían acá tras el cuestionario asistido).
  useEffect(() => {
    const encuestaGuardada = searchParams.get("encuestaGuardada");
    if (encuestaGuardada) navigate(patientPath(encuestaGuardada, "evaluacion"), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleChanged(message: string, isError?: boolean) {
    setStatusMsg({ text: message, error: isError });
    queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["panel-cuentas"] });
  }

  const resumen = useMemo(() => {
    const total = patients?.length ?? 0;
    const pendientes = (patients ?? []).filter((p) => siguientePaso(p, cuentas.get(p.id)) !== null).length;
    const sueltas = (accounts ?? []).filter((a) => a.role !== "profesional" && a.links.length === 0).length;
    const equipo = (accounts ?? []).filter((a) => a.role === "profesional").length;
    return { total, pendientes, sueltas, equipo };
  }, [patients, cuentas, accounts]);

  const existingPatients = (patients ?? []).map((p) => ({ id: p.id, nombre: p.nombre }));
  const pestanas: { id: Pestana; label: string; n: number; aviso?: boolean }[] = [
    { id: "familias", label: "Familias", n: resumen.total },
    { id: "sin_paciente", label: "Cuentas sin paciente", n: resumen.sueltas, aviso: resumen.sueltas > 0 },
    { id: "equipo", label: "Equipo de la clínica", n: resumen.equipo },
  ];

  return (
    <div className="im-in max-w-[1240px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:py-10 lg:pb-20">
      {/* Encabezado */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-6">
        <div className="min-w-0">
          <h1 className="m-0 font-serif font-normal text-[32px] sm:text-[38px] leading-tight">Pacientes y familias</h1>
          <p className="m-0 mt-1.5 text-[15.5px] text-tinta-suave">
            {resumen.total} {resumen.total === 1 ? "familia" : "familias"}
            {resumen.pendientes > 0 ? (
              <>
                {" · "}
                <strong className="text-aviso-texto">
                  {resumen.pendientes} {resumen.pendientes === 1 ? "necesita" : "necesitan"} algo de vos
                </strong>
              </>
            ) : (
              " · todo al día"
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <label className="relative flex items-center basis-full sm:basis-auto">
            <span className="absolute left-3.5 flex text-tinta-suave" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setPestana("familias");
              }}
              aria-label="Buscar paciente, familiar o correo"
              placeholder="Buscar paciente, familiar o correo"
              className="w-full sm:w-[320px] h-11 pl-10.5 pr-3.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setCrear(true)}
            className="flex-1 sm:flex-none justify-center h-11 px-4.5 rounded-xl border-0 bg-verde-profundo text-white font-sans text-[14.5px] font-bold cursor-pointer inline-flex items-center gap-2 hover:bg-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo paciente
          </button>
          <div className="w-11 h-11 rounded-xl border-[1.5px] border-borde-campo bg-white inline-flex items-center justify-center">
            <RowMenu items={[{ label: "Ajustes de cuentas", onClick: () => setAjustes(true) }]} />
          </div>
        </div>
      </header>

      {statusMsg && (
        <div role="status" className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl mb-5 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-verde-tenue text-verde-profundo"}`}>
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="border-none bg-transparent font-sans text-[13px] font-semibold cursor-pointer text-inherit">
            Cerrar
          </button>
        </div>
      )}

      {/* Pestañas */}
      <div role="tablist" aria-label="Usuarios" className="flex gap-6 sm:gap-7 border-b border-borde mb-5 overflow-x-auto [scrollbar-width:none]">
        {pestanas.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={pestana === t.id}
            onClick={() => setPestana(t.id)}
            className={`shrink-0 pb-3 -mb-px border-0 border-b-[3px] bg-transparent font-sans text-[15px] cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
              pestana === t.id ? "border-verde-profundo font-extrabold text-tinta" : "border-transparent font-semibold text-tinta-suave hover:text-tinta"
            }`}
          >
            {t.label}
            <span
              className={
                t.aviso
                  ? "min-w-[22px] h-[22px] px-1.5 rounded-full bg-aviso text-aviso-texto text-[12px] font-extrabold inline-flex items-center justify-center"
                  : "font-semibold text-tinta-suave"
              }
            >
              {t.n}
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {pestana === "familias" && <ListaFamilias search={search} vistaInicial={(searchParams.get("vista") as Vista | null) ?? undefined} onChanged={handleChanged} onOpenAccount={setOpenAccount} />}
        {pestana !== "familias" && <CuentasTab seccion={pestana} patients={existingPatients} onChanged={handleChanged} onOpenAccount={setOpenAccount} />}
      </div>

      {crear && <NewPatientModal onClose={() => setCrear(false)} onCreated={() => handleChanged("Paciente creado.")} onError={(msg) => handleChanged(msg, true)} />}
      {ajustes && <AjustesCuentasModal onClose={() => setAjustes(false)} />}
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
