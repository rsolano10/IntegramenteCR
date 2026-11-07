import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { moduloLabel, type MediaResource } from "../../lib/mediaResources";
import type { ResourceModulo } from "../../lib/modulos";
import { Button } from "../../components/ui/Button";
import { SelectorRecurso } from "../../components/profesional/SelectorRecurso";
import { usePlantillas, uno, type Plantilla, type TareaPlantilla } from "../../lib/plantillas";
import { DIAS, enFila, formatHora } from "../../lib/planWeek";
import { CalendarioSemana } from "../../components/profesional/CalendarioSemana";
import { Modal } from "../../components/ui/Modal";
import { ResourceEditor } from "../../components/profesional/ResourceEditor";

// Plantillas de semana (Fase 4.4) y recursos de bienvenida (Fase 3.3).
// Una plantilla es una semana tipo (recursos por día, de domingo a sábado) para
// un perfil objetivo; en el planificador del paciente se puede partir de
// una, con o sin ajuste de la IA (Fase 4.5).

let seq = 0;
const nuevaKey = () => `n${++seq}`;

function EditorPlantilla({ inicial, onCerrar }: { inicial: Plantilla | null; onCerrar: () => void }) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [perfil, setPerfil] = useState(inicial?.perfil_objetivo ?? "");
  const [tareas, setTareas] = useState<TareaPlantilla[]>(inicial?.tareas ?? []);
  const [agregarEn, setAgregarEn] = useState<{ dia: number; hora: string } | null>(null);
  const [editandoTarea, setEditandoTarea] = useState<TareaPlantilla | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function agregar(dia: number, hora: string, r: MediaResource) {
    setTareas((t) => [...t, { key: nuevaKey(), dia_idx: dia, hora, media_resource_id: r.id, titulo: r.titulo, codigo: r.codigo, modulo: r.modulo }]);
    setAgregarEn(null);
  }
  const cambiarTarea = (t: TareaPlantilla) => {
    setTareas((xs) => xs.map((x) => (x.key === t.key ? t : x)));
    setEditandoTarea(null);
  };
  const porDia = (i: number) => tareas.filter((t) => t.dia_idx === i).length;
  const diasVacios = DIAS.filter((_, i) => porDia(i) === 0);

  async function guardar() {
    setError("");
    if (!nombre.trim()) {
      setError("Poné un nombre a la plantilla.");
      return;
    }
    setGuardando(true);
    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() || null, perfil_objetivo: perfil.trim() || null, updated_at: new Date().toISOString() };
    let id = inicial?.id;
    if (id) {
      const { error: e } = await supabase.from("plantillas_semana").update(datos).eq("id", id);
      if (e) return fallo(e.message);
    } else {
      const { data, error: e } = await supabase.from("plantillas_semana").insert(datos).select("id").single();
      if (e) return fallo(e.message);
      id = data.id as string;
    }
    const { error: eDel } = await supabase.from("plantilla_tareas").delete().eq("plantilla_id", id);
    if (eDel) return fallo(eDel.message);
    if (tareas.length) {
      const { error: eIns } = await supabase
        .from("plantilla_tareas")
        .insert(tareas.map((t, i) => ({ plantilla_id: id, dia_idx: t.dia_idx, hora: t.hora || null, media_resource_id: t.media_resource_id, orden: i })));
      if (eIns) return fallo(eIns.message);
    }
    setGuardando(false);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
    onCerrar();
  }
  function fallo(m: string) {
    setGuardando(false);
    setError(m);
  }

  const campo = "min-h-11 px-3.5 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta w-full";
  return (
    <section className="rounded-3xl bg-white border border-borde p-5 sm:p-6 grid gap-5">
      <h2 className="m-0 font-serif font-normal text-[24px]">{inicial ? "Editar plantilla" : "Nueva plantilla"}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
          Nombre
          <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Semana inicial, DCL" />
        </label>
        <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
          Perfil objetivo
          <input className={campo} value={perfil} onChange={(e) => setPerfil(e.target.value)} placeholder="Deterioro leve con alta movilidad" />
        </label>
        <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave md:col-span-2">
          Descripción
          <textarea className={`${campo} py-2.5 min-h-20`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>
      </div>
      {/* Mismo calendario que el planificador del paciente, con una semana
          genérica de domingo a sábado (sin fechas). */}
      <div className="rounded-3xl border border-borde overflow-hidden">
        <p className="m-0 px-5 py-3 border-b border-borde-suave text-[14px] text-tinta-suave">
          <strong className="text-tinta">{tareas.length}</strong> {tareas.length === 1 ? "actividad" : "actividades"} ·{" "}
          <strong className="text-tinta">{7 - diasVacios.length}</strong> de 7 días con actividades · Tocá una celda para agregar un recurso.
        </p>
        <CalendarioSemana
          etiqueta="Semana de la plantilla"
          columnas={DIAS.map((d, i) => ({ key: String(i), titulo: d, cantidad: porDia(i) }))}
          onAgregar={(col, fila) => setAgregarEn({ dia: Number(col), hora: fila === null ? "" : `${String(fila).padStart(2, "0")}:00` })}
          celda={(col, fila) => {
            const items = tareas.filter((t) => t.dia_idx === Number(col) && enFila(t.hora, fila));
            return {
              vacia: items.length === 0,
              contenido: items.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setEditandoTarea(t)}
                  className="text-left rounded-lg bg-verde-serenidad text-white px-2 py-1.5 text-[12px] leading-tight cursor-pointer border-none hover:bg-verde-profundo font-sans"
                >
                  {t.hora && <span className="block text-[10.5px] opacity-80">{formatHora(t.hora)}</span>}
                  <span className="font-semibold">{t.titulo}</span>
                  <span className="block text-[10.5px] opacity-80">
                    {t.codigo ? `${t.codigo} · ` : ""}
                    {moduloLabel[t.modulo]}
                  </span>
                </button>
              )),
            };
          }}
        />
        {diasVacios.length > 0 && tareas.length > 0 && (
          <p className="m-0 px-5 py-3 border-t border-borde-suave bg-campo/60 text-[13.5px] text-aviso-texto">
            <strong>Días sin actividades:</strong> {diasVacios.join(", ")}.
          </p>
        )}
      </div>
      {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
      <div className="flex gap-2">
        <Button dense onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar plantilla"}
        </Button>
        <Button dense variant="secondary" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
      {agregarEn !== null && (
        <SelectorRecurso
          titulo={`Agregar el ${DIAS[agregarEn.dia].toLowerCase()}${agregarEn.hora ? ` a las ${formatHora(agregarEn.hora)}` : ""}`}
          onElegir={(r) => agregar(agregarEn.dia, agregarEn.hora, r)}
          onClose={() => setAgregarEn(null)}
        />
      )}
      {editandoTarea && (
        <EditorTareaPlantilla
          tarea={editandoTarea}
          onGuardar={cambiarTarea}
          onQuitar={() => {
            setTareas((xs) => xs.filter((x) => x.key !== editandoTarea.key));
            setEditandoTarea(null);
          }}
          onClose={() => setEditandoTarea(null)}
        />
      )}
    </section>
  );
}

