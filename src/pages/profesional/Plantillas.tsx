import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { moduloLabel, type MediaResource } from "../../lib/mediaResources";
import { moduloTheme, type ResourceModulo } from "../../lib/modulos";
import { Button } from "../../components/ui/Button";
import { SelectorRecurso } from "../../components/profesional/SelectorRecurso";
import { IconoInteractivo, NivelInteractivo } from "../../components/profesional/NivelInteractivo";
import { esInteractivo } from "../../lib/clasificarNumeros";
import { nivelLabel } from "../../lib/actividades/contrato";
import { usePlantillas, uno, type Plantilla, type TareaPlantilla } from "../../lib/plantillas";
import { DIAS, enFila, formatHora } from "../../lib/planWeek";
import { CalendarioSemana } from "../../components/profesional/CalendarioSemana";
import { Modal } from "../../components/ui/Modal";
import { ResourceEditor } from "../../components/profesional/ResourceEditor";
import { RowMenu } from "../../components/ui/RowMenu";
import { Caja, CajaAviso, CajaBarra, CajaCuerpo, CajaPestanas, Pagina } from "../../components/profesional/Caja";

// Plantillas de semana (Fase 4.4) y recursos automáticos (antes «de bienvenida»).
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
    const nueva: TareaPlantilla = { key: nuevaKey(), dia_idx: dia, hora, media_resource_id: r.id, titulo: r.titulo, codigo: r.codigo, modulo: r.modulo, nivel_interactivo: null, extras: r.extras ?? null };
    setTareas((t) => [...t, nueva]);
    setAgregarEn(null);
    // Actividad interactiva: se pregunta la dificultad al agregarla.
    if (r.extras?.modo === "interactiva") setEditandoTarea(nueva);
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
        .insert(
          tareas.map((t, i) => ({
            plantilla_id: id,
            dia_idx: t.dia_idx,
            hora: t.hora || null,
            media_resource_id: t.media_resource_id,
            orden: i,
            nivel_interactivo: t.extras?.modo === "interactiva" ? t.nivel_interactivo : null,
          })),
        );
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
    <div className="grid gap-5">
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
      <div className="rounded-[22px] border border-borde overflow-hidden">
        <p className="m-0 px-5 py-3 bg-[#fcfbf6] border-b border-borde-suave text-[14px] text-tinta-suave">
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
                  {esInteractivo(t.extras) ? (
                    <span className="flex items-center gap-1 text-[10.5px] opacity-90">
                      <IconoInteractivo /> Interactivo{t.nivel_interactivo ? ` · ${nivelLabel[t.nivel_interactivo]}` : ""}
                    </span>
                  ) : (
                    <span className="block text-[10.5px] opacity-80">
                      {t.codigo ? `${t.codigo} · ` : ""}
                      {moduloLabel[t.modulo]}
                    </span>
                  )}
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
    </div>
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
          setT({ ...t, media_resource_id: r.id, titulo: r.titulo, codigo: r.codigo, modulo: r.modulo, extras: r.extras ?? null, nivel_interactivo: null });
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
      {t.extras?.modo === "interactiva" && <NivelInteractivo extras={t.extras} valor={t.nivel_interactivo} onChange={(n) => setT({ ...t, nivel_interactivo: n })} />}
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

