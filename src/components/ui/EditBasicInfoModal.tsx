import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ChipToggle } from "./ChipToggle";
import { PillToggle } from "./PillToggle";
import { FormField } from "./FormField";
import { useAppStore, type Modalidad } from "../../lib/store";
import { getPatientName, getPatientAge } from "../../lib/patient";
import { questions, resolveOptions } from "../../lib/onboardingSchema";

const modalidadOptions: { value: Modalidad; label: string }[] = [
  { value: "autoguiado", label: "Autoguiado" },
  { value: "orientado", label: "Orientado" },
  { value: "clinico", label: "Clínico" },
];

const interestsQuestion = questions.find((q) => q.id === "intereses_actuales")!;

export function EditBasicInfoModal({ onClose }: { onClose: () => void }) {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const modalidad = useAppStore((s) => s.modalidad);
  const updateBasicInfo = useAppStore((s) => s.updateBasicInfo);

  const [nombre, setNombre] = useState(getPatientName(onboarding2));
  const [edad, setEdad] = useState(getPatientAge(onboarding2));
  const [modalidadValue, setModalidadValue] = useState<Modalidad>(modalidad);
  const rawInterests = Array.isArray(onboarding2.intereses_actuales) ? onboarding2.intereses_actuales : [];
  const [intereses, setIntereses] = useState<string[]>(rawInterests.filter((v) => v !== "otra" && v !== "poco_interes" && v !== "no_se"));

  const interestOpts = resolveOptions(interestsQuestion, onboarding2).filter((o) => !["otra", "poco_interes", "no_se"].includes(o.value));

  function toggleInterest(v: string) {
    setIntereses((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function submit() {
    updateBasicInfo({
      nombre: nombre.trim() || getPatientName(onboarding2),
      edad: edad.trim() || getPatientAge(onboarding2),
      modalidad: modalidadValue,
      intereses,
    });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Editar datos básicos</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        Este cambio se actualiza en la vista familiar, la vista de participante y el panel clínico.
      </p>
      <div className="grid grid-cols-1 gap-4">
        <FormField label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <FormField label="Edad" type="text" value={edad} onChange={(e) => setEdad(e.target.value)} className="max-w-[120px]" />
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Modalidad</p>
          <PillToggle value={modalidadValue} onChange={setModalidadValue} options={modalidadOptions} />
        </div>
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Intereses</p>
          <div className="flex flex-wrap gap-2">
            {interestOpts.map((o) => (
              <ChipToggle key={o.value} active={intereses.includes(o.value)} onToggle={() => toggleInterest(o.value)}>
                {o.label}
              </ChipToggle>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="ink" onClick={submit}>
          Guardar cambios
        </Button>
      </div>
    </Modal>
  );
}
