import type { EstadoRevision as Estado, EstadoRev } from "../../lib/revisiones";

// Distintivo del estado de revisión. Nunca usa los colores del semáforo
// (verde, amarillo y rojo ya significan riesgo clínico): gris, verde de
// marca y mostaza punteado.
const TONO: Record<EstadoRev, string> = {
  sin_revisar: "bg-campo text-tinta-suave border border-borde-suave",
  en_revision: "bg-verde-tenue text-verde-profundo border border-verde-serenidad/40",
  sugerencias: "bg-mostaza-vital/35 text-[#6e521c] border-[1.5px] border-dashed border-[#c99a45]",
  revisada: "bg-verde-profundo text-white border border-verde-profundo",
  desactualizada: "bg-campo text-tinta-suave border-[1.5px] border-dashed border-tinta-tenue/60",
};

function textoEstado(e: Estado | null | undefined): string {
  if (!e) return "Sin revisar";
  const activas = e.tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_curso");
  const ok = e.tareas.filter((t) => t.resultado === "aprobado" && !t.desactualizada);
  const primer = (n: string) => n.split(" ")[0];
  switch (e.estado) {
    case "sugerencias":
      return `${e.abiertas} ${e.abiertas === 1 ? "sugerencia" : "sugerencias"}`;
    case "en_revision":
      return `En revisión${activas[0]?.area ? ` · ${activas[0].area}` : ""}${activas.length > 1 ? ` +${activas.length - 1}` : ""}`;
    case "revisada":
      return `Revisada${ok[0] ? ` · ${primer(ok[0].revisor)}` : ""}`;
    case "desactualizada":
      return "Revisada antes de cambios";
    default:
      return "Sin revisar";
  }
}

function detalleEstado(e: Estado | null | undefined): string {
  if (!e || e.tareas.length === 0) return "Nadie la revisó todavía.";
  return e.tareas
    .map((t) => `${t.revisor}${t.area ? ` (${t.area})` : ""}: ${t.estado === "resuelta" ? (t.resultado === "aprobado" ? (t.desactualizada ? "aprobó una versión anterior" : "aprobó") : "respondió") : "pendiente"}`)
    .join(" · ");
}

export function EstadoRevisionChip({ estado, compacto = false }: { estado: Estado | null | undefined; compacto?: boolean }) {
  const e: EstadoRev = estado?.estado ?? "sin_revisar";
  return (
    <span
      title={detalleEstado(estado)}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${compacto ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]"} ${TONO[e]}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${e === "revisada" ? "bg-white" : "bg-current"}`} />
      {textoEstado(estado)}
    </span>
  );
}
