import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_WORDS = 400;
const term = z.string().trim().toLowerCase().regex(/^[a-z][a-z '’-]{1,39}$/);

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    term,
    meaningAr: z.string().trim().min(1).max(120),
    storyAr: z.string().trim().max(400).optional(),
    storyEn: z.string().trim().max(400).optional(),
  }),
  z.object({ action: z.literal("toggle"), id: z.string().uuid(), active: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

/** The admin adds, switches off and deletes words of the day. Students have no write access. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "add") {
      const { count, error: countError } = await db.from("word_of_day").select("id", { count: "exact", head: true });
      if (countError) throw countError;
      if ((count ?? 0) >= MAX_WORDS) return NextResponse.json({ error: "too_many" }, { status: 400 });
      const { error } = await db.from("word_of_day").insert({ term: body.term, meaning_ar: body.meaningAr, story_ar: body.storyAr ?? "", story_en: body.storyEn ?? "" });
      if (error) throw error;
    } else if (body.action === "toggle") {
      const { error } = await db.from("word_of_day").update({ active: body.active }).eq("id", body.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("word_of_day").delete().eq("id", body.id);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
