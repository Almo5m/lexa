import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/features/demo/limits";
import { normalizeCode } from "@/features/plus/codes";
import { daysLeft } from "@/features/plus/plan";
import { isMissingPlusTable } from "@/features/plus/server";

const MAX_WRONG_PER_HOUR = 8;
const bodySchema = z.object({ code: z.string().max(40) });

/**
 * Uses an activation code. Wrong guesses are counted: after 8 in an hour the student waits, so codes cannot be guessed.
 * The code is claimed inside one database function, so a code works for one student only.
 */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) throw new HttpError(403, "forbidden");
    const { user } = await requireUser();
    const { code } = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    const since = new Date(Date.now() - 3600 * 1000).toISOString();
    const wrong = await db.from("plus_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
    if (isMissingPlusTable(wrong.error)) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if (wrong.error) throw wrong.error;
    if ((wrong.count ?? 0) >= MAX_WRONG_PER_HOUR) return NextResponse.json({ error: "too_many" }, { status: 429 });

    const normalized = normalizeCode(code);
    const result = normalized ? await db.rpc("redeem_plus_code", { p_code: normalized, p_user: user.id }) : null;
    if (!result || result.error) {
      if (result?.error && !/invalid_code/.test(result.error.message ?? "")) throw result.error;
      await db.from("plus_attempts").insert({ user_id: user.id });
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }
    const until = result.data as string;
    return NextResponse.json({ plus: true, until, daysLeft: daysLeft(until) });
  } catch (error) {
    return handleApiError(error);
  }
}
