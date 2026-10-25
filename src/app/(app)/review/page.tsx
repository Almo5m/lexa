import Link from "next/link";
import { StepBanner } from "@/components/step-banner";
import { BoMascot } from "@/components/bo-mascot";
import { ReviewSession, type SessionWord } from "@/components/review-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { toDateKey } from "@/features/gamification/streak";
import { buildReviewQueue, classifyWord } from "@/features/srs/scheduler";
import { pickMode } from "@/features/srs/session";
import { rowToState, type WordRow } from "@/lib/words";
import { unitById } from "@/features/curriculum";
import { isDailyMinutes, newWordsQuota, reviewRoundSize } from "@/features/curriculum/session-plan";
import type { WordCard } from "@/features/ai/schemas";

export const metadata = { title: "Review" };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ unit?: string; from?: string }> }) {
  const { unit: unitId, from } = await searchParams;
  const unit = unitId ? unitById(unitId) : undefined;
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();
  const now = new Date();

  const [{ data: profile }, { data: wordsData }, { data: day }] = await Promise.all([
    supabase.from("profiles").select("daily_minutes").eq("id", user.id).single(),
    supabase
      .from("words")
      .select("id, term, card, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id, source")
      .eq("card_status", "ready"),
    supabase
      .from("daily_progress")
      .select("new_words")
      .eq("user_id", user.id)
      .eq("day", toDateKey(now))
      .maybeSingle(),
  ]);

  const minutes = isDailyMinutes(profile?.daily_minutes) ? profile.daily_minutes : 15;
  const roundSize = reviewRoundSize(minutes);
  const rows = ((wordsData ?? []) as unknown as WordRow[]).filter((row) => row.card);
  const byId = new Map(rows.map((row) => [row.id, row]));

  const dueIds = buildReviewQueue(
    rows.map((row) => ({ id: row.id, state: rowToState(row) })),
    settings,
    now,
    roundSize,
  );

  const newSlots = Math.max(
    0,
    Math.min(roundSize - dueIds.length, newWordsQuota(settings.dailyGoalNewWords, minutes) - (day?.new_words ?? 0)),
  );
  const newIds = rows
    .filter((row) => row.last_reviewed_at === null && row.source !== "path")
    .slice(0, newSlots)
    .map((row) => row.id);

  // A unit test practices the words of one unit, weakest first, whether or not they are due.
  const unitTerms = new Set(unit?.words.map((word) => word.en) ?? []);
  const unitIds = unit
    ? rows
        .filter((row) => unitTerms.has(row.term) && row.last_reviewed_at !== null)
        .sort((a, b) => a.repetitions - b.repetitions || b.lapses - a.lapses)
        .slice(0, 10)
        .map((row) => row.id)
    : [];

  const sessionWords: SessionWord[] = (unit ? unitIds : [...dueIds, ...newIds]).flatMap((id) => {
    const row = byId.get(id);
    if (!row || !row.card) return [];
    const status = classifyWord(rowToState(row), settings);
    return [
      {
        id: row.id,
        term: row.term,
        card: row.card as WordCard,
        mode: pickMode({ status, repetitions: row.repetitions, lapses: row.lapses }),
      },
    ];
  });

  return (
    <div className="max-w-2xl space-y-6">
      {from === "today" && !unit && <StepBanner step="review" />}
      <h1 className="text-2xl font-semibold">{unit ? unit.titleAr : t("review.title")}</h1>
      {sessionWords.length === 0 ? (
        <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
          <BoMascot mood="neutral" size={140} />
          <p className="text-lg">{t("review.nothing")}</p>
          <p className="text-ink-soft">{t("review.nothingHint")}</p>
          <Link href="/" className="tag-btn">
            {t("today.backToSession")}
          </Link>
        </div>
      ) : (
        <ReviewSession words={sessionWords} />
      )}
    </div>
  );
}
