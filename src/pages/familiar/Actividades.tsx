import { useMemo, useState } from "react";
import { useAppStore } from "../../lib/store";
import { computeProfiles } from "../../lib/clinicalEngine";
import { libraryItems, type ActivityCategory } from "../../lib/mockData";

const categories: ActivityCategory[] = ["Movimiento", "Cognitiva", "Social", "Relajación", "Música"];

export function Actividades() {
  const onboarding2 = useAppStore((s) => s.onboarding2);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<ActivityCategory[]>([]);
  const [onlyApt, setOnlyApt] = useState(true);

  function toggleCategory(c: ActivityCategory) {
    setActiveCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  // "Ejercicio de pie con desplazamiento" reacts to the real movement
  // profile instead of a hardcoded flag — a concrete example of content
  // actually respecting what onboarding recorded, not just displaying it.
  const items = useMemo(() => {
    const { movimiento } = computeProfiles(onboarding2);
    const blocked = movimiento === "rojo" || onboarding2.movimiento_caidas === "dos_mas";
    return libraryItems.map((item) =>
      item.titulo === "Ejercicio de pie con desplazamiento"
        ? blocked
          ? item
          : { ...item, disponible: true, detalle: "10 min · con apoyo firme", motivoBloqueo: undefined }
        : item,
    );
  }, [onboarding2]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (onlyApt && !item.disponible) return false;
      if (activeCategories.length && !activeCategories.includes(item.categoria)) return false;
      if (q && !item.titulo.toLowerCase().includes(q) && !item.detalle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, activeCategories, onlyApt]);

  return (
    <div>
      <p className="m-0 mb-3.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Actividades</p>
      <p className="m-0 mb-4 text-[15px] leading-relaxed text-tinta-suave">
        Buscá actividades complementarias a lo que asignó la clínica, filtradas por lo que corresponde al perfil de Rosa.
      </p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar actividad o tema"
        className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] mb-3.5"
      />
      <div className="flex flex-wrap gap-2 mb-4.5">
        <button
          type="button"
          onClick={() => setOnlyApt((v) => !v)}
          className={`px-3.5 py-2 rounded-full text-sm font-semibold cursor-pointer ${
            onlyApt ? "bg-verde-serenidad text-white" : "bg-beige-serenidad text-tinta"
          }`}
        >
          Aptas para Rosa
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCategory(c)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold cursor-pointer ${
              activeCategories.includes(c) ? "bg-tinta text-white" : "bg-beige-serenidad text-tinta"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Ninguna actividad coincide con estos filtros.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <div
              key={item.titulo}
              className={`grid grid-cols-[80px_1fr] sm:grid-cols-[92px_1fr] gap-3.5 items-center border rounded-2xl p-3 ${
                item.disponible ? "border-borde" : "border-[#efeada] opacity-55"
              }`}
            >
              <div className={`h-[62px] rounded-[10px] ${item.disponible ? "im-placeholder" : "bg-beige-serenidad"}`} />
              <span className="text-[16px]">
                <span className="text-[11px] uppercase tracking-[0.08em] text-tinta-tenue">{item.categoria}</span>
                <br />
                <strong>{item.titulo}</strong>
                <br />
                <span className={`text-sm ${item.disponible ? "text-tinta-tenue" : "text-semaforo-amarillo-texto"}`}>{item.detalle}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
