import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Modal } from "../../components/ui/Modal";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { ResourceCard } from "../../components/ui/ResourceCard";
import { ChipToggle } from "../../components/ui/ChipToggle";
import { moduloLabel, tipoLabel, type MediaResource, type ResourceModulo } from "../../lib/mediaResources";

const modulos = Object.keys(moduloLabel) as ResourceModulo[];

export function Actividades() {
  const [search, setSearch] = useState("");
  const [activeModulos, setActiveModulos] = useState<ResourceModulo[]>([]);
  const [opened, setOpened] = useState<MediaResource | null>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ["media-resources-catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_resources").select("*").eq("activo", true).order("titulo");
      if (error) throw error;
      return data as MediaResource[];
    },
  });

  function toggleModulo(m: ResourceModulo) {
    setActiveModulos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (resources ?? []).filter((r) => {
      if (activeModulos.length && !activeModulos.includes(r.modulo)) return false;
      if (q && !r.titulo.toLowerCase().includes(q) && !(r.detalle ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, search, activeModulos]);

  return (
    <div>
      <p className="m-0 mb-3.5 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Actividades</p>
      <p className="m-0 mb-4 text-[15px] leading-relaxed text-tinta-suave">
        Explorá el catálogo completo de actividades de la clínica, más allá de lo ya asignado en el plan.
      </p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar actividad o tema"
        className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] mb-3.5"
      />
      <div className="flex flex-wrap gap-2 mb-4.5">
        {modulos.map((m) => (
          <ChipToggle key={m} active={activeModulos.includes(m)} onToggle={() => toggleModulo(m)}>
            {moduloLabel[m]}
          </ChipToggle>
        ))}
      </div>

      {isLoading && <p className="m-0 text-[15px] text-tinta-tenue">Cargando…</p>}
      {!isLoading && filtered.length === 0 ? (
        <p className="m-0 text-[15px] text-tinta-tenue">Ninguna actividad coincide con estos filtros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <ResourceCard key={item.id} resource={item} onClick={() => setOpened(item)} />
          ))}
        </div>
      )}

      {opened && (
        <Modal onClose={() => setOpened(null)}>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">
            {moduloLabel[opened.modulo]} · {tipoLabel[opened.tipo]}
            {opened.duracion ? ` · ${opened.duracion}` : ""}
          </p>
          <h3 className="font-serif font-normal text-2xl m-0 mb-4">{opened.titulo}</h3>
          <div className="grid grid-cols-1 gap-4">
            <ResourceDetailView
              content={{
                mediaKind: opened.media_kind,
                storagePath: opened.storage_path,
                externalUrl: opened.external_url,
                materiales: opened.materiales,
                adaptacion: opened.adaptacion,
                ciencia: opened.ciencia,
                porQue: opened.por_que,
                pasos: opened.pasos ?? undefined,
                fallbackLabel: `${tipoLabel[opened.tipo]}${opened.duracion ? ` · ${opened.duracion}` : ""}`,
              }}
            />
            {opened.precaucion && (
              <p className="m-0 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3">{opened.precaucion}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
