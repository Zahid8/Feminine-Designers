import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export const CLOTH_SAMPLE_BUCKET = "cloth-samples";

const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

function extensionFor(contentType: string) {
  const subtype = contentType.split("/")[1]?.toLowerCase() ?? "jpg";
  if (subtype === "jpeg") return "jpg";
  return subtype.replace(/[^a-z0-9]/g, "") || "jpg";
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${CLOTH_SAMPLE_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? undefined : decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

/**
 * Moves a camera data URL into Supabase Storage and returns its public URL.
 * Anything that is not an image data URL is returned unchanged. If the upload
 * fails (for example before the bucket migration has been run) the original
 * data URL is returned so saving the order still works.
 */
export async function storeClothSample(admin: AdminClient, value: string): Promise<string> {
  const match = DATA_URL_PATTERN.exec(value);
  if (!match) return value;

  const [, contentType, base64] = match;
  const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extensionFor(contentType)}`;

  try {
    const bucket = admin.storage.from(CLOTH_SAMPLE_BUCKET);
    const { error } = await bucket.upload(path, Buffer.from(base64, "base64"), {
      contentType,
      cacheControl: "31536000",
      upsert: false
    });
    if (error) throw error;
    return bucket.getPublicUrl(path).data.publicUrl;
  } catch (error) {
    console.warn("Cloth sample upload failed; keeping the photo inline.", error instanceof Error ? error.message : error);
    return value;
  }
}

/** Best-effort removal of a stored cloth sample. Inline data URLs are ignored. */
export async function removeStoredClothSample(admin: AdminClient, url: string | null | undefined) {
  const path = url ? storagePathFromPublicUrl(url) : undefined;
  if (!path) return;

  try {
    const { error } = await admin.storage.from(CLOTH_SAMPLE_BUCKET).remove([path]);
    if (error) throw error;
  } catch (error) {
    console.warn("Cloth sample cleanup failed.", error instanceof Error ? error.message : error);
  }
}
