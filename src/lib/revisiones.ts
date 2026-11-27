import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { DIAS } from "./planWeek";
import { moduloLabel, type ResourceModulo } from "./modulos";
import type { MediaResource } from "./mediaResources";
import { nivelLabel, type Nivel } from "./actividades/contrato";

// Revisiones del equipo integradas en cada pantalla
// (supabase/migrations/20261129000000_revisiones.sql). La revisión vive donde
// vive el trabajo: cada plantilla, borrador de semana, semana publicada y
// valoración tiene su estado; el equipo deja comentarios y sugerencias
// (cambios como datos) y la coordinación los acepta de un toque.

export type ObjetoRevision = "plantilla" | "borrador" | "plan" | "valoracion";
export type EstadoRev = "sin_revisar" | "en_revision" | "sugerencias" | "revisada" | "desactualizada";
export type Eje = "etapa" | "cognitivo" | "fisico" | "funcional" | "nutricional";

export const EJES: { id: Eje; label: string; area: string[] }[] = [
  { id: "etapa", label: "Etapa", area: ["Neuropsicología", "Estimulación cognitiva", "Geriatría"] },
  { id: "cognitivo", label: "Cognitivo", area: ["Neuropsicología", "Estimulación cognitiva"] },
  { id: "fisico", label: "Físico", area: ["Gerontogimnasia", "Fisioterapia"] },
  { id: "funcional", label: "Funcional", area: ["Terapia ocupacional", "Geriatría"] },
  { id: "nutricional", label: "Nutricional", area: ["Nutrición"] },
];
export const ejeLabel = (e: string | null | undefined) => EJES.find((x) => x.id === e)?.label ?? "General";

export interface TareaDeRevision {
  id: string;
  revisor: string;
  area: string | null;
  estado: "pendiente" | "en_curso" | "resuelta" | "cancelada";
  resultado: "aprobado" | "con_cambios" | "comentario" | null;
  eje: Eje | null;
  vence: string | null;
  resuelta_en: string | null;
  desactualizada: boolean;
}
export interface EstadoRevision {
  estado: EstadoRev;
  abiertas: number;
  tareas: TareaDeRevision[];
}

export interface Rec {
  id: string | null;
  titulo: string;
  codigo?: string | null;
  modulo?: string | null;
}
// Día de 0 (domingo) a 6 y hora "HH:MM" o "" (sin hora fija).
export interface Pos {
  dia: number;
  hora: string;
}
export type Cambio =
  | { op: "reemplazar"; en: Pos; desde: Rec; hacia: Rec }
  | { op: "mover"; en: Pos; recurso: Rec; a: Pos }
  | { op: "quitar"; en: Pos; recurso: Rec }
  | { op: "agregar"; a: Pos; hacia: Rec }
  | { op: "nivel"; en: Pos; recurso: Rec; nivel: Nivel }
  | { op: "valor"; eje: Eje; valor: string | null };
export type Ancla = { tipo: "general" } | { tipo: "actividad"; dia: number; hora: string; recurso: Rec } | { tipo: "dia"; dia: number } | { tipo: "eje"; eje: Eje };

export interface ItemRevision {
  id: string;
  tarea_id: string | null;
  objeto: ObjetoRevision;
  eje: Eje | null;
  clase: "comentario" | "sugerencia";
  ancla: Ancla;
  cambio: Cambio | null;
  texto: string | null;
  para_proxima: boolean;
  estado: "abierta" | "aceptada" | "descartada" | "resuelta";
  autor_id: string | null;
  autor_nombre: string | null;
  autor_area: string | null;
  created_at: string;
  decidida_nombre: string | null;
  decidida_en: string | null;
}

// ─── Textos ───
export const hora5 = (h: string | null | undefined) => (h ?? "").slice(0, 5);
const nombreDia = (d: number) => DIAS[d] ?? `Día ${d + 1}`;
export const textoPos = (p: Pos) => `${nombreDia(p.dia)}${p.hora ? ` ${p.hora}` : ""}`;
const textoRec = (r: Rec) => `${r.codigo ? `${r.codigo} ` : ""}${r.titulo}`;
const COLOR: Record<string, string> = { verde: "Verde", amarillo: "Amarillo", rojo: "Rojo" };
const ETAPA: Record<string, string> = { preventivo: "Preventivo", dcl: "DCL", leve: "Demencia leve", moderada: "Demencia moderada", avanzada: "Demencia avanzada" };
export const textoValor = (eje: Eje, v: string | null) => (v === null ? "Lo que calcula el motor" : eje === "etapa" ? (ETAPA[v] ?? v) : (COLOR[v] ?? v));

