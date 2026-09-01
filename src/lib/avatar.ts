import { supabase } from "./supabase";

const BUCKET = "avatars";

// Path is "<uid>/avatar.<ext>" — storage RLS checks ownership from the path
// itself (see supabase/migrations/20260826000003_avatars.sql), and upsert
// means re-uploading just replaces the old photo instead of accumulating.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
