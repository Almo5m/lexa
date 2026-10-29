import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_MESSAGES = 200;
const arabic = z.string().trim().min(1).max(200);
const english = z.string().trim().max(200).optional();

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), textAr: arabic, textEn: english }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), textAr: arabic, textEn: english }),
  z.object({ action: z.literal("toggle"), id: z.string().uuid(), active: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

/** The admin writes, edits, switches off and deletes the messages Bo says. Students have no write access. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "add") {
      const { count, error: countError } = await db.from("bo_messages").select("id", { count: "exact", head: true });
      if (countError) throw countError;
      if ((count ?? 0) >= MAX_MESSAGES) return NextResponse.json({ error: "too_many" }, { status: 400 });
      const { error } = await db.from("bo_messages").insert({ text_ar: body.textAr, text_en: body.textEn ?? "" });
      if (error) throw error;
    } else if (body.action === "update") {
      const { error } = await db.from("bo_messages").update({ text_ar: body.textAr, text_en: body.textEn ?? "" }).eq("id", body.id);
      if (error) throw error;
    } else if (body.action === "toggle") {
      const { error } = await db.from("bo_messages").update({ active: body.active }).eq("id", body.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("bo_messages").delete().eq("id", body.id);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
