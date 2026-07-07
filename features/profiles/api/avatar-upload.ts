import { del, put } from "@vercel/blob";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BASE64_BYTES = 256 * 1024;

/**
 * Upload avatar; returns value to store in profiles.avatar_url.
 * Order: Vercel Blob → Supabase Storage (resources bucket) → small base64.
 */
export async function uploadAvatarForUser(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `avatars/${userId}/avatar-${Date.now()}.${ext}`;
      const blob = await put(filename, file, { access: "private" });
      return blob.pathname;
    } catch (err) {
      console.error("[avatar] Vercel Blob upload failed:", err);
    }
  }

  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `avatars/${userId}/avatar-${Date.now()}.${ext}`;
  const { error: storageError } = await supabase.storage
    .from("resources")
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (!storageError) {
    return storagePath;
  }

  console.warn(
    "[avatar] Supabase storage upload failed:",
    storageError.message,
  );

  if (file.size > MAX_BASE64_BYTES) {
    throw new Error(
      "Photo storage is not configured. Set BLOB_READ_WRITE_TOKEN or enable the Supabase 'resources' storage bucket.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function deleteStoredAvatar(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith("avatars/")) return;
  try {
    await del(avatarUrl);
  } catch {
    // ignore
  }
}
