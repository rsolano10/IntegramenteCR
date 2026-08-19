import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { planTiers } from "../../lib/mockData";

export interface PatientLink {
  profile_id: string;
  nombre: string;
  role: "familiar" | "paciente" | "profesional";
  relation: "familiar_admin" | "participante" | "profesional_asignado";
}

export interface PatientRow {
  id: string;
  nombre: string;
  edad: string | null;
  modalidad: string;
  plan_status: "pendiente" | "asignado";
  onboarding_complete: boolean;
  created_at: string;
  overall: string | null;
  links: PatientLink[];
}

interface ManagedAccount {
  id: string;
  email: string;
  nombre: string;
  role: "familiar" | "paciente" | "profesional";
}

const relationLabel: Record<string, string> = {
  familiar_admin: "Familiar administrador",
  participante: "Participante",
  profesional_asignado: "Clínica",
};

export function PatientDetailModal({
  patient,
  onClose,
  onChanged,
}: {
  patient: PatientRow;
  onClose: () => void;
  onChanged: (message: string, isError?: boolean) => void;
}) {
  const [nombre, setNombre] = useState(patient.nombre);
  const [edad, setEdad] = useState(patient.edad ?? "");
  const [modalidad, setModalidad] = useState(patient.modalidad);
  const [planStatus, setPlanStatus] = useState(patient.plan_status);
  const [saving, setSaving] = useState(false);
  const [linkBusy, setLinkBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [localError, setLocalError] = useState("");

  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
    enabled: linkPickerOpen,
  });

  async function saveBasics() {
    setLocalError("");
    if (!nombre.trim()) {
      setLocalError("El nombre no puede quedar vacío.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("patients")
      .update({ nombre: nombre.trim(), edad: edad.trim() || null, modalidad, plan_status: planStatus })
      .eq("id", patient.id);
    setSaving(false);
    if (error) {
      setLocalError(error.message);
      return;
    }
    onChanged("Datos del paciente actualizados.");
  }

  async function unlink(link: PatientLink) {
    setLinkBusy(`${link.profile_id}-${link.relation}`);
    const { error } = await supabase
      .from("patient_links")
      .delete()
      .match({ patient_id: patient.id, profile_id: link.profile_id, relation: link.relation });
    setLinkBusy(null);
    if (error) {
      onChanged(error.message, true);
      return;
    }
    onChanged(`${link.nombre} ya no está vinculado a ${patient.nombre}.`);
    onClose();
  }

  async function deletePatient() {
    setSaving(true);
    const { error } = await supabase.from("patients").delete().eq("id", patient.id);
    setSaving(false);
    if (error) {
      onChanged(error.message, true);
      return;
    }
    onChanged(`${patient.nombre} fue eliminado.`);
    onClose();
  }

  const linkedProfileIds = new Set(patient.links.map((l) => l.profile_id));
  const linkableAccounts = (accounts ?? []).filter((a) => !linkedProfileIds.has(a.id));

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">{patient.nombre}</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Datos básicos y cuentas vinculadas.</p>

      <div className="grid gap-4.5 mb-6">
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Edad
            <input
              type="text"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Modalidad
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            >
              {planTiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Estado del plan
            <select
              value={planStatus}
              onChange={(e) => setPlanStatus(e.target.value as "pendiente" | "asignado")}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            >
              <option value="pendiente">Pendiente</option>
              <option value="asignado">Asignado</option>
            </select>
          </label>
        </div>
        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}
        <Button variant="ink" dense onClick={saveBasics} disabled={saving} className="justify-self-start">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      <div className="pt-5 border-t border-[#efeada]">
        <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">Cuentas vinculadas</p>
        <div className="grid gap-2 mb-3">
          {patient.links.length === 0 && <p className="m-0 text-sm text-tinta-tenue">Sin cuentas vinculadas todavía.</p>}
          {patient.links.map((l) => (
            <div key={`${l.profile_id}-${l.relation}`} className="flex items-center justify-between gap-3 bg-campo rounded-xl px-3.5 py-2.5">
              <span className="text-[14px] text-tinta">
                {l.nombre} <span className="text-tinta-tenue">· {relationLabel[l.relation]}</span>
              </span>
              <button
                type="button"
                onClick={() => unlink(l)}
                disabled={linkBusy === `${l.profile_id}-${l.relation}`}
                className="text-[13px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer disabled:opacity-60"
              >
                Desvincular
              </button>
            </div>
          ))}
        </div>

        {!linkPickerOpen ? (
          <Button variant="secondary" dense onClick={() => setLinkPickerOpen(true)}>
            Vincular cuenta existente
          </Button>
        ) : (
          <LinkAccountPicker
            patientId={patient.id}
            accounts={linkableAccounts}
            onLinked={(msg) => {
              setLinkPickerOpen(false);
              onChanged(msg);
              onClose();
            }}
            onCancel={() => setLinkPickerOpen(false)}
          />
        )}
      </div>

      <div className="pt-5 mt-5 border-t border-[#efeada]">
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-[14px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer">
            Eliminar paciente
          </button>
        ) : (
          <div className="bg-alerta rounded-xl p-4">
            <p className="m-0 mb-3 text-[14px] text-alerta-texto">
              Esto borra a {patient.nombre} y toda su información asociada (plan, mensajes, cuestionario). No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" dense onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button variant="urgency" dense onClick={deletePatient} disabled={saving}>
                Sí, eliminar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function LinkAccountPicker({
  patientId,
  accounts,
  onLinked,
  onCancel,
}: {
  patientId: string;
  accounts: ManagedAccount[];
  onLinked: (msg: string) => void;
  onCancel: () => void;
}) {
  const [profileId, setProfileId] = useState(accounts[0]?.id ?? "");
  const [relation, setRelation] = useState<"familiar_admin" | "participante" | "profesional_asignado">("familiar_admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!profileId) {
      setError("Elegí una cuenta.");
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase.from("patient_links").insert({ patient_id: patientId, profile_id: profileId, relation });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const account = accounts.find((a) => a.id === profileId);
    onLinked(`${account?.nombre ?? "Cuenta"} vinculada.`);
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-campo rounded-xl p-4">
        <p className="m-0 text-sm text-tinta-tenue">No hay más cuentas disponibles para vincular. Creá una desde Cuentas.</p>
        <button type="button" onClick={onCancel} className="mt-2 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-campo rounded-xl p-4 grid gap-3">
      <label className="grid gap-1.5 text-[14px] font-semibold text-[#3b4c51]">
        Cuenta
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[15px] text-tinta"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.email})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-[14px] font-semibold text-[#3b4c51]">
        Vínculo
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value as typeof relation)}
          className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[15px] text-tinta"
        >
          <option value="familiar_admin">Familiar administrador</option>
          <option value="participante">Participante</option>
          <option value="profesional_asignado">Clínica</option>
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
