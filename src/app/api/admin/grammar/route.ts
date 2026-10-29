import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { grammarUnit } from "@/features/grammar";
import { LESSON_BUCKET, MAX_IMAGES_PER_UNIT, MAX_IMAGE_BYTES, MIME, detectImageType } from "@/features/grammar/lesson-images";

export const maxDuration = 30;

const jsonSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
  z.object({ action: z.literal("move"), id: z.string().uuid(), direction: z.enum(["up", "down"]) }),
]);

/**
 * Uploads one picture of a grammar lesson. The browser sends one file per request (a serverless request has a size
 * limit), and the type is decided here from the file's own bytes.
 */
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const unitId = String(form.get("unitId") ?? "");
    const file = form.get("file");
    if (!grammarUnit(unitId)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "too_big" }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) return NextResponse.json({ error: "bad_type" }, { status: 415 });

    const db = createSupabaseAdminClient();
    const { data: existing, error: listError } = await db.from("grammar_lessons").select("sort").eq("unit_id", unitId).order("sort", { ascending: false });
    if (listError) throw listError;
    if ((existing ?? []).length >= MAX_IMAGES_PER_UNIT) return NextResponse.json({ error: "too_many" }, { status: 400 });

    const path = `${unitId}/${crypto.randomUUID()}.${type === "jpeg" ? "jpg" : type}`;
    const upload = await db.storage.from(LESSON_BUCKET).upload(path, bytes, { contentType: MIME[type], upsert: false });
    if (upload.error) throw upload.error;

    const { error } = await db.from("grammar_lessons").insert({ unit_id: unitId, path, sort: (existing?.[0]?.sort ?? 0) + 1 });
    if (error) {
      await db.storage.from(LESSON_BUCKET).remove([path]);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Deletes a picture, or moves it one place up or down inside its unit. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = jsonSchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    const { data: row, error } = await db.from("grammar_lessons").select("id, unit_id, path").eq("id", body.id).maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ ok: true });

    if (body.action === "delete") {
      await db.storage.from(LESSON_BUCKET).remove([row.path]);
      const { error: deleteError } = await db.from("grammar_lessons").delete().eq("id", row.id);
      if (deleteError) throw deleteError;
      return NextResponse.json({ ok: true });
    }

    const { data: rows, error: listError } = await db.from("grammar_lessons").select("id").eq("unit_id", row.unit_id).order("sort").order("created_at");
    if (listError) throw listError;
    const ids = (rows ?? []).map((item) => item.id as string);
    const at = ids.indexOf(row.id);
    const to = body.direction === "up" ? at - 1 : at + 1;
    if (at === -1 || to < 0 || to >= ids.length) return NextResponse.json({ ok: true });
    [ids[at], ids[to]] = [ids[to], ids[at]];
    const results = await Promise.all(ids.map((id, index) => db.from("grammar_lessons").update({ sort: index + 1 }).eq("id", id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
