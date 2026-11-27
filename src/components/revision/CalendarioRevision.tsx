import { CalendarioSemana } from "../profesional/CalendarioSemana";
import { IconoInteractivo } from "../profesional/NivelInteractivo";
import { enFila, formatHora } from "../../lib/planWeek";
import { nivelLabel, type Nivel } from "../../lib/actividades/contrato";
import { agregadosEn, areaDeModulo, claveAct, describirCambio, marcasPorActividad, type ItemRevision, type Pos } from "../../lib/revisiones";

// El mismo calendario curado de la clínica, en modo revisión: cada actividad
// muestra si tiene sugerencias (mostaza punteado, con el cambio propuesto) o
// comentarios (burbuja con número), y las sugerencias de agregar aparecen
// como tarjetas fantasma en su celda. Tocar una actividad o una celda abre
// las opciones para sugerir.
export interface ActividadCal {
  key: string;
  dia: number;
  hora: string;
  titulo: string;
  codigo?: string | null;
  modulo?: string | null;
  recursoId: string | null;
  interactivo: boolean;
  nivel: Nivel | null;
  // Semana publicada: lo que registró la familia.
  estado?: string | null;
  comentario?: string | null;
}

const ESTADO: Record<string, string> = { realizado: "✓ Hecha", parcial: "En parte", no: "No se pudo", pendiente: "Sin registrar", futuro: "Por hacer" };

export function CalendarioRevision({
  columnas,
  actividades,
  items,
  onActividad,
  onCelda,
  etiqueta = "Calendario en revisión",
}: {
  columnas: { dia: number; titulo: string; detalle?: string }[];
  actividades: ActividadCal[];
  items: ItemRevision[] | undefined;
  onActividad?: (a: ActividadCal) => void;
  onCelda?: (p: Pos) => void;
  etiqueta?: string;
}) {
  const marcas = marcasPorActividad(items);
  const horaDeFila = (fila: number | null) => (fila === null ? "" : `${String(fila).padStart(2, "0")}:00`);
  return (
    <CalendarioSemana
      etiqueta={etiqueta}
      columnas={columnas.map((c) => ({ key: String(c.dia), titulo: c.titulo, detalle: c.detalle, cantidad: actividades.filter((a) => a.dia === c.dia).length }))}
      onAgregar={(col, fila) => onCelda?.({ dia: Number(col), hora: horaDeFila(fila) })}
      celda={(col, fila) => {
        const dia = Number(col);
        const acts = actividades.filter((a) => a.dia === dia && enFila(a.hora, fila));
        const fantasmas = agregadosEn(items, dia, (h) => enFila(h, fila));
        return {
          vacia: acts.length + fantasmas.length === 0,
          contenido: (
            <>
              {acts.map((a) => {
                const m = marcas.get(claveAct(a.dia, a.hora, a.recursoId));
                const d = m?.cambio ? describirCambio(m.cambio) : null;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => onActividad?.(a)}
                    className={`relative text-left rounded-lg px-2 py-1.5 text-[12px] leading-tight cursor-pointer font-sans ${
                      m?.sug ? "bg-mostaza-vital/30 text-tinta border-[1.5px] border-dashed border-[#c99a45]" : "bg-verde-profundo text-white border-0 hover:bg-tinta"
                    }`}
                  >
                    {m && m.com + m.sug > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-verde-serenidad text-white text-[10.5px] font-bold inline-flex items-center justify-center">
                        {m.com + m.sug}
                      </span>
                    )}
                    {a.hora && <span className="block text-[10.5px] opacity-80">{formatHora(a.hora)}</span>}
                    <span className={`font-semibold ${d && m?.cambio?.op !== "nivel" && m?.cambio?.op !== "mover" ? "line-through opacity-70" : ""}`}>{a.titulo}</span>
                    {d && <span className="block text-[11px] font-semibold text-[#6e521c]">→ {d.despues}</span>}
                    {a.interactivo ? (
                      <span className="flex items-center gap-1 text-[10.5px] opacity-90">
                        <IconoInteractivo /> {a.nivel ? nivelLabel[a.nivel] : "Según el perfil"}
                      </span>
                    ) : (
                      <span className="block text-[10.5px] opacity-80">
                        {a.codigo ? `${a.codigo} · ` : ""}
                        {areaDeModulo(a.modulo) ?? ""}
                      </span>
                    )}
                    {a.estado && <span className="block mt-0.5 text-[10.5px] font-semibold opacity-90">{ESTADO[a.estado] ?? a.estado}</span>}
                    {a.comentario && <span className="block text-[10.5px] italic opacity-90">«{a.comentario}»</span>}
                  </button>
                );
              })}
              {fantasmas.map((i) => (
                <span key={i.id} className="rounded-lg border-[1.5px] border-dashed border-[#c99a45] bg-mostaza-vital/20 px-2 py-1.5 text-[12px] leading-tight text-[#6e521c]">
                  <span className="block text-[10.5px] font-bold uppercase tracking-wide">Sugerencia</span>
                  <span className="font-semibold">+ {i.cambio?.op === "agregar" ? i.cambio.hacia.titulo : ""}</span>
                </span>
              ))}
            </>
          ),
        };
      }}
    />
  );
}
