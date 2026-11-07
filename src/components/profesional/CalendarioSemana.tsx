import type { ReactNode } from "react";
import { HORAS } from "../../lib/planWeek";

export interface ColumnaCalendario {
  key: string;
  titulo: string;
  // Fecha corta debajo del día (el planificador); las plantillas no tienen.
  detalle?: string;
  resaltado?: boolean;
  cantidad: number;
}

// Calendario semanal compartido por el planificador del paciente y el
// editor de plantillas: columnas por día, filas por hora más "sin hora
// fija". Tocar una celda vacía (o el + de una con contenido) pide agregar
// en ese día y hora.
export function CalendarioSemana({
  columnas,
  celda,
  onAgregar,
  etiqueta = "Calendario de la semana",
}: {
  columnas: ColumnaCalendario[];
  // Contenido de la celda (tarjetas de actividades) y si está vacía.
  celda: (columna: string, fila: number | null) => { contenido: ReactNode; vacia: boolean };
  onAgregar: (columna: string, fila: number | null) => void;
  etiqueta?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `64px repeat(${columnas.length}, minmax(112px, 1fr))` }} role="grid" aria-label={etiqueta}>
        {/* Encabezados */}
        <div className="sticky left-0 z-[1] bg-campo border-b border-borde-suave" />
        {columnas.map((c) => (
          <div key={c.key} className={`px-2.5 py-3 border-b border-l border-borde-suave text-center ${c.cantidad === 0 ? "bg-aviso/60" : "bg-campo"}`}>
            <p className={`m-0 text-[13px] font-semibold ${c.resaltado ? "text-verde-profundo" : "text-tinta"}`}>{c.titulo}</p>
            {c.detalle && <p className="m-0 text-[12px] text-tinta-tenue">{c.detalle}</p>}
            <p className={`m-0 mt-1 text-[11.5px] font-semibold ${c.cantidad === 0 ? "text-aviso-texto" : "text-tinta-tenue"}`}>
              {c.cantidad === 0 ? "Sin actividades" : `${c.cantidad} ${c.cantidad === 1 ? "actividad" : "actividades"}`}
            </p>
          </div>
        ))}

        {/* Filas por hora, más "sin hora fija" */}
        {[null, ...HORAS].map((fila) => (
          <Fila key={fila ?? "sin"} hora={fila}>
            {columnas.map((c) => {
              const { contenido, vacia } = celda(c.key, fila);
              return (
                <div key={c.key} className={`group relative border-l border-t border-borde-suave p-1 ${fila === null ? "min-h-[52px] bg-campo/50" : "min-h-[48px]"}`}>
                  <div className="grid gap-1">{contenido}</div>
                  <button
                    type="button"
                    onClick={() => onAgregar(c.key, fila)}
                    aria-label={`Agregar actividad el ${c.titulo}${fila !== null ? ` a las ${fila}:00` : " sin hora fija"}`}
                    className={`${vacia ? "absolute inset-1" : "w-full mt-1 h-6"} rounded-lg border border-dashed border-transparent text-tinta-tenue text-[16px] cursor-pointer bg-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-hover:border-borde-campo hover:bg-verde-tenue transition-opacity`}
                  >
                    +
                  </button>
                </div>
              );
            })}
          </Fila>
        ))}
      </div>
    </div>
  );
}

function Fila({ hora, children }: { hora: number | null; children: ReactNode }) {
  return (
    <>
      <div className={`sticky left-0 z-[1] border-t border-borde-suave px-2 py-1.5 text-right text-[11.5px] text-tinta-tenue ${hora === null ? "bg-campo" : "bg-white"}`}>
        {hora === null ? "Sin hora fija" : `${hora % 12 === 0 ? 12 : hora % 12} ${hora < 12 ? "a.m." : "p.m."}`}
      </div>
      {children}
    </>
  );
}
