import type { ReactNode } from "react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PillToggle } from "../ui/PillToggle";
import { ChipToggle } from "../ui/ChipToggle";
import { LightbulbIcon, WarningIcon } from "../ui/Icons";
import {
  moduloLabel,
  nivelCognitivoLabel,
  nivelMotorLabel,
  removeResourceFile,
  tipoLabel,
  uploadResourceFile,
  type MediaKind,
  type MediaResource,
  type NivelCognitivo,
  type NivelMotor,
  type ResourceModulo,
  type ResourceTipo,
} from "../../lib/mediaResources";

const modulos = Object.keys(moduloLabel) as ResourceModulo[];
const tipos = Object.keys(tipoLabel) as ResourceTipo[];
const nivelesCognitivos = Object.keys(nivelCognitivoLabel) as NivelCognitivo[];
const nivelesMotores = Object.keys(nivelMotorLabel) as NivelMotor[];

function inferMediaKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "imagen";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "documento";
}

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const inputClass = "w-full min-h-12 px-4 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[16px] text-tinta";
const textareaClass = "w-full px-4 py-3 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[15px] text-tinta resize-y";
// min-w-0 is the actual fix for the overlap bug: a grid item's default
// min-width is "auto", which means it won't shrink below its content's
// natural width (an input's intrinsic character-width, or a long
// placeholder) — with 2-3 of these per row, that pushed the grid wider
// than the modal and clipped/overlapped fields, worst on mobile where
// there's no room to spare.
const labelClass = "grid gap-2 min-w-0 text-[15px] font-semibold text-tinta-suave";

