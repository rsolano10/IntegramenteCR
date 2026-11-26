import type { ReactNode } from "react";

// Piezas comunes de Administración.
export function Indicador({ valor, etiqueta, detalle, tono = "normal", onClick }: { valor: string; etiqueta: string; detalle?: string; tono?: "normal" | "aviso" | "bien"; onClick?: () => void }) {
  const color = tono === "aviso" ? "text-alerta-texto" : tono === "bien" ? "text-semaforo-verde-texto" : "text-tinta";
  const contenido = (
    <>
      <span className={`block font-serif text-[30px] leading-none ${color}`}>{valor}</span>
      <span className="block mt-2 text-[14px] font-semibold text-tinta">{etiqueta}</span>
      {detalle && <span className="block mt-0.5 text-[12.5px] leading-snug text-tinta-suave">{detalle}</span>}
    </>
  );
  const clase = "text-left rounded-2xl border border-borde bg-white px-4 py-4 font-sans";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${clase} cursor-pointer hover:border-verde-serenidad hover:shadow-[0_14px_30px_-24px_rgba(31,51,56,0.6)]`}>
      {contenido}
    </button>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

export function Seccion({ titulo, children, accion }: { titulo: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 font-serif font-normal text-[22px] text-tinta">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

