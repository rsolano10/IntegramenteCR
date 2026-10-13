import { Modal } from "./Modal";
import { BotonWhatsApp } from "./BotonWhatsApp";
import { waEquipo } from "../../lib/whatsapp";

const canales: { titulo: string; valor: string }[] = [
  { titulo: "Correo", valor: "info@integramente.com" },
  { titulo: "Teléfono", valor: "+506 8343 5772" },
  { titulo: "WhatsApp", valor: "+506 8346 4703" },
];

// WhatsApp es el único canal con el equipo (cuenta, programa, pagos y
// dudas del cuidado). Correo y teléfono quedan como alternativa. Las
// urgencias van por el botón SOS.
export function ContactanosModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Contactanos</h2>
      <p className="m-0 mb-4 text-[14.5px] leading-relaxed text-tinta-tenue">
        Para dudas sobre el cuidado, tu cuenta, el programa o cómo funciona la app, escribinos por WhatsApp.
      </p>
      <BotonWhatsApp href={waEquipo()} fullWidth className="mb-5" />
      <div className="grid gap-3 mb-5">
        {canales.map((c) => (
          <div key={c.titulo} className="rounded-2xl bg-campo border border-borde-suave px-4.5 py-4">
            <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue font-semibold">{c.titulo}</p>
            <p className="m-0 mt-1 font-serif text-[22px] text-tinta select-all">{c.valor}</p>
          </div>
        ))}
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed text-tinta-suave">
        ¿Una duda rápida del día a día? Probá <strong>Respuestas rápidas</strong> en Ayuda. ¿Una urgencia? Usá el botón{" "}
        <strong className="text-alerta-texto">SOS</strong> de arriba.
      </p>
    </Modal>
  );
}
