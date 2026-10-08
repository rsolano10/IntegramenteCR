import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase";
import { useBodyScrollLock } from "../../lib/useBodyScrollLock";
import { Button } from "../ui/Button";
import { ChipToggle } from "../ui/ChipToggle";
import { LightbulbIcon } from "../ui/Icons";
import { ModuloIcon } from "../ui/ModuloIcon";
import { ResourceCard } from "../ui/ResourceCard";
import { ResourceDetailView } from "../ui/ResourceDetailView";
import {
  moduloLabel,
  moduloTheme,
  nivelCognitivoLabel,
  nivelMotorLabel,
  removeResourceFile,
  resourceUrl,
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

interface Form {
  codigo: string;
  titulo: string;
  detalle: string;
  modulo: ResourceModulo;
  tipo: ResourceTipo;
  tipoIntervencion: string;
  dominios: string;
  nivelesCog: NivelCognitivo[];
  nivelesMot: NivelMotor[];
  duracionMin: string;
  duracionMax: string;
  frecuencia: string;
  perfil: string;
  requisito: string;
  objetivo: string;
  materiales: string;
  pasos: string[];
  progresion: string;
  adaptacion: string;
  precaucion: string;
  gancho: string;
  evidencia: string;
  cierre: string;
  porQue: string;
}

function fromResource(r: MediaResource | null): Form {
  return {
    codigo: r?.codigo ?? "",
    titulo: r?.titulo ?? "",
    detalle: r?.detalle ?? "",
    modulo: r?.modulo ?? "movimiento",
    tipo: r?.tipo ?? "actividad",
    tipoIntervencion: r?.tipo_intervencion ?? "",
    dominios: (r?.dominios ?? []).join(", "),
    nivelesCog: r?.niveles_cognitivos ?? [],
    nivelesMot: r?.niveles_motores ?? [],
    duracionMin: r?.duracion_min?.toString() ?? "",
    duracionMax: r?.duracion_max?.toString() ?? "",
    frecuencia: r?.frecuencia ?? "",
    perfil: r?.perfil ?? "",
    requisito: r?.requisito ?? "",
    objetivo: r?.objetivo ?? "",
    materiales: r?.materiales ?? "",
    pasos: r?.pasos?.length ? [...r.pasos] : [""],
    progresion: r?.progresion ?? "",
    adaptacion: r?.adaptacion ?? "",
    precaucion: r?.precaucion ?? "",
    gancho: r?.ciencia?.gancho ?? "",
    evidencia: r?.ciencia?.evidencia ?? "",
    cierre: r?.ciencia?.cierre ?? "",
    porQue: r?.por_que ?? "",
  };
}

function duracionTexto(f: Form) {
  if (f.duracionMin && f.duracionMax) return f.duracionMin === f.duracionMax ? `${f.duracionMin} min` : `${f.duracionMin}-${f.duracionMax} min`;
  if (f.duracionMin || f.duracionMax) return `${f.duracionMin || f.duracionMax} min`;
  return "";
}

// Un textarea que crece con el contenido y no parece un campo: el texto se
// edita en el mismo lugar y con la misma tipografía con que lo va a leer
// la familia.
function Inline({
  value,
  onChange,
  placeholder,
  className = "",
  single = false,
  autoFocus = false,
  onEnter,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  single?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        inputRef?.(el);
      }}
      value={value}
      rows={1}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(single ? e.target.value.replace(/\n/g, " ") : e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (single || onEnter) && !e.shiftKey) {
          e.preventDefault();
          onEnter?.();
        }
      }}
      className={`block w-full resize-none overflow-hidden bg-transparent border-0 outline-none rounded-lg px-1.5 -mx-1.5 py-0.5 font-[inherit] text-inherit placeholder:text-tinta-tenue/70 placeholder:italic hover:bg-white/60 focus:bg-white focus:ring-2 focus:ring-verde-serenidad/40 transition-colors ${className}`}
    />
  );
}

