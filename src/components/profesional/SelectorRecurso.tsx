import { useState } from "react";
import { moduloLabel, type MediaResource } from "../../lib/mediaResources";
import { useCatalogo } from "../../lib/plantillas";
import type { ResourceModulo } from "../../lib/modulos";
import { Modal } from "../ui/Modal";

// Elegir un recurso del catálogo (plantillas y recursos de bienvenida).
export function SelectorRecurso({ titulo, onElegir, onClose }: { titulo: string; onElegir: (r: MediaResource) => void; onClose: () => void }) {
  const { data: recursos } = useCatalogo();
  const [buscar, setBuscar] = useState("");
  const [modulo, setModulo] = useState<ResourceModulo | "todos">("todos");
  const q = buscar.trim().toLowerCase();
  const lista = (recursos ?? []).filter(
    (r) => (modulo === "todos" || r.modulo === modulo) && (!q || r.titulo.toLowerCase().includes(q) || (r.codigo ?? "").toLowerCase().includes(q)),
  );
  return (
    <Modal onClose={onClose} size="lg">
      <h2 className="m-0 mb-4 font-serif font-normal text-[24px]">{titulo}</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_200px] mb-4">
        <input
          autoFocus
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por título o código"
          className="min-h-11 px-4 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px]"
        />
        <select value={modulo} onChange={(e) => setModulo(e.target.value as ResourceModulo | "todos")} className="min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px]">
          <option value="todos">Todos los módulos</option>
          {(Object.keys(moduloLabel) as ResourceModulo[]).map((m) => (
            <option key={m} value={m}>
              {moduloLabel[m]}
            </option>
          ))}
        </select>
      </div>
      <ul className="list-none m-0 p-0 grid gap-1.5 max-h-[55vh] overflow-y-auto">
        {lista.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onElegir(r)}
              className="w-full text-left rounded-xl border border-borde bg-white hover:border-verde-serenidad px-4 py-2.5 cursor-pointer font-sans"
            >
              <span className="block text-[14.5px] font-semibold text-tinta">{r.titulo}</span>
              <span className="block text-[12.5px] text-tinta-tenue">
                {r.codigo ? `${r.codigo} · ` : ""}
                {moduloLabel[r.modulo]}
                {r.estado_clinico === "bloqueado" ? " · bloqueado" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
