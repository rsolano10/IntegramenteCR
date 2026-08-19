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
  pending,
}: {
  nombre: string;
  meta: string;
  modalidad: string;
  // Absent when no clinical data has been computed for this patient yet
  // (e.g. a roster entry with no onboarding answers) — renders "Sin
  // evaluar" instead of guessing a color.
  semaforo?: Semaforo;
  adherencia: string;
  cta: string;
  onClick: () => void;
  urgent?: boolean;
  // Amber "awaiting your review" highlight — distinct from `urgent`'s red
  // alert styling, since a new profile waiting on assignment isn't a crisis.
  pending?: boolean;
}) {
  const highlightClass = urgent ? "bg-alerta rounded-xl" : pending ? "bg-aviso rounded-xl" : "";
  const buttonVariant = urgent ? "urgency" : pending ? "ink" : "secondary";

  return (
    <>
      {/* Phone / tablet: stacked card */}
      <div className={`lg:hidden grid gap-2.5 py-4 px-3 border-b border-[#f4f0e2] text-[15px] ${highlightClass}`}>
        <div>
          <strong className="text-[16px]">{nombre}</strong>
          <br />
          <span className="text-[13px] text-tinta-tenue">{meta}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-tinta-suave text-[14px]">
          <span>{modalidad}</span>
          {pending ? (
            <span className="text-[13px] font-bold text-semaforo-amarillo-texto">Pendiente de revisión</span>
          ) : semaforo ? (
            <SemaforoChip sem={semaforo} variant="bare" />
          ) : (
            <span className="text-[13px] text-tinta-tenue">Sin evaluar</span>
          )}
          <span>Adherencia: {adherencia}</span>
        </div>
        <Button variant={buttonVariant} dense onClick={onClick} className="justify-self-start">
          {cta}
        </Button>
      </div>

      {/* Desktop: table row */}
      <div
        className={`hidden lg:grid items-center gap-4 py-4.5 text-[16px] border-b border-[#f4f0e2] ${highlightClass ? `${highlightClass} px-3` : ""}`}
        style={{ gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr auto" }}
      >
        <span>
          <strong>{nombre}</strong>
          <br />
          <span className="text-[14px] text-tinta-tenue">{meta}</span>
        </span>
        <span className="text-tinta-suave">{modalidad}</span>
        {pending ? (
          <span className="text-[14px] font-bold text-semaforo-amarillo-texto">Pendiente</span>
        ) : semaforo ? (
          <SemaforoChip sem={semaforo} variant="bare" />
        ) : (
          <span className="text-[14px] text-tinta-tenue">Sin evaluar</span>
        )}
        <span className="text-tinta-suave">{adherencia}</span>
        <Button variant={buttonVariant} dense onClick={onClick}>
          {cta}
        </Button>
      </div>
    </>
  );
}
