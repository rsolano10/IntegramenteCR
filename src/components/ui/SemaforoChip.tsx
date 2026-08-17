import type { Semaforo } from "../../lib/mockData";
import { semaforoData } from "../../lib/rules";

// Status is always dot + word — never color alone (Handoff §4 rule 3).
export function SemaforoChip({ sem, variant = "chip" }: { sem: Semaforo; variant?: "chip" | "short" | "bare" }) {
  const d = semaforoData[sem];
  if (variant === "bare") {
    return (
      <span className={`inline-flex items-center gap-2 text-[16px] ${sem === "rojo" ? `font-semibold ${d.ink}` : "text-tinta-suave"}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
        {d.short}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[15px] font-bold ${d.bg} ${d.ink}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
      {variant === "short" ? d.short : d.chip}
    </span>
  );
}
