import { supabase } from "./supabase";

export type ResourceModulo = "sentidos" | "movimiento" | "musica" | "reminiscencia";
export type ResourceTipo = "video" | "actividad" | "estrategia" | "neuroproteccion";
export type MediaKind = "video" | "imagen" | "audio" | "documento" | "enlace";
export type NivelCognitivo = "preventivo" | "dcl" | "leve" | "moderada" | "avanzada";
export type NivelMotor = "verde" | "amarillo" | "rojo";

export interface ResourceCiencia {
  gancho: string;
  evidencia: string;
  cierre: string;
}

export interface MediaResource {
  id: string;
  codigo: string | null;
  titulo: string;
  detalle: string | null;
  modulo: ResourceModulo;
  tipo: ResourceTipo;
  tipo_intervencion: string | null;
  dominios: string[] | null;
  media_kind: MediaKind | null;
  storage_path: string | null;
  external_url: string | null;
  duracion: string | null;
  duracion_min: number | null;
  duracion_max: number | null;
  frecuencia: string | null;
  perfil: string | null;
  requisito: string | null;
  objetivo: string | null;
  materiales: string | null;
  pasos: string[] | null;
  progresion: string | null;
  adaptacion: string | null;
  precaucion: string | null;
  ciencia: ResourceCiencia | null;
  por_que: string | null;
  niveles_cognitivos: NivelCognitivo[] | null;
  niveles_motores: NivelMotor[] | null;
  activo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const moduloLabel: Record<ResourceModulo, string> = {
  sentidos: "Sentidos",
  movimiento: "Movimiento",
  musica: "Música",
  reminiscencia: "Reminiscencia",
};


export const tipoLabel: Record<ResourceTipo, string> = {
  video: "Video",
  actividad: "Actividad",
  estrategia: "Estrategia",
  neuroproteccion: "Neuroprotección",
};

export const mediaKindLabel: Record<MediaKind, string> = {
  video: "Video",
  imagen: "Foto",
  audio: "Audio",
  documento: "Documento",
  enlace: "Enlace",
};

export const nivelCognitivoLabel: Record<NivelCognitivo, string> = {
  preventivo: "Preventivo",
  dcl: "DCL",
  leve: "Demencia leve",
  moderada: "Demencia moderada",
  avanzada: "Demencia avanzada",
};

// Compact form for the resource card's tag row — same values, short enough
// to sit next to 2-3 other chips without crowding it out.
export const nivelCognitivoShort: Record<NivelCognitivo, string> = {
  preventivo: "Prev.",
  dcl: "DCL",
  leve: "Leve",
  moderada: "Mod.",
  avanzada: "Avanz.",
};

export const nivelMotorLabel: Record<NivelMotor, string> = {
  verde: "Motor Verde",
  amarillo: "Motor Amarillo",
  rojo: "Motor Rojo",
};

// Reuses the app's existing semáforo tokens — a motor tier is the same
// "traffic light" safety signal as the clinical semáforo elsewhere, not a
// new color language.
export const nivelMotorClass: Record<NivelMotor, string> = {
  verde: "bg-fila-fria text-verde-profundo",
  amarillo: "bg-aviso text-semaforo-amarillo-texto",
  rojo: "bg-alerta text-alerta-texto",
};

const BUCKET = "media-resources";

export function resourceUrl(resource: Pick<MediaResource, "storage_path" | "external_url">): string | null {
  if (resource.external_url) return resource.external_url;
  if (resource.storage_path) return supabase.storage.from(BUCKET).getPublicUrl(resource.storage_path).data.publicUrl;
  return null;
}

export async function uploadResourceFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export async function removeResourceFile(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
