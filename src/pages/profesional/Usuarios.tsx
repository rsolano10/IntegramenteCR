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
import { Button } from "../../components/ui/Button";
import { Caja, CajaAviso, CajaBarra, CajaCuerpo, CajaPestanas, Pagina, type PestanaCaja } from "../../components/profesional/Caja";

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
  const pestanas: PestanaCaja<Pestana>[] = [
    { id: "familias", label: "Familias", n: resumen.total },
    { id: "sin_paciente", label: "Cuentas sin paciente", n: resumen.sueltas, aviso: resumen.sueltas > 0 },
    { id: "equipo", label: "Equipo de la clínica", n: resumen.equipo },
  ];

  return (
    <Pagina>
      <Caja
        eyebrow="Usuarios"
        titulo="Pacientes y familias"
        descripcion={
          <>
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
          </>
        }
        acciones={
          <>
            <Button dense onClick={() => setCrear(true)}>
              + Nuevo paciente
            </Button>
            <span className="w-10 h-10 rounded-full border-[1.5px] border-borde-campo bg-white inline-flex items-center justify-center">
              <RowMenu items={[{ label: "Ajustes de cuentas", onClick: () => setAjustes(true) }]} />
            </span>
          </>
        }
        pie={<CajaPestanas etiqueta="Usuarios" pestanas={pestanas} activa={pestana} onCambiar={setPestana} />}
      >
        {statusMsg && <CajaAviso texto={statusMsg.text} error={statusMsg.error} onCerrar={() => setStatusMsg(null)} />}
        {pestana === "familias" && (
          <CajaBarra>
            <label className="relative flex items-center flex-1 min-w-0 max-w-[520px]">
              <span className="absolute left-3.5 flex text-tinta-suave" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar paciente, familiar o correo"
                placeholder="Buscar paciente, familiar o correo"
                className="w-full min-h-11 pl-10.5 pr-4 rounded-full border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none"
              />
            </label>
          </CajaBarra>
        )}
        <CajaCuerpo>
          {pestana === "familias" && <ListaFamilias search={search} vistaInicial={(searchParams.get("vista") as Vista | null) ?? undefined} onChanged={handleChanged} onOpenAccount={setOpenAccount} />}
          {pestana !== "familias" && <CuentasTab seccion={pestana} patients={existingPatients} onChanged={handleChanged} onOpenAccount={setOpenAccount} />}
        </CajaCuerpo>
      </Caja>

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
    </Pagina>
  );
}
