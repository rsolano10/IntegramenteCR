import { Modal } from "./Modal";
import { emergencyContacts } from "../../lib/mockData";

export function EmergencyContactsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Contactos de emergencia</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Guardados acá para encontrarlos rápido si hacen falta.</p>
      <div className="grid gap-3">
        {emergencyContacts.map((c) => (
          <div key={c.id} className="bg-alerta rounded-2xl p-4.5">
            <p className="m-0 mb-1 text-[13px] font-bold text-alerta-texto">{c.label}</p>
            <p className="m-0 font-serif text-2xl text-tinta">{c.value}</p>
            {c.note && <p className="m-0 mt-1 text-[13px] text-[#6e4436]">{c.note}</p>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
