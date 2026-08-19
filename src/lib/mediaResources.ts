import { supabase } from "./supabase";

export type ResourceCategory = "movimiento" | "cognitiva" | "social" | "relajacion" | "musica";
export type ResourceTipo = "video" | "actividad" | "estrategia" | "neuroproteccion";
export type MediaKind = "video" | "imagen" | "audio" | "documento" | "enlace";

export interface MediaResource {
  id: string;
  titulo: string;
  detalle: string | null;
  categoria: ResourceCategory;
  tipo: ResourceTipo;
  media_kind: MediaKind;
  storage_path: string | null;
  external_url: string | null;
  duracion: string | null;
  precaucion: string | null;
  activo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const categoryLabel: Record<ResourceCategory, string> = {
  movimiento: "Movimiento",
  cognitiva: "Cognitiva",
  social: "Social",
  relajacion: "Relajación",
  musica: "Música",
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
