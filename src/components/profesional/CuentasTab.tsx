import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PillToggle } from "../ui/PillToggle";
import { RowMenu } from "../ui/RowMenu";
import { FormField } from "../ui/FormField";
import { callAdminAccounts, type ManagedAccount } from "../../lib/adminAccounts";
import { normalizeCrPhone } from "../../lib/phone";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { EstadoChip } from "./CuentaSeguimiento";
import { useCuentaPorPaciente } from "../../lib/usePanelCuentas";
import { Avatar } from "./usuarios/piezas";
import { BadgeRol } from "../ui/AccountMenu";
import { useIdsAdministradores } from "../../lib/useEsAdmin";

// Las otras dos pestañas de Usuarios: cuentas de familia invitadas pero
// todavía sin paciente, y el equipo de la clínica.
export function CuentasTab({
  seccion,
  patients,
  onChanged,
  onOpenAccount,
}: {
  seccion: "sin_paciente" | "equipo";
  patients: { id: string; nombre: string }[];
  onChanged: (message: string, isError?: boolean) => void;
  onOpenAccount: (account: ManagedAccount) => void;
}) {
  const { data: accounts, isLoading, error: loadError } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
  });

  // Estado de la cuenta (registrado, cuestionario pendiente…) para las que
  // todavía no tienen paciente.
  const { porCuenta } = useCuentaPorPaciente();
  const admins = useIdsAdministradores();
  const [createFor, setCreateFor] = useState<"profesional" | "familiar_admin" | null>(null);
  const [deleteFor, setDeleteFor] = useState<ManagedAccount | null>(null);
  const [permanentDeleteFor, setPermanentDeleteFor] = useState<ManagedAccount | null>(null);

  const resendMutation = useMutation({
    mutationFn: (account: ManagedAccount) => callAdminAccounts("resend", { userId: account.id }),
    onSuccess: () => onChanged("Confirmación reenviada."),
    onError: (err: Error) => onChanged(err.message, true),
  });

  const reactivateMutation = useMutation({
    mutationFn: (account: ManagedAccount) => callAdminAccounts("reactivate_user", { userId: account.id }),
    onSuccess: (_data, account) => onChanged(`${account.nombre} fue reactivado.`),
    onError: (err: Error) => onChanged(err.message, true),
  });

  const orphans = (accounts ?? []).filter((a) => a.role !== "profesional" && a.links.length === 0);
  // El administrador primero; después el resto del equipo.
  const staff = (accounts ?? []).filter((a) => a.role === "profesional").sort((x, y) => Number(admins.has(y.id)) - Number(admins.has(x.id)));

  function AccountRow({ a }: { a: ManagedAccount }) {
    const confirmed = !!a.email_confirmed_at;
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-borde-suave last:border-b-0 hover:bg-[#fcfbf6]">
        <button type="button" onClick={() => onOpenAccount(a)} className="flex items-center gap-3 min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer font-sans">
          <Avatar id={a.id} nombre={a.nombre} size={38} />
          <span className="min-w-0">
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-tinta truncate">{a.nombre}</span>
            {admins.has(a.id) && <BadgeRol texto="Administrador" />}
          </span>
          <span className="block text-[13px] text-tinta-suave truncate">
            {a.email}
            {a.especialidad && !admins.has(a.id) ? ` · ${a.especialidad}` : ""}
          </span>
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {a.role !== "profesional" && a.is_active && <EstadoChip estado={porCuenta.get(a.id)?.estado ?? null} />}
          {!a.is_active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-white text-tinta-tenue">Desactivada</span>
          ) : confirmed ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-verde-serenidad/15 text-verde-profundo">Confirmado</span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-aviso text-semaforo-amarillo-texto">Pendiente</span>
          )}
          <div>
            <RowMenu
              items={[
                { label: "Ver detalle", onClick: () => onOpenAccount(a) },
                { label: "Reenviar confirmación", hidden: confirmed || !a.is_active, onClick: () => resendMutation.mutate(a) },
                { label: "Reactivar cuenta", hidden: a.is_active, onClick: () => reactivateMutation.mutate(a) },
                { label: "Desactivar cuenta", danger: true, hidden: !a.is_active, onClick: () => setDeleteFor(a) },
                { label: "Eliminar permanentemente", danger: true, hidden: a.is_active, onClick: () => setPermanentDeleteFor(a) },
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  const lista = seccion === "sin_paciente" ? orphans : staff;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="m-0 text-[14px] text-tinta-suave max-w-[60ch]">
          {seccion === "sin_paciente"
            ? "Cuentas de familia invitadas o registradas que todavía no están vinculadas a ningún paciente. Abrí una para vincularla."
            : "Las cuentas de la clínica. Todas ven y atienden a las familias; el administrador además ve las métricas generales del programa."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setCreateFor(seccion === "sin_paciente" ? "familiar_admin" : "profesional")} className="shrink-0">
          {seccion === "sin_paciente" ? "+ Invitar cuenta" : "+ Agregar cuenta"}
        </Button>
      </div>
      {isLoading && <p className="m-0 text-sm text-tinta-suave">Cargando…</p>}
      {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar las cuentas.</p>}
      {!isLoading && lista.length === 0 && (
        <div className="rounded-[20px] border-[1.5px] border-dashed border-borde-campo bg-white/50 py-10 px-6 text-center">
          <p className="m-0 font-serif text-[20px] text-tinta">{seccion === "sin_paciente" ? "Ninguna cuenta suelta" : "Ninguna cuenta de clínica todavía"}</p>
          <p className="m-0 mt-1 text-[14px] text-tinta-suave">{seccion === "sin_paciente" ? "Todas las cuentas de familia están vinculadas a un paciente." : "Agregá la primera con «Agregar cuenta»."}</p>
        </div>
      )}
      {lista.length > 0 && (
        <div className="bg-white border border-borde rounded-[20px] overflow-hidden">
          {lista.map((a) => (
            <AccountRow key={a.id} a={a} />
          ))}
        </div>
      )}

      {createFor && (
        <CreateAccountModal
          initialAccountType={createFor}
          existingPatients={patients}
          onClose={() => setCreateFor(null)}
          onCreated={(msg) => onChanged(msg ?? "Cuenta creada. Le enviamos una invitación por correo.")}
          onError={(msg) => onChanged(msg, true)}
        />
      )}

      {deleteFor && (
        <DeleteConfirmModal
          title={`¿Desactivar la cuenta de ${deleteFor.nombre}?`}
          message="No va a poder ingresar hasta que se reactive. Su historial (mensajes, notas, cambios de estado) se conserva intacto."
          confirmLabel="Sí, desactivar"
          confirmLoadingLabel="Desactivando…"
          onCancel={() => setDeleteFor(null)}
          onConfirm={async () => {
            try {
              await callAdminAccounts("delete_user", { userId: deleteFor.id });
              onChanged(`${deleteFor.nombre} fue desactivado.`);
            } catch (err) {
              onChanged(err instanceof Error ? err.message : "No pudimos desactivar la cuenta.", true);
            } finally {
              setDeleteFor(null);
            }
          }}
        />
      )}

      {permanentDeleteFor && (
        <DeleteConfirmModal
          title={`¿Eliminar por completo la cuenta de ${permanentDeleteFor.nombre}?`}
          message="Esto borra la cuenta de la base de datos — no se puede deshacer ni reactivar después. Sus mensajes y notas de auditoría quedan sin autor, pero no se borran."
          warningNote='Solo hacé esto si estás limpiando el sistema de cuentas que ya no van a volver — para un descanso temporal, usá "Desactivar" en vez de esto.'
          confirmLabel="Sí, eliminar por completo"
          confirmLoadingLabel="Eliminando…"
          onCancel={() => setPermanentDeleteFor(null)}
          onConfirm={async () => {
            try {
              const result = await callAdminAccounts("permanently_delete_user", { userId: permanentDeleteFor.id });
              onChanged(result?.message ?? `${permanentDeleteFor.nombre} fue eliminado permanentemente.`);
            } catch (err) {
              onChanged(err instanceof Error ? err.message : "No pudimos eliminar la cuenta.", true);
            } finally {
              setPermanentDeleteFor(null);
            }
          }}
        />
      )}
    </div>
  );
}

