import Link from "next/link";
import { LexaMascot } from "@/components/lexa-mascot";
import { ReviewSession, type SessionWord } from "@/components/review-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { toDateKey } from "@/features/gamification/streak";
import { buildReviewQueue, classifyWord } from "@/features/srs/scheduler";
import { pickMode } from "@/features/srs/session";
import { rowToState, type WordRow } from "@/lib/words";
import type { WordCard } from "@/features/ai/schemas";

export const metadata = { title: "Review" };

const SESSION_SIZE = 15;

export default async function ReviewPage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();
  const now = new Date();

  const [{ data: wordsData }, { data: day }] = await Promise.all([
    supabase
      .from("words")
      .select("id, term, card, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id")
      .eq("card_status", "ready"),
    supabase
      .from("daily_progress")
      .select("new_words")
      .eq("user_id", user.id)
      .eq("day", toDateKey(now))
      .maybeSingle(),
  ]);

  const rows = ((wordsData ?? []) as unknown as WordRow[]).filter((row) => row.card);
  const byId = new Map(rows.map((row) => [row.id, row]));

  const dueIds = buildReviewQueue(
    rows.map((row) => ({ id: row.id, state: rowToState(row) })),
    settings,
    now,
    SESSION_SIZE,
  );

  const newSlots = Math.max(
    0,
    Math.min(SESSION_SIZE - dueIds.length, settings.dailyGoalNewWords - (day?.new_words ?? 0)),
  );
  const newIds = rows
    .filter((row) => row.last_reviewed_at === null)
    .slice(0, newSlots)
    .map((row) => row.id);

  const sessionWords: SessionWord[] = [...dueIds, ...newIds].flatMap((id) => {
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
      <h1 className="text-2xl font-semibold">{t("review.title")}</h1>
      {sessionWords.length === 0 ? (
        <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
          <LexaMascot mood="neutral" size={140} />
          <p className="text-lg">{t("review.nothing")}</p>
          <p className="text-ink-soft">{t("review.nothingHint")}</p>
          <Link href="/add" className="tag-btn">
            {t("nav.add")}
          </Link>
        </div>
      ) : (
        <ReviewSession words={sessionWords} />
      )}
    </div>
  );
}
