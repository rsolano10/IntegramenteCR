import { useMyPatient } from "../../lib/useMyPatient";
import { useResumen } from "../../lib/resumen";
import { ResumenSeguimiento } from "../../components/resumen/ResumenSeguimiento";
import { CompartirResumen } from "../../components/resumen/CompartirResumen";
import { Cargando } from "../../components/ui/Cargando";

// «Resumen para el médico»: lo que hicieron en casa, listo para llevar a la
// consulta (impreso) o mandar por enlace.
export function ResumenMedico() {
  const { data: myPatient } = useMyPatient();
  const { data, isLoading, error } = useResumen(myPatient?.id ?? null, !!myPatient);
  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 grid gap-5">
      <div className="print:hidden">
        <h1 className="m-0 font-serif font-normal text-[30px] text-tinta">Resumen para el médico</h1>
        <p className="m-0 mt-1 text-[15.5px] leading-relaxed text-tinta-suave">
          Lo que hicieron en casa estas semanas, en una página. Así el médico entiende rápido cómo va{myPatient?.nombre ? ` ${myPatient.nombre.split(" ")[0]}` : ""}.
        </p>
      </div>
      {isLoading ? (
        <Cargando />
      ) : error || !data ? (
        <p className="m-0 text-[15px] text-tinta-suave">No pudimos armar el resumen. Probá de nuevo en un momento.</p>
      ) : (
        <>
          <CompartirResumen patientId={myPatient?.id} nombre={myPatient?.nombre?.split(" ")[0]} />
          <ResumenSeguimiento datos={data} para="familia" />
        </>
      )}
    </div>
  );
}
