import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { interestsPromptLine } from "@/features/profile/interests";
import { loadSettings } from "@/lib/settings-server";
import { requestCards } from "@/features/ai/cards";
import { assertWithinDailyLimit } from "@/features/ai/gemini";
import { entryFor } from "@/features/curriculum";
import { loadPathCards } from "@/features/curriculum/path-cards-db";
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
      .select("id, term, source")
      .in("id", ids)
      .eq("enriched", false);
    if (error) throw error;
    if (!rows || rows.length === 0) return NextResponse.json({ cards: {} });

    // Words that already have a finished card in the shared set need no AI at all.
    // School words keep the admin's own meanings and example, so they never take the shared path card.
    const finished = await loadPathCards(supabase, rows.filter((row) => row.source !== "school").map((row) => row.term));
    const cards: Record<string, WordCard> = {};
    await Promise.all(
      rows.flatMap((row) => {
        const card = finished.get(row.term);
        if (!card) return [];
        cards[row.id] = card;
        return [supabase.from("words").update({ card, enriched: true }).eq("id", row.id)];
      }),
    );
    const pending = rows.filter((row) => !cards[row.id]);
    if (pending.length === 0) return NextResponse.json({ cards });

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const { data: profile } = await supabase.from("profiles").select("interests").eq("id", user.id).single();
    const { data: schoolRows } = await supabase
      .from("school_words")
      .select("term, meaning_ar, example_en, example_ar")
      .in("term", pending.filter((row) => row.source === "school").map((row) => row.term));
    const schoolByTerm = new Map((schoolRows ?? []).map((row) => [row.term as string, row]));
    const meaningOf = (term: string): string => schoolByTerm.get(term)?.meaning_ar ?? entryFor(term)?.ar ?? "";
    const hints = Object.fromEntries(pending.flatMap((row) => {
      const meaning = meaningOf(row.term);
      return meaning ? [[row.term, meaning]] : [];
    }));

    const result = await requestCards(
      user.id,
      settings.aiModel,
      settings.aiFallbackModel,
      pending.map((row) => row.term),
      interestsPromptLine(profile?.interests ?? []),
      hints,
    );

    await Promise.all(
      pending.map(async (row) => {
        const card = result.cards.find((item) => item.term.toLowerCase() === row.term);
        if (!card) return;
        // The teacher-written meanings always come first; the AI's extra meanings only follow them.
        const curated = meaningOf(row.term).split(/[،,]/).map((part) => part.trim()).filter(Boolean);
        const meaningsAr = [...new Set([...curated, ...card.meaningsAr])].slice(0, 3);
        const own = schoolByTerm.get(row.term);
        // The admin's example stays the main one; the AI's example moves to the extra examples.
        const merged =
          own && own.example_en
            ? { ...card, meaningsAr, sentence: own.example_en, sentenceAr: own.example_ar, extraExamples: [{ en: card.sentence, ar: card.sentenceAr }, ...card.extraExamples].slice(0, 3) }
            : { ...card, meaningsAr };
        cards[row.id] = merged;
        await supabase.from("words").update({ card: merged, enriched: true }).eq("id", row.id);
      }),
    );
    return NextResponse.json({ cards });
  } catch (error) {
    return handleApiError(error);
  }
}