// Antes y después, en palabras.
export function describirCambio(c: Cambio): { antes: string | null; despues: string } {
  switch (c.op) {
    case "reemplazar":
      return { antes: `${textoPos(c.en)} · ${textoRec(c.desde)}`, despues: textoRec(c.hacia) };
    case "mover":
      return { antes: `${textoPos(c.en)} · ${textoRec(c.recurso)}`, despues: `Mover a ${textoPos(c.a)}` };
    case "quitar":
      return { antes: `${textoPos(c.en)} · ${textoRec(c.recurso)}`, despues: "Quitar" };
    case "agregar":
      return { antes: null, despues: `Agregar ${textoPos(c.a)} · ${textoRec(c.hacia)}` };
    case "nivel":
      return { antes: `${textoPos(c.en)} · ${textoRec(c.recurso)}`, despues: `Nivel ${nivelLabel[c.nivel]}` };
    case "valor":
      return { antes: null, despues: `${ejeLabel(c.eje)}: ${textoValor(c.eje, c.valor)}` };
  }
}
export const recDe = (r: MediaResource): Rec => ({ id: r.id, titulo: r.titulo, codigo: r.codigo, modulo: r.modulo });
export const areaDeModulo = (m: string | null | undefined) => (m && m in moduloLabel ? moduloLabel[m as ResourceModulo] : null);

// Qué celda o actividad toca un ítem (para marcarlo en el calendario).
export function posDeItem(i: ItemRevision): (Pos & { recursoId: string | null }) | null {
  const c = i.cambio;
  if (c && c.op === "agregar") return { ...c.a, recursoId: null };
  if (c && "en" in c) return { ...c.en, recursoId: "recurso" in c ? c.recurso.id : c.desde.id };
  if (i.ancla.tipo === "actividad") return { dia: i.ancla.dia, hora: i.ancla.hora, recursoId: i.ancla.recurso.id };
  return null;
}
export const claveAct = (dia: number, hora: string | null | undefined, recursoId: string | null | undefined) => `${dia}|${hora5(hora)}|${recursoId ?? ""}`;

// Por actividad: cuántas sugerencias y comentarios abiertos tiene.
export function marcasPorActividad(items: ItemRevision[] | undefined) {
  const m = new Map<string, { sug: number; com: number; cambio: Cambio | null }>();
  for (const i of items ?? []) {
    if (i.estado !== "abierta") continue;
    const p = posDeItem(i);
    if (!p || p.recursoId === null) continue;
    const k = claveAct(p.dia, p.hora, p.recursoId);
    const x = m.get(k) ?? { sug: 0, com: 0, cambio: null };
    if (i.clase === "sugerencia") {
      x.sug++;
      x.cambio = x.cambio ?? i.cambio;
    } else x.com++;
    m.set(k, x);
  }
  return m;
}
// Sugerencias de agregar abiertas en una celda.
export function agregadosEn(items: ItemRevision[] | undefined, dia: number, enLaFila: (hora: string) => boolean) {
  return (items ?? []).filter((i) => i.estado === "abierta" && i.cambio?.op === "agregar" && i.cambio.a.dia === dia && enLaFila(i.cambio.a.hora));
}

// Qué áreas conviene que revisen según los módulos del contenido.
const AREA_MODULO: Record<string, string[]> = {
  gerontogimnasia: ["Gerontogimnasia", "Fisioterapia"],
  movimiento: ["Gerontogimnasia", "Fisioterapia"],
  nutricion: ["Nutrición"],
  cognicion: ["Estimulación cognitiva", "Neuropsicología"],
  reminiscencia: ["Estimulación cognitiva", "Psicología"],
  musica: ["Estimulación cognitiva", "Terapia ocupacional"],
  sentidos: ["Terapia ocupacional", "Estimulación cognitiva"],
};
export function areasDeModulos(modulos: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const m of modulos) for (const a of AREA_MODULO[m ?? ""] ?? []) if (!out.includes(a)) out.push(a);
  return out;
}