// Mini semana para la tarjeta: una columna por día con un punto por recurso,
// del color de su módulo (como la franja de las tarjetas de Biblioteca).
function SemanaMini({ p }: { p: Plantilla }) {
  return (
    <div className="relative h-32 shrink-0 overflow-hidden bg-[linear-gradient(135deg,#6a969c,#3f6a70)] px-4 pt-3.5 pb-3 flex flex-col">
      <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/18 text-white text-[10.5px] font-semibold uppercase tracking-[0.06em] backdrop-blur-sm">
        Semana tipo
      </span>
      <div className="mt-auto grid grid-cols-7 gap-1.5 items-end" aria-hidden="true">
        {DIAS.map((d, i) => {
          const del = p.tareas.filter((t) => t.dia_idx === i);
          return (
            <div key={d} className="grid gap-1 justify-items-center">
              <div className="flex flex-col-reverse items-center gap-[3px] min-h-[46px]">
                {del.slice(0, 6).map((t) => (
                  <span key={t.key} className="w-3.5 h-[6px] rounded-full" style={{ background: moduloTheme[t.modulo]?.from ?? "#fff" }} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-white/75">{d.slice(0, 2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListaPlantillas({ verArchivadas, busqueda, onEditar, onAviso }: { verArchivadas: boolean; busqueda: string; onEditar: (p: Plantilla | "nueva") => void; onAviso: (texto: string, error?: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: plantillas, isLoading } = usePlantillas();

  async function duplicar(p: Plantilla) {
    const { error: e } = await supabase.rpc("duplicar_plantilla", { p_id: p.id });
    if (e) onAviso(e.message, true);
    else onAviso(`Se duplicó «${p.nombre}».`);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
  }
  async function archivar(p: Plantilla, archivada: boolean) {
    const { error: e } = await supabase.from("plantillas_semana").update({ archivada }).eq("id", p.id);
    if (e) onAviso(e.message, true);
    else onAviso(archivada ? `«${p.nombre}» se archivó.` : `«${p.nombre}» volvió a las activas.`);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
  }
  async function borrar(p: Plantilla) {
    if (!window.confirm(`¿Borrar la plantilla «${p.nombre}»? No afecta a las semanas ya publicadas.`)) return;
    const { error: e } = await supabase.from("plantillas_semana").delete().eq("id", p.id);
    if (e) onAviso(e.message, true);
    else onAviso(`«${p.nombre}» se borró.`);
    queryClient.invalidateQueries({ queryKey: ["plantillas-semana"] });
  }

  const q = busqueda.trim().toLowerCase();
  const visibles = (plantillas ?? []).filter((p) => p.archivada === verArchivadas && (!q || `${p.nombre} ${p.perfil_objetivo ?? ""} ${p.descripcion ?? ""}`.toLowerCase().includes(q)));
  if (isLoading) return <p className="m-0 text-sm text-tinta-tenue">Cargando…</p>;
  if (visibles.length === 0)
    return (
      <div className="rounded-[22px] border-[1.5px] border-dashed border-borde-campo bg-campo/50 py-12 px-6 text-center">
        <p className="m-0 font-serif text-[22px] text-tinta">{q ? "Ninguna plantilla coincide" : verArchivadas ? "No hay plantillas archivadas" : "Todavía no hay plantillas"}</p>
        <p className="m-0 mt-1 text-[14px] text-tinta-suave">{q ? "Probá con otra búsqueda." : verArchivadas ? "Las que archives aparecen acá." : "Creá la primera con los recursos de una semana tipo."}</p>
        {!q && !verArchivadas && (
          <div className="mt-5">
            <Button dense onClick={() => onEditar("nueva")}>
              + Nueva plantilla
            </Button>
          </div>
        )}
      </div>
    );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {visibles.map((p) => {
        const dias = new Set(p.tareas.map((t) => t.dia_idx)).size;
        const porModulo = new Map<ResourceModulo, number>();
        for (const t of p.tareas) porModulo.set(t.modulo, (porModulo.get(t.modulo) ?? 0) + 1);
        return (
          <article
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onEditar(p)}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onEditar(p);
              }
            }}
            className={`group relative flex flex-col rounded-[22px] border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-elevada focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-profundo ${
              p.archivada ? "border-borde-suave bg-campo/60 opacity-80" : "border-borde bg-white"
            }`}
          >
            <SemanaMini p={p} />
            <div className="absolute top-2.5 right-2.5" onClick={(e) => e.stopPropagation()}>
              <span className="w-9 h-9 rounded-full bg-white/90 inline-flex items-center justify-center">
                <RowMenu
                  items={[
                    { label: "Editar", onClick: () => onEditar(p) },
                    { label: "Duplicar", onClick: () => duplicar(p) },
                    { label: p.archivada ? "Restaurar" : "Archivar", onClick: () => archivar(p, !p.archivada) },
                    { label: "Borrar", danger: true, onClick: () => borrar(p) },
                  ]}
                />
              </span>
            </div>
            <div className="flex flex-col flex-1 gap-2 p-4.5">
              <h3 className="m-0 text-[17px] font-bold leading-snug text-tinta group-hover:text-verde-profundo">{p.nombre}</h3>
              {p.perfil_objetivo && <p className="m-0 text-[13.5px] font-semibold text-verde-profundo">{p.perfil_objetivo}</p>}
              {p.descripcion && <p className="m-0 text-[14px] leading-relaxed text-tinta-suave line-clamp-3">{p.descripcion}</p>}
              <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-campo border border-borde-suave text-[12px] font-bold text-tinta-suave">
                  {p.tareas.length} {p.tareas.length === 1 ? "recurso" : "recursos"} · {dias} {dias === 1 ? "día" : "días"}
                </span>
                {[...porModulo.entries()].map(([m, n]) => (
                  <span key={m} className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-bold" style={{ background: `${moduloTheme[m]?.from}55`, color: moduloTheme[m]?.ink }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: moduloTheme[m]?.to }} />
                    {moduloLabel[m]} {n}
                  </span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type Disparador = "cuenta_creada" | "cuenta_aprobada" | "primera_semana" | "cada_semana" | "inmediato";

interface FilaAutomatico {
  id: string;
  dia_offset: number;
  hora: string | null;
  orden: number;
  activo: boolean;
  disparador: Disparador;
  aplicado_en: string | null;
  aplicado_cuentas: number | null;
  media_resource_id: string;
  media_resources: { titulo: string; codigo: string | null; modulo: ResourceModulo; media_kind: string | null } | { titulo: string; codigo: string | null; modulo: ResourceModulo; media_kind: string | null }[] | null;
}

// Cuándo se agrega cada grupo de recursos y qué significa «día» en cada caso.
const DISPARADORES: { id: Disparador; titulo: string; detalle: string; dia: string }[] = [
  {
    id: "cuenta_creada",
    titulo: "Al crear la cuenta",
    detalle: "Cuando la familia termina el cuestionario, sin esperar la aprobación. Arman un plan de bienvenida para conocer la app.",
    dia: "Día 1 = el día en que termina el cuestionario.",
  },
  {
    id: "cuenta_aprobada",
    titulo: "Al aprobar la cuenta",
    detalle: "Cuando la clínica aprueba la cuenta (empieza la semana gratis). Se suman a la semana en curso o, si no hay, a una de bienvenida.",
    dia: "Día 1 = el día de la aprobación.",
  },
  {
    id: "primera_semana",
    titulo: "Al asignar la primera semana",
    detalle: "Se suman a la primera semana que publica la clínica para esa cuenta.",
    dia: "Día 1 = el primer día de esa semana.",
  },
  {
    id: "cada_semana",
    titulo: "Al asignar cualquier semana",
    detalle: "Se suman a cada semana que publica la clínica, también la primera.",
    dia: "Día 1 = el primer día de cada semana.",
  },
  {
    id: "inmediato",
    titulo: "Aplicación inmediata",
    detalle:
      "Se agregan una sola vez, cuando tocás «Aplicar ahora», a todas las cuentas con una semana en curso (no rechazadas). Después el recurso queda desactivado.",
    dia: "Día 1 = hoy. Nunca pasan del final de la semana de cada cuenta.",
  },
];

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

// Recursos automáticos (antes «recursos de bienvenida»): se agregan solos al
// plan de una cuenta según un disparador. La lógica vive en la base
// (migración 20261109010000_recursos_automaticos.sql).
function RecursosAutomaticos() {
  const queryClient = useQueryClient();
  const [agregarEn, setAgregarEn] = useState<Disparador | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [editando, setEditando] = useState<MediaResource | null>(null);
  const [aplicando, setAplicando] = useState<string | null>(null);
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
    queryKey: ["recursos-automaticos"],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from("recursos_automaticos")
        .select("id, dia_offset, hora, orden, activo, disparador, aplicado_en, aplicado_cuentas, media_resource_id, media_resources(titulo, codigo, modulo, media_kind)")
        .order("dia_offset")
        .order("orden");
      if (e) throw e;
      return (data ?? []) as FilaAutomatico[];
    },
  });
  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["recursos-automaticos"] });
    queryClient.invalidateQueries({ queryKey: ["media-resources"] });
    queryClient.invalidateQueries({ queryKey: ["media-resources-active"] });
  };
  async function cambiar(id: string, cambios: Record<string, unknown>) {
    setError("");
    const { error: e } = await supabase.from("recursos_automaticos").update(cambios).eq("id", id);
    if (e) setError(e.message);
    refrescar();
  }
  async function quitar(id: string) {
    setError("");
    const { error: e } = await supabase.from("recursos_automaticos").delete().eq("id", id);
    if (e) setError(e.message);
    refrescar();
  }
  async function sumar(disparador: Disparador, r: MediaResource) {
    setAgregarEn(null);
    setError("");
    const enGrupo = (filas ?? []).filter((f) => f.disparador === disparador).length;
    const { error: e } = await supabase.from("recursos_automaticos").insert({ media_resource_id: r.id, dia_offset: 0, orden: enGrupo + 1, disparador });
    if (e) setError(e.message);
    refrescar();
  }
  async function aplicarAhora(f: FilaAutomatico, titulo: string) {
    if (!window.confirm(`¿Agregar «${titulo}» ahora a todas las cuentas con una semana en curso? Se aplica una sola vez y después queda desactivado.`)) return;
    setError("");
    setAviso("");
    setAplicando(f.id);
    const { data, error: e } = await supabase.rpc("aplicar_recurso_inmediato", { p_recurso: f.id });
    setAplicando(null);
    if (e) setError(e.message);
    else setAviso(`Listo: «${titulo}» se agregó a ${data} ${data === 1 ? "cuenta" : "cuentas"}.`);
    refrescar();
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  }

  return (
    <div className="grid">
      {error && <p className="m-0 mb-4 rounded-2xl bg-alerta px-4 py-2.5 text-[14px] text-alerta-texto">{error}</p>}
      {aviso && (
        <p className="m-0 mb-4 rounded-2xl bg-verde-tenue px-4 py-2.5 text-[14px] text-verde-profundo" role="status">
          {aviso}
        </p>
      )}

      {DISPARADORES.map((d) => {
        const grupo = (filas ?? []).filter((f) => f.disparador === d.id);
        const inmediato = d.id === "inmediato";
        return (
          <section key={d.id} className="grid gap-3.5 py-6 first-of-type:pt-0 last:pb-0 border-t first-of-type:border-t-0 border-borde-suave" aria-labelledby={`disp-${d.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-[46em]">
                <h3 id={`disp-${d.id}`} className="m-0 text-[17px] font-extrabold text-tinta">
                  {d.titulo}
                  <span className="ml-2 align-middle rounded-full bg-campo border border-borde px-2.5 py-0.5 text-[12.5px] font-extrabold text-tinta-suave">{grupo.length}</span>
                </h3>
                <p className="m-0 mt-1 text-[14px] leading-relaxed text-tinta-suave">{d.detalle}</p>
                <p className="m-0 mt-0.5 text-[13px] text-tinta-tenue">{d.dia}</p>
              </div>
              <Button dense variant="secondary" onClick={() => setAgregarEn(d.id)}>
                + Agregar recurso
              </Button>
            </div>

            {grupo.length === 0 ? (
              <p className="m-0 rounded-2xl border border-dashed border-borde-campo px-4 py-3 text-[14px] text-tinta-tenue">Ningún recurso todavía.</p>
            ) : (
              <ul className="list-none m-0 p-0 grid gap-2">
                {grupo.map((f) => {
                  const r = uno(f.media_resources);
                  const titulo = r?.titulo ?? "Recurso";
                  const yaAplicado = inmediato && !!f.aplicado_en;
                  return (
                    <li
                      key={f.id}
                      className={`rounded-2xl bg-campo/60 border border-borde-suave px-4 py-3 grid gap-2.5 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center ${f.activo ? "" : "opacity-70"}`}
                    >
                      <button type="button" onClick={() => abrir(f.media_resource_id)} className="text-left bg-transparent border-0 p-0 cursor-pointer font-sans group" title="Abrir y editar el recurso">
                        <span className="block text-[14.5px] font-semibold text-tinta group-hover:text-verde-profundo group-hover:underline underline-offset-4">{titulo}</span>
                        <span className="block text-[12.5px] text-tinta-tenue">
                          {r?.codigo ? `${r.codigo} · ` : ""}
                          {r ? moduloLabel[r.modulo] : ""}
                          {r?.media_kind ? ` · ${r.media_kind === "video" ? "video" : r.media_kind}` : ""}
                        </span>
                        {yaAplicado && (
                          <span className="mt-1 inline-block rounded-full bg-[#e3efe3] px-2.5 py-0.5 text-[12px] font-semibold text-semaforo-verde-texto">
                            Aplicado el {fechaCorta(f.aplicado_en!)} · {f.aplicado_cuentas ?? 0} {f.aplicado_cuentas === 1 ? "cuenta" : "cuentas"}
                          </span>
                        )}
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        <Button dense variant="secondary" onClick={() => abrir(f.media_resource_id)}>
                          Abrir y editar
                        </Button>
                        <Button dense variant="secondary" onClick={() => setCambiando(f.id)}>
                          Cambiar
                        </Button>
                      </div>
                      <label className="flex items-center gap-2 text-[13px] text-tinta-suave">
                        Día
                        <select value={f.dia_offset} onChange={(e) => cambiar(f.id, { dia_offset: Number(e.target.value) })} className="min-h-9 px-2 rounded-lg border border-borde-campo bg-white font-sans text-[13.5px]">
                          {Array.from({ length: 7 }, (_, i) => (
                            <option key={i} value={i}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {inmediato ? (
                          f.activo ? (
                            <Button dense onClick={() => aplicarAhora(f, titulo)} disabled={aplicando === f.id}>
                              {aplicando === f.id ? "Aplicando…" : "Aplicar ahora"}
                            </Button>
                          ) : (
                            <Button dense variant="secondary" onClick={() => cambiar(f.id, { activo: true, aplicado_en: null, aplicado_cuentas: null })}>
                              Preparar de nuevo
                            </Button>
                          )
                        ) : (
                          <label className="flex items-center gap-2 text-[13px] text-tinta-suave cursor-pointer">
                            <input type="checkbox" checked={f.activo} onChange={(e) => cambiar(f.id, { activo: e.target.checked })} /> Activo
                          </label>
                        )}
                        <button type="button" onClick={() => quitar(f.id)} className="min-h-9 px-2 bg-transparent border-0 text-[13px] text-alerta-texto cursor-pointer">
                          Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {agregarEn && (
        <SelectorRecurso
          titulo={`Agregar: ${DISPARADORES.find((d) => d.id === agregarEn)!.titulo.toLowerCase()}`}
          onElegir={(r) => sumar(agregarEn, r)}
          onClose={() => setAgregarEn(null)}
        />
      )}
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

type PestanaPlantillas = "plantillas" | "automaticos";

export function Plantillas() {
  const [tab, setTab] = useState<PestanaPlantillas>("plantillas");
  const [editando, setEditando] = useState<Plantilla | "nueva" | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);
  const { data: plantillas } = usePlantillas();
  const activas = (plantillas ?? []).filter((p) => !p.archivada).length;
  const archivadas = (plantillas ?? []).length - activas;

  if (editando)
    return (
      <Pagina>
        <Caja
          eyebrow="Plantillas · semana tipo"
          titulo={editando === "nueva" ? "Nueva plantilla" : editando.nombre}
          descripcion="Elegí los recursos de cada día. En el planificador del paciente se puede partir de esta semana."
          acciones={
            <Button dense variant="secondary" onClick={() => setEditando(null)}>
              ← Volver a las plantillas
            </Button>
          }
        >
          <CajaCuerpo>
            <EditorPlantilla
              inicial={editando === "nueva" ? null : editando}
              onCerrar={() => {
                setEditando(null);
              }}
            />
          </CajaCuerpo>
        </Caja>
      </Pagina>
    );

  return (
    <Pagina>
      <Caja
        eyebrow="Plantillas"
        titulo="Semanas tipo y recursos automáticos"
        descripcion={
          tab === "plantillas"
            ? "Semanas armadas para un perfil, listas para usar como punto de partida al planificar."
            : "Recursos que se agregan solos al plan de cada cuenta: al crearla, al aprobarla, al asignar sus semanas o una sola vez, cuando vos decidas. Un recurso que ya está en esa semana no se repite."
        }
        acciones={
          tab === "plantillas" ? (
            <Button dense onClick={() => setEditando("nueva")}>
              + Nueva plantilla
            </Button>
          ) : undefined
        }
        pie={
          <CajaPestanas
            etiqueta="Plantillas"
            activa={tab}
            onCambiar={(t) => {
              setTab(t);
              setAviso(null);
            }}
            pestanas={[
              { id: "plantillas", label: "Plantillas de semana", n: activas },
              { id: "automaticos", label: "Recursos automáticos" },
            ]}
          />
        }
      >
        {aviso && <CajaAviso texto={aviso.texto} error={aviso.error} onCerrar={() => setAviso(null)} />}
        {tab === "plantillas" && (
          <CajaBarra>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plantilla o perfil"
              aria-label="Buscar plantilla o perfil"
              className="flex-1 min-w-[220px] max-w-[520px] min-h-11 px-4 rounded-full border-[1.5px] border-borde-campo bg-white font-sans text-[15px] text-tinta focus:border-verde-serenidad focus:outline-none"
            />
            <div role="group" aria-label="Mostrar" className="inline-flex p-1 rounded-full bg-white border-[1.5px] border-borde-campo">
              {(
                [
                  [false, `Activas · ${activas}`],
                  [true, `Archivadas · ${archivadas}`],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={verArchivadas === v}
                  onClick={() => setVerArchivadas(v)}
                  className={`h-9 px-3.5 rounded-full border-0 font-sans text-[13.5px] cursor-pointer ${verArchivadas === v ? "bg-tinta text-white font-bold" : "bg-transparent text-tinta-suave font-semibold hover:text-tinta"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CajaBarra>
        )}
        <CajaCuerpo>
          {tab === "plantillas" ? (
            <ListaPlantillas verArchivadas={verArchivadas} busqueda={busqueda} onEditar={setEditando} onAviso={(texto, error) => setAviso({ texto, error })} />
          ) : (
            <RecursosAutomaticos />
          )}
        </CajaCuerpo>
      </Caja>
    </Pagina>
  );
}
