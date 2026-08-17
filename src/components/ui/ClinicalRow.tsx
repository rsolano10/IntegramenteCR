import { SemaforoChip } from "./SemaforoChip";
import { Button } from "./Button";
import type { Semaforo } from "../../lib/mockData";

export function ClinicalRow({
  nombre,
  meta,
  modalidad,
  semaforo,
  adherencia,
  cta,
  onClick,
  urgent,
}: {
  nombre: string;
  meta: string;
  modalidad: string;
  semaforo: Semaforo;
  adherencia: string;
  cta: string;
  onClick: () => void;
  urgent?: boolean;
}) {
  return (
    <>
      {/* Phone / tablet: stacked card */}
      <div className={`lg:hidden grid gap-2.5 py-4 px-3 border-b border-[#f4f0e2] text-[15px] ${urgent ? "bg-alerta rounded-xl" : ""}`}>
        <div>
          <strong className="text-[16px]">{nombre}</strong>
          <br />
          <span className="text-[13px] text-tinta-tenue">{meta}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-tinta-suave text-[14px]">
          <span>{modalidad}</span>
          <SemaforoChip sem={semaforo} variant="bare" />
          <span>Adherencia: {adherencia}</span>
        </div>
        <Button variant={urgent ? "urgency" : "secondary"} dense onClick={onClick} className="justify-self-start">
          {cta}
        </Button>
      </div>

      {/* Desktop: table row */}
      <div
        className={`hidden lg:grid items-center gap-4 py-4.5 text-[16px] border-b border-[#f4f0e2] ${
          urgent ? "bg-alerta rounded-xl px-3" : ""
        }`}
        style={{ gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr auto" }}
      >
        <span>
          <strong>{nombre}</strong>
          <br />
          <span className="text-[14px] text-tinta-tenue">{meta}</span>
        </span>
        <span className="text-tinta-suave">{modalidad}</span>
        <SemaforoChip sem={semaforo} variant="bare" />
        <span className="text-tinta-suave">{adherencia}</span>
        <Button variant={urgent ? "urgency" : "secondary"} dense onClick={onClick}>
          {cta}
        </Button>
      </div>
    </>
  );
}
