import { useMarcarPedidoVisto, usePedidosAyuda } from "../../lib/usePedidosAyuda";
import { cuandoFue } from "../../lib/cuandoFue";

// En la ficha del paciente: los «Necesito ayuda» de las últimas dos
// semanas, con si la familia ya los vio. No es un aviso de riesgo: es
// contexto para la clínica.
export function PedidosAyudaPaciente({ patientId }: { patientId: string }) {
  const { data } = usePedidosAyuda(patientId, false);
  const marcar = useMarcarPedidoVisto();
  if (!data || data.length === 0) return null;

  return (
    <section className="border-[1.5px] border-mostaza-vital bg-aviso rounded-3xl px-5 py-4">
      <p className="m-0 text-[13px] tracking-[0.14em] uppercase font-bold text-aviso-texto">
        {data.length === 1 ? "Pidió ayuda desde la app" : `Pidió ayuda ${data.length} veces en dos semanas`}
      </p>
      <ul className="m-0 mt-2 p-0 list-none grid gap-2">
        {data.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl px-4 py-2.5 border border-borde">
            <span className="text-[14.5px] text-tinta">
              {cuandoFue(p.created_at)}
              {p.nota && <span className="text-tinta-suave"> · «{p.nota.replace(/[.\s]+$/, "")}»</span>}
              <span className="text-tinta-suave"> · {p.visto_at ? "la familia lo vio" : "sin ver"}</span>
            </span>
            {!p.visto_at && (
              <button
                type="button"
                onClick={() => marcar(p.id)}
                className="text-[14px] font-semibold text-verde-profundo bg-transparent border-0 cursor-pointer underline"
              >
                Marcar visto
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
