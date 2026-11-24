import type { SupabaseClient } from "@supabase/supabase-js";

export const LESSON_BUCKET = "grammar-lessons";
/** The most pictures one unit can hold, and the biggest file the server accepts (the browser shrinks photos first). */
export const MAX_IMAGES_PER_UNIT = 30;
export const MAX_IMAGE_BYTES = 3_500_000;
const SIGNED_SECONDS = 60 * 60;

export type ImageType = "jpeg" | "png" | "webp";

/** Decides the type from the first bytes of the file, never from its name or the type the browser claims. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return "png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export const MIME: Record<ImageType, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** One piece of a lesson, in the order the admin arranged: a picture, or a text written in the lesson format. */
export type LessonBlock = { id: string; kind: "image"; url: string } | { id: string; kind: "text"; body: string };

interface Row {
  id: string;
  path: string | null;
  body: string | null;
}

/** True when the lessons table (or its text column) is not in the database yet (setup.sql was not run after this update). */
function missing(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || error?.code === "42703" || /grammar_lessons|body/.test(error?.message ?? ""));
}

/**
 * The pictures and texts of one grammar unit, in order; pictures come with a link that works for an hour.
 * Call it only from server code with the service client: the bucket is private.
 */
export async function loadLessonBlocks(db: SupabaseClient, unitId: string): Promise<LessonBlock[]> {
  const { data, error } = await db.from("grammar_lessons").select("id, path, body").eq("unit_id", unitId).order("sort").order("created_at");
  if (missing(error)) return [];
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];
  const paths = rows.flatMap((row) => (row.path ? [row.path] : []));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const signed = await db.storage.from(LESSON_BUCKET).createSignedUrls(paths, SIGNED_SECONDS);
    if (signed.error) throw signed.error;
    for (const item of signed.data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return rows.flatMap((row): LessonBlock[] => {
    if (row.body) return [{ id: row.id, kind: "text", body: row.body }];
    const url = row.path ? urls.get(row.path) : undefined;
    return url ? [{ id: row.id, kind: "image", url }] : [];
  });
}