// Un bloque de la vista familiar. Opcional + vacío = se muestra como un
// "+ Agregar …" discreto, para que el lienzo no se llene de cajas vacías.
function Bloque({
  titulo,
  ayuda,
  vacio,
  opcional = true,
  className,
  children,
}: {
  titulo: string;
  ayuda: string;
  vacio: boolean;
  opcional?: boolean;
  className: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(!vacio || !opcional);
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full text-left rounded-2xl border-[1.5px] border-dashed border-borde-campo px-4 py-3 bg-transparent cursor-pointer font-sans text-[14px] text-tinta-tenue hover:border-verde-serenidad hover:text-verde-profundo"
      >
        <strong className="font-semibold">+ {titulo}</strong> <span className="text-[13px]">· {ayuda}</span>
      </button>
    );
  }
  return (
    <div className={`group relative ${className}`}>
      {children}
      {opcional && vacio && (
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label={`Quitar ${titulo}`}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/70 text-tinta-tenue text-[13px] cursor-pointer border-none opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function ResourceEditor({
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
  useBodyScrollLock();
  const isNew = resource === null;
  const [f, setF] = useState<Form>(() => fromResource(resource));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const [source, setSource] = useState<"upload" | "link" | "none">(
    resource?.external_url ? "link" : resource?.storage_path ? "upload" : resource ? "none" : "upload",
  );
  const [externalUrl, setExternalUrl] = useState(resource?.external_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<"preview" | "ficha">("preview");
  const [previewMode, setPreviewMode] = useState<"detalle" | "tarjeta">("detalle");
  const [mobileView, setMobileView] = useState<"editar" | "panel">("editar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pasoRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [focusPaso, setFocusPaso] = useState<number | null>(null);
  const theme = moduloTheme[f.modulo];

  // Vista previa del archivo elegido antes de subirlo.
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  useEffect(() => {
    if (focusPaso !== null) {
      pasoRefs.current[focusPaso]?.focus();
      setFocusPaso(null);
    }
  }, [focusPaso, f.pasos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const media: { kind: MediaKind | null; url: string | null } =
    source === "upload"
      ? file
        ? { kind: inferMediaKind(file), url: fileUrl }
        : resource?.storage_path
          ? { kind: resource.media_kind, url: resourceUrl({ storage_path: resource.storage_path, external_url: null }) }
          : { kind: null, url: null }
      : source === "link" && externalUrl.trim()
        ? { kind: "enlace", url: externalUrl.trim() }
        : { kind: null, url: null };

  const pasosLimpios = f.pasos.map((p) => p.trim()).filter(Boolean);
  const duracion = duracionTexto(f);

  // Lo mismo que va a guardar — alimenta las dos vistas previas.
  const preview: MediaResource = {
    id: resource?.id ?? "preview",
    codigo: f.codigo || null,
    titulo: f.titulo || "Título de la actividad",
    detalle: f.detalle || null,
    modulo: f.modulo,
    tipo: f.tipo,
    tipo_intervencion: f.tipoIntervencion || null,
    dominios: f.dominios ? f.dominios.split(",").map((d) => d.trim()).filter(Boolean) : null,
    media_kind: media.kind,
    storage_path: null,
    external_url: media.url,
    duracion: duracion || null,
    duracion_min: f.duracionMin ? parseInt(f.duracionMin, 10) : null,
    duracion_max: f.duracionMax ? parseInt(f.duracionMax, 10) : null,
    frecuencia: f.frecuencia || null,
    perfil: f.perfil || null,
    requisito: f.requisito || null,
    objetivo: f.objetivo || null,
    materiales: f.materiales || null,
    pasos: pasosLimpios.length ? pasosLimpios : null,
    progresion: f.progresion || null,
    adaptacion: f.adaptacion || null,
    precaucion: f.precaucion || null,
    ciencia: f.gancho || f.evidencia || f.cierre ? { gancho: f.gancho, evidencia: f.evidencia, cierre: f.cierre } : null,
    por_que: f.porQue || null,
    niveles_cognitivos: f.nivelesCog.length ? f.nivelesCog : null,
    niveles_motores: f.nivelesMot.length ? f.nivelesMot : null,
    activo: resource?.activo ?? true,
    created_by: null,
    created_at: resource?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const checklist = [
    { ok: !!f.titulo.trim(), t: "Título" },
    { ok: !!media.url, t: "Video, imagen o enlace" },
    { ok: !!f.porQue.trim(), t: "¿Por qué esta actividad?" },
    { ok: pasosLimpios.length > 0, t: "Pasos" },
    { ok: !!duracion, t: "Duración" },
    { ok: f.nivelesCog.length > 0, t: "Nivel cognitivo (ficha clínica)" },
  ];
  const completos = checklist.filter((c) => c.ok).length;

  function setPaso(i: number, v: string) {
    set(
      "pasos",
      f.pasos.map((p, j) => (j === i ? v : p)),
    );
  }
  function agregarPaso(after: number) {
    const next = [...f.pasos];
    next.splice(after + 1, 0, "");
    set("pasos", next);
    setFocusPaso(after + 1);
  }
  function quitarPaso(i: number) {
    const next = f.pasos.filter((_, j) => j !== i);
    set("pasos", next.length ? next : [""]);
  }
  function moverPaso(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= f.pasos.length) return;
    const next = [...f.pasos];
    [next[i], next[j]] = [next[j], next[i]];
    set("pasos", next);
  }

  function elegirArchivo(fl: File | undefined | null) {
    if (!fl) return;
    setFile(fl);
    setSource("upload");
  }

  async function guardar() {
    setError("");
    if (!f.titulo.trim()) {
      setError("Ponele un título a la actividad.");
      setMobileView("editar");
      return;
    }
    if (source === "link" && !externalUrl.trim()) {
      setError("Pegá el enlace o elegí “Sin multimedia”.");
      return;
    }
    if (source === "upload" && !file && !resource?.storage_path) {
      setError("Subí un archivo o elegí “Sin multimedia”.");
      return;
    }
    setLoading(true);
    try {
      let storagePath = source === "upload" ? (resource?.storage_path ?? null) : null;
      let mediaKind: MediaKind | null =
        source === "none" ? null : source === "link" ? "enlace" : resource?.media_kind && !file ? resource.media_kind : "documento";
      const previousStoragePath = resource?.storage_path ?? null;
      if (source === "upload" && file) {
        storagePath = await uploadResourceFile(file);
        mediaKind = inferMediaKind(file);
      }
      const row = {
        codigo: f.codigo.trim() || null,
        titulo: f.titulo.trim(),
        detalle: f.detalle.trim() || null,
        modulo: f.modulo,
        tipo: f.tipo,
        tipo_intervencion: f.tipoIntervencion.trim() || null,
        dominios: preview.dominios,
        niveles_cognitivos: preview.niveles_cognitivos,
        niveles_motores: preview.niveles_motores,
        duracion_min: preview.duracion_min,
        duracion_max: preview.duracion_max,
        duracion: duracion || null,
        frecuencia: f.frecuencia.trim() || null,
        perfil: f.perfil.trim() || null,
        requisito: f.requisito.trim() || null,
        objetivo: f.objetivo.trim() || null,
        materiales: f.materiales.trim() || null,
        pasos: pasosLimpios.length ? pasosLimpios : null,
        progresion: f.progresion.trim() || null,
        adaptacion: f.adaptacion.trim() || null,
        precaucion: f.precaucion.trim() || null,
        ciencia: preview.ciencia ? { gancho: f.gancho.trim(), evidencia: f.evidencia.trim(), cierre: f.cierre.trim() } : null,
        por_que: f.porQue.trim() || null,
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
      // Remove the old file only after the DB stops referencing it.
      if (previousStoragePath && previousStoragePath !== storagePath) await removeResourceFile(previousStoragePath);
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

  const labelCls = "grid gap-1.5 min-w-0 text-[13px] font-semibold text-tinta-suave";
  const fieldCls = "w-full min-w-0 min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-campo font-sans text-[14.5px] text-tinta focus:border-verde-serenidad";

  // Portal: the page container animates with a transform (.im-in), which
  // would turn `position: fixed` into "fixed to that container" and slide
  // this full-screen editor under the app header.
  return createPortal(
    <div className="fixed inset-0 z-50 bg-fondo-papel flex flex-col" role="dialog" aria-modal="true" aria-label={isNew ? "Nuevo recurso" : "Editar recurso"}>
      {/* Barra superior */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-borde" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-campo text-tinta-tenue hover:text-tinta cursor-pointer border-none text-[18px]">
            ×
          </button>
          <div className="min-w-0">
            <p className="m-0 text-[11.5px] tracking-[0.14em] uppercase text-tinta-tenue font-semibold">{isNew ? "Nuevo recurso" : "Editar recurso"}</p>
            <p className="m-0 text-[15px] font-semibold text-tinta truncate">{f.titulo || "Sin título"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[12.5px] text-tinta-tenue">
            {completos}/{checklist.length} listo
          </span>
          {error && <span className="hidden md:inline text-[13px] text-alerta-texto max-w-[280px] truncate">{error}</span>}
          <Button variant="ink" dense onClick={guardar} disabled={loading}>
            {loading ? "Guardando…" : isNew ? "Crear recurso" : "Guardar cambios"}
          </Button>
        </div>
      </header>

      {/* Selector en teléfono */}
      <div className="lg:hidden shrink-0 flex gap-1 p-1 mx-4 mt-3 rounded-full bg-pastilla-fondo">
        {(
          [
            ["editar", "Editar"],
            ["panel", "Vista previa y ficha"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setMobileView(k)}
            className={`flex-1 py-2 rounded-full text-[13.5px] font-semibold border-none cursor-pointer ${mobileView === k ? "bg-white text-tinta shadow-sm" : "bg-transparent text-tinta-suave"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {error && <p className="md:hidden m-0 mx-4 mt-2 text-[13px] text-alerta-texto">{error}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
          {/* ── Lienzo: la actividad tal como la ve la familia, editable ── */}
          <main className={`${mobileView === "editar" ? "" : "hidden"} lg:block`}>
            <p className="m-0 mb-3 text-[12.5px] text-tinta-tenue">
              Así la ve la familia. Escribí directo sobre cada parte; lo opcional aparece como “+ Agregar”.
            </p>
            <article className="bg-white border border-borde rounded-[28px] overflow-hidden shadow-elevada">
              {/* Encabezado con el color del módulo */}
              <div className="px-5 sm:px-8 pt-6 pb-5" style={{ backgroundImage: `linear-gradient(135deg, ${theme.from}33, ${theme.to}26)` }}>
                <div className="flex flex-wrap gap-1.5 mb-4" role="radiogroup" aria-label="Módulo">
                  {modulos.map((m) => {
                    const t = moduloTheme[m];
                    const activo = f.modulo === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={activo}
                        onClick={() => set("modulo", m)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold cursor-pointer border-[1.5px] transition-colors ${
                          activo ? "text-white border-transparent" : "bg-white/70 text-tinta-suave border-white hover:border-borde"
                        }`}
                        style={activo ? { backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})` } : undefined}
                      >
                        <ModuloIcon modulo={m} className="w-3.5 h-3.5" />
                        {moduloLabel[m]}
                      </button>
                    );
                  })}
                </div>
                <Inline
                  value={f.titulo}
                  onChange={(v) => set("titulo", v)}
                  placeholder="Título de la actividad"
                  single
                  autoFocus={isNew}
                  className="font-serif text-[28px] sm:text-[32px] leading-tight text-tinta"
                />
                <Inline
                  value={f.detalle}
                  onChange={(v) => set("detalle", v)}
                  placeholder="Una frase que la describa (opcional)"
                  className="mt-1.5 text-[16px] leading-relaxed text-tinta-suave"
                />
                <div className="flex flex-wrap items-center gap-2 mt-4 text-[14px] text-tinta-suave">
                  <span className="inline-flex items-center gap-1.5 bg-white/80 rounded-full pl-3 pr-2 py-1">
                    <span aria-hidden="true">⏱</span>
                    <input
                      type="number"
                      min={0}
                      value={f.duracionMin}
                      onChange={(e) => set("duracionMin", e.target.value)}
                      placeholder="10"
                      aria-label="Duración mínima en minutos"
                      className="w-11 bg-transparent border-0 outline-none text-center font-semibold text-tinta focus:bg-white rounded"
                    />
                    –
                    <input
                      type="number"
                      min={0}
                      value={f.duracionMax}
                      onChange={(e) => set("duracionMax", e.target.value)}
                      placeholder="15"
                      aria-label="Duración máxima en minutos"
                      className="w-11 bg-transparent border-0 outline-none text-center font-semibold text-tinta focus:bg-white rounded"
                    />
                    min
                  </span>
                  <label className="inline-flex items-center gap-1.5 bg-white/80 rounded-full pl-3 pr-1 py-1">
                    <span className="text-tinta-tenue">En el plan como</span>
                    <select value={f.tipo} onChange={(e) => set("tipo", e.target.value as ResourceTipo)} className="bg-transparent border-0 outline-none font-semibold text-tinta cursor-pointer">
                      {tipos.map((t) => (
                        <option key={t} value={t}>
                          {tipoLabel[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="px-5 sm:px-8 py-6 grid gap-4.5">
                {/* Multimedia */}
                {media.url ? (
                  <div className="relative group">
                    <ResourceDetailMediaOnly kind={media.kind} url={media.url} />
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button type="button" onClick={() => fileInput.current?.click()} className="rounded-full bg-white/90 px-3 py-1 text-[12.5px] font-semibold text-tinta border-none cursor-pointer shadow">
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setExternalUrl("");
                          setSource("none");
                        }}
                        className="rounded-full bg-white/90 px-3 py-1 text-[12.5px] font-semibold text-alerta-texto border-none cursor-pointer shadow"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      elegirArchivo(e.dataTransfer.files?.[0]);
                    }}
                    className={`rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors ${dragging ? "border-verde-serenidad bg-verde-tenue" : "border-borde-campo bg-campo"}`}
                  >
                    <span className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                      <ModuloIcon modulo={f.modulo} className="w-6 h-6" />
                    </span>
                    <p className="m-0 text-[15px] font-semibold text-tinta">Video, imagen o enlace</p>
                    <p className="m-0 mt-0.5 mb-3.5 text-[13px] text-tinta-tenue">Arrastralo acá, o elegí una opción. Si no hay, la familia ve una imagen del módulo.</p>
                    {source === "link" ? (
                      <div className="flex gap-2 max-w-[460px] mx-auto">
                        <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://youtube.com/…" autoFocus className={fieldCls} />
                        <Button variant="secondary" dense onClick={() => setSource("upload")}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="ink" dense onClick={() => fileInput.current?.click()}>
                          Subir archivo
                        </Button>
                        <Button variant="secondary" dense onClick={() => setSource("link")}>
                          Pegar enlace
                        </Button>
                        {source !== "none" && (
                          <Button variant="secondary" dense onClick={() => setSource("none")}>
                            Sin multimedia
                          </Button>
                        )}
                      </div>
                    )}
                    {source === "none" && <p className="m-0 mt-3 text-[12.5px] text-tinta-tenue">Elegiste: sin multimedia.</p>}
                  </div>
                )}
                <input ref={fileInput} type="file" accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0])} />

                <Bloque titulo="¿Por qué esta actividad?" ayuda="lo que gana la persona, en palabras simples" vacio={!f.porQue} opcional={false} className="bg-fila-fria rounded-2xl p-4">
                  <p className="m-0 mb-1.5 font-bold text-verde-profundo text-[15px]">¿Por qué esta actividad?</p>
                  <Inline value={f.porQue} onChange={(v) => set("porQue", v)} placeholder="Ej.: Mover el cuerpo con música conocida mejora el ánimo y la coordinación." className="text-[15px] leading-relaxed text-tinta-suave" />
                </Bloque>

                <Bloque titulo="La ciencia detrás" ayuda="gancho, evidencia y cierre" vacio={!f.gancho && !f.evidencia && !f.cierre} className="bg-beige-serenidad rounded-2xl p-4">
                  <p className="m-0 mb-1.5 flex items-center gap-2 tracking-[0.08em] uppercase font-bold text-tinta text-[12px]">
                    <LightbulbIcon /> La ciencia detrás de esta actividad
                  </p>
                  <div className="grid gap-1.5 text-[14px] leading-relaxed text-tinta-suave">
                    <Inline value={f.gancho} onChange={(v) => set("gancho", v)} placeholder="Gancho: un dato que despierte interés." />
                    <Inline value={f.evidencia} onChange={(v) => set("evidencia", v)} placeholder="Evidencia: qué dice la investigación." />
                    <Inline value={f.cierre} onChange={(v) => set("cierre", v)} placeholder="Cierre: el mensaje para llevarse." className="font-semibold text-tinta" />
                  </div>
                </Bloque>

                <Bloque titulo="Qué vas a necesitar" ayuda="materiales" vacio={!f.materiales} className="">
                  <p className="m-0 mb-1.5 tracking-[0.1em] uppercase text-tinta-tenue text-[12px]">Qué vas a necesitar</p>
                  <Inline value={f.materiales} onChange={(v) => set("materiales", v)} placeholder="Ej.: una silla firme, una lista de 5 canciones." className="text-[15px] leading-relaxed text-tinta-suave" />
                </Bloque>

                {/* Pasos */}
                <div>
                  <p className="m-0 mb-2.5 tracking-[0.14em] uppercase text-tinta-tenue text-[13px]">Cómo realizarla</p>
                  <ol className="list-none m-0 p-0 grid gap-1.5">
                    {f.pasos.map((p, i) => (
                      <li key={i} className="group flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 w-6 text-right text-[16px] text-tinta-suave">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <Inline
                            value={p}
                            onChange={(v) => setPaso(i, v)}
                            placeholder={i === 0 ? "Primer paso… (Enter para agregar el siguiente)" : "Siguiente paso…"}
                            className="text-[16px] leading-relaxed text-tinta-suave"
                            onEnter={() => agregarPaso(i)}
                            inputRef={(el) => {
                              pasoRefs.current[i] = el;
                            }}
                          />
                        </div>
                        <span className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                          <IconBtn label="Subir" onClick={() => moverPaso(i, -1)} disabled={i === 0}>
                            ↑
                          </IconBtn>
                          <IconBtn label="Bajar" onClick={() => moverPaso(i, 1)} disabled={i === f.pasos.length - 1}>
                            ↓
                          </IconBtn>
                          <IconBtn label="Quitar paso" onClick={() => quitarPaso(i)}>
                            ×
                          </IconBtn>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => agregarPaso(f.pasos.length - 1)}
                    className="mt-2 ml-8 text-[13.5px] font-semibold text-verde-profundo bg-transparent border-none cursor-pointer p-0 hover:underline"
                  >
                    + Agregar paso
                  </button>
                </div>

                <Bloque titulo="Si necesita ayuda extra" ayuda="cómo adaptarla" vacio={!f.adaptacion} className="bg-campo border border-borde rounded-2xl p-4">
                  <p className="m-0 mb-1.5 font-bold text-tinta text-[15px]">Si necesita ayuda extra</p>
                  <Inline value={f.adaptacion} onChange={(v) => set("adaptacion", v)} placeholder="Ej.: hacerla sentada, con un solo paso a la vez." className="text-[15px] leading-relaxed text-tinta-suave" />
                </Bloque>

                <Bloque titulo="Precaución" ayuda="se muestra destacada en amarillo" vacio={!f.precaucion} className="bg-aviso rounded-xl px-4 py-3">
                  <Inline value={f.precaucion} onChange={(v) => set("precaucion", v)} placeholder="Ej.: suspender si hay mareo o dolor." className="text-[15px] leading-relaxed text-semaforo-amarillo-texto" />
                </Bloque>
              </div>
            </article>
          </main>

          {/* ── Panel: vista previa real + ficha clínica ── */}
          <aside className={`${mobileView === "panel" ? "" : "hidden"} lg:block lg:sticky lg:top-0`}>
            <div className="flex gap-1 p-1 rounded-full bg-pastilla-fondo mb-4">
              {(
                [
                  ["preview", "Vista previa"],
                  ["ficha", "Ficha clínica"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPanel(k)}
                  className={`flex-1 py-2 rounded-full text-[13.5px] font-semibold border-none cursor-pointer ${panel === k ? "bg-white text-tinta shadow-sm" : "bg-transparent text-tinta-suave"}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {panel === "preview" ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 text-[12.5px] text-tinta-tenue">Exactamente como en la app de la familia</p>
                  <div className="flex gap-1 text-[12.5px]">
                    {(
                      [
                        ["detalle", "Actividad"],
                        ["tarjeta", "Tarjeta"],
                      ] as const
                    ).map(([k, l]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPreviewMode(k)}
                        className={`px-2.5 py-1 rounded-full border cursor-pointer font-semibold ${previewMode === k ? "bg-tinta text-white border-tinta" : "bg-white text-tinta-suave border-borde"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {previewMode === "tarjeta" ? (
                  <div className="max-w-[320px] mx-auto w-full">
                    <ResourceCard resource={preview} />
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-[360px] rounded-[40px] bg-tinta p-2.5 shadow-elevada">
                    <div className="rounded-[32px] bg-white overflow-hidden">
                      <div className="h-6 flex justify-center items-center">
                        <span className="w-20 h-1.5 rounded-full bg-borde" />
                      </div>
                      <div className="max-h-[560px] overflow-y-auto px-4 pb-6">
                        <p className="m-0 mb-1 text-[11px] tracking-[0.14em] uppercase text-tinta-tenue">
                          {moduloLabel[f.modulo]} · {tipoLabel[f.tipo]}
                          {duracion ? ` · ${duracion}` : ""}
                        </p>
                        <h3 className="font-serif font-normal text-[22px] leading-tight m-0 mb-3.5">{preview.titulo}</h3>
                        <div className="grid gap-3.5">
                          <ResourceDetailView
                            content={{
                              mediaKind: preview.media_kind,
                              storagePath: null,
                              externalUrl: preview.external_url,
                              materiales: preview.materiales,
                              adaptacion: preview.adaptacion,
                              ciencia: preview.ciencia,
                              porQue: preview.por_que,
                              pasos: preview.pasos ?? undefined,
                              fallbackLabel: `${tipoLabel[f.tipo]}${duracion ? ` · ${duracion}` : ""}`,
                            }}
                          />
                          {preview.precaucion && (
                            <p className="m-0 text-[14px] leading-relaxed text-semaforo-amarillo-texto bg-aviso rounded-xl px-3.5 py-2.5">{preview.precaucion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl bg-white border border-borde p-4">
                  <p className="m-0 mb-2 text-[12px] tracking-[0.1em] uppercase text-tinta-tenue font-semibold">
                    Para que quede completa · {completos}/{checklist.length}
                  </p>
                  <ul className="m-0 p-0 list-none grid gap-1">
                    {checklist.map((c) => (
                      <li key={c.t} className={`flex items-center gap-2 text-[13.5px] ${c.ok ? "text-[#22663f]" : "text-tinta-tenue"}`}>
                        <span aria-hidden="true" className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] ${c.ok ? "bg-[#e3efe6]" : "border border-borde-campo"}`}>
                          {c.ok ? "✓" : ""}
                        </span>
                        {c.t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 rounded-3xl bg-white border border-borde p-5">
                <p className="m-0 text-[13px] leading-relaxed text-tinta-tenue">
                  Solo lo ve el equipo clínico. Se usa para filtrar qué actividades se le sugieren a cada paciente.
                </p>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3">
                  <label className={labelCls}>
                    Código
                    <input type="text" value={f.codigo} onChange={(e) => set("codigo", e.target.value)} placeholder="SEN-009" className={fieldCls} />
                  </label>
                  <label className={labelCls}>
                    Tipo de intervención
                    <input type="text" value={f.tipoIntervencion} onChange={(e) => set("tipoIntervencion", e.target.value)} placeholder="Ej.: olfativa" className={fieldCls} />
                  </label>
                </div>
                <div>
                  <p className="m-0 mb-2 text-[13px] font-semibold text-tinta-suave">Nivel cognitivo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nivelesCognitivos.map((n) => (
                      <ChipToggle key={n} active={f.nivelesCog.includes(n)} onToggle={() => set("nivelesCog", f.nivelesCog.includes(n) ? f.nivelesCog.filter((x) => x !== n) : [...f.nivelesCog, n])}>
                        {nivelCognitivoLabel[n]}
                      </ChipToggle>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="m-0 mb-2 text-[13px] font-semibold text-tinta-suave">Seguridad motora {f.modulo === "movimiento" && <span className="text-aviso-texto font-normal">· importante en Movimiento</span>}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nivelesMotores.map((n) => (
                      <ChipToggle key={n} active={f.nivelesMot.includes(n)} onToggle={() => set("nivelesMot", f.nivelesMot.includes(n) ? f.nivelesMot.filter((x) => x !== n) : [...f.nivelesMot, n])}>
                        {nivelMotorLabel[n]}
                      </ChipToggle>
                    ))}
                  </div>
                </div>
                <label className={labelCls}>
                  Dominios que estimula
                  <input type="text" value={f.dominios} onChange={(e) => set("dominios", e.target.value)} placeholder="atención, memoria de trabajo" className={fieldCls} />
                </label>
                <label className={labelCls}>
                  Frecuencia sugerida
                  <input type="text" value={f.frecuencia} onChange={(e) => set("frecuencia", e.target.value)} placeholder="2 veces por semana" className={fieldCls} />
                </label>
                {(
                  [
                    ["objetivo", "Objetivo clínico", "Qué se busca trabajar."],
                    ["perfil", "Perfil", "Para quién está pensada."],
                    ["requisito", "Requisito", "Qué necesita poder hacer la persona."],
                    ["progresion", "Progresión", "Cómo aumentar la dificultad."],
                  ] as const
                ).map(([k, l, ph]) => (
                  <label key={k} className={labelCls}>
                    {l}
                    <textarea value={f[k]} onChange={(e) => set(k, e.target.value)} rows={2} placeholder={ph} className={`${fieldCls} py-2.5 resize-y`} />
                  </label>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-lg bg-transparent border-none text-tinta-tenue hover:bg-campo hover:text-tinta cursor-pointer disabled:opacity-30 disabled:cursor-default text-[14px]"
    >
      {children}
    </button>
  );
}

// Just the media part of ResourceDetailView, at canvas size.
function ResourceDetailMediaOnly({ kind, url }: { kind: MediaKind | null; url: string }) {
  if (kind === "video") return <video controls src={url} className="w-full rounded-2xl bg-tinta" style={{ maxHeight: 320 }} />;
  if (kind === "imagen") return <img src={url} alt="" className="w-full rounded-2xl object-cover" style={{ maxHeight: 320 }} />;
  if (kind === "audio") return <audio controls src={url} className="w-full" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block text-center border-2 border-verde-serenidad rounded-2xl bg-verde-tenue text-verde-profundo font-sans font-bold no-underline min-h-12 leading-[3rem] text-[15px] truncate px-4">
      {kind === "documento" ? "Ver documento" : "Ver recurso"} ↗ <span className="font-normal text-[12.5px] text-tinta-tenue">{url}</span>
    </a>
  );
}
