import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import {
  categoryLabel,
  removeResourceFile,
  tipoLabel,
  uploadResourceFile,
  type MediaKind,
  type MediaResource,
  type ResourceCategory,
  type ResourceTipo,
} from "../../lib/mediaResources";

const categories = Object.keys(categoryLabel) as ResourceCategory[];
const tipos = Object.keys(tipoLabel) as ResourceTipo[];

function inferMediaKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "imagen";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "documento";
}

export function MediaResourceModal({
  resource,
  onClose,
  onSaved,
  onError,
}: {
  resource: MediaResource | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const isNew = resource === null;
  const [titulo, setTitulo] = useState(resource?.titulo ?? "");
  const [detalle, setDetalle] = useState(resource?.detalle ?? "");
  const [categoria, setCategoria] = useState<ResourceCategory>(resource?.categoria ?? "movimiento");
  const [tipo, setTipo] = useState<ResourceTipo>(resource?.tipo ?? "actividad");
  const [duracion, setDuracion] = useState(resource?.duracion ?? "");
  const [precaucion, setPrecaucion] = useState(resource?.precaucion ?? "");
  const [source, setSource] = useState<"upload" | "link">(resource?.external_url ? "link" : "upload");
  const [externalUrl, setExternalUrl] = useState(resource?.external_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!titulo.trim()) {
      setError("Ingresá un título.");
      return;
    }
    if (source === "link" && !externalUrl.trim()) {
      setError("Pegá un enlace.");
      return;
    }
    if (source === "upload" && !file && !resource?.storage_path) {
      setError("Subí un archivo.");
      return;
    }

    setLoading(true);
    try {
      let storagePath = source === "upload" ? (resource?.storage_path ?? null) : null;
      let mediaKind: MediaKind = source === "link" ? "enlace" : resource?.media_kind && !file ? resource.media_kind : "documento";
      const previousStoragePath = resource?.storage_path ?? null;

      if (source === "upload" && file) {
        storagePath = await uploadResourceFile(file);
        mediaKind = inferMediaKind(file);
      }

      const row = {
        titulo: titulo.trim(),
        detalle: detalle.trim() || null,
        categoria,
        tipo,
        media_kind: mediaKind,
        duracion: duracion.trim() || null,
        precaucion: precaucion.trim() || null,
        storage_path: source === "upload" ? storagePath : null,
        external_url: source === "link" ? externalUrl.trim() : null,
      };

      if (isNew) {
        const { error: insertError } = await supabase.from("media_resources").insert(row);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase.from("media_resources").update(row).eq("id", resource.id);
        if (updateError) throw updateError;
      }

      // Clean up the old file only after the DB write that stops
      // referencing it succeeds — avoids a window with no valid file if
      // something above fails first.
      if (previousStoragePath && previousStoragePath !== storagePath) {
        await removeResourceFile(previousStoragePath);
      }

      setLoading(false);
      onSaved(isNew ? "Recurso creado." : "Recurso actualizado.");
      onClose();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "No pudimos guardar el recurso.";
      setError(msg);
      onError(msg);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">{isNew ? "Nuevo recurso" : "Editar recurso"}</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Se guarda en la biblioteca para asignar a usuarios más adelante.</p>

      <div className="grid gap-4.5">
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Título
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Movilidad sentada"
            className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
          />
        </label>
        <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
          Detalle
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            rows={2}
            className="px-4 py-3 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[15px] text-tinta resize-y"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ResourceCategory)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ResourceTipo)}
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            >
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {tipoLabel[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Duración
            <input
              type="text"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="12 min"
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Precaución
            <input
              type="text"
              value={precaucion}
              onChange={(e) => setPrecaucion(e.target.value)}
              placeholder="Opcional"
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-[#f2eede] p-1.5 rounded-full">
          <button
            type="button"
            onClick={() => setSource("upload")}
            className={`min-h-10 rounded-full border-none font-sans text-[14px] font-semibold cursor-pointer ${source === "upload" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
          >
            Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setSource("link")}
            className={`min-h-10 rounded-full border-none font-sans text-[14px] font-semibold cursor-pointer ${source === "link" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
          >
            Pegar enlace
          </button>
        </div>

        {source === "upload" ? (
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Archivo {resource?.storage_path && "(dejá vacío para mantener el actual)"}
            <input
              type="file"
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="font-sans text-[15px] text-tinta"
            />
          </label>
        ) : (
          <label className="grid gap-2 text-[15px] font-semibold text-[#3b4c51]">
            Enlace
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="min-h-12 px-4 rounded-xl border-[1.5px] border-[#ddd7be] bg-campo font-sans text-[16px] text-tinta"
            />
          </label>
        )}

        {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}

        <div className="flex gap-3 mt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" onClick={submit} disabled={loading}>
            {loading ? "Guardando…" : isNew ? "Crear recurso" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
