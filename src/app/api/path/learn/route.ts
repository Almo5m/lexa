import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { toDateKey } from "@/features/gamification/streak";
import { entryFor, nextPathWords, pathIndex, unitById } from "@/features/curriculum";
import { basicCard } from "@/features/curriculum/basic-card";
import { isDailyMinutes, newWordsQuota } from "@/features/curriculum/session-plan";
import type { WordCard } from "@/features/ai/schemas";

const EXTRA_WORDS = 10;
const bodySchema = z.object({ more: z.boolean().optional() });

export interface LearnWord {
  id: string;
  term: string;
  card: WordCard;
  enriched: boolean;
  unitTitleAr: string;
}

/**
 * Gives the student today's new words from the path. Words he already got but has not learned yet come first
 * (so closing the page never loses them), then new ones up to today's quota. `more` adds a few beyond the quota.
 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { more } = bodySchema.parse(await request.json().catch(() => ({})));
    const settings = await loadSettings();

    const [{ data: profile }, { data: day }, { data: owned }] = await Promise.all([
      supabase.from("profiles").select("daily_minutes").eq("id", user.id).single(),
      supabase.from("daily_progress").select("new_words").eq("user_id", user.id).eq("day", toDateKey(new Date())).maybeSingle(),
      supabase.from("words").select("term, source, last_reviewed_at"),
    ]);

    const minutes = isDailyMinutes(profile?.daily_minutes) ? profile.daily_minutes : 15;
    const quota = newWordsQuota(settings.dailyGoalNewWords, minutes);
    const ownedRows = owned ?? [];
    const waiting = ownedRows.filter((row) => row.source === "path" && row.last_reviewed_at === null).length;
    const room = more ? Math.max(EXTRA_WORDS - waiting, 0) : Math.max(quota - (day?.new_words ?? 0) - waiting, 0);

    const fresh = nextPathWords(new Set(ownedRows.map((row) => row.term)), room);
    if (fresh.length > 0) {
      const { error } = await supabase.from("words").upsert(
        fresh.map((entry) => ({
          user_id: user.id,
          term: entry.en,
          card: basicCard(entry),
          card_status: "ready",
          source: "path",
          unit_id: entry.unitId,
          enriched: false,
        })),
        { onConflict: "user_id,term", ignoreDuplicates: true },
      );
      if (error) throw error;
    }

    const { data: rows, error } = await supabase
      .from("words")
      .select("id, term, card, enriched, unit_id")
      .eq("source", "path")
      .is("last_reviewed_at", null)
      .eq("card_status", "ready");
    if (error) throw error;

    const limit = more ? EXTRA_WORDS + waiting : quota;
    const words: LearnWord[] = (rows ?? [])
      .flatMap((row) => {
        if (!row.card || !entryFor(row.term)) return [];
        return [{ word: { id: row.id, term: row.term, card: row.card as WordCard, enriched: row.enriched, unitTitleAr: unitById(row.unit_id ?? "")?.titleAr ?? "" } }];
      })
      .sort((a, b) => pathIndex(a.word.term) - pathIndex(b.word.term))
      .slice(0, Math.max(limit, 0))
      .map((item) => item.word);

    return NextResponse.json({ words });
  } catch (error) {
    return handleApiError(error);
  }
}