// Editar una actividad de la plantilla: día, hora o recurso.
function EditorTareaPlantilla({
  tarea,
  onGuardar,
  onQuitar,
  onClose,
}: {
  tarea: TareaPlantilla;
  onGuardar: (t: TareaPlantilla) => void;
  onQuitar: () => void;
  onClose: () => void;
}) {
  const [t, setT] = useState(tarea);
  const [elegir, setElegir] = useState(false);
  const campo = "min-h-11 px-3 rounded-xl border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta";
  if (elegir)
    return (
      <SelectorRecurso
        titulo="Cambiar el recurso"
        onElegir={(r) => {
          setT({ ...t, media_resource_id: r.id, titulo: r.titulo, codigo: r.codigo, modulo: r.modulo });
          setElegir(false);
        }}
        onClose={() => setElegir(false)}
      />
    );
  return (
    <Modal onClose={onClose}>
      <h2 className="m-0 mb-1 font-serif font-normal text-[24px] pr-10">{t.titulo}</h2>
      <p className="m-0 mb-5 text-[13.5px] text-tinta-tenue">
        {t.codigo ? `${t.codigo} · ` : ""}
        {moduloLabel[t.modulo]}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
          Día
          <select className={campo} value={t.dia_idx} onChange={(e) => setT({ ...t, dia_idx: Number(e.target.value) })}>
            {DIAS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-[13.5px] font-semibold text-tinta-suave">
          Hora (opcional)
          <input type="time" className={campo} value={t.hora} onChange={(e) => setT({ ...t, hora: e.target.value })} />
        </label>
      </div>
      <button type="button" onClick={() => setElegir(true)} className="mt-4 min-h-10 px-0 bg-transparent border-0 font-sans text-[14px] font-semibold text-verde-profundo cursor-pointer underline underline-offset-4">
        Cambiar por otro recurso
      </button>
      <div className="flex flex-wrap items-center gap-2 mt-5">
        <Button dense onClick={() => onGuardar(t)}>
          Listo
        </Button>
        <Button dense variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <button type="button" onClick={onQuitar} className="ml-auto min-h-10 px-3 bg-transparent border-0 text-[13.5px] font-semibold text-alerta-texto cursor-pointer">
          Quitar de la plantilla
        </button>
      </div>
    </Modal>
  );
}

function ListaPlantillas() {
  const queryClient = useQueryClient();
  const { data: plantillas, isLoading } = usePlantillas();
  const [editando, setEditando] = useState<Plantilla | "nueva" | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [error, setError] = useState("");

  async function duplicar(p: Plantilla) {
    const { error: e } = await supabase.rpc("duplicar_plantilla", { p_id: p.id });
    if (e) setError(e.message);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
  }
  async function archivar(p: Plantilla, archivada: boolean) {
    const { error: e } = await supabase.from("plantillas_semana").update({ archivada }).eq("id", p.id);
    if (e) setError(e.message);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
  }
  async function borrar(p: Plantilla) {
    if (!window.confirm(`¿Borrar la plantilla «${p.nombre}»? No afecta a las semanas ya publicadas.`)) return;
    const { error: e } = await supabase.from("plantillas_semana").delete().eq("id", p.id);
    if (e) setError(e.message);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
  }

  if (editando) return <EditorPlantilla inicial={editando === "nueva" ? null : editando} onCerrar={() => setEditando(null)} />;
  const visibles = (plantillas ?? []).filter((p) => p.archivada === verArchivadas);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[14px] text-tinta-suave cursor-pointer">
          <input type="checkbox" checked={verArchivadas} onChange={(e) => setVerArchivadas(e.target.checked)} /> Ver archivadas
        </label>
        <Button dense onClick={() => setEditando("nueva")}>
          + Nueva plantilla
        </Button>
      </div>
      {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
      {isLoading ? null : visibles.length === 0 ? (
        <p className="m-0 rounded-3xl bg-white border border-borde p-6 text-[15px] text-tinta-suave">
          {verArchivadas ? "No hay plantillas archivadas." : "Todavía no hay plantillas. Creá la primera con los recursos de una semana tipo."}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibles.map((p) => {
            const dias = new Set(p.tareas.map((t) => t.dia_idx)).size;
            const porModulo = new Map<string, number>();
            for (const t of p.tareas) porModulo.set(moduloLabel[t.modulo], (porModulo.get(moduloLabel[t.modulo]) ?? 0) + 1);
            return (
              <article key={p.id} className="rounded-3xl bg-white border border-borde p-5 grid gap-3">
                <div>
                  <h3 className="m-0 text-[17px] font-bold">{p.nombre}</h3>
                  {p.perfil_objetivo && <p className="m-0 mt-0.5 text-[13.5px] font-semibold text-verde-profundo">{p.perfil_objetivo}</p>}
                  {p.descripcion && <p className="m-0 mt-1.5 text-[14px] leading-relaxed text-tinta-suave">{p.descripcion}</p>}
                </div>
                <p className="m-0 text-[13px] text-tinta-tenue">
                  {p.tareas.length} recursos en {dias} {dias === 1 ? "día" : "días"}
                  {porModulo.size > 0 && ` · ${[...porModulo.entries()].map(([m, n]) => `${m} ${n}`).join(", ")}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button dense variant="secondary" onClick={() => setEditando(p)}>
                    Editar
                  </Button>
                  <Button dense variant="secondary" onClick={() => duplicar(p)}>
                    Duplicar
                  </Button>
                  <Button dense variant="secondary" onClick={() => archivar(p, !p.archivada)}>
                    {p.archivada ? "Restaurar" : "Archivar"}
                  </Button>
                  <button type="button" onClick={() => borrar(p)} className="min-h-10 px-3 bg-transparent border-0 text-[13.5px] text-alerta-texto cursor-pointer">
                    Borrar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FilaBienvenida {
  id: string;
  dia_offset: number;
  hora: string | null;
  orden: number;
  activo: boolean;
  media_resource_id: string;
  media_resources: { titulo: string; codigo: string | null; modulo: ResourceModulo; media_kind: string | null } | { titulo: string; codigo: string | null; modulo: ResourceModulo; media_kind: string | null }[] | null;
}

// Recursos que recibe automáticamente toda cuenta nueva al terminar el
// cuestionario, antes de la aprobación (Fase 3.3). Día 1 = el día en que
// termina el cuestionario.
function RecursosBienvenida() {
  const queryClient = useQueryClient();
  const [agregar, setAgregar] = useState(false);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [editando, setEditando] = useState<MediaResource | null>(null);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  // Abre el recurso completo en el mismo editor de la Biblioteca (video,
  // texto, pasos…). Los cambios se ven en todas las cuentas que lo tienen.
  async function abrir(id: string) {
    setError("");
    const { data, error: e } = await supabase.from("media_resources").select("*").eq("id", id).single();
    if (e) setError(e.message);
    else setEditando(data as MediaResource);
  }
  const { data: filas } = useQuery({
    queryKey: ["recursos-bienvenida"],
    queryFn: async () => {
      const { data, error: e } = await supabase.from("recursos_bienvenida").select("id, dia_offset, hora, orden, activo, media_resource_id, media_resources(titulo, codigo, modulo, media_kind)").order("dia_offset").order("orden");
      if (e) throw e;
      return (data ?? []) as FilaBienvenida[];
    },
  });
  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["recursos-bienvenida"] });
    queryClient.invalidateQueries({ queryKey: ["media-resources"] });
    queryClient.invalidateQueries({ queryKey: ["media-resources-active"] });
  };
  async function cambiar(id: string, cambios: Record<string, unknown>) {
    const { error: e } = await supabase.from("recursos_bienvenida").update(cambios).eq("id", id);
    if (e) setError(e.message);
    refrescar();
  }
  async function quitar(id: string) {
    const { error: e } = await supabase.from("recursos_bienvenida").delete().eq("id", id);
    if (e) setError(e.message);
    refrescar();
  }
  async function sumar(r: MediaResource) {
    setAgregar(false);
    const { error: e } = await supabase.from("recursos_bienvenida").insert({ media_resource_id: r.id, dia_offset: 0, orden: (filas?.length ?? 0) + 1 });
    if (e) setError(e.message);
    refrescar();
  }
  return (
    <div className="grid gap-4">
      <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave max-w-[52em]">
        Toda cuenta nueva los recibe al terminar el cuestionario, sin esperar la aprobación. Se ven igual que los recursos reales y quedan
        marcados como bienvenida en el panel y las métricas. Los cambios aplican a las cuentas nuevas.
      </p>
      {error && <p className="m-0 text-[14px] text-alerta-texto">{error}</p>}
      {aviso && <p className="m-0 rounded-2xl bg-verde-tenue px-4 py-2.5 text-[14px] text-verde-profundo">{aviso}</p>}
      <ul className="list-none m-0 p-0 grid gap-2">
        {(filas ?? []).map((f) => {
          const r = uno(f.media_resources);
          return (
            <li key={f.id} className={`rounded-2xl bg-white border border-borde px-4 py-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center ${f.activo ? "" : "opacity-60"}`}>
              <button type="button" onClick={() => abrir(f.media_resource_id)} className="text-left bg-transparent border-0 p-0 cursor-pointer font-sans group" title="Abrir y editar el recurso">
                <span className="block text-[14.5px] font-semibold text-tinta group-hover:text-verde-profundo group-hover:underline underline-offset-4">{r?.titulo}</span>
                <span className="block text-[12.5px] text-tinta-tenue">
                  {r?.codigo ? `${r.codigo} · ` : ""}
                  {r ? moduloLabel[r.modulo] : ""}
                  {r?.media_kind ? ` · ${r.media_kind === "video" ? "video" : r.media_kind}` : ""}
                </span>
              </button>
              <div className="flex gap-1.5">
                <Button dense variant="secondary" onClick={() => abrir(f.media_resource_id)}>
                  Abrir y editar
                </Button>
                <Button dense variant="secondary" onClick={() => setCambiando(f.id)}>
                  Cambiar
                </Button>
              </div>
              <label className="flex items-center gap-2 text-[13px] text-tinta-suave">
                Día
                <select value={f.dia_offset} onChange={(e) => cambiar(f.id, { dia_offset: Number(e.target.value) })} className="min-h-9 px-2 rounded-lg border border-borde-campo font-sans text-[13.5px]">
                  {Array.from({ length: 7 }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-tinta-suave cursor-pointer">
                <input type="checkbox" checked={f.activo} onChange={(e) => cambiar(f.id, { activo: e.target.checked })} /> Activo
              </label>
              <button type="button" onClick={() => quitar(f.id)} className="min-h-9 px-2 bg-transparent border-0 text-[13px] text-alerta-texto cursor-pointer">
                Quitar
              </button>
            </li>
          );
        })}
      </ul>
      <div>
        <Button dense variant="secondary" onClick={() => setAgregar(true)}>
          + Agregar recurso
        </Button>
      </div>
      {agregar && <SelectorRecurso titulo="Agregar a la bienvenida" onElegir={sumar} onClose={() => setAgregar(false)} />}
      {cambiando && (
        <SelectorRecurso
          titulo="Cambiar por otro recurso"
          onElegir={(r) => {
            const id = cambiando;
            setCambiando(null);
            cambiar(id, { media_resource_id: r.id });
          }}
          onClose={() => setCambiando(null)}
        />
      )}
      {editando && (
        <ResourceEditor
          resource={editando}
          onClose={() => setEditando(null)}
          onSaved={(msg) => {
            setAviso(msg);
            refrescar();
          }}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

export function Plantillas() {
  const [tab, setTab] = useState<"plantillas" | "bienvenida">("plantillas");
  return (
    <div className="im-in max-w-[1180px] mx-auto px-5 py-8 sm:px-8 lg:py-10 grid gap-6">
      <div>
        <p className="m-0 mb-1 text-[13px] tracking-[0.14em] uppercase text-tinta-tenue">Plantillas</p>
        <h1 className="m-0 font-serif font-normal text-[30px] sm:text-[36px]">Semanas tipo y bienvenida</h1>
      </div>
      <div role="tablist" className="flex gap-2">
        {(
          [
            ["plantillas", "Plantillas de semana"],
            ["bienvenida", "Recursos de bienvenida"],
          ] as const
        ).map(([k, t]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-10 px-4 rounded-full border-0 font-sans font-semibold text-[14.5px] cursor-pointer ${tab === k ? "bg-tinta text-white" : "bg-campo text-tinta-suave"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "plantillas" ? <ListaPlantillas /> : <RecursosBienvenida />}
    </div>
  );
}
