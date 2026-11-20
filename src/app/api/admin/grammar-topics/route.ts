import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { LESSON_BUCKET } from "@/features/grammar/lesson-images";
import { STAGES } from "@/features/stage/stage";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), stage: z.enum(STAGES), title: z.string().trim().min(1).max(100) }),
  z.object({ action: z.literal("rename"), id: z.string().uuid(), title: z.string().trim().min(1).max(100) }),
  z.object({ action: z.literal("setStage"), id: z.string().uuid(), stage: z.enum(STAGES) }),
  z.object({ action: z.literal("move"), id: z.string().uuid(), direction: z.enum(["up", "down"]) }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

/** The admin's extra grammar lessons: add, rename, change stage, reorder inside the stage, delete (with its pictures). */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "add") {
      const { data: last } = await db.from("grammar_topics").select("sort").eq("stage", body.stage).order("sort", { ascending: false }).limit(1).maybeSingle();
      const { error } = await db.from("grammar_topics").insert({ stage: body.stage, title: body.title, sort: (last?.sort ?? 0) + 1 });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "rename") {
      const { error } = await db.from("grammar_topics").update({ title: body.title }).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "setStage") {
      const { data: last } = await db.from("grammar_topics").select("sort").eq("stage", body.stage).order("sort", { ascending: false }).limit(1).maybeSingle();
      const { error } = await db.from("grammar_topics").update({ stage: body.stage, sort: (last?.sort ?? 0) + 1 }).eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "move") {
      const { data: row } = await db.from("grammar_topics").select("stage").eq("id", body.id).maybeSingle();
      if (!row) return NextResponse.json({ ok: true });
      const { data: rows, error } = await db.from("grammar_topics").select("id").eq("stage", row.stage).order("sort").order("created_at");
      if (error) throw error;
      const ids = (rows ?? []).map((item) => item.id as string);
      const at = ids.indexOf(body.id);
      const to = body.direction === "up" ? at - 1 : at + 1;
      if (at === -1 || to < 0 || to >= ids.length) return NextResponse.json({ ok: true });
      [ids[at], ids[to]] = [ids[to], ids[at]];
      const results = await Promise.all(ids.map((id, index) => db.from("grammar_topics").update({ sort: index + 1 }).eq("id", id)));
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      return NextResponse.json({ ok: true });
    }
    // delete: pictures first (files, then rows), then the lesson itself
    const { data: pictures } = await db.from("grammar_lessons").select("path").eq("unit_id", body.id);
    const paths = (pictures ?? []).map((item) => item.path as string);
    if (paths.length > 0) await db.storage.from(LESSON_BUCKET).remove(paths);
    await db.from("grammar_lessons").delete().eq("unit_id", body.id);
    const { error } = await db.from("grammar_topics").delete().eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
