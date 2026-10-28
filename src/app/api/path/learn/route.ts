import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { toDateKey } from "@/features/gamification/streak";
import { entryFor, nextPathWords, pathIndex, startUnitIndex, unitById } from "@/features/curriculum";
import { basicCard } from "@/features/curriculum/basic-card";
import { schoolCard } from "@/features/school/card";
import { loadSchoolUnits } from "@/features/school/load";
import { nextSchoolWords, schoolWordTotal } from "@/features/school/pick";
import { loadPathCards } from "@/features/curriculum/path-cards-db";
import { isDailyMinutes, newWordsQuota } from "@/features/curriculum/session-plan";
import type { WordCard } from "@/features/ai/schemas";

const EXTRA_WORDS = 10;
const bodySchema = z.object({
  more: z.boolean().optional(),
  /** Study one school unit the student picked, whatever today's quota is. */
  unit: z.string().uuid().optional(),
  /** "path" asks for our own improvement path instead of the school curriculum. */
  track: z.enum(["school", "path"]).optional(),
});

export interface LearnWord {
  id: string;
  term: string;
  card: WordCard;
  enriched: boolean;
  unitTitleAr: string;
}

/**
 * Gives the student today's new words. The school curriculum is the main source; our own path is only used when
 * the student asks for it, or when the admin has not uploaded any school words yet. Words he already got but has
 * not learned yet come first (so closing the page never loses them), then new ones up to today's quota.
 * `more` adds a few beyond the quota, and `unit` studies one chosen school unit.
 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { more, unit, track } = bodySchema.parse(await request.json().catch(() => ({})));
    const settings = await loadSettings();

    const [{ data: profile }, { data: day }, { data: owned }, schoolUnits] = await Promise.all([
      supabase.from("profiles").select("daily_minutes, level_band").eq("id", user.id).single(),
      supabase.from("daily_progress").select("new_words").eq("user_id", user.id).eq("day", toDateKey(new Date())).maybeSingle(),
      supabase.from("words").select("term, source, last_reviewed_at"),
      loadSchoolUnits(supabase),
    ]);

    const source: "school" | "path" = track === "path" || schoolWordTotal(schoolUnits) === 0 ? "path" : "school";
    const minutes = isDailyMinutes(profile?.daily_minutes) ? profile.daily_minutes : 15;
    const quota = newWordsQuota(settings.dailyGoalNewWords, minutes);
    const ownedRows = owned ?? [];
    const ownedTerms = new Set(ownedRows.map((row) => row.term));
    const waiting = ownedRows.filter((row) => row.source === source && row.last_reviewed_at === null).length;
    const extra = Boolean(more || unit);
    const room = extra ? Math.max(EXTRA_WORDS - waiting, 0) : Math.max(quota - (day?.new_words ?? 0) - waiting, 0);

    if (source === "school") {
      const fresh = nextSchoolWords(schoolUnits, ownedTerms, room, unit);
      if (fresh.length > 0) {
        const { error } = await supabase.from("words").upsert(
          fresh.map((word) => ({
            user_id: user.id,
            term: word.term,
            card: schoolCard(word),
            card_status: "ready",
            source: "school",
            unit_id: word.unitId,
            enriched: false,
          })),
          { onConflict: "user_id,term", ignoreDuplicates: true },
        );
        if (error) throw error;
      }
      const { data: rows, error } = await supabase
        .from("words")
        .select("id, term, card, enriched, unit_id")
        .eq("source", "school")
        .is("last_reviewed_at", null)
        .eq("card_status", "ready");
      if (error) throw error;

      const order = new Map(schoolUnits.flatMap((u) => u.words.map((w, index) => [w.term, schoolUnits.indexOf(u) * 100_000 + index] as const)));
      const titles = new Map(schoolUnits.map((u) => [u.id, u.titleAr]));
      const limit = extra ? EXTRA_WORDS + waiting : quota;
      const words: LearnWord[] = (rows ?? [])
        .filter((row) => row.card && (!unit || row.unit_id === unit))
        .sort((a, b) => (order.get(a.term) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.term) ?? Number.MAX_SAFE_INTEGER))
        .slice(0, Math.max(limit, 0))
        .map((row) => ({ id: row.id, term: row.term, card: row.card as WordCard, enriched: row.enriched, unitTitleAr: titles.get(row.unit_id ?? "") ?? "" }));
      return NextResponse.json({ words });
    }

    const fresh = nextPathWords(ownedTerms, room, startUnitIndex(profile?.level_band));
    if (fresh.length > 0) {
      // A word with a finished card gets it at once; the hand-written basic card is only the fallback.
      const finished = await loadPathCards(supabase, fresh.map((entry) => entry.en));
      const { error } = await supabase.from("words").upsert(
        fresh.map((entry) => ({
          user_id: user.id,
          term: entry.en,
          card: finished.get(entry.en) ?? basicCard(entry),
          card_status: "ready",
          source: "path",
          unit_id: entry.unitId,
          enriched: finished.has(entry.en),
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

    // Words handed out earlier with only the basic card get the finished one as soon as it exists.
    const basic = (rows ?? []).filter((row) => !row.enriched);
    const upgrades = await loadPathCards(supabase, basic.map((row) => row.term));
    await Promise.all(
      basic.flatMap((row) => {
        const card = upgrades.get(row.term);
        if (!card) return [];
        row.card = card;
        row.enriched = true;
        return [supabase.from("words").update({ card, enriched: true }).eq("id", row.id)];
      }),
    );

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
