import { DIAS } from "./planWeek";
import { draftDesdeRecurso, type TareaPlantilla } from "./plantillas";
import { hora5, recursoPorId, type Cambio, type Pos, type Rec } from "./revisiones";
import type { MediaResource } from "./mediaResources";
import type { DraftTask } from "../components/profesional/paciente/TaskEditorModal";
import type { ResourceModulo } from "./modulos";

// Aplica una sugerencia aceptada sobre lo que se está editando: la plantilla
// (días 0 a 6) o el borrador de la semana del paciente (días por nombre).
// Devuelve el resultado o un error para mostrar en el panel.
type Resultado<T> = { ok: T } | { error: string };
const NO_ESTA = "Esa actividad ya no está donde la vio quien revisó: aplicalo a mano y marcala como resuelta.";

// ─── Plantilla ───
function buscarEnPlantilla(ts: TareaPlantilla[], en: Pos, r: Rec) {
  return ts.find((t) => t.dia_idx === en.dia && hora5(t.hora) === en.hora && t.media_resource_id === r.id) ?? ts.find((t) => t.dia_idx === en.dia && t.media_resource_id === r.id);
}
const desdeRecursoPlantilla = (r: MediaResource, pos: Pos): TareaPlantilla => ({
  key: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  dia_idx: pos.dia,
  hora: pos.hora,
  media_resource_id: r.id,
  titulo: r.titulo,
  codigo: r.codigo,
  modulo: r.modulo as ResourceModulo,
  nivel_interactivo: null,
  extras: r.extras ?? null,
});

export async function aplicarEnPlantilla(ts: TareaPlantilla[], c: Cambio): Promise<Resultado<TareaPlantilla[]>> {
  if (c.op === "valor") return { error: "No aplica a una plantilla." };
  if (c.op === "agregar") {
    const r = c.hacia.id ? await recursoPorId(c.hacia.id) : null;
    if (!r) return { error: "No encontramos ese recurso en la biblioteca." };
    return { ok: [...ts, desdeRecursoPlantilla(r, c.a)] };
  }
  const t = buscarEnPlantilla(ts, c.en, c.op === "reemplazar" ? c.desde : c.recurso);
  if (!t) return { error: NO_ESTA };
  if (c.op === "quitar") return { ok: ts.filter((x) => x.key !== t.key) };
  if (c.op === "mover") return { ok: ts.map((x) => (x.key === t.key ? { ...x, dia_idx: c.a.dia, hora: c.a.hora } : x)) };
  if (c.op === "nivel") return { ok: ts.map((x) => (x.key === t.key ? { ...x, nivel_interactivo: c.nivel } : x)) };
  const r = c.hacia.id ? await recursoPorId(c.hacia.id) : null;
  if (!r) return { error: "No encontramos ese recurso en la biblioteca." };
  return { ok: ts.map((x) => (x.key === t.key ? { ...desdeRecursoPlantilla(r, { dia: x.dia_idx, hora: x.hora }), key: x.key } : x)) };
}

// ─── Borrador de la semana ───
function buscarEnBorrador(ds: DraftTask[], en: Pos, r: Rec, flexible: boolean) {
  const dia = DIAS[en.dia];
  return (
    ds.find((d) => d.dia === dia && hora5(d.hora) === en.hora && d.mediaResourceId === r.id) ??
    ds.find((d) => d.dia === dia && d.mediaResourceId === r.id) ??
    // Lo que viene del seguimiento es de otra semana: basta con el recurso.
    (flexible ? ds.find((d) => d.mediaResourceId === r.id) : undefined)
  );
}

export async function aplicarEnBorrador(
  ds: DraftTask[],
  c: Cambio,
  opts: { diasSemana: string[]; flexible?: boolean; validar?: (r: MediaResource) => string | null; nivelPara?: (r: MediaResource) => DraftTask["nivelInteractivo"] },
): Promise<Resultado<DraftTask[]>> {
  if (c.op === "valor") return { error: "No aplica a una semana." };
  const nuevo = async (rec: Rec, pos: Pos): Promise<Resultado<DraftTask>> => {
    const r = rec.id ? await recursoPorId(rec.id) : null;
    if (!r) return { error: "No encontramos ese recurso en la biblioteca." };
    const motivo = opts.validar?.(r);
    if (motivo) return { error: `No se puede aplicar: ${motivo}` };
    const dia = DIAS[pos.dia];
    if (!opts.diasSemana.includes(dia)) return { error: `El ${dia.toLowerCase()} no está en esta semana: elegí otro día a mano.` };
    return { ok: draftDesdeRecurso(r, dia, pos.hora, opts.nivelPara?.(r) ?? null) };
  };
  if (c.op === "agregar") {
    const d = await nuevo(c.hacia, c.a);
    return "error" in d ? d : { ok: [...ds, d.ok] };
  }
  const t = buscarEnBorrador(ds, c.en, c.op === "reemplazar" ? c.desde : c.recurso, !!opts.flexible);
  if (!t) return { error: NO_ESTA };
  if (c.op === "quitar") return { ok: ds.filter((x) => x.key !== t.key) };
  if (c.op === "mover") {
    const dia = DIAS[c.a.dia];
    if (!opts.diasSemana.includes(dia)) return { error: `El ${dia.toLowerCase()} no está en esta semana: elegí otro día a mano.` };
    return { ok: ds.map((x) => (x.key === t.key ? { ...x, dia, hora: c.a.hora } : x)) };
  }
  if (c.op === "nivel") return { ok: ds.map((x) => (x.key === t.key ? { ...x, nivelInteractivo: c.nivel } : x)) };
  const d = await nuevo(c.hacia, { dia: DIAS.indexOf(t.dia), hora: t.hora });
  return "error" in d ? d : { ok: ds.map((x) => (x.key === t.key ? { ...d.ok, key: x.key } : x)) };
}
