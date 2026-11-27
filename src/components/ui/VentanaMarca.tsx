import type { ReactNode } from "react";
import { Modal } from "./Modal";

// La ventana de la marca (la de «Perfil de …», «Mi cuenta» y «Contactanos»):
// siempre del mismo tamaño, con el encabezado verde y pestañas; al cambiar de
// pestaña solo cambia el contenido, la ventana no salta.
export function VentanaMarca({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <Modal onClose={onClose} bare size="lg" className="h-[85vh] sm:h-[min(85vh,800px)]">
      {children}
    </Modal>
  );
}

export function CargandoVentana() {
  return (
    <div className="p-10 flex justify-center">
      <span className="inline-block w-7 h-7 rounded-full border-[3px] border-beige-serenidad border-t-verde-serenidad animate-spin" />
    </div>
  );
}

// Encabezado verde con los círculos de la marca. `inicio` es lo que va a la
// izquierda del título (la foto en «Mi cuenta»).
export function EncabezadoMarca({ ceja, titulo, chips, inicio }: { ceja: string; titulo: ReactNode; chips?: ReactNode; inicio?: ReactNode }) {
  return (
    <div className="relative bg-verde-profundo text-white px-6 sm:px-8 pt-7 pb-6 overflow-hidden">
      <div aria-hidden="true" className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-verde-serenidad/40" />
      <div aria-hidden="true" className="absolute right-16 -bottom-28 w-44 h-44 rounded-full bg-mostaza-vital/25" />
      <div className="relative pr-10 flex items-center gap-4">
        {inicio}
        <div className="min-w-0">
          <p className="m-0 text-[12px] tracking-[0.14em] uppercase font-semibold text-[#c4dbdb]">{ceja}</p>
          <h2 className="m-0 mt-1.5 font-serif font-normal text-[28px] sm:text-[34px] leading-tight text-white break-words">{titulo}</h2>
        </div>
      </div>
      {chips && <div className="relative mt-4 flex flex-wrap gap-2">{chips}</div>}
    </div>
  );
}

export function ChipMarca({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-2 min-w-0 max-w-full text-[13px] font-semibold bg-white/15 rounded-full px-3 py-1.5 break-all">{children}</span>;
}

export function PestanasMarca<T extends string>({ tabs, tab, onTab }: { tabs: { id: T; label: string }[]; tab: T; onTab: (t: T) => void }) {
  return (
    <div role="tablist" className="sticky top-0 z-[1] flex sm:gap-1 px-2 sm:px-6 border-b border-borde bg-campo">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onTab(t.id)}
          className={`flex-1 sm:flex-none px-1.5 sm:px-3 py-3.5 text-[14px] sm:text-[15px] font-semibold whitespace-nowrap border-b-[2.5px] -mb-px cursor-pointer transition-colors ${
            tab === t.id ? "border-verde-profundo text-tinta" : "border-transparent text-tinta-tenue hover:text-tinta"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Título de cada pestaña: ceja en verde serenidad y título serif.
export function TituloPestana({ ceja, children, detalle }: { ceja: string; children: ReactNode; detalle?: ReactNode }) {
  return (
    <div>
      <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-verde-serenidad">{ceja}</p>
      <p className="m-0 mt-0.5 font-serif text-[24px] leading-tight text-tinta">{children}</p>
      {detalle && <p className="m-0 mt-1 text-[15px] leading-relaxed text-tinta-suave">{detalle}</p>}
    </div>
  );
}
