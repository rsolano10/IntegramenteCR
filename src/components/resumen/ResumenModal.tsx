import { Modal } from "../ui/Modal";
import { Cargando } from "../ui/Cargando";
import { useResumen } from "../../lib/resumen";
import { ResumenSeguimiento } from "./ResumenSeguimiento";
import { CompartirResumen } from "./CompartirResumen";

// El resumen para el médico desde la clínica: el mismo que arma la familia.
export function ResumenModal({ patientId, nombre, onClose, compartir = true }: { patientId: string; nombre: string; onClose: () => void; compartir?: boolean }) {
  const { data, isLoading } = useResumen(patientId);
  return (
    <Modal onClose={onClose} size="xl">
      <div className="grid gap-4">
        <h3 className="m-0 pr-10 font-serif font-normal text-[24px] text-tinta print:hidden">Resumen para el médico</h3>
        {isLoading || !data ? <Cargando /> : (
          <>
            {compartir && <CompartirResumen patientId={patientId} nombre={nombre.split(" ")[0]} />}
            <ResumenSeguimiento datos={data} />
          </>
        )}
      </div>
    </Modal>
  );
}
