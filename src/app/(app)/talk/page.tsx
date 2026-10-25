import { LevelBar, TalkSession } from "@/components/talk-session";
import { StepBanner } from "@/components/step-banner";
import { BoMascot } from "@/components/bo-mascot";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { recentAverage, topMistakeTypes, type StoredSession } from "@/features/talk/analyze";
import { topicsFor } from "@/features/talk/topics";
import { SPEAK_WORDS, WORDS_TOPIC, recentWords, wordsTopicPrompt } from "@/features/curriculum/today";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "Talk" };

export default async function TalkPage({ searchParams }: { searchParams: Promise<{ today?: string }> }) {
  const { today } = await searchParams;
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();

  const [{ data: profile }, { data: sessionsData }] = await Promise.all([
    supabase.from("profiles").select("interests").eq("id", user.id).single(),
    supabase
      .from("talk_sessions")
      .select("vocabulary_level, grammar_level, clarity_level, mistakes, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const sessions = (sessionsData ?? []) as unknown as StoredSession[];
  const todayWords = today === "1" ? await recentWords(supabase, SPEAK_WORDS) : [];
  const topics = [
    ...(todayWords.length >= 2 ? [{ id: WORDS_TOPIC, prompt: wordsTopicPrompt(todayWords) }] : []),
    ...topicsFor(profile?.interests ?? []).map(({ id, prompt }) => ({ id, prompt })),
  ];
  const average = recentAverage(sessions);
  const patterns = topMistakeTypes(sessions);

  return (
    <div className="max-w-2xl space-y-8">
      {today === "1" && <StepBanner step="speak" />}
      <div className="flex items-end gap-3">
        <BoMascot mood="neutral" size={84} />
        <div>
          <h1 className="text-2xl font-semibold">{t("talk.title")}</h1>
          <p className="text-ink-soft">{t("talk.intro")}</p>
        </div>
      </div>

      <TalkSession topics={topics} />

      <section aria-labelledby="profile-title" className="sheet space-y-5 p-5 md:p-6">
        <h2 id="profile-title" className="text-xl font-bold">
          {t("talk.profileTitle")}
        </h2>
        {!average ? (
          <p className="text-ink-soft">{t("talk.profileEmpty")}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <LevelBar label={t("talk.vocabulary")} level={average.vocabulary} />
              <LevelBar label={t("talk.grammar")} level={average.grammar} />
              <LevelBar label={t("talk.clarity")} level={average.clarity} />
            </div>
            {patterns.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold">{t("talk.patterns")}</h3>
                <ul className="space-y-3">
                  {patterns.map((pattern) => (
                    <li key={pattern.type} className="rounded-lg bg-paper-deep p-4">
                      <p className="font-semibold">
                        {t(`talk.type.${pattern.type}` as DictKey)}
                        <span className="ms-2 text-sm font-normal text-ink-faint">{t("talk.times", { n: pattern.count })}</span>
                      </p>
                      <p className="mt-1 text-ink-soft">{t(`talk.why.${pattern.type}` as DictKey)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-ink-faint">
              {t("talk.sessions", { n: sessions.length })} · {t("talk.profileHint")}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
