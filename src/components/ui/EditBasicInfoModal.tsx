import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ChipToggle } from "./ChipToggle";
import { useAppStore, type Modalidad } from "../../lib/store";
import { getPatientName, getPatientAge } from "../../lib/patient";
import { questions, resolveOptions } from "../../lib/onboardingSchema";

const modalidadOptions: { value: Modalidad; label: string }[] = [
  { value: "autoguiado", label: "Autoguiado" },
  { value: "orientado", label: "Orientado" },
  { value: "clinico", label: "Clínico" },
];

const interestsQuestion = questions.find((q) => q.id === "persona2_actividades")!;

export function EditBasicInfoModal({ onClose }: { onClose: () => void }) {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const modalidad = useAppStore((s) => s.modalidad);
  const updateBasicInfo = useAppStore((s) => s.updateBasicInfo);

  const [nombre, setNombre] = useState(getPatientName(onboarding2));
  const [edad, setEdad] = useState(getPatientAge(onboarding2));
  const [modalidadValue, setModalidadValue] = useState<Modalidad>(modalidad);
  const rawInterests = Array.isArray(onboarding2.persona2_actividades) ? onboarding2.persona2_actividades : [];
  const [intereses, setIntereses] = useState<string[]>(rawInterests);

  const interestOpts = resolveOptions(interestsQuestion, onboarding2).filter((o) => o.value !== "otro");

  function toggleInterest(v: string) {
    setIntereses((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function submit() {
    updateBasicInfo({
      nombre: nombre.trim() || "Rosa Jiménez",
      edad: edad.trim() || "79",
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
      <div className="grid gap-4">
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
            className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta max-w-[120px]"
          />
        </label>
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Modalidad</p>
          <div className="grid grid-cols-3 gap-2">
            {modalidadOptions.map((o) => {
              const active = modalidadValue === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setModalidadValue(o.value)}
                  className={`min-h-11 rounded-xl border-[1.5px] font-sans text-sm font-semibold cursor-pointer ${
                    active ? "border-verde-serenidad bg-verde-serenidad text-white" : "border-borde bg-white text-tinta"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="m-0 mb-2 text-[15px] font-semibold text-[#3b4c51]">Intereses</p>
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
