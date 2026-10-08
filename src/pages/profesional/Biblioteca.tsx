import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { RowMenu } from "../../components/ui/RowMenu";
import { FilterDropdown } from "../../components/ui/FilterDropdown";
import { ResourceDetailView } from "../../components/ui/ResourceDetailView";
import { ResourceCard } from "../../components/ui/ResourceCard";
import {
  moduloLabel,
  nivelCognitivoLabel,
  removeResourceFile,
  tipoLabel,
  type MediaResource,
  type NivelCognitivo,
  type ResourceModulo,
} from "../../lib/mediaResources";
import { ResourceEditor } from "../../components/profesional/ResourceEditor";

const modulos = Object.keys(moduloLabel) as ResourceModulo[];
const nivelesCognitivos = Object.keys(nivelCognitivoLabel) as NivelCognitivo[];

type DuracionBucket = "corta" | "media" | "larga";
const duracionBucketLabel: Record<DuracionBucket, string> = {
  corta: "Hasta 10 min",
  media: "10-15 min",
  larga: "Más de 15 min",
};
function matchesDuracionBucket(r: MediaResource, bucket: DuracionBucket): boolean {
  const max = r.duracion_max ?? r.duracion_min;
  if (max == null) return false;
  if (bucket === "corta") return max <= 10;
  if (bucket === "media") return max > 10 && max <= 15;
  return max > 15;
}

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
  const [moduloFilter, setModuloFilter] = useState<ResourceModulo | "">("");
  const [nivelFilter, setNivelFilter] = useState<NivelCognitivo | "">("");
  const [duracionFilter, setDuracionFilter] = useState<DuracionBucket | "">("");
  const [editing, setEditing] = useState<MediaResource | "new" | null>(null);
  const [previewing, setPreviewing] = useState<MediaResource | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (resources ?? []).filter((r) => {
      if (moduloFilter && r.modulo !== moduloFilter) return false;
      if (nivelFilter && !(r.niveles_cognitivos ?? []).includes(nivelFilter)) return false;
      if (duracionFilter && !matchesDuracionBucket(r, duracionFilter)) return false;
      if (q && !r.titulo.toLowerCase().includes(q) && !(r.detalle ?? "").toLowerCase().includes(q) && !(r.codigo ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, search, moduloFilter, nivelFilter, duracionFilter]);

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
        <div className="px-5 py-5 sm:px-8 sm:py-6.5 border-b border-borde-suave flex items-center justify-between gap-4 flex-wrap">
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
          <div className="flex flex-wrap items-end gap-4 mb-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar recurso o código"
              className="flex-1 min-w-[220px] min-h-11 px-4 rounded-full border-[1.5px] border-borde-campo bg-campo font-sans text-[15px] text-tinta"
            />
            <FilterDropdown
              label="Módulo"
              options={modulos.map((m) => ({ value: m, label: moduloLabel[m] }))}
              value={moduloFilter}
              onChange={(v) => setModuloFilter(v as ResourceModulo | "")}
            />
            <FilterDropdown
              label="Nivel cognitivo"
              options={nivelesCognitivos.map((n) => ({ value: n, label: nivelCognitivoLabel[n] }))}
              value={nivelFilter}
              onChange={(v) => setNivelFilter(v as NivelCognitivo | "")}
            />
            <FilterDropdown
              label="Duración"
              options={(Object.keys(duracionBucketLabel) as DuracionBucket[]).map((b) => ({ value: b, label: duracionBucketLabel[b] }))}
              value={duracionFilter}
              onChange={(v) => setDuracionFilter(v as DuracionBucket | "")}
            />
          </div>

          {isLoading && <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>}
          {loadError && <p className="m-0 text-sm text-alerta-texto">No pudimos cargar los recursos.</p>}
          {filtered.length === 0 && !isLoading && <p className="m-0 text-sm text-tinta-tenue">Ningún recurso coincide con estos filtros.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                actions={
                  <RowMenu
                    items={[
                      { label: "Vista previa", onClick: () => setPreviewing(r) },
                      { label: "Editar", onClick: () => setEditing(r) },
                      { label: r.activo ? "Desactivar" : "Activar", onClick: () => toggleActivo(r) },
                      { label: deleting === r.id ? "Eliminando…" : "Eliminar", danger: true, onClick: () => deleteResource(r) },
                    ]}
                  />
                }
              />
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <ResourceEditor
          resource={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setStatusMsg({ text: msg });
            invalidate();
          }}
          onError={(msg) => setStatusMsg({ text: msg, error: true })}
        />
      )}

      {previewing && (
        <Modal onClose={() => setPreviewing(null)}>
          <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Así lo ve la familia</p>
          <h3 className="font-serif font-normal text-2xl m-0 mb-4">{previewing.titulo}</h3>
          <div className="grid grid-cols-1 gap-4">
            <ResourceDetailView
              content={{
                mediaKind: previewing.media_kind,
                storagePath: previewing.storage_path,
                externalUrl: previewing.external_url,
                materiales: previewing.materiales,
                adaptacion: previewing.adaptacion,
                ciencia: previewing.ciencia,
                porQue: previewing.por_que,
                pasos: previewing.pasos ?? undefined,
                fallbackLabel: `${tipoLabel[previewing.tipo]}${previewing.duracion ? ` · ${previewing.duracion}` : ""}`,
              }}
            />
            {previewing.precaucion && (
              <p className="m-0 text-[15px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-4 py-3">{previewing.precaucion}</p>
            )}
          </div>
          {(previewing.perfil || previewing.requisito || previewing.progresion) && (
            <div className="mt-5 pt-4 border-t border-borde grid gap-3">
              <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue">Solo visible para la clínica</p>
              {previewing.perfil && (
                <p className="m-0 text-[14px] text-tinta-suave">
                  <strong className="text-tinta">¿Para quién?</strong> {previewing.perfil}
                </p>
              )}
              {previewing.requisito && (
                <p className="m-0 text-[14px] text-tinta-suave">
                  <strong className="text-tinta">Requisito:</strong> {previewing.requisito}
                </p>
              )}
              {previewing.progresion && (
                <p className="m-0 text-[14px] text-tinta-suave">
                  <strong className="text-tinta">Progresión:</strong> {previewing.progresion}
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
