// Plantillas de semana (Fase 4.4): tipos y carga, compartidos por la página
// de Plantillas y el planificador del paciente.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { ResourceModulo } from "./modulos";
import { DIAS } from "./planWeek";
import type { MediaResource, ResourceExtras } from "./mediaResources";
import type { Nivel } from "./actividades/contrato";
import type { DraftTask } from "../components/profesional/paciente/TaskEditorModal";
import { evaluarAsignacion, gruposDeLaSemana, type PerfilRecursos } from "./reglasRecursos";
import type { TareaIA, CambioIA } from "../../supabase/functions/_shared/validarCambiosIA.ts";

export interface TareaPlantilla {
  key: string;
  dia_idx: number;
  hora: string;
  media_resource_id: string;
  titulo: string;
  codigo: string | null;
  modulo: ResourceModulo;
  // Dificultad de una actividad interactiva (vacío = la del recurso).
  nivel_interactivo: Nivel | null;
  extras: ResourceExtras | null;
}

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string | null;
  perfil_objetivo: string | null;
  archivada: boolean;
  updated_at: string;
  tareas: TareaPlantilla[];
}

interface FilaTarea {
  id: string;
  dia_idx: number;
  hora: string | null;
  media_resource_id: string;
  orden: number;
  nivel_interactivo: Nivel | null;
  media_resources: FilaRecurso | FilaRecurso[] | null;
}
type FilaRecurso = { titulo: string; codigo: string | null; modulo: ResourceModulo; extras: ResourceExtras | null };

export const uno = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);

export function usePlantillas() {
  return useQuery({
    queryKey: ["plantillas-semana"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plantillas_semana")
        .select("id, nombre, descripcion, perfil_objetivo, archivada, updated_at, plantilla_tareas(id, dia_idx, hora, media_resource_id, orden, nivel_interactivo, media_resources(titulo, codigo, modulo, extras))")
        .order("nombre");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        tareas: ((p.plantilla_tareas ?? []) as FilaTarea[])
          .sort((a, b) => a.dia_idx - b.dia_idx || a.orden - b.orden)
          .map((t) => {
            const r = uno(t.media_resources);
            return {
              key: t.id,
              dia_idx: t.dia_idx,
              hora: t.hora ?? "",
              media_resource_id: t.media_resource_id,
              titulo: r?.titulo ?? "Recurso",
              codigo: r?.codigo ?? null,
              modulo: r?.modulo ?? "cognicion",
              nivel_interactivo: t.nivel_interactivo ?? null,
              extras: r?.extras ?? null,
            };
          }),
      })) as Plantilla[];
    },
  });
}


// Catálogo activo de recursos (mismo cache que el editor de tareas).
export function useCatalogo() {
  return useQuery({
    queryKey: ["media-resources-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_resources").select("*").eq("activo", true).order("titulo");
      if (error) throw error;
      return data as MediaResource[];
    },
  });
}


// ─── Partir de una plantilla en el planificador (Fases 4.4 y 4.5) ─────

let seqDraft = 0;
export function draftDesdeRecurso(r: MediaResource, dia: string, hora: string, nivel: Nivel | null = null): DraftTask {
  seqDraft += 1;
  return {
    key: `p${seqDraft}`,
    dia,
    hora,
    titulo: r.titulo,
    tipo: r.tipo,
    duracion: r.duracion ?? "",
    detalle: r.detalle ?? "",
    precaucion: r.precaucion ?? "",
    pasos: (r.pasos ?? []).join("\n"),
    porQue: r.por_que ?? "",
    notaClinica: "",
    mediaResourceId: r.id,
    modulo: r.modulo,
    indicacionIndividual: "",
    nivelInteractivo: r.extras?.modo === "interactiva" ? nivel : null,
  };
}

