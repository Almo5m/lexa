import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/features/demo/limits";

const MAX_PER_DAY = 5;
const bodySchema = z.object({ kind: z.enum(["bug", "idea", "question"]), message: z.string().trim().min(3).max(1000) });

/** A student writes to the admin. Five messages a day each, so the inbox cannot be flooded. */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) throw new HttpError(403, "forbidden");
    const { user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recent = await db.from("feedback").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
    if (recent.error) throw recent.error;
    if ((recent.count ?? 0) >= MAX_PER_DAY) return NextResponse.json({ error: "too_many" }, { status: 429 });

    const { error } = await db.from("feedback").insert({ user_id: user.id, kind: body.kind, message: body.message });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
