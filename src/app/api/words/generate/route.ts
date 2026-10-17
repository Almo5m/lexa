import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { interestsPromptLine } from "@/features/profile/interests";
import { loadSettings } from "@/lib/settings-server";
import { requestCards } from "@/features/ai/cards";
import { AiBusyError, AiUnavailableError, assertWithinDailyLimit } from "@/features/ai/gemini";

export const maxDuration = 60;

/** Without ids the server takes the oldest pending words. With ids the caller picks them, so several calls can run side by side. */
const BATCH_SIZE = 8;

const bodySchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(BATCH_SIZE).optional() });

/** The pending words, so the browser can split them into groups and prepare the groups together. */
export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("words")
      .select("id")
      .eq("card_status", "pending")
      .order("created_at")
      .limit(80);
    if (error) throw error;
    return NextResponse.json({ ids: (data ?? []).map((word) => word.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    const { ids } = bodySchema.parse(await request.json().catch(() => ({})));

    const { data: profile } = await supabase.from("profiles").select("interests").eq("id", user.id).single();
    const interestsLine = interestsPromptLine(profile?.interests ?? []);

    const query = supabase.from("words").select("id, term").eq("card_status", "pending").order("created_at");
    const { data: pending, error } = await (ids ? query.in("id", ids) : query.limit(BATCH_SIZE));
    if (error) throw error;
    if (!pending || pending.length === 0) return NextResponse.json({ generated: 0, remaining: 0 });

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);

    let cards: Awaited<ReturnType<typeof requestCards>>;
    try {
      cards = await requestCards(user.id, settings.aiModel, settings.aiFallbackModel, pending.map((word) => word.term), interestsLine);
    } catch (aiError) {
      if (!(aiError instanceof AiBusyError) && !(aiError instanceof AiUnavailableError)) {
        await supabase
          .from("words")
          .update({ card_status: "failed" })
          .in("id", pending.map((word) => word.id));
      }
      throw aiError;
    }

    const results = await Promise.all(
      pending.map(async (word) => {
        const card = cards.cards.find((item) => item.term.toLowerCase() === word.term);
        const update = card ? { card, card_status: "ready" as const } : { card_status: "failed" as const };
        await supabase.from("words").update(update).eq("id", word.id);
        return card ? 1 : 0;
      }),
    );
    const generated = results.reduce<number>((sum, value) => sum + value, 0);

    const { count } = await supabase
      .from("words")
      .select("id", { count: "exact", head: true })
      .eq("card_status", "pending");

    return NextResponse.json({ generated, remaining: count ?? 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
