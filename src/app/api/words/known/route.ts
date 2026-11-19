import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";

const KNOWN_INTERVAL_DAYS = 7;
const bodySchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(30) });

/**
 * The student told us he already knows these words (he picked the right meaning before they were taught).
 * They count as learned and come back for a review in a week, so he does not waste time on them now.
 * Only his own words that were never studied are touched.
 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { ids } = bodySchema.parse(await request.json());
    const settings = await loadSettings();
    const now = new Date();
    const { error } = await supabase
      .from("words")
      .update({
        last_reviewed_at: now.toISOString(),
        repetitions: 1,
        correct_count: 1,
        interval_days: KNOWN_INTERVAL_DAYS,
        ease: settings.srsStartingEase,
        due_at: new Date(now.getTime() + KNOWN_INTERVAL_DAYS * 86_400_000).toISOString(),
      })
      .in("id", ids)
      .eq("user_id", user.id)
      .is("last_reviewed_at", null);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
