import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MAX_IMPORT_CHARS, MAX_IMPORT_WORDS, parseWordLines } from "@/features/school/parse";

const title = z.string().trim().min(1).max(80);

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("addUnit"), titleAr: title, titleEn: z.string().trim().max(80).optional() }),
  z.object({ action: z.literal("renameUnit"), id: z.string().uuid(), titleAr: title, titleEn: z.string().trim().max(80).optional() }),
  z.object({ action: z.literal("deleteUnit"), id: z.string().uuid() }),
  z.object({ action: z.literal("moveUnit"), id: z.string().uuid(), direction: z.enum(["up", "down"]) }),
  z.object({ action: z.literal("deleteWord"), id: z.string().uuid() }),
  z.object({ action: z.literal("importWords"), unitId: z.string().uuid(), text: z.string().max(MAX_IMPORT_CHARS), replace: z.boolean().optional() }),
]);

/**
 * Everything the admin does to the school curriculum. Only an admin gets in, and every write goes through the
 * service client here, because students have no write access to these tables.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    switch (body.action) {
      case "addUnit": {
        const { data: last } = await db.from("school_units").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
        const { error } = await db.from("school_units").insert({ title_ar: body.titleAr, title_en: body.titleEn ?? "", sort: (last?.sort ?? 0) + 1 });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "renameUnit": {
        const { error } = await db.from("school_units").update({ title_ar: body.titleAr, title_en: body.titleEn ?? "" }).eq("id", body.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "deleteUnit": {
        const { error } = await db.from("school_units").delete().eq("id", body.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "moveUnit": {
        const { data: units, error } = await db.from("school_units").select("id").order("sort").order("created_at");
        if (error) throw error;
        const ids = (units ?? []).map((unit) => unit.id as string);
        const at = ids.indexOf(body.id);
        const to = body.direction === "up" ? at - 1 : at + 1;
        if (at === -1 || to < 0 || to >= ids.length) return NextResponse.json({ ok: true });
        [ids[at], ids[to]] = [ids[to], ids[at]];
        const results = await Promise.all(ids.map((id, index) => db.from("school_units").update({ sort: index + 1 }).eq("id", id)));
        const failed = results.find((result) => result.error);
        if (failed?.error) throw failed.error;
        return NextResponse.json({ ok: true });
      }
      case "deleteWord": {
        const { error } = await db.from("school_words").delete().eq("id", body.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "importWords": {
        const { words, problems } = parseWordLines(body.text);
        if (words.length > MAX_IMPORT_WORDS) return NextResponse.json({ error: "too_many", max: MAX_IMPORT_WORDS }, { status: 400 });
        if (words.length === 0) return NextResponse.json({ saved: 0, problems }, { status: 200 });

        if (body.replace) {
          const { error } = await db.from("school_words").delete().eq("unit_id", body.unitId);
          if (error) throw error;
        }
        const { data: last } = await db.from("school_words").select("sort").eq("unit_id", body.unitId).order("sort", { ascending: false }).limit(1).maybeSingle();
        const start = last?.sort ?? 0;
        const { error } = await db.from("school_words").upsert(
          words.map((word, index) => ({
            unit_id: body.unitId,
            sort: start + index + 1,
            term: word.term,
            pos: word.pos,
            meaning_ar: word.meaningAr,
            example_en: word.exampleEn,
            example_ar: word.exampleAr,
          })),
          { onConflict: "unit_id,term" },
        );
        if (error) throw error;
        return NextResponse.json({ saved: words.length, problems });
      }
    }
  } catch (error) {
    return handleApiError(error);
  }
}
