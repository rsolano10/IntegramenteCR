import { Modal } from "./Modal";

const canales: { titulo: string; valor: string }[] = [
  { titulo: "Correo", valor: "info@integramente.com" },
  { titulo: "Teléfono", valor: "+506 8343 5772" },
];

// Dudas sobre la cuenta, el programa o pagos — no clínicas (esas van a tu
// profesional en Ayuda) ni urgencias (botón SOS).
export function ContactanosModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Contactanos</h2>
      <p className="m-0 mb-5 text-[14.5px] leading-relaxed text-tinta-tenue">
        Para dudas sobre tu cuenta, el programa o cómo funciona la app.
      </p>
      <div className="grid gap-3 mb-5">
        {canales.map((c) => (
          <div key={c.titulo} className="rounded-2xl bg-campo border border-borde-suave px-4.5 py-4">
            <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue font-semibold">{c.titulo}</p>
            <p className="m-0 mt-1 font-serif text-[22px] text-tinta select-all">{c.valor}</p>
          </div>
        ))}
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
        ¿Una duda sobre el cuidado o las actividades? Escribile a tu profesional desde <strong>Ayuda</strong>. ¿Una urgencia? Usá el botón{" "}
        <strong className="text-alerta-texto">SOS</strong> de arriba.
      </p>
    </Modal>
  );
}
