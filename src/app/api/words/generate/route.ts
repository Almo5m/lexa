import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { cardBatchSchema } from "@/features/ai/schemas";
import { CARDS_SYSTEM } from "@/features/ai/prompts";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";

export const maxDuration = 60;

const BATCH_SIZE = 5;

export async function POST() {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();

    const { data: pending, error } = await supabase
      .from("words")
      .select("id, term")
      .eq("card_status", "pending")
      .order("created_at")
      .limit(BATCH_SIZE);
    if (error) throw error;
    if (!pending || pending.length === 0) return NextResponse.json({ generated: 0, remaining: 0 });

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);

    let cards: Awaited<ReturnType<typeof requestCards>>;
    try {
      cards = await requestCards(user.id, settings.aiModel, pending.map((word) => word.term));
    } catch (aiError) {
      await supabase
        .from("words")
        .update({ card_status: "failed" })
        .in("id", pending.map((word) => word.id));
      throw aiError;
    }

    let generated = 0;
    for (const word of pending) {
      const card = cards.cards.find((item) => item.term.toLowerCase() === word.term);
      const update = card
        ? { card, card_status: "ready" as const }
        : { card_status: "failed" as const };
      await supabase.from("words").update(update).eq("id", word.id);
      if (card) generated += 1;
    }

    const { count } = await supabase
      .from("words")
      .select("id", { count: "exact", head: true })
      .eq("card_status", "pending");

    return NextResponse.json({ generated, remaining: count ?? 0 });
  } catch (error) {
    return handleApiError(error);
  }
}

function requestCards(userId: string, model: string, terms: string[]) {
  return callGeminiJson(
    {
      userId,
      feature: "cards",
      model,
      system: CARDS_SYSTEM,
      prompt: `Write cards for these words: ${JSON.stringify(terms)}`,
      temperature: 0.8,
    },
    cardBatchSchema,
  );
}