function CreateAccountModal({
  initialAccountType,
  existingPatients,
  onClose,
  onCreated,
  onError,
}: {
  initialAccountType?: "familiar_admin" | "participante" | "profesional";
  existingPatients: { id: string; nombre: string }[];
  onClose: () => void;
  onCreated: (msg?: string) => void;
  onError: (msg: string) => void;
}) {
  const [accountType, setAccountType] = useState<"familiar_admin" | "participante" | "profesional">(initialAccountType ?? "familiar_admin");
  const [metodo, setMetodo] = useState<"invite" | "generic">("invite");
  const [patientMode, setPatientMode] = useState<"none" | "new" | "existing">(existingPatients.length > 0 ? "existing" : "none");
  const [patientId, setPatientId] = useState(existingPatients[0]?.id ?? "");
  const [patientNombre, setPatientNombre] = useState("");
  const [patientEdad, setPatientEdad] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const isStaff = accountType === "profesional";

  const patientModeOptions: { value: typeof patientMode; label: string }[] = [
    { value: "none", label: "Sin paciente" },
    { value: "new", label: "Paciente nuevo" },
    ...(existingPatients.length > 0 ? [{ value: "existing" as const, label: "Existente" }] : []),
  ];

  async function submit() {
    setLocalError("");
    if (!nombre.trim() || !email.trim()) {
      setLocalError("Completá el nombre y el correo de la persona.");
      return;
    }
    if (!isStaff && patientMode === "new" && !patientNombre.trim()) {
      setLocalError("Completá el nombre del paciente.");
      return;
    }
    if (!isStaff && patientMode === "existing" && !patientId) {
      setLocalError("Elegí un paciente existente.");
      return;
    }
    const normalizedPhone = whatsappPhone.trim() ? normalizeCrPhone(whatsappPhone) : null;
    if (whatsappPhone.trim() && !normalizedPhone) {
      setLocalError("El número de WhatsApp no parece válido — usá los 8 dígitos costarricenses.");
      return;
    }
    setLoading(true);
    try {
      const result = await callAdminAccounts("invite", {
        email: email.trim(),
        nombre: nombre.trim(),
        genericPassword: metodo === "generic",
        ...(normalizedPhone ? { whatsappPhone: normalizedPhone } : {}),
        ...(isStaff
          ? { accountType: "profesional", especialidad: especialidad.trim() }
          : {
              relation: accountType,
              ...(patientMode === "existing" ? { patientId } : patientMode === "new" ? { patientNombre: patientNombre.trim(), patientEdad: patientEdad.trim() } : {}),
            }),
      });
      const successMsg =
        metodo === "generic"
          ? `Cuenta creada con la contraseña provisional "${result?.provisionalPassword}". Le pedirá confirmar el correo y cambiarla al entrar.${result?.warning ? ` (${result.warning})` : ""}`
          : (result?.warning ?? "Cuenta creada. Le enviamos una invitación por correo.");
      onCreated(successMsg);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos crear la cuenta.";
      setLocalError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} size="lg">
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Crear cuenta</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        {metodo === "generic"
          ? "Se crea con una contraseña provisional generada al momento — te la mostramos acá al confirmar, para que se la compartas en persona."
          : "Le enviamos un correo de invitación. Va a poder entrar en cuanto confirme y elija una contraseña."}
      </p>

      <div className="grid grid-cols-1 gap-4.5">
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Tipo de cuenta</p>
          <PillToggle
            value={accountType}
            onChange={setAccountType}
            options={[
              { value: "familiar_admin", label: "Familiar" },
              { value: "participante", label: "Paciente" },
              { value: "profesional", label: "Equipo clínico" },
            ]}
          />
        </div>

        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Cómo entra</p>
          <PillToggle
            value={metodo}
            onChange={setMetodo}
            options={[
              { value: "invite", label: "Invitación por correo" },
              { value: "generic", label: "Contraseña provisional (presencial)" },
            ]}
          />
        </div>

        {isStaff ? (
          <FormField label="Especialidad" type="text" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
        ) : (
          <>
            <div>
              <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Paciente</p>
              <PillToggle value={patientMode} onChange={setPatientMode} options={patientModeOptions} />
            </div>

            {patientMode === "existing" && (
              <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
                Cuál
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full min-w-0 min-h-13 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[17px] text-tinta"
                >
                  {existingPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {patientMode === "new" && (
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
                <FormField label="Nombre del paciente" type="text" value={patientNombre} onChange={(e) => setPatientNombre(e.target.value)} />
                <FormField label="Edad" type="text" value={patientEdad} onChange={(e) => setPatientEdad(e.target.value)} />
              </div>
            )}
          </>
        )}

        <FormField label="Nombre de la persona" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <FormField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@correo.com"
        />

        {!isStaff && (
          <label className="grid grid-cols-1 gap-2 text-[15px] font-semibold text-tinta-suave">
            WhatsApp (opcional)
            <input
              type="text"
              inputMode="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="8888 8888"
              className="w-full min-w-0 min-h-13 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[17px] text-tinta"
            />
            <span className="text-[13px] font-normal text-tinta-tenue">Ahí le llegan los recordatorios de las actividades asignadas.</span>
          </label>
        )}

        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}

        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={loading}>
            {loading ? "Creando…" : "Crear e invitar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
