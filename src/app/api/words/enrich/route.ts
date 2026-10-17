import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { interestsPromptLine } from "@/features/profile/interests";
import { loadSettings } from "@/lib/settings-server";
import { requestCards } from "@/features/ai/cards";
import { assertWithinDailyLimit } from "@/features/ai/gemini";
import { entryFor } from "@/features/curriculum";
import type { WordCard } from "@/features/ai/schemas";

export const maxDuration = 60;

const bodySchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(6) });

/**
 * Path words start with a hand-written card. This fills in the rest (sound, examples, memory hook, written around
 * the student's interests). If the AI is busy the basic card stays, so nothing is lost.
 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { ids } = bodySchema.parse(await request.json());
    const settings = await loadSettings();

    const { data: rows, error } = await supabase
      .from("words")
      .select("id, term")
      .in("id", ids)
      .eq("enriched", false);
    if (error) throw error;
    if (!rows || rows.length === 0) return NextResponse.json({ cards: {} });

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const { data: profile } = await supabase.from("profiles").select("interests").eq("id", user.id).single();
    const hints = Object.fromEntries(rows.flatMap((row) => {
      const entry = entryFor(row.term);
      return entry ? [[row.term, entry.ar]] : [];
    }));

    const result = await requestCards(
      user.id,
      settings.aiModel,
      settings.aiFallbackModel,
      rows.map((row) => row.term),
      interestsPromptLine(profile?.interests ?? []),
      hints,
    );

    const cards: Record<string, WordCard> = {};
    await Promise.all(
      rows.map(async (row) => {
        const card = result.cards.find((item) => item.term.toLowerCase() === row.term);
        if (!card) return;
        // The teacher-written meanings always come first; the AI's extra meanings only follow them.
        const curated = entryFor(row.term)?.ar.split(/[،,]/).map((part) => part.trim()).filter(Boolean) ?? [];
        const meaningsAr = [...new Set([...curated, ...card.meaningsAr])].slice(0, 3);
        const merged = { ...card, meaningsAr };
        cards[row.id] = merged;
        await supabase.from("words").update({ card: merged, enriched: true }).eq("id", row.id);
      }),
    );
    return NextResponse.json({ cards });
  } catch (error) {
    return handleApiError(error);
  }
}