// Por cada tarea de la plantilla: si el paciente la puede hacer y qué
// recursos del catálogo podrían reemplazarla (misma área, permitidos por
// las reglas de seguridad con el resto de la semana).
export function tareasParaIA(plantilla: Plantilla, catalogo: MediaResource[], perfil: PerfilRecursos | null, maxCandidatos = 12): TareaIA[] {
  const porId = new Map(catalogo.map((r) => [r.id, r]));
  return plantilla.tareas.map((t) => {
    const r = porId.get(t.media_resource_id);
    const otros = plantilla.tareas.filter((x) => x.key !== t.key).map((x) => porId.get(x.media_resource_id)).filter((x): x is MediaResource => !!x);
    const ctx = { gruposSemana: gruposDeLaSemana(otros) };
    const ev = r && perfil ? evaluarAsignacion(r, perfil, ctx) : { permitido: true as const };
    const enUso = new Set(plantilla.tareas.map((x) => x.media_resource_id));
    const candidatos = catalogo
      .filter((c) => c.modulo === t.modulo && !enUso.has(c.id) && c.estado_clinico !== "bloqueado" && (!perfil || evaluarAsignacion(c, perfil, ctx).permitido))
      .slice(0, maxCandidatos)
      .map((c) => ({ id: c.id, titulo: c.titulo }));
    return {
      id: t.key,
      dia_idx: t.dia_idx,
      titulo: t.titulo,
      modulo: t.modulo,
      permitido: ev.permitido,
      motivo: ev.permitido ? null : ev.motivo,
      candidatos,
    };
  });
}

export interface CambioVisible {
  tipo: "reemplazar" | "mover";
  quitado: string;
  puesto: string | null;
  diaDe: number;
  diaA: number;
  justificacion: string;
  obligatorio: boolean;
}

// Aplica los cambios ya validados y arma los borradores de la semana.
export function aplicarCambios(
  plantilla: Plantilla,
  cambios: CambioIA[],
  catalogo: MediaResource[],
  dias: { dia: string }[],
): { drafts: DraftTask[]; visibles: CambioVisible[]; fueraDeSemana: string[] } {
  const porId = new Map(catalogo.map((r) => [r.id, r]));
  const porTarea = new Map(cambios.map((c) => [c.tarea_id, c]));
  const drafts: DraftTask[] = [];
  const visibles: CambioVisible[] = [];
  const fueraDeSemana: string[] = [];
  for (const t of plantilla.tareas) {
    const c = porTarea.get(t.key);
    let recurso = porId.get(t.media_resource_id);
    let diaIdx = t.dia_idx;
    if (c?.accion === "reemplazar") {
      const nuevo = porId.get(c.recurso_id);
      if (nuevo) {
        visibles.push({ tipo: "reemplazar", quitado: t.titulo, puesto: nuevo.titulo, diaDe: t.dia_idx, diaA: t.dia_idx, justificacion: c.justificacion, obligatorio: c.obligatorio });
        recurso = nuevo;
      }
    } else if (c?.accion === "mover") {
      visibles.push({ tipo: "mover", quitado: t.titulo, puesto: null, diaDe: t.dia_idx, diaA: c.dia_idx, justificacion: c.justificacion, obligatorio: false });
      diaIdx = c.dia_idx;
    }
    if (!recurso) continue;
    // dia_idx es el día de la semana (0 = domingo … 6 = sábado), como en
    // el calendario de la plantilla. Si la semana del paciente empieza a
    // mitad de semana, los días que no tiene quedan afuera y se avisa.
    const dia = dias.find((d) => d.dia === DIAS[diaIdx])?.dia;
    if (!dia) {
      fueraDeSemana.push(recurso.titulo);
      continue;
    }
    // La dificultad elegida en la plantilla se conserva si el recurso no cambió.
    drafts.push(draftDesdeRecurso(recurso, dia, t.hora, recurso.id === t.media_resource_id ? t.nivel_interactivo : null));
  }
  return { drafts, visibles, fueraDeSemana };
}
