import type { ReactNode } from "react";

export function CautionNotice({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[16px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4.5 py-3.5">{children}</p>;
}

export function AlertNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-[1.5px] border-alerta-borde bg-alerta rounded-2xl p-4.5">
      {title && <p className="m-0 mb-1.5 text-[16px] font-bold text-alerta-texto">{title}</p>}
      <div className="text-[15px] leading-relaxed text-[#6e4436]">{children}</div>
    </div>
  );
}

export function RiskNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border-[1.5px] border-riesgo-borde bg-riesgo rounded-2xl p-4.5">
      <div className="text-[16px] leading-relaxed text-riesgo-texto">{children}</div>
    </div>
  );
}