// Un color por área (avatares de quien revisa).
const COLORES = ["#6f8f4e", "#b0883a", "#5b7489", "#c0664f", "#6a969c", "#8a6a9c", "#3f6a70"];
export function colorArea(area: string | null | undefined) {
  if (!area) return "#7a8b8e";
  let h = 0;
  for (const c of area) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}

// ─── Consultas ───
export function useEstadoRevision(objeto: ObjetoRevision, id: string | null | undefined, eje?: Eje) {
  return useQuery({
    queryKey: ["estado-revision", objeto, id, eje ?? null],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("estado_revision", { p_objeto: objeto, p_id: id, p_eje: eje ?? null });
      if (error) throw error;
      return data as EstadoRevision | null;
    },
  });
}

export function useEstadosRevision(objeto: ObjetoRevision, ids: string[]) {
  return useQuery({
    queryKey: ["estados-revision", objeto, ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("estados_revision", { p_objeto: objeto, p_ids: ids });
      if (error) throw error;
      return new Map(((data ?? []) as { id: string; estado: EstadoRevision | null }[]).map((x) => [x.id, x.estado]));
    },
  });
}

export function useItemsRevision(objeto: ObjetoRevision, id: string | null | undefined) {
  return useQuery({
    queryKey: ["revision-items", objeto, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("revision_items_de", { p_objeto: objeto, p_objeto_id: id });
      if (error) throw error;
      return (data ?? []) as ItemRevision[];
    },
  });
}

function invalidarRevision(qc: ReturnType<typeof useQueryClient>) {
  for (const k of ["revision-items", "estado-revision", "estados-revision", "tareas-equipo", "valoracion"]) qc.invalidateQueries({ queryKey: [k] });
}

export function useAgregarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (x: { objeto: ObjetoRevision; objetoId: string; clase: "comentario" | "sugerencia"; ancla?: Ancla; cambio?: Cambio; texto?: string; eje?: Eje | null; paraProxima?: boolean; tareaId?: string | null }) => {
      const { error } = await supabase.rpc("revision_agregar", {
        p_objeto: x.objeto,
        p_objeto_id: x.objetoId,
        p_clase: x.clase,
        p_ancla: x.ancla ?? { tipo: "general" },
        p_cambio: x.cambio ?? null,
        p_texto: x.texto ?? null,
        p_eje: x.eje ?? null,
        p_para_proxima: x.paraProxima ?? false,
        p_tarea: x.tareaId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidarRevision(qc),
  });
}

export function useDecidirItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (x: { id: string; estado: "aceptada" | "descartada" | "resuelta" | "abierta" | "retirar" }) => {
      const { error } = await supabase.rpc("revision_decidir", { p_id: x.id, p_estado: x.estado });
      if (error) throw error;
    },
    onSuccess: () => invalidarRevision(qc),
  });
}

export async function decidirVarios(ids: string[], estado: "aceptada" | "descartada" | "resuelta") {
  for (const id of ids) {
    const { error } = await supabase.rpc("revision_decidir", { p_id: id, p_estado: estado });
    if (error) throw error;
  }
}

export async function recursoPorId(id: string): Promise<MediaResource | null> {
  const { data } = await supabase.from("media_resources").select("*").eq("id", id).maybeSingle();
  return (data as MediaResource | null) ?? null;
}

// ─── Valoración ───
type Tier = "verde" | "amarillo" | "rojo";
export interface Valoracion {
  etapa: { derivadas: string[]; ajuste: string | null };
  ejes: Record<Exclude<Eje, "etapa">, { motor: Tier | null; ajuste: Tier | null }>;
  estados: Record<Eje, EstadoRevision | null>;
}
export function useValoracion(patientId: string | null | undefined) {
  return useQuery({
    queryKey: ["valoracion", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("valoracion_paciente", { p_patient: patientId });
      if (error) throw error;
      return data as Valoracion;
    },
  });
}
export function useAjustarValoracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (x: { patientId: string; eje: Eje; valor: string | null }) => {
      const { error } = await supabase.rpc("ajustar_valoracion", { p_patient: x.patientId, p_eje: x.eje, p_valor: x.valor });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarRevision(qc);
      for (const k of ["patients", "perfil-recursos", "ejes-rojos"]) qc.invalidateQueries({ queryKey: [k] });
    },
  });
}
