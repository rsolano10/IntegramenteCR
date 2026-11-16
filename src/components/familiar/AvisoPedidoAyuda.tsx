import { useState } from "react";
import { useMarcarPedidoVisto, usePedidosAyuda } from "../../lib/usePedidosAyuda";
import { cuandoFue } from "../../lib/cuandoFue";

// Arriba de Hoy, para el familiar: el participante tocó «Necesito ayuda».
// Queda hasta que el familiar toca «Ya lo vi».
export function AvisoPedidoAyuda({ patientId, nombre }: { patientId: string | undefined; nombre: string }) {
  const { data } = usePedidosAyuda(patientId, true);
  const marcar = useMarcarPedidoVisto();
  const [marcando, setMarcando] = useState<string | null>(null);
  if (!data || data.length === 0) return null;
  const ultimo = data[0];

  return (
    <section role="alert" className="rounded-[22px] border-[1.5px] border-mostaza-vital bg-aviso px-5 py-4">
      <p className="m-0 text-[18px] font-bold text-tinta">
        {nombre} pidió ayuda {cuandoFue(ultimo.created_at)}
      </p>
      <p className="m-0 mt-1 text-[15.5px] leading-relaxed text-tinta-suave">
        {ultimo.nota ? `Contó: «${ultimo.nota.replace(/[.\s]+$/, "")}». ` : ""}
        {data.length > 1 ? `Lo pidió ${data.length} veces. ` : ""}
        Acercate o llamale para ver qué necesita.
      </p>
      <button
        type="button"
        disabled={marcando !== null}
        onClick={async () => {
          setMarcando(ultimo.id);
          await Promise.all(data.map((p) => marcar(p.id)));
          setMarcando(null);
        }}
        className="mt-3 inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-verde-profundo text-white font-semibold text-[16px] border-0 cursor-pointer disabled:opacity-60"
      >
        {marcando ? "Guardando…" : "Ya lo vi"}
      </button>
    </section>
  );
}
