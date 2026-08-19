import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PillToggle } from "../ui/PillToggle";
import { callAdminAccounts, relationLabel, roleLabel, type AppRole, type ManagedAccount } from "../../lib/adminAccounts";

const roleOptions: { value: AppRole; label: string }[] = [
  { value: "familiar", label: roleLabel.familiar },
  { value: "paciente", label: roleLabel.paciente },
  { value: "profesional", label: roleLabel.profesional },
];

export function AccountDetailModal({
  account,
  onClose,
  onChanged,
  onViewPatient,
}: {
  account: ManagedAccount;
  onClose: () => void;
  onChanged: (message: string, isError?: boolean) => void;
  onViewPatient?: (patientId: string) => void;
}) {
  const confirmed = !!account.email_confirmed_at;

  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(account.email);
  const [role, setRole] = useState<AppRole>(account.role);
  const [especialidad, setEspecialidad] = useState(account.especialidad ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function resend() {
    setError("");
    setBusy("resend");
    try {
      await callAdminAccounts("resend", { userId: account.id });
      onChanged("Confirmación reenviada.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos reenviar.");
    } finally {
      setBusy(null);
    }
  }

  async function saveEmail() {
    setError("");
    if (!newEmail.trim() || newEmail.trim() === account.email) {
      setError("Ingresá un correo distinto al actual.");
      return;
    }
    setBusy("email");
    try {
      const result = await callAdminAccounts("update_email", { userId: account.id, newEmail: newEmail.trim() });
      onChanged(result?.warning ?? "Correo actualizado y confirmación reenviada.", !!result?.warning);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar el correo.");
    } finally {
      setBusy(null);
    }
  }

  async function saveRole() {
    setError("");
    setBusy("role");
    try {
      const result = await callAdminAccounts("update_role", {
        userId: account.id,
        role,
        ...(role === "profesional" ? { especialidad: especialidad.trim() } : {}),
      });
      onChanged(result?.warning ?? "Rol actualizado.", !!result?.warning);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cambiar el rol.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1">{account.nombre}</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">{account.email}</p>

      {!confirmed && (
        <div className="bg-aviso rounded-xl p-4 mb-5">
          <p className="m-0 mb-3 text-[14px] font-semibold text-semaforo-amarillo-texto">Pendiente de confirmar</p>
          {!editingEmail ? (
            <div className="flex gap-2.5 flex-wrap">
              <Button variant="secondary" dense onClick={resend} disabled={busy === "resend"}>
                {busy === "resend" ? "Reenviando…" : "Reenviar confirmación"}
              </Button>
              <Button variant="secondary" dense onClick={() => setEditingEmail(true)}>
                Corregir correo
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[15px] text-tinta"
              />
              <div className="flex gap-2.5">
                <Button variant="secondary" dense onClick={() => setEditingEmail(false)}>
                  Cancelar
                </Button>
                <Button variant="ink" dense onClick={saveEmail} disabled={busy === "email"}>
                  {busy === "email" ? "Guardando…" : "Guardar y reenviar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-1">
        <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Rol</p>
        <div className="grid gap-3">
          <PillToggle value={role} onChange={setRole} options={roleOptions} />
          {role === "profesional" && (
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              placeholder="Especialidad"
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[15px] text-tinta"
            />
          )}
          <Button variant="secondary" dense onClick={saveRole} disabled={busy === "role" || role === account.role} className="justify-self-start">
            {busy === "role" ? "Guardando…" : "Guardar rol"}
          </Button>
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-[#efeada]">
        <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Pacientes vinculados</p>
        {account.links.length === 0 ? (
          <p className="m-0 text-sm text-tinta-tenue">Ninguno todavía.</p>
        ) : (
          <div className="grid gap-2">
            {account.links.map((l) => (
              <button
                key={l.patient_id}
                type="button"
                onClick={() => onViewPatient?.(l.patient_id)}
                disabled={!onViewPatient}
                className="text-left bg-campo rounded-xl px-3.5 py-2.5 text-[14px] text-tinta cursor-pointer hover:bg-[#efeada] disabled:cursor-default disabled:hover:bg-campo"
              >
                {l.patient_nombre} <span className="text-tinta-tenue">· {relationLabel[l.relation]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="m-0 mt-4 text-[14px] text-alerta-texto">{error}</p>}
    </Modal>
  );
}
