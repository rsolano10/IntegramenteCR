import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { callAdminAccounts } from "../../lib/adminAccounts";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { categoryLabel, type MediaResource, type ResourceCategory } from "../../lib/mediaResources";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "actividad", label: "Actividad" },
  { value: "estrategia", label: "Estrategia" },
  { value: "neuroproteccion", label: "Neuroprotección" },
];
const categories = Object.keys(categoryLabel) as ResourceCategory[];

// Plans always run Sunday-to-Sunday — if this is the first plan and today
// isn't Sunday, only today through the coming Sunday is offered (a partial
// first week), never a day that's already in the past.
function initialWeekDays(): string[] {
  const todayIdx = new Date().getDay();
  const days: string[] = [];
  for (let i = todayIdx; i < 7; i++) days.push(DIAS[i]);
  if (todayIdx !== 0) days.push(DIAS[0]);
  return days;
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextSunday(): Date {
  const d = new Date();
  const add = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d;
}

interface DraftTask {
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
}

let draftSeq = 0;

export function AssignPlanModal({
  patientId,
  patientNombre,
  hasFamiliar,
  isFirstAssignment = true,
  onClose,
  onAssigned,
}: {
  patientId: string;
  patientNombre: string;
  hasFamiliar: boolean;
  isFirstAssignment?: boolean;
  onClose: () => void;
  onAssigned: (message: string) => void;
}) {
  const days = initialWeekDays();
  const [dia, setDia] = useState(days[0]);
  const [source, setSource] = useState<"biblioteca" | "nuevo">("biblioteca");
  const [resourceSearch, setResourceSearch] = useState("");
  const [hora, setHora] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("actividad");
  const [duracion, setDuracion] = useState("");
  const [detalle, setDetalle] = useState("");
  const [precaucion, setPrecaucion] = useState("");
  const [pasos, setPasos] = useState("");
  const [porQue, setPorQue] = useState("");
  const [notaClinica, setNotaClinica] = useState("");
  const [guardarEnBiblioteca, setGuardarEnBiblioteca] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<ResourceCategory>("movimiento");
  const [nuevoEnlace, setNuevoEnlace] = useState("");
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [vistaCompleta, setVistaCompleta] = useState(false);
  const [publishDate, setPublishDate] = useState(toDateInputValue(isFirstAssignment ? new Date() : nextSunday()));
  const [mensajeBienvenida, setMensajeBienvenida] = useState(
    isFirstAssignment
      ? `¡Hola! Ya revisamos el perfil de ${patientNombre} y armamos su primer programa personalizado. Cualquier duda, escribinos por acá.`
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: resources } = useQuery({
    queryKey: ["media-resources-active"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase.from("media_resources").select("*").eq("activo", true).order("titulo");
      if (fetchError) throw fetchError;
      return data as MediaResource[];
    },
    enabled: source === "biblioteca",
  });

  const filteredResources = (resources ?? []).filter(
    (r) => !resourceSearch.trim() || r.titulo.toLowerCase().includes(resourceSearch.trim().toLowerCase()),
  );

  function pickResource(r: MediaResource) {
    setTitulo(r.titulo);
    setTipo(r.tipo);
    setDuracion(r.duracion ?? "");
    setDetalle(r.detalle ?? "");
    setPrecaucion(r.precaucion ?? "");
    setPasos((r.pasos ?? []).join("\n"));
    setPorQue(r.por_que ?? "");
  }

  function resetTaskForm() {
    setHora("");
    setTitulo("");
    setTipo("actividad");
    setDuracion("");
    setDetalle("");
    setPrecaucion("");
    setPasos("");
    setPorQue("");
    setNotaClinica("");
    setGuardarEnBiblioteca(false);
    setNuevoEnlace("");
    setResourceSearch("");
  }

  async function addTask() {
    if (!titulo.trim()) {
      setError("Ponele un título a la actividad antes de agregarla.");
      return;
    }
    if (source === "nuevo" && guardarEnBiblioteca && !nuevoEnlace.trim()) {
      setError("Para guardar en la biblioteca hace falta un enlace (video u otro recurso).");
      return;
    }
    setError("");

    if (source === "nuevo" && guardarEnBiblioteca) {
      const { error: saveError } = await supabase.from("media_resources").insert({
        titulo: titulo.trim(),
        tipo,
        categoria: nuevaCategoria,
        media_kind: "enlace",
        external_url: nuevoEnlace.trim(),
        duracion: duracion.trim() || null,
        detalle: detalle.trim() || null,
        precaucion: precaucion.trim() || null,
        pasos: pasos.trim() ? pasos.split("\n").map((p) => p.trim()).filter(Boolean) : null,
        por_que: porQue.trim() || null,
      });
      if (saveError) {
        setError(`No pudimos guardar en la biblioteca: ${saveError.message}`);
        return;
      }
    }

    draftSeq += 1;
    setTasks((prev) => [
      ...prev,
      {
        key: `t${draftSeq}`,
        dia,
        hora: hora.trim(),
        titulo: titulo.trim(),
        tipo,
        duracion: duracion.trim(),
        detalle: detalle.trim(),
        precaucion: precaucion.trim(),
        pasos: pasos.trim(),
        porQue: porQue.trim(),
        notaClinica: notaClinica.trim(),
      },
    ]);
    resetTaskForm();
  }

  function removeTask(key: string) {
    setTasks((prev) => prev.filter((t) => t.key !== key));
  }

  async function confirm() {
    if (tasks.length === 0) {
      setError("Agregá al menos una actividad antes de aceptar.");
      return;
    }
    setError("");
    setSaving(true);
    const payload = tasks.map((t) => {
      const task: Record<string, unknown> = {
        dia: t.dia,
        is_today: t.dia === days[0],
        hora: t.hora || null,
        titulo: t.titulo,
        tipo: t.tipo,
        duracion: t.duracion || null,
        detalle: t.detalle || null,
        precaucion: t.precaucion || null,
      };
      if (t.pasos.trim()) task.pasos = t.pasos.split("\n").map((p) => p.trim()).filter(Boolean);
      if (t.porQue.trim()) task.por_que = t.porQue.trim();
      if (t.notaClinica.trim()) task.nota_clinica = t.notaClinica.trim();
      return task;
    });
    const { error: rpcError } = await supabase.rpc("assign_initial_plan", {
      p_patient_id: patientId,
      p_tasks: payload,
      p_vista_completa: hasFamiliar ? null : vistaCompleta,
      p_publish_at: new Date(`${publishDate}T00:00:00`).toISOString(),
      p_mensaje_bienvenida: mensajeBienvenida.trim() || null,
    });
    if (rpcError) {
      setSaving(false);
      setError(rpcError.message);
      return;
    }
    if (mensajeBienvenida.trim()) {
      await callAdminAccounts("notify_plan_assigned", { patientId }).catch(() => {});
    }
    setSaving(false);
    onAssigned(`${patientNombre} fue aceptado — su plan ya está asignado.`);
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-serif font-normal text-2xl m-0 mb-1.5">Asignar programa {isFirstAssignment ? "inicial" : "de la semana"}</h2>
      <p className="m-0 mb-5 text-sm text-tinta-tenue">
        {isFirstAssignment
          ? `Los planes van de domingo a domingo — como hoy no es domingo, este primer plan solo cubre de ${days[0]} a ${days[days.length - 1]}.`
          : "Armá las actividades de la semana y elegí cuándo se publican."}
      </p>

      <div className="grid grid-cols-2 gap-1.5 bg-[#f2eede] p-1.5 rounded-full mb-4">
        <button
          type="button"
          onClick={() => setSource("biblioteca")}
          className={`min-h-10 rounded-full border-none font-sans text-[14px] font-semibold cursor-pointer ${source === "biblioteca" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
        >
          Elegir de la biblioteca
        </button>
        <button
          type="button"
          onClick={() => setSource("nuevo")}
          className={`min-h-10 rounded-full border-none font-sans text-[14px] font-semibold cursor-pointer ${source === "nuevo" ? "bg-white text-tinta" : "bg-transparent text-[#6b7c80]"}`}
        >
          Crear nuevo
        </button>
      </div>

      {source === "biblioteca" && (
        <div className="mb-4">
          <input
            type="text"
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            placeholder="Buscar recurso…"
            className="w-full min-h-11 px-4 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta mb-2.5"
          />
          <div className="grid gap-1.5 max-h-40 overflow-y-auto">
            {filteredResources.length === 0 && <p className="m-0 text-[13px] text-tinta-tenue">Ningún recurso activo coincide.</p>}
            {filteredResources.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pickResource(r)}
                className={`text-left px-3.5 py-2.5 rounded-xl border-[1.5px] cursor-pointer font-sans text-[14px] ${
                  titulo === r.titulo ? "border-verde-serenidad bg-[#f5f9f9]" : "border-[#ddd7be] bg-white"
                }`}
              >
                <strong className="text-tinta">{r.titulo}</strong> <span className="text-tinta-tenue">· {categoryLabel[r.categoria]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-campo rounded-2xl p-4 grid gap-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
            Día
            <select value={dia} onChange={(e) => setDia(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta">
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta">
              {TIPO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
          Título
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
            Hora (opcional)
            <input type="text" value={hora} onChange={(e) => setHora(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta" />
          </label>
          <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
            Duración (opcional)
            <input type="text" value={duracion} onChange={(e) => setDuracion(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta" />
          </label>
        </div>
        <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
          Detalle (opcional)
          <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={2} className="w-full rounded-lg border-[1.5px] border-[#ddd7be] bg-white px-3 py-2.5 font-sans text-[14px] text-tinta resize-y" />
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
          Precaución (opcional)
          <input type="text" value={precaucion} onChange={(e) => setPrecaucion(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta" />
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
          Pasos (uno por línea, opcional)
          <textarea value={pasos} onChange={(e) => setPasos(e.target.value)} rows={2} className="w-full rounded-lg border-[1.5px] border-[#ddd7be] bg-white px-3 py-2.5 font-sans text-[14px] text-tinta resize-y" />
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
          ¿Para qué sirve? (opcional)
          <input type="text" value={porQue} onChange={(e) => setPorQue(e.target.value)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta" />
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
          Mensaje de la clínica para esta actividad (opcional, se destaca en la vista de la familia)
          <textarea value={notaClinica} onChange={(e) => setNotaClinica(e.target.value)} rows={2} className="w-full rounded-lg border-[1.5px] border-[#ddd7be] bg-white px-3 py-2.5 font-sans text-[14px] text-tinta resize-y" />
        </label>

        {source === "nuevo" && (
          <label className="flex items-start gap-2.5 bg-white rounded-xl p-3 cursor-pointer">
            <input type="checkbox" checked={guardarEnBiblioteca} onChange={(e) => setGuardarEnBiblioteca(e.target.checked)} className="mt-1" />
            <span className="text-[13px] leading-relaxed text-tinta">Guardar en la biblioteca para uso futuro</span>
          </label>
        )}
        {source === "nuevo" && guardarEnBiblioteca && (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
              Categoría (biblioteca)
              <select value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value as ResourceCategory)} className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51]">
              Enlace (video u otro)
              <input type="url" value={nuevoEnlace} onChange={(e) => setNuevoEnlace(e.target.value)} placeholder="https://…" className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta" />
            </label>
          </div>
        )}

        <Button variant="secondary" dense onClick={addTask} className="justify-self-start">
          + Agregar actividad
        </Button>
      </div>

      {tasks.length > 0 && (
        <div className="grid gap-2 mb-4">
          {tasks.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-3 bg-white border border-borde rounded-xl px-3.5 py-2.5">
              <span className="text-[14px] text-tinta">
                <strong>{t.dia}</strong> · {t.titulo} {t.hora ? `· ${t.hora}` : ""}
              </span>
              <button type="button" onClick={() => removeTask(t.key)} className="text-[13px] font-semibold text-alerta-texto underline decoration-dotted cursor-pointer">
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51] mb-4">
        Fecha de publicación
        <input
          type="date"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          className="min-h-11 px-3 rounded-lg border-[1.5px] border-[#ddd7be] bg-white font-sans text-[14px] text-tinta max-w-[200px]"
        />
      </label>

      <label className="grid gap-1.5 text-[13px] font-semibold text-[#3b4c51] mb-4">
        Mensaje de bienvenida (opcional — se muestra una sola vez al entrar)
        <textarea
          value={mensajeBienvenida}
          onChange={(e) => setMensajeBienvenida(e.target.value)}
          rows={3}
          className="w-full rounded-lg border-[1.5px] border-verde-serenidad bg-[#f5f9f9] px-3 py-2.5 font-sans text-[14px] text-tinta resize-y"
        />
      </label>

      {!hasFamiliar && (
        <label className="flex items-start gap-2.5 mb-4 bg-fila-fria rounded-xl p-3.5 cursor-pointer">
          <input type="checkbox" checked={vistaCompleta} onChange={(e) => setVistaCompleta(e.target.checked)} className="mt-1" />
          <span className="text-[14px] leading-relaxed text-tinta">
            <strong>{patientNombre} no tiene familiar vinculado.</strong> Dale vista completa (ve todo lo mismo que vería un familiar,
            no solo "Hoy").
          </span>
        </label>
      )}

      {error && <p className="m-0 mb-4 text-[14px] text-alerta-texto">{error}</p>}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="ink" onClick={confirm} disabled={saving}>
          {saving ? "Asignando…" : "Confirmar y aceptar"}
        </Button>
      </div>
    </Modal>
  );
}
