import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { planTiers } from "../../../lib/mockData";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { PillToggle } from "../../ui/PillToggle";
import { FormField } from "../../ui/FormField";

export function NewPatientModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: () => void; onError: (msg: string) => void }) {
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [modalidad, setModalidad] = useState("orientado");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit() {
    setLocalError("");
    if (!nombre.trim()) {
      setLocalError("Ingresá el nombre del paciente.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("create_patient", { p_nombre: nombre.trim(), p_edad: edad.trim() || null, p_modalidad: modalidad });
    setLoading(false);
    if (error) {
      setLocalError(error.message);
      onError(error.message);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Nuevo paciente</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Podés vincular cuentas (familiar/participante) después, desde "Ver detalle".</p>
      <div className="grid grid-cols-1 gap-4.5">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
          <FormField label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <FormField label="Edad" type="text" value={edad} onChange={(e) => setEdad(e.target.value)} />
        </div>
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Modalidad</p>
          <PillToggle value={modalidad} onChange={setModalidad} options={planTiers.map((t) => ({ value: t.id, label: t.nombre }))} />
        </div>
        {localError && <p className="m-0 text-[14px] text-alerta-texto">{localError}</p>}
        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={loading}>
            {loading ? "Creando…" : "Crear paciente"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
