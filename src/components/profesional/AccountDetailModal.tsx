import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
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
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);

  const hasPatientLink = account.links.some((l) => l.relation === "familiar_admin" || l.relation === "participante");
  // Una cuenta profesional no se "vincula a un paciente" desde acá — su
  // relación (profesional_asignado) es un concepto distinto, ya cubierto
  // por el roster de Pacientes.
  const showLinkSection = account.role !== "profesional" && !hasPatientLink;

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase.rpc("list_patients");
      if (fetchError) throw fetchError;
      return data as { id: string; nombre: string }[];
    },
    enabled: linkPickerOpen,
  });

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
    <Modal onClose={onClose} size="lg">
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
            <div className="grid grid-cols-1 gap-2.5">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full min-w-0 min-h-11 px-3 rounded-lg border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta"
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
        <div className="grid grid-cols-1 gap-3">
          <PillToggle value={role} onChange={setRole} options={roleOptions} />
          {role === "profesional" && (
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              placeholder="Especialidad"
              className="w-full min-w-0 min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[15px] text-tinta"
            />
          )}
          <Button
            variant="secondary"
            dense
            onClick={saveRole}
            disabled={busy === "role" || (role === account.role && especialidad.trim() === (account.especialidad ?? ""))}
            className="justify-self-start"
          >
            {busy === "role" ? "Guardando…" : "Guardar rol"}
          </Button>
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-borde-suave">
        <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Pacientes vinculados</p>
        {account.links.length === 0 ? (
          <p className="m-0 text-sm text-tinta-tenue">Ninguno todavía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {account.links.map((l) => (
              <button
                key={l.patient_id}
                type="button"
                onClick={() => onViewPatient?.(l.patient_id)}
                disabled={!onViewPatient}
                className="text-left bg-campo rounded-xl px-3.5 py-2.5 text-[14px] text-tinta cursor-pointer hover:bg-borde-suave disabled:cursor-default disabled:hover:bg-campo"
              >
                {l.patient_nombre} <span className="text-tinta-tenue">· {relationLabel[l.relation]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showLinkSection && (
        <div className="pt-5 mt-5 border-t border-borde-suave">
          <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Vincular a paciente</p>
          {!linkPickerOpen ? (
            <Button variant="secondary" dense onClick={() => setLinkPickerOpen(true)}>
              Vincular a un paciente
            </Button>
          ) : (
            <LinkPatientPicker
              profileId={account.id}
              defaultRelation={account.role === "familiar" ? "familiar_admin" : "participante"}
              patients={patients ?? []}
              onLinked={(msg) => {
                setLinkPickerOpen(false);
                onChanged(msg);
                onClose();
              }}
              onCancel={() => setLinkPickerOpen(false)}
            />
          )}
        </div>
      )}

      {error && <p className="m-0 mt-4 text-[14px] text-alerta-texto">{error}</p>}
    </Modal>
  );
}

// Simétrico a LinkAccountPicker en PatientDetailModal.tsx (misma escritura
// directa a patient_links, misma política RLS "patient_links: profesional
// insert") — a propósito no ofrece "crear paciente nuevo" inline, mismo
// alcance que su contraparte (que tampoco crea cuentas nuevas).
function LinkPatientPicker({
  profileId,
  defaultRelation,
  patients,
  onLinked,
  onCancel,
}: {
  profileId: string;
  defaultRelation: "familiar_admin" | "participante";
  patients: { id: string; nombre: string }[];
  onLinked: (msg: string) => void;
  onCancel: () => void;
}) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [relation, setRelation] = useState<"familiar_admin" | "participante">(defaultRelation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!patientId) {
      setError("Elegí un paciente.");
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase.from("patient_links").insert({ patient_id: patientId, profile_id: profileId, relation });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const patient = patients.find((p) => p.id === patientId);
    onLinked(`Vinculado${patient ? ` a ${patient.nombre}` : ""}.`);
  }

  if (patients.length === 0) {
    return (
      <div className="bg-campo rounded-xl p-4">
        <p className="m-0 text-sm text-tinta-tenue">No hay pacientes disponibles todavía. Creá uno desde Pacientes.</p>
        <button type="button" onClick={onCancel} className="mt-2 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-campo rounded-xl p-4 grid grid-cols-1 gap-3">
      <label className="grid grid-cols-1 gap-1.5 text-[14px] font-semibold text-tinta-suave">
        Paciente
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full min-w-0 min-h-11 px-3 rounded-lg border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="grid grid-cols-1 gap-1.5 text-[14px] font-semibold text-tinta-suave">
        Vínculo
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value as typeof relation)}
          className="w-full min-w-0 min-h-11 px-3 rounded-lg border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta"
        >
          <option value="familiar_admin">Familiar administrador</option>
          <option value="participante">Participante</option>
        </select>
      </label>
      {error && <p className="m-0 text-[13px] text-alerta-texto">{error}</p>}
      <div className="flex gap-2.5">
        <Button variant="secondary" dense onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="ink" dense onClick={submit} disabled={loading}>
          {loading ? "Vinculando…" : "Vincular"}
        </Button>
      </div>
    </div>
  );
}
