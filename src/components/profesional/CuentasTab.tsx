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

// The secondary half of Usuarios — clinic/admin accounts, and any
// familiar/paciente account invited but not yet attached to a patient. Both
// are things you look at, almost never act on, so this stays a couple of
// quiet lists instead of PacientesTab's full filter/sort/card grid.
export function CuentasTab({
  patients,
  onChanged,
  onOpenAccount,
}: {
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
  const staff = (accounts ?? []).filter((a) => a.role === "profesional");

  function AccountRow({ a }: { a: ManagedAccount }) {
    const confirmed = !!a.email_confirmed_at;
    return (
      <div
        onClick={() => onOpenAccount(a)}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-campo hover:bg-borde-suave cursor-pointer transition-colors"
      >
        <div className="min-w-0">
          <p className="m-0 font-bold text-tinta truncate">{a.nombre}</p>
          <p className="m-0 text-[13px] text-tinta-tenue truncate">
            {a.email}
            {a.especialidad ? ` · ${a.especialidad}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!a.is_active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-white text-tinta-tenue">Desactivada</span>
          ) : confirmed ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-verde-serenidad/15 text-verde-profundo">Confirmado</span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-aviso text-semaforo-amarillo-texto">Pendiente</span>
          )}
          <div onClick={(e) => e.stopPropagation()}>
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

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-7 grid grid-cols-1 gap-6">
      {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
      {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar las cuentas.</p>}

      {!isLoading && (
        <div className={orphans.length > 0 ? "rounded-2xl border-[1.5px] border-riesgo-borde bg-riesgo/40 p-4" : "rounded-2xl border border-borde-suave p-4"}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className={`m-0 mb-0.5 text-[13px] font-bold ${orphans.length > 0 ? "text-riesgo-texto" : "text-tinta-suave"}`}>
                Cuentas sin paciente asignado{orphans.length > 0 ? ` (${orphans.length})` : ""}
              </p>
              <p className={`m-0 text-[12.5px] ${orphans.length > 0 ? "text-riesgo-texto/80" : "text-tinta-tenue"}`}>
                {orphans.length > 0 ? "Invitadas, pero todavía no vinculadas a ningún paciente." : "Ninguna por ahora."}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setCreateFor("familiar_admin")} className="shrink-0">
              + Invitar cuenta
            </Button>
          </div>
          {orphans.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {orphans.map((a) => (
                <AccountRow key={a.id} a={a} />
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="m-0 mb-0.5 text-[11px] uppercase tracking-[0.1em] text-tinta-tenue font-semibold">Equipo y administración</p>
            <p className="m-0 text-[13px] text-tinta-tenue">Cuentas de la clínica — casi nunca vas a necesitar tocar esto.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCreateFor("profesional")} className="shrink-0">
            + Agregar cuenta
          </Button>
        </div>
        {!isLoading && staff.length === 0 ? (
          <p className="m-0 text-sm text-tinta-tenue">Ninguna cuenta de clínica todavía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {staff.map((a) => (
              <AccountRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>

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
