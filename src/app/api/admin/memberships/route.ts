import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/features/demo/limits";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("extend"), id: z.string().uuid(), days: z.number().int().min(1).max(400) }),
  z.object({ action: z.literal("end"), id: z.string().uuid() }),
]);

/** Extends a student's Plus, or ends it now. Every change is written to the admin log (no names or emails). */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) throw new HttpError(403, "forbidden");
    const { user } = await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "extend") {
      const { error } = await db.rpc("grant_plus", { p_user: body.id, p_days: body.days });
      if (error) throw error;
      await db.from("admin_log").insert({ admin_id: user.id, action: "grant_plus", detail: `${body.days} days (from plans tab)` });
    } else {
      const { error } = await db.from("memberships").update({ plus_until: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", body.id);
      if (error) throw error;
      await db.from("admin_log").insert({ admin_id: user.id, action: "end_plus", detail: "Plus ended from plans tab" });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
