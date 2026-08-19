import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  categoryLabel,
  mediaKindLabel,
  removeResourceFile,
  resourceUrl,
  tipoLabel,
  type MediaResource,
  type ResourceCategory,
} from "../../lib/mediaResources";
import { MediaResourceModal } from "../../components/profesional/MediaResourceModal";

const categories = Object.keys(categoryLabel) as ResourceCategory[];

export function Biblioteca() {
  const queryClient = useQueryClient();
  const { data: resources, isLoading, error: loadError } = useQuery({
    queryKey: ["media-resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_resources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaResource[];
    },
  });

  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<ResourceCategory[]>([]);
  const [editing, setEditing] = useState<MediaResource | "new" | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function toggleCategory(c: ResourceCategory) {
    setActiveCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (resources ?? []).filter((r) => {
      if (activeCategories.length && !activeCategories.includes(r.categoria)) return false;
      if (q && !r.titulo.toLowerCase().includes(q) && !(r.detalle ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, search, activeCategories]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["media-resources"] });
  }

  async function toggleActivo(r: MediaResource) {
    const { error } = await supabase.from("media_resources").update({ activo: !r.activo }).eq("id", r.id);
    if (error) {
      setStatusMsg({ text: error.message, error: true });
      return;
    }
    invalidate();
  }

  async function deleteResource(r: MediaResource) {
    setDeleting(r.id);
    const { error } = await supabase.from("media_resources").delete().eq("id", r.id);
    if (error) {
      setDeleting(null);
      setStatusMsg({ text: error.message, error: true });
      return;
    }
    if (r.storage_path) await removeResourceFile(r.storage_path);
    setDeleting(null);
    setStatusMsg({ text: `"${r.titulo}" eliminado.` });
    invalidate();
  }

  return (
    <div className="im-in max-w-[1200px] mx-auto px-5 py-8 pb-14 sm:px-8 lg:px-8 lg:py-10 lg:pb-20">
      <div className="bg-white border border-borde rounded-3xl overflow-hidden shadow-elevada">
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-[#efeada] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Biblioteca</p>
            <h2 className="font-serif font-normal text-2xl sm:text-[30px] m-0">Recursos multimedia</h2>
          </div>
          <Button dense onClick={() => setEditing("new")}>
            Nuevo recurso
          </Button>
        </div>

        {statusMsg && (
          <div className={`px-5 py-3 sm:px-8 text-[14px] ${statusMsg.error ? "bg-alerta text-alerta-texto" : "bg-verde-serenidad/10 text-verde-profundo"}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recurso"
            className="w-full min-h-13 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] mb-3.5"
          />
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold cursor-pointer ${
                  activeCategories.includes(c) ? "bg-tinta text-white" : "bg-beige-serenidad text-tinta"
                }`}
              >
                {categoryLabel[c]}
              </button>
            ))}
          </div>

          {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
          {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar los recursos.</p>}
          {filtered.length === 0 && !isLoading && <p className="m-0 text-sm text-tinta-tenue">Ningún recurso coincide con estos filtros.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const url = resourceUrl(r);
              return (
                <div key={r.id} className={`border rounded-2xl overflow-hidden ${r.activo ? "border-borde" : "border-[#efeada] opacity-60"}`}>
                  <div className="h-[110px] bg-beige-serenidad flex items-center justify-center">
                    {r.media_kind === "imagen" && url ? (
                      <img src={url} alt={r.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[13px] font-semibold text-tinta-suave uppercase tracking-[0.08em]">{mediaKindLabel[r.media_kind]}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-tinta-tenue">
                      {categoryLabel[r.categoria]} · {tipoLabel[r.tipo]}
                    </p>
                    <p className="m-0 mt-1 text-[16px] font-bold text-tinta">{r.titulo}</p>
                    {r.detalle && <p className="m-0 mt-1 text-[14px] text-tinta-suave">{r.detalle}</p>}
                    <div className="flex items-center gap-2.5 flex-wrap mt-3.5">
                      <Button variant="secondary" dense onClick={() => setEditing(r)}>
                        Editar
                      </Button>
                      <Button variant="secondary" dense onClick={() => toggleActivo(r)}>
                        {r.activo ? "Desactivar" : "Activar"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => deleteResource(r)}
                        disabled={deleting === r.id}
                        className="text-[13px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer disabled:opacity-60"
                      >
                        {deleting === r.id ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editing && (
        <MediaResourceModal
          resource={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setStatusMsg({ text: msg });
            invalidate();
          }}
          onError={(msg) => setStatusMsg({ text: msg, error: true })}
        />
      )}
    </div>
  );
}