// Visual grouping for a form this long — nothing fancier than the eyebrow +
// border-b strip already used elsewhere in the app (e.g. Ficha.tsx), so a
// daily editor can tell "identificación" from "seguridad" at a glance
// instead of one undifferentiated scroll of ~20 fields.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 pt-5 border-t border-borde-suave first:pt-0 first:border-t-0">
      <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue font-bold">{title}</p>
      {children}
    </div>
  );
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
  const [codigo, setCodigo] = useState(resource?.codigo ?? "");
  const [titulo, setTitulo] = useState(resource?.titulo ?? "");
  const [detalle, setDetalle] = useState(resource?.detalle ?? "");
  const [modulo, setModulo] = useState<ResourceModulo>(resource?.modulo ?? "movimiento");
  const [tipo, setTipo] = useState<ResourceTipo>(resource?.tipo ?? "actividad");
  const [tipoIntervencion, setTipoIntervencion] = useState(resource?.tipo_intervencion ?? "");
  const [dominios, setDominios] = useState((resource?.dominios ?? []).join(", "));
  const [nivelesCog, setNivelesCog] = useState<NivelCognitivo[]>(resource?.niveles_cognitivos ?? []);
  const [nivelesMot, setNivelesMot] = useState<NivelMotor[]>(resource?.niveles_motores ?? []);
  const [duracionMin, setDuracionMin] = useState(resource?.duracion_min?.toString() ?? "");
  const [duracionMax, setDuracionMax] = useState(resource?.duracion_max?.toString() ?? "");
  const [frecuencia, setFrecuencia] = useState(resource?.frecuencia ?? "");
  const [perfil, setPerfil] = useState(resource?.perfil ?? "");
  const [requisito, setRequisito] = useState(resource?.requisito ?? "");
  const [objetivo, setObjetivo] = useState(resource?.objetivo ?? "");
  const [materiales, setMateriales] = useState(resource?.materiales ?? "");
  const [pasos, setPasos] = useState((resource?.pasos ?? []).join("\n"));
  const [progresion, setProgresion] = useState(resource?.progresion ?? "");
  const [adaptacion, setAdaptacion] = useState(resource?.adaptacion ?? "");
  const [precaucion, setPrecaucion] = useState(resource?.precaucion ?? "");
  const [gancho, setGancho] = useState(resource?.ciencia?.gancho ?? "");
  const [evidencia, setEvidencia] = useState(resource?.ciencia?.evidencia ?? "");
  const [cierre, setCierre] = useState(resource?.ciencia?.cierre ?? "");
  const [porQue, setPorQue] = useState(resource?.por_que ?? "");
  const [source, setSource] = useState<"upload" | "link" | "none">(
    resource?.external_url ? "link" : resource?.storage_path ? "upload" : resource ? "none" : "upload",
  );
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
      let mediaKind: MediaKind | null = source === "none" ? null : source === "link" ? "enlace" : resource?.media_kind && !file ? resource.media_kind : "documento";
      const previousStoragePath = resource?.storage_path ?? null;

      if (source === "upload" && file) {
        storagePath = await uploadResourceFile(file);
        mediaKind = inferMediaKind(file);
      }

      const row = {
        codigo: codigo.trim() || null,
        titulo: titulo.trim(),
        detalle: detalle.trim() || null,
        modulo,
        tipo,
        tipo_intervencion: tipoIntervencion.trim() || null,
        dominios: dominios.trim() ? dominios.split(",").map((d) => d.trim()).filter(Boolean) : null,
        niveles_cognitivos: nivelesCog.length ? nivelesCog : null,
        niveles_motores: nivelesMot.length ? nivelesMot : null,
        duracion_min: duracionMin.trim() ? parseInt(duracionMin, 10) : null,
        duracion_max: duracionMax.trim() ? parseInt(duracionMax, 10) : null,
        duracion: duracionMin.trim() && duracionMax.trim() ? `${duracionMin}-${duracionMax} min` : null,
        frecuencia: frecuencia.trim() || null,
        perfil: perfil.trim() || null,
        requisito: requisito.trim() || null,
        objetivo: objetivo.trim() || null,
        materiales: materiales.trim() || null,
        pasos: pasos.trim() ? pasos.split("\n").map((p) => p.trim()).filter(Boolean) : null,
        progresion: progresion.trim() || null,
        adaptacion: adaptacion.trim() || null,
        precaucion: precaucion.trim() || null,
        ciencia: gancho.trim() || evidencia.trim() || cierre.trim() ? { gancho: gancho.trim(), evidencia: evidencia.trim(), cierre: cierre.trim() } : null,
        por_que: porQue.trim() || null,
        storage_path: source === "upload" ? storagePath : null,
        external_url: source === "link" ? externalUrl.trim() : null,
        media_kind: mediaKind,
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
    <Modal onClose={onClose} size="lg">
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">{isNew ? "Nuevo recurso" : "Editar recurso"}</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">Se guarda en la biblioteca para asignar a usuarios más adelante.</p>

      <div className="grid grid-cols-1 gap-5">
        <Section title="Identificación">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
            <label className={labelClass}>
              Código (opcional)
              <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="SEN-009" className={inputClass} />
            </label>
            <label className={labelClass}>
              Título
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            Detalle (opcional)
            <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={2} className={textareaClass} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClass}>
              Módulo
              <select value={modulo} onChange={(e) => setModulo(e.target.value as ResourceModulo)} className={inputClass}>
                {modulos.map((m) => (
                  <option key={m} value={m}>
                    {moduloLabel[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Tipo (para el plan)
              <select value={tipo} onChange={(e) => setTipo(e.target.value as ResourceTipo)} className={inputClass}>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {tipoLabel[t]}
                  </option>
                ))}
              </select>
              <span className="text-[12px] font-normal text-tinta-tenue">No es la categoría de intervención del manual — es cómo se usa en el plan semanal.</span>
            </label>
          </div>
          <label className={labelClass}>
            Tipo de intervención (opcional — categoría del manual, ej. "olfativa")
            <input
              type="text"
              value={tipoIntervencion}
              onChange={(e) => setTipoIntervencion(e.target.value)}
              placeholder="Ej.: coordinación + inhibición"
              className={inputClass}
            />
          </label>
        </Section>

        <Section title="Para quién y seguridad">
          <label className={labelClass}>
            Dominios que estimula (separados por coma, opcional)
            <input
              type="text"
              value={dominios}
              onChange={(e) => setDominios(e.target.value)}
              placeholder="atención, memoria de trabajo, lenguaje"
              className={inputClass}
            />
          </label>
          <div>
            <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Nivel cognitivo</p>
            <div className="flex flex-wrap gap-2">
              {nivelesCognitivos.map((n) => (
                <ChipToggle key={n} active={nivelesCog.includes(n)} onToggle={() => setNivelesCog((prev) => toggleInArray(prev, n))}>
                  {nivelCognitivoLabel[n]}
                </ChipToggle>
              ))}
            </div>
          </div>
          <div>
            <p className="m-0 mb-2 text-[15px] font-semibold text-tinta-suave">Nivel motor (si aplica)</p>
            <div className="flex flex-wrap gap-2">
              {nivelesMotores.map((n) => (
                <ChipToggle key={n} active={nivelesMot.includes(n)} onToggle={() => setNivelesMot((prev) => toggleInArray(prev, n))}>
                  {nivelMotorLabel[n]}
                </ChipToggle>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className={labelClass}>
              Duración mín. (min)
              <input type="number" min={0} value={duracionMin} onChange={(e) => setDuracionMin(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Duración máx. (min)
              <input type="number" min={0} value={duracionMax} onChange={(e) => setDuracionMax(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Frecuencia
              <input
                type="text"
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value)}
                placeholder="2 veces/semana"
                className={inputClass}
              />
            </label>
          </div>
          <label className={labelClass}>
            Notas sobre para quién (opcional, complementa el nivel de arriba)
            <textarea value={perfil} onChange={(e) => setPerfil(e.target.value)} rows={2} className={textareaClass} />
          </label>
          <label className={labelClass}>
            Requisito mínimo (opcional)
            <textarea value={requisito} onChange={(e) => setRequisito(e.target.value)} rows={2} className={textareaClass} />
          </label>
          <label className="grid grid-cols-1 gap-2 min-w-0 text-[15px] font-semibold text-semaforo-amarillo-texto">
            <span className="flex items-center gap-2">
              <WarningIcon /> Precaución (se muestra siempre a la familia)
            </span>
            <input
              type="text"
              value={precaucion}
              onChange={(e) => setPrecaucion(e.target.value)}
              className="w-full min-h-12 px-4 rounded-xl border-[1.5px] border-mostaza-vital bg-aviso font-sans text-[16px] text-tinta"
            />
          </label>
        </Section>

        <Section title="Instrucciones">
          <label className={labelClass}>
            Objetivo clínico (opcional)
            <textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} className={textareaClass} />
          </label>
          <label className={labelClass}>
            Materiales (opcional)
            <textarea value={materiales} onChange={(e) => setMateriales(e.target.value)} rows={2} className={textareaClass} />
          </label>
          <label className={labelClass}>
            Cómo realizarla (pasos, uno por línea, opcional)
            <textarea
              value={pasos}
              onChange={(e) => setPasos(e.target.value)}
              rows={3}
              placeholder={"Poné sobre la mesa solo lo que se va a usar.\nPedí una acción por vez…"}
              className={textareaClass}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClass}>
              Progresión (opcional, solo lo ve la clínica)
              <textarea value={progresion} onChange={(e) => setProgresion(e.target.value)} rows={2} className={textareaClass} />
            </label>
            <label className={labelClass}>
              Adaptación (opcional)
              <textarea value={adaptacion} onChange={(e) => setAdaptacion(e.target.value)} rows={2} className={textareaClass} />
            </label>
          </div>
        </Section>

        <Section title="La ciencia">
          <div className="bg-beige-serenidad rounded-2xl p-4 grid gap-3">
            <p className="m-0 flex items-center gap-2 text-[13px] tracking-[0.08em] uppercase font-bold text-tinta">
              <LightbulbIcon /> La ciencia detrás de esta actividad
            </p>
            <label className={labelClass}>
              Gancho ("¿Sabías que...?")
              <textarea value={gancho} onChange={(e) => setGancho(e.target.value)} rows={2} className={textareaClass} />
            </label>
            <label className={labelClass}>
              Evidencia
              <textarea value={evidencia} onChange={(e) => setEvidencia(e.target.value)} rows={2} className={textareaClass} />
            </label>
            <label className={labelClass}>
              Cierre ("¡Por eso hoy...!")
              <textarea value={cierre} onChange={(e) => setCierre(e.target.value)} rows={2} className={textareaClass} />
            </label>
          </div>
        </Section>

        <Section title="Medio y objetivo esperado">
          <label className={labelClass}>
            Objetivo esperado (se muestra a la familia como "¿Por qué esta actividad?")
            <textarea value={porQue} onChange={(e) => setPorQue(e.target.value)} rows={2} className={textareaClass} />
          </label>

          <PillToggle
            value={source}
            onChange={setSource}
            options={[
              { value: "upload", label: "Subir archivo" },
              { value: "link", label: "Pegar enlace" },
              { value: "none", label: "Sin archivo" },
            ]}
          />

          {source === "upload" && (
            <label className={labelClass}>
              Archivo {resource?.storage_path && "(dejá vacío para mantener el actual)"}
              <input
                type="file"
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="font-sans text-[15px] text-tinta"
              />
            </label>
          )}
          {source === "link" && (
            <label className={labelClass}>
              Enlace
              <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." className={inputClass} />
            </label>
          )}
          {source === "none" && <p className="m-0 text-[13px] text-tinta-tenue">Solo instrucciones — sin video, foto ni enlace.</p>}
        </Section>

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
