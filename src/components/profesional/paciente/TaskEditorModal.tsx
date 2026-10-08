import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { moduloLabel, tipoLabel, type MediaResource, type ResourceModulo } from "../../../lib/mediaResources";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { PillToggle } from "../../ui/PillToggle";

export interface DraftTask {
  key: string;
  dia: string;
  hora: string;
  titulo: string;
  tipo: string;
  duracion: string;
  detalle: string;
  precaucion: string;
  pasos: string;
  porQue: string;
  notaClinica: string;
  mediaResourceId: string | null;
  modulo: ResourceModulo | null;
}

const TIPOS = ["actividad", "video", "estrategia", "neuroproteccion"] as const;
const modulos = Object.keys(moduloLabel) as ResourceModulo[];

let seq = 0;
function newDraftKey() {
  seq += 1;
  return `d${seq}`;
}

const inputCls = "w-full min-w-0 min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[14.5px] text-tinta focus:border-verde-serenidad";

// Una actividad del planificador. Desde la biblioteca, el contenido del
// recurso se muestra tal cual (no se reescribe acá — se edita en
// Biblioteca); lo único propio de esta asignación es el día, la hora y el
// mensaje de la clínica. "Crear nueva" es el caso para algo puntual.
export function TaskEditorModal({
  days,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  days: { dia: string; date: Date }[];
  initial: Partial<DraftTask> & { dia: string };
  onSave: (task: DraftTask) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const editing = !!initial.key;
  const [source, setSource] = useState<"biblioteca" | "nueva">(editing && !initial.mediaResourceId ? "nueva" : "biblioteca");
  const [dia, setDia] = useState(initial.dia);
  const [hora, setHora] = useState(initial.hora ?? "");
  const [resourceId, setResourceId] = useState<string | null>(initial.mediaResourceId ?? null);
  const [search, setSearch] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState<ResourceModulo | "todos">("todos");
  const [titulo, setTitulo] = useState(initial.mediaResourceId ? "" : (initial.titulo ?? ""));
  const [tipo, setTipo] = useState(initial.tipo ?? "actividad");
  const [duracion, setDuracion] = useState(initial.mediaResourceId ? "" : (initial.duracion ?? ""));
  const [detalle, setDetalle] = useState(initial.mediaResourceId ? "" : (initial.detalle ?? ""));
  const [precaucion, setPrecaucion] = useState(initial.mediaResourceId ? "" : (initial.precaucion ?? ""));
  const [pasos, setPasos] = useState(initial.mediaResourceId ? "" : (initial.pasos ?? ""));
  const [porQue, setPorQue] = useState(initial.mediaResourceId ? "" : (initial.porQue ?? ""));
  const [notaClinica, setNotaClinica] = useState(initial.notaClinica ?? "");
  const [guardarEnBiblioteca, setGuardarEnBiblioteca] = useState(false);
  const [nuevoModulo, setNuevoModulo] = useState<ResourceModulo>("movimiento");
  const [nuevoEnlace, setNuevoEnlace] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: resources, isLoading } = useQuery({
    queryKey: ["media-resources-active"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase.from("media_resources").select("*").eq("activo", true).order("titulo");
      if (fetchError) throw fetchError;
      return data as MediaResource[];
    },
  });

  const selected = (resources ?? []).find((r) => r.id === resourceId) ?? null;
  const q = search.trim().toLowerCase();
  const filtered = (resources ?? []).filter(
    (r) => (moduloFiltro === "todos" || r.modulo === moduloFiltro) && (!q || r.titulo.toLowerCase().includes(q) || (r.codigo ?? "").toLowerCase().includes(q)),
  );

  async function save() {
    setError("");
    if (source === "biblioteca") {
      if (!selected) {
        setError("Elegí una actividad de la biblioteca.");
        return;
      }
      onSave({
        key: initial.key ?? newDraftKey(),
        dia,
        hora,
        titulo: selected.titulo,
        tipo: selected.tipo,
        duracion: selected.duracion ?? "",
        detalle: selected.detalle ?? "",
        precaucion: selected.precaucion ?? "",
        pasos: (selected.pasos ?? []).join("\n"),
        porQue: selected.por_que ?? "",
        notaClinica: notaClinica.trim(),
        mediaResourceId: selected.id,
        modulo: selected.modulo,
      });
      return;
    }
    if (!titulo.trim()) {
      setError("Ponele un título a la actividad.");
      return;
    }
    let mediaResourceId: string | null = null;
    if (guardarEnBiblioteca) {
      if (!nuevoEnlace.trim()) {
        setError("Para guardarla en la biblioteca hace falta un enlace (video u otro recurso).");
        return;
      }
      setSaving(true);
      const { data: saved, error: saveError } = await supabase
        .from("media_resources")
        .insert({
          titulo: titulo.trim(),
          tipo,
          modulo: nuevoModulo,
          media_kind: "enlace",
          external_url: nuevoEnlace.trim(),
          duracion: duracion.trim() || null,
          detalle: detalle.trim() || null,
          precaucion: precaucion.trim() || null,
          pasos: pasos.trim() ? pasos.split("\n").map((p) => p.trim()).filter(Boolean) : null,
          por_que: porQue.trim() || null,
        })
        .select("id")
        .single();
      setSaving(false);
      if (saveError) {
        setError("No pudimos guardarla en la biblioteca. Probá de nuevo.");
        return;
      }
      mediaResourceId = saved.id;
    }
    onSave({
      key: initial.key ?? newDraftKey(),
      dia,
      hora,
      titulo: titulo.trim(),
      tipo,
      duracion: duracion.trim(),
      detalle: detalle.trim(),
      precaucion: precaucion.trim(),
      pasos: pasos.trim(),
      porQue: porQue.trim(),
      notaClinica: notaClinica.trim(),
      mediaResourceId,
      modulo: guardarEnBiblioteca ? nuevoModulo : null,
    });
  }

  return (
    <Modal onClose={onClose} size="lg">
      <h2 className="font-serif font-normal text-2xl m-0 mb-1">{editing ? "Editar actividad" : "Nueva actividad"}</h2>
      <p className="m-0 mb-5 text-[14px] text-tinta-tenue">Elegí cuándo y qué. La familia la ve en su día, con recordatorio a la hora indicada.</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
          Día
          <select value={dia} onChange={(e) => setDia(e.target.value)} className={inputCls}>
            {days.map((d) => (
              <option key={d.dia + d.date.toISOString()} value={d.dia}>
                {d.dia} · {d.date.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
          Hora
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputCls} />
        </label>
      </div>

      <div className="mb-4">
        <PillToggle
          value={source}
          onChange={setSource}
          options={[
            { value: "biblioteca", label: "De la biblioteca" },
            { value: "nueva", label: "Crear una nueva" },
          ]}
        />
      </div>

      {source === "biblioteca" ? (
        selected ? (
          <div className="rounded-2xl border-[1.5px] border-verde-serenidad bg-verde-tenue p-4.5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[12px] tracking-[0.1em] uppercase text-verde-profundo font-semibold">
                  {moduloLabel[selected.modulo]} · {tipoLabel[selected.tipo]}
                  {selected.duracion ? ` · ${selected.duracion}` : ""}
                </p>
                <p className="m-0 mt-1 font-serif text-[20px] text-tinta">{selected.titulo}</p>
              </div>
              <button type="button" onClick={() => setResourceId(null)} className="shrink-0 text-[13px] font-semibold text-verde-profundo underline decoration-dotted cursor-pointer bg-transparent border-none">
                Cambiar
              </button>
            </div>
            {selected.por_que && <p className="m-0 mt-2.5 text-[14px] leading-relaxed text-tinta-suave">{selected.por_que}</p>}
            {selected.precaucion && (
              <p className="m-0 mt-2 text-[13px] leading-relaxed text-aviso-texto">
                <strong>Precaución:</strong> {selected.precaucion}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o código…" className={`${inputCls} mb-2.5`} />
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {(["todos", ...modulos] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModuloFiltro(m)}
                  className={`px-3 py-1 rounded-full text-[12.5px] font-semibold border cursor-pointer ${
                    moduloFiltro === m ? "bg-tinta text-white border-tinta" : "bg-white text-tinta-suave border-borde"
                  }`}
                >
                  {m === "todos" ? "Todos" : moduloLabel[m]}
                </button>
              ))}
            </div>
            <div className="grid gap-1.5 max-h-60 overflow-y-auto pr-1">
              {isLoading && <p className="m-0 text-[13px] text-tinta-tenue">Cargando biblioteca…</p>}
              {!isLoading && filtered.length === 0 && <p className="m-0 text-[13px] text-tinta-tenue">Ninguna actividad coincide.</p>}
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setResourceId(r.id)}
                  className="text-left px-3.5 py-2.5 rounded-xl border-[1.5px] border-borde-campo bg-white cursor-pointer font-sans hover:border-verde-serenidad"
                >
                  <span className="block text-[14.5px] font-semibold text-tinta">{r.titulo}</span>
                  <span className="block text-[12.5px] text-tinta-tenue">
                    {moduloLabel[r.modulo]}
                    {r.duracion ? ` · ${r.duracion}` : ""}
                    {r.codigo ? ` · ${r.codigo}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="grid gap-3 mb-4">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
            <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
              Título
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} />
            </label>
            <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {tipoLabel[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
            Duración
            <input type="text" value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="Ej.: 15 min" className={inputCls} />
          </label>
          <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
            Pasos (uno por línea)
            <textarea value={pasos} onChange={(e) => setPasos(e.target.value)} rows={3} className={`${inputCls} py-2.5 resize-y`} />
          </label>
          <details className="rounded-xl border border-borde-suave bg-campo px-3.5 py-2.5">
            <summary className="cursor-pointer text-[13.5px] font-semibold text-tinta-suave">Más detalles (opcional)</summary>
            <div className="grid gap-3 mt-3">
              <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
                Descripción
                <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={2} className={`${inputCls} py-2.5 resize-y`} />
              </label>
              <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
                ¿Para qué sirve?
                <input type="text" value={porQue} onChange={(e) => setPorQue(e.target.value)} className={inputCls} />
              </label>
              <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
                Precaución
                <input type="text" value={precaucion} onChange={(e) => setPrecaucion(e.target.value)} className={inputCls} />
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={guardarEnBiblioteca} onChange={(e) => setGuardarEnBiblioteca(e.target.checked)} className="mt-1" />
                <span className="text-[13.5px] leading-relaxed text-tinta">Guardarla también en la biblioteca</span>
              </label>
              {guardarEnBiblioteca && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
                    Módulo
                    <select value={nuevoModulo} onChange={(e) => setNuevoModulo(e.target.value as ResourceModulo)} className={inputCls}>
                      {modulos.map((m) => (
                        <option key={m} value={m}>
                          {moduloLabel[m]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave">
                    Enlace
                    <input type="url" value={nuevoEnlace} onChange={(e) => setNuevoEnlace(e.target.value)} placeholder="https://…" className={inputCls} />
                  </label>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      <label className="grid gap-1.5 text-[13px] font-semibold text-tinta-suave mb-5">
        Mensaje de la clínica para esta actividad (opcional)
        <textarea
          value={notaClinica}
          onChange={(e) => setNotaClinica(e.target.value)}
          rows={2}
          placeholder="Se destaca en la vista de la familia. Ej.: Empiecen despacio, sin apuro."
          className={`${inputCls} py-2.5 resize-y`}
        />
      </label>

      {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-[14px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer bg-transparent border-none">
            Quitar del plan
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2.5">
          <Button variant="secondary" dense onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="ink" dense onClick={save} disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Agregar al calendario"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
