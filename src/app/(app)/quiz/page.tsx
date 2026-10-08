import Link from "next/link";
import { LexaMascot } from "@/components/lexa-mascot";
import { QuizSession } from "@/components/quiz-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { classifyWord, isDue } from "@/features/srs/scheduler";
import { buildQuiz, MIN_WORDS_FOR_QUIZ, type QuizWord } from "@/features/quiz/build";
import { rowToState, type WordRow } from "@/lib/words";

export const metadata = { title: "Quiz" };
export const dynamic = "force-dynamic";

const QUESTION_COUNT = 10;

export default async function QuizPage() {
  const { supabase } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();

  const { data } = await supabase
    .from("words")
    .select("id, term, card, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id")
    .eq("card_status", "ready");
  const rows = ((data ?? []) as unknown as WordRow[]).filter((row) => row.card?.meaningsAr?.[0]);

  const now = new Date();
  const rank = (row: WordRow) => {
    const state = rowToState(row);
    if (classifyWord(state, settings) === "weak") return 0;
    if (state.lastReviewedAt !== null && isDue(state, now)) return 1;
    return 2;
  };
  const ordered = [...rows].sort((a, b) => rank(a) - rank(b) || Math.random() - 0.5);

  const words: QuizWord[] = ordered.map((row) => ({
    id: row.id,
    term: row.term,
    meaningAr: row.card!.meaningsAr[0],
    situationAr: row.card!.situationAr,
    sentence: row.card!.sentence,
  }));
  const questions = buildQuiz(words, QUESTION_COUNT);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("quiz.title")}</h1>
      {questions.length === 0 ? (
        <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
          <LexaMascot mood="neutral" size={140} />
          <p>{t("quiz.need", { n: MIN_WORDS_FOR_QUIZ })}</p>
          <Link href="/add" className="tag-btn">
            {t("nav.add")}
          </Link>
        </div>
      ) : (
        <QuizSession questions={questions} />
      )}
    </div>
  );
}
