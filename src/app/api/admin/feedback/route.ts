import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("done"), id: z.string().uuid(), done: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

/** The admin marks a student's message as handled, or deletes it. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();
    const { error } = body.action === "done" ? await db.from("feedback").update({ done: body.done }).eq("id", body.id) : await db.from("feedback").delete().eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
