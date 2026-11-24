import { moduloLabel, moduloTheme, nivelCognitivoShort, tipoLabel, type MediaResource } from "../../lib/mediaResources";
import { ModuloIcon } from "../ui/ModuloIcon";
import { RowMenu, type RowMenuItem } from "../ui/RowMenu";

// Biblioteca en lista compacta: código, título, módulo, niveles, duración y
// estado en una fila. Con 120+ recursos se ve mucho más que en tarjetas.
const estadoTexto: Record<string, { label: string; clase: string }> = {
  aprobado: { label: "Aprobado", clase: "text-semaforo-verde-texto" },
  en_revision: { label: "En revisión", clase: "text-aviso-texto" },
  bloqueado: { label: "Bloqueado", clase: "text-alerta-texto" },
};

export function ListaRecursos({
  recursos,
  onAbrir,
  menuDe,
}: {
  recursos: MediaResource[];
  onAbrir: (r: MediaResource) => void;
  menuDe: (r: MediaResource) => RowMenuItem[];
}) {
  return (
    <div className="rounded-[20px] border border-borde bg-white overflow-hidden">
      <div className="hidden md:grid grid-cols-[100px_minmax(0,2.6fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_90px_110px_40px] gap-3 px-4 py-2.5 bg-[#fbf9f1] border-b border-borde-suave text-[12.5px] font-bold text-tinta-suave">
        <span>Código</span>
        <span>Recurso</span>
        <span>Módulo</span>
        <span>Niveles</span>
        <span>Duración</span>
        <span>Estado</span>
        <span />
      </div>
      <ul className="list-none m-0 p-0">
        {recursos.map((r) => {
          const tema = moduloTheme[r.modulo];
          const estado = !r.activo ? { label: "Inactivo", clase: "text-tinta-tenue" } : (estadoTexto[r.estado_clinico] ?? estadoTexto.aprobado);
          return (
            <li
              key={r.id}
              className={`grid grid-cols-[1fr_40px] md:grid-cols-[100px_minmax(0,2.6fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_90px_110px_40px] gap-x-3 gap-y-1 items-center px-4 py-2.5 border-b border-borde-suave last:border-b-0 hover:bg-[#fcfbf6] ${r.activo ? "" : "opacity-70"}`}
            >
              <span className="hidden md:block font-mono text-[12.5px] text-tinta-suave">{r.codigo ?? "Sin código"}</span>
              <button type="button" onClick={() => onAbrir(r)} className="min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer font-sans group">
                <span className="block text-[15px] font-semibold leading-snug text-tinta group-hover:text-verde-profundo group-hover:underline underline-offset-4 truncate">{r.titulo}</span>
                <span className="block text-[12.5px] text-tinta-suave">
                  <span className="md:hidden font-mono">{r.codigo ? `${r.codigo} · ` : ""}</span>
                  {tipoLabel[r.tipo]}
                  <span className="md:hidden">{` · ${moduloLabel[r.modulo]}`}</span>
                </span>
              </button>
              <span className="hidden md:inline-flex items-center gap-1.5 min-w-0 text-[13.5px] text-tinta">
                <span className="w-6 h-6 shrink-0 rounded-md inline-flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tema.from}, ${tema.to})` }}>
                  <ModuloIcon modulo={r.modulo} className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="truncate">{moduloLabel[r.modulo]}</span>
              </span>
              <span className="hidden md:block text-[12.5px] text-tinta-suave truncate">{(r.niveles_cognitivos ?? []).map((n) => nivelCognitivoShort[n]).join(" · ") || "Todos"}</span>
              <span className="hidden md:block text-[13px] text-tinta-suave">{r.duracion ?? "Sin dato"}</span>
              <span className={`hidden md:block text-[13px] font-semibold ${estado.clase}`}>{estado.label}</span>
              <RowMenu items={menuDe(r)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
