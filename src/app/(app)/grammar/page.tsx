import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { GRAMMAR_UNITS } from "@/features/grammar";
import { loadTopics } from "@/features/grammar/topics";
import { chosenStage, hasBook } from "@/features/stage/stage";

export const metadata = { title: "Grammar" };

/** The grammar of the school book, unit by unit. */
export default async function GrammarPage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const { data: profile } = await supabase.from("profiles").select("stage").eq("id", user.id).single();
  const stage = chosenStage(profile?.stage);
  const book = hasBook(profile?.stage);
  const topics = stage ? await loadTopics(supabase, stage) : [];
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("grammar.title")}</h1>
        <p className="text-ink-soft">{t("grammar.intro")}</p>
      </div>
      {topics.length > 0 && (
        <section className="space-y-2" aria-label={t("grammar.topics")}>
          <h2 className="font-semibold">{t("grammar.topics")}</h2>
          <ul className="divide-y divide-line border-y border-line">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link href={`/grammar/topic/${topic.id}`} className="flex min-h-16 items-center justify-between gap-4 px-1 py-2 hover:bg-paper-deep/60">
                  <span className="text-lg font-medium">{topic.title}</span>
                  <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!book && topics.length === 0 && <p className="sheet p-6 text-center text-ink-soft">{t("grammar.noneYet")}</p>}
      {book && (
      <ul className="divide-y divide-line border-y border-line">
        {GRAMMAR_UNITS.map((unit) => (
          <li key={unit.id}>
            <Link href={`/grammar/${unit.id}`} className="flex min-h-16 items-center justify-between gap-4 px-1 py-2 hover:bg-paper-deep/60">
              <span>
                <span className="block text-sm text-ink-soft">{t("grammar.unit", { n: unit.number })} · {unit.topic}</span>
                <span className="block text-lg font-medium" dir="ltr">{unit.rule}</span>
              </span>
              <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
            </Link>
          </li>
        ))}
      </ul>
      )}
      {book && (
      <Link href="/writing" className="sheet flex min-h-14 items-center justify-between gap-3 px-5 py-3 font-medium text-indigo">
        {t("practice.writing")}
        <span aria-hidden="true" className="ltr:rotate-180">‹</span>
      </Link>
      )}
    </div>
  );
}
