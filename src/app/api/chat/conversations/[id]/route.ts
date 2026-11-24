import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** Deletes one conversation of the signed-in student. Today's message count is not given back. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireUser();
    const id = z.string().uuid().parse((await context.params).id);
    await createSupabaseAdminClient().from("chat_conversations").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
