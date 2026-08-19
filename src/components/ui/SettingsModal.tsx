import { Modal } from "./Modal";
import { RadioRow } from "./CheckRow";
import { useAppStore } from "../../lib/store";

// Home for the risk-notification preference that used to live as a
// mandatory checkbox in the consent screen — moved here so it reads as an
// ongoing setting instead of a one-time decision made before anyone has
// even met the app.
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const notify = useAppStore((s) => s.notify);
  const setNotify = useAppStore((s) => s.setNotify);

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Configuraciones</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Podés cambiar esto cuando quieras.</p>
      <p className="m-0 mb-3 text-[15px] font-semibold text-[#3b4c51]">
        Si el sistema detecta una señal de riesgo, ¿querés que se avise a la profesional asignada?
      </p>
      <div className="grid gap-2.5">
        <RadioRow checked={notify === "si"} onSelect={() => setNotify("si")}>
          Sí, avisar a la Dra. Solano
        </RadioRow>
        <RadioRow checked={notify === "no"} onSelect={() => setNotify("no")}>
          No, prefiero decidirlo en el momento
        </RadioRow>
      </div>
      <p className="m-0 mt-4 text-sm text-tinta-tenue">Podés cambiarlo igual cuando aparezca la alerta.</p>
    </Modal>
  );
}
