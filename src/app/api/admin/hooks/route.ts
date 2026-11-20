import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings-server";
import { applyProgress } from "@/features/gamification/award";
import { HOOK_APPROVED_XP } from "@/features/hooks/hooks";

const bodySchema = z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject", "delete"]) });

/** The admin approves a student's hook (he gets XP once), rejects it, or deletes it. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { id, action } = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (action === "delete") {
      const { error } = await db.from("shared_hooks").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    const { data: row } = await db.from("shared_hooks").select("user_id, status").eq("id", id).maybeSingle();
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const status = action === "approve" ? "approved" : "rejected";
    const { error } = await db.from("shared_hooks").update({ status }).eq("id", id);
    if (error) throw error;
    if (action === "approve" && row.status !== "approved") {
      await applyProgress(row.user_id, { xp: HOOK_APPROVED_XP }, await loadSettings()).catch(() => undefined);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
