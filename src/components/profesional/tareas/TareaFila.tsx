import type { ReactNode } from "react";
import { ESTADO_TAREA, RESULTADO_TAREA, TIPO_TAREA, sobreQue, type TareaEquipo } from "../../../lib/tareasEquipo";

// Una tarea del equipo en una fila: qué es, de quién, para quién y cómo va.
const fechaCorta = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short" }).replace(".", "");

const TONO: Record<string, string> = {
  pendiente: "bg-aviso text-aviso-texto",
  en_curso: "bg-verde-tenue text-verde-profundo",
  resuelta: "bg-[#e3efe6] text-[#22663f]",
  cancelada: "bg-campo text-tinta-tenue",
};

export function TareaFila({ t, mostrarAsignada = true, acciones, onAbrir }: { t: TareaEquipo; mostrarAsignada?: boolean; acciones?: ReactNode; onAbrir?: () => void }) {
  const vencida = t.vence && (t.estado === "pendiente" || t.estado === "en_curso") && t.vence < new Date().toISOString().slice(0, 10);
  const cuerpo = (
    <>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold uppercase tracking-[0.08em] text-tinta-tenue">{TIPO_TAREA[t.tipo]}</span>
        <span className="block text-[15.5px] font-semibold text-tinta">{t.titulo}</span>
        <span className="block text-[13.5px] text-tinta-suave">
          {[sobreQue(t), mostrarAsignada ? `Para ${t.asignada_nombre}${t.asignada_area ? ` (${t.asignada_area})` : ""}` : t.creada_por_nombre ? `Pedida por ${t.creada_por_nombre}` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {t.respuesta && (
          <span className="mt-1.5 block rounded-xl bg-campo px-3 py-2 text-[13.5px] leading-snug text-tinta">
            {t.resultado && <strong className="font-semibold">{RESULTADO_TAREA[t.resultado]}: </strong>}
            {t.respuesta}
          </span>
        )}
      </span>
      <span className="flex flex-col items-start sm:items-end gap-1">
        <span className={`inline-flex rounded-full px-3 py-1 text-[12.5px] font-semibold ${TONO[t.estado]}`}>{ESTADO_TAREA[t.estado]}</span>
        {t.vence && <span className={`text-[12.5px] ${vencida ? "font-semibold text-alerta-texto" : "text-tinta-tenue"}`}>Para el {fechaCorta(t.vence)}</span>}
        {acciones}
      </span>
    </>
  );
  const clase = "w-full grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start px-4 py-3.5 text-left";
  return onAbrir ? (
    <button type="button" onClick={onAbrir} className={`${clase} border-0 bg-transparent cursor-pointer hover:bg-[#fcfbf6] font-sans`}>
      {cuerpo}
    </button>
  ) : (
    <div className={clase}>{cuerpo}</div>
  );
}
