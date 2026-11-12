import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import type { ManagedAccount } from "../../../lib/adminAccounts";
import { patientPath, type PatientRow } from "../../../lib/patients";
import type { Paso } from "../../../lib/siguientePaso";
import { waLink } from "../../../lib/whatsapp";
import type { FilaCuenta } from "../../../lib/cuentas";
import type { RowMenuItem } from "../../ui/RowMenu";
import { DeleteConfirmModal } from "../DeleteConfirmModal";
import { useAccionesCuenta } from "../useAccionesCuenta";
import { VistaRapida } from "./VistaRapida";

// Lo que se puede hacer con una familia desde la clínica (lista de Usuarios
// y Panel): el botón del siguiente paso, la vista rápida, el menú ⋯ y la
// confirmación de borrado. Aprobar siempre pasa por la vista rápida.
export function useFamiliaAcciones({
  patients,
  cuentas,
  onChanged,
  onOpenAccount,
}: {
  patients: PatientRow[] | undefined;
  cuentas: Map<string, FilaCuenta>;
  onChanged: (message: string, isError?: boolean) => void;
  onOpenAccount: (account: ManagedAccount) => void;
}) {
  const navigate = useNavigate();
  const acciones = useAccionesCuenta(onChanged);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [borrar, setBorrar] = useState<PatientRow | null>(null);
  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });
  const cuentasPorId = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts]);

  function accion(paso: Paso, p: PatientRow, f: FilaCuenta | undefined, desdeVista = false) {
    switch (paso.tipo) {
      case "aprobar":
        // Desde la lista, aprobar abre primero la vista rápida para revisar.
        if (!desdeVista || !f) return setAbierto(p.id);
        return acciones.aprobar(f);
      case "pagar":
        return f && acciones.pagar(f, true);
      case "evaluar":
        return navigate(patientPath(p.id, "evaluacion"));
      case "revisar":
        return navigate(patientPath(p.id, "semana"));
      case "asignar":
        return navigate(patientPath(p.id, "planificar"));
      case "duplicado":
        return navigate(patientPath(p.id));
      case "contactar":
        if (f?.telefono) return void window.open(waLink(f.telefono, `Hola ${f.nombre.split(" ")[0]}, te escribimos de IntegraMente en Casa.`), "_blank", "noopener");
        return setAbierto(p.id);
    }
  }

  const menuDe = (p: PatientRow, f: FilaCuenta | undefined): RowMenuItem[] => [
    { label: "Vista rápida", onClick: () => setAbierto(p.id) },
    { label: "Abrir la ficha completa", onClick: () => navigate(patientPath(p.id)) },
    ...acciones.menu(f),
    { label: "Eliminar paciente", danger: true, onClick: () => setBorrar(p) },
  ];

  const pAbierto = abierto ? patients?.find((p) => p.id === abierto) : undefined;
  const fAbierta = pAbierto ? cuentas.get(pAbierto.id) : undefined;

  const elementos = (
    <>
      {pAbierto && (
        <VistaRapida
          p={pAbierto}
          f={fAbierta}
          cuentas={cuentasPorId}
          menu={menuDe(pAbierto, fAbierta).filter((m) => m.label !== "Vista rápida" && m.label !== "Abrir la ficha completa")}
          ocupado={acciones.ocupado === pAbierto.id}
          onAccion={(paso) => accion(paso, pAbierto, fAbierta, true)}
          onAbrirCuenta={(a) => {
            setAbierto(null);
            onOpenAccount(a);
          }}
          onClose={() => setAbierto(null)}
        />
      )}

      {acciones.modalHistorial}

      {borrar && (
        <DeleteConfirmModal
          title={`¿Eliminar a ${borrar.nombre}?`}
          message="Se borran su perfil, su plan y todos sus registros. No se puede deshacer."
          onCancel={() => setBorrar(null)}
          onConfirm={async () => {
            const { error } = await supabase.from("patients").delete().eq("id", borrar.id);
            if (error) onChanged(error.message, true);
            else onChanged(`${borrar.nombre} fue eliminado.`);
            setBorrar(null);
            setAbierto(null);
          }}
        />
      )}
    </>
  );

  return { accion, menuDe, abrir: setAbierto, ocupado: acciones.ocupado, cuentasPorId, elementos };
}
