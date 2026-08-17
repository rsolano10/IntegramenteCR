import type { PlanDayStatus } from "../../lib/mockData";

const statusBg: Record<PlanDayStatus, string> = {
  realizado: "bg-fila-fria",
  parcial: "bg-fila-calida",
  no: "bg-campo",
  pendiente: "bg-[#edf4f4] border-[1.5px] border-verde-serenidad",
  futuro: "bg-fondo-papel",
};

const statusLabel: Record<PlanDayStatus, { text: string; className: string } | null> = {
  realizado: { text: "✓ Realizado", className: "text-[#4c7a4c]" },
  parcial: { text: "En parte", className: "text-semaforo-amarillo-texto" },
  no: { text: "No se realizó", className: "text-tinta-tenue" },
  pendiente: { text: "Pendiente", className: "text-verde-profundo" },
  futuro: null,
};

export function PlanRow({ dia, titulo, estado, nota }: { dia: string; titulo: string; estado: PlanDayStatus; nota?: string }) {
  const label = nota ? { text: nota, className: statusLabel[estado]?.className ?? "text-tinta-suave" } : statusLabel[estado];
  return (
    <div className={`grid grid-cols-[78px_1fr] gap-3 items-center px-4 py-3.5 rounded-2xl ${statusBg[estado]}`}>
      <span className={`text-[14px] font-bold ${estado === "futuro" ? "text-tinta-tenue" : "text-verde-profundo"}`}>{dia}</span>
      <span className={`text-[16px] ${estado === "futuro" ? "text-tinta-suave" : ""}`}>
        {titulo}
        {label && (
          <>
            <br />
            <span className={`text-[14px] ${label.className}`}>{label.text}</span>
          </>
        )}
      </span>
    </div>
  );
}
