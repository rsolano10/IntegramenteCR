import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { useMyPatient } from "../../lib/useMyPatient";
import { planTiers } from "../../lib/mockData";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { PillToggle } from "./PillToggle";

const modalidadOptions = planTiers.map((t) => ({ value: t.id, label: t.nombre }));

export function MiPerfilModal({ onClose, isSelf = false }: { onClose: () => void; isSelf?: boolean }) {
  const session = useSession();
  const { data: myPatient } = useMyPatient();
  const queryClient = useQueryClient();

  const email = session.status === "authed" ? session.session.user.email ?? "" : "";
  const [nombre, setNombre] = useState(session.status === "authed" ? session.profile.nombre : "");
  const [patientNombre, setPatientNombre] = useState(myPatient?.nombre ?? "");
  const [patientEdad, setPatientEdad] = useState(myPatient?.edad ?? "");
  const [modalidad, setModalidad] = useState(myPatient?.modalidad ?? "orientado");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (session.status !== "authed") return;
    setError("");
    if (!nombre.trim()) {
      setError("Tu nombre no puede quedar vacío.");
      return;
    }
    setSaving(true);

    const { error: profileError } = await supabase.from("profiles").update({ nombre: nombre.trim() }).eq("id", session.session.user.id);
    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    if (myPatient) {
      const { error: patientError } = await supabase
        .from("patients")
        .update({ nombre: patientNombre.trim() || myPatient.nombre, edad: patientEdad.trim() || null, modalidad })
        .eq("id", myPatient.id);
      if (patientError) {
        setSaving(false);
        setError(patientError.message);
        return;
      }
    }

    // useSession() only re-reads profiles on an auth state change, not on a
    // plain DB write — force one so the header picks up the new name right
    // away instead of waiting for the next token refresh or reload.
    await supabase.auth.refreshSession();
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["my-patient", session.session.user.id] });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Mi perfil</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        Datos de tu cuenta{myPatient ? (isSelf ? " y de tu perfil" : " y de tu familiar") : ""}.
      </p>

      <div className="grid gap-4.5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Tu nombre
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
          />
        </label>
        <div>
          <p className="m-0 mb-1 text-[15px] font-semibold text-[#3b4c51]">Correo</p>
          <p className="m-0 text-[15px] text-tinta-tenue">{email}</p>
        </div>

        {myPatient && (
          <>
            <div className="pt-4 border-t border-[#efeada]">
              <p className="m-0 mb-3 text-[13px] tracking-[0.1em] uppercase text-tinta-tenue">{isSelf ? "Tus datos" : "Datos de tu familiar"}</p>
              <div className="grid gap-4">
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                  <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                    Nombre
                    <input
                      type="text"
                      value={patientNombre}
                      onChange={(e) => setPatientNombre(e.target.value)}
                      className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
                    />
                  </label>
                  <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
                    Edad
                    <input
                      type="text"
                      value={patientEdad}
                      onChange={(e) => setPatientEdad(e.target.value)}
                      className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
                    />
                  </label>
                </div>
                <div>
                  <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Modalidad</p>
                  <PillToggle value={modalidad} onChange={setModalidad} options={modalidadOptions} />
                </div>
              </div>
            </div>
            <Button variant="secondary" dense onClick={() => window.location.assign("/app/perfil/resumen")} className="justify-self-start">
              Ver el cuestionario completo →
            </Button>
          </>
        )}

        {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}

        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
