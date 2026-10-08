import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../ui/Button";
import type { PatientLink, PatientRow } from "../../../lib/patients";

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

export function VinculosTab({ patient, onChanged }: { patient: PatientRow; onChanged: (message: string, isError?: boolean) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_managed_accounts");
      if (error) throw error;
      return data as ManagedAccount[];
    },
    enabled: pickerOpen,
  });

  async function unlink(link: PatientLink) {
    setBusy(`${link.profile_id}-${link.relation}`);
    const { error } = await supabase.from("patient_links").delete().match({ patient_id: patient.id, profile_id: link.profile_id, relation: link.relation });
    setBusy(null);
    if (error) onChanged("No pudimos desvincular la cuenta.", true);
    else onChanged(`${link.nombre} ya no está vinculado a ${patient.nombre}.`);
  }

  const linked = new Set(patient.links.map((l) => l.profile_id));
  const linkable = (accounts ?? []).filter((a) => !linked.has(a.id));

  return (
    <section className="bg-white border border-borde rounded-3xl p-5 sm:p-6 max-w-[760px] grid gap-3">
      {patient.links.length === 0 && <p className="m-0 text-[14.5px] text-tinta-tenue">Sin cuentas vinculadas todavía.</p>}
      {patient.links.map((l) => (
        <div key={`${l.profile_id}-${l.relation}`} className="flex items-center justify-between gap-3 bg-campo rounded-2xl px-4 py-3">
          <span className="text-[14.5px] text-tinta">
            <strong className="font-semibold">{l.nombre}</strong> <span className="text-tinta-tenue">· {relationLabel[l.relation]}</span>
          </span>
          <button
            type="button"
            onClick={() => unlink(l)}
            disabled={busy === `${l.profile_id}-${l.relation}`}
            className="text-[13px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer bg-transparent border-none disabled:opacity-60"
          >
            Desvincular
          </button>
        </div>
      ))}
      {!pickerOpen ? (
        <Button variant="secondary" dense onClick={() => setPickerOpen(true)} className="justify-self-start mt-1">
          Vincular cuenta existente
        </Button>
      ) : (
        <LinkPicker
          patientId={patient.id}
          accounts={linkable}
          onDone={(msg) => {
            setPickerOpen(false);
            if (msg) onChanged(msg);
          }}
        />
      )}
    </section>
  );
}

function LinkPicker({ patientId, accounts, onDone }: { patientId: string; accounts: ManagedAccount[]; onDone: (msg?: string) => void }) {
  const [profileId, setProfileId] = useState("");
  const [relation, setRelation] = useState<"familiar_admin" | "participante" | "profesional_asignado">("familiar_admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectCls = "w-full min-w-0 min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta";

  async function submit() {
    const id = profileId || accounts[0]?.id;
    if (!id) return;
    setError("");
    setLoading(true);
    const { error: insertError } = await supabase.from("patient_links").insert({ patient_id: patientId, profile_id: id, relation });
    setLoading(false);
    if (insertError) {
      setError("No pudimos vincular la cuenta.");
      return;
    }
    onDone(`${accounts.find((a) => a.id === id)?.nombre ?? "Cuenta"} vinculada.`);
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-campo rounded-2xl p-4">
        <p className="m-0 text-[14px] text-tinta-tenue">No hay más cuentas para vincular. Creá una desde Usuarios.</p>
        <button type="button" onClick={() => onDone()} className="mt-2 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-campo rounded-2xl p-4 grid gap-3">
      <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
        Cuenta
        <select value={profileId || accounts[0].id} onChange={(e) => setProfileId(e.target.value)} className={selectCls}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.email})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
        Vínculo
        <select value={relation} onChange={(e) => setRelation(e.target.value as typeof relation)} className={selectCls}>
          <option value="familiar_admin">Familiar administrador</option>
          <option value="participante">Participante</option>
          <option value="profesional_asignado">Clínica</option>
        </select>
      </label>
      {error && <p className="m-0 text-[13px] text-alerta-texto">{error}</p>}
      <div className="flex gap-2.5">
        <Button variant="secondary" dense onClick={() => onDone()}>
          Cancelar
        </Button>
        <Button variant="ink" dense onClick={submit} disabled={loading}>
          {loading ? "Vinculando…" : "Vincular"}
        </Button>
      </div>
    </div>
  );
}
