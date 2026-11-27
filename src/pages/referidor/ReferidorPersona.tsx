import { Link, useParams } from "react-router-dom";
import { useResumen } from "../../lib/resumen";
import { ResumenSeguimiento } from "../../components/resumen/ResumenSeguimiento";
import { Cargando } from "../../components/ui/Cargando";

// La ficha de seguimiento de una persona referida (con permiso de la familia).
export function ReferidorPersona() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useResumen(id);
  return (
    <div className="max-w-3xl mx-auto w-full grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/app/referidor" className="text-[14.5px] font-semibold text-verde-profundo no-underline">‹ Mis personas</Link>
        {data && (
          <button type="button" onClick={() => window.print()} className="min-h-10 px-4 rounded-full border-[1.5px] border-borde bg-white text-[14px] font-semibold text-tinta cursor-pointer hover:border-verde-serenidad">
            Imprimir
          </button>
        )}
      </div>
      {isLoading ? (
        <Cargando />
      ) : error || !data ? (
        <p className="m-0 rounded-[22px] bg-white border border-borde px-5 py-6 text-[15.5px] text-tinta-suave">No podés ver este seguimiento: la familia no autorizó compartirlo o retiró el permiso.</p>
      ) : (
        <ResumenSeguimiento datos={data} />
      )}
    </div>
  );
}
