import Link from "next/link";
import { ReviewIcon, QuizIcon, ReadIcon, TranslateIcon, GrammarIcon, WritingIcon, ListenIcon, MicIcon, SparkIcon, XpIcon } from "@/components/icons";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import type { ReactNode } from "react";

export const metadata = { title: "Practice" };

export default async function PracticePage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const { data: profile } = await supabase.from("profiles").select("level_band").eq("id", user.id).single();
  const level = profile?.level_band ?? null;

  return (
    <div className="max-w-2xl space-y-8 lg:max-w-5xl">
      <h1 className="text-2xl font-semibold">{t("practice.title")}</h1>

      <Group title={t("practice.groupWords")}>
        <Row href="/review" icon={<ReviewIcon />} title={t("practice.review")} hint={t("practice.reviewHint")} />
        <Row href="/quiz" icon={<QuizIcon />} title={t("practice.quiz")} hint={t("practice.quizHint")} />
      </Group>

      <Group title={t("practice.groupUnderstand")}>
        <Row href="/read" icon={<ReadIcon />} title={t("practice.read")} hint={t("practice.readHint")} />
        <Row href="/translate" icon={<TranslateIcon />} title={t("practice.translate")} hint={t("practice.translateHint")} />
      </Group>

      <Group title={t("practice.groupGrammar")}>
        <Row href="/grammar" icon={<GrammarIcon />} title={t("practice.grammar")} hint={t("practice.grammarHint")} />
        <Row href="/writing" icon={<WritingIcon />} title={t("practice.writing")} hint={t("practice.writingHint")} />
        <Row href="/listening" icon={<ListenIcon />} title={t("practice.listening")} hint={t("practice.listeningHint")} />
      </Group>

      <Group title={t("practice.groupSpeak")}>
        <Row href="/talk" icon={<MicIcon />} title={t("practice.talk")} hint={t("practice.talkHint")} />
      </Group>

      <Group title={t("practice.groupLevel")}>
        <Row
          href="/level"
          icon={<XpIcon />}
          title={t("practice.level")}
          hint={level ? t("practice.levelDone", { n: level }) : t("practice.levelHint")}
        />
        <Row href="/suggest" icon={<SparkIcon />} title={t("practice.suggest")} hint={t("suggest.intro")} />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-ink-faint">{title}</h2>
      <ul className="grid gap-3 lg:grid-cols-2">{children}</ul>
    </section>
  );
}

function Row({ href, icon, title, hint }: { href: string; icon: ReactNode; title: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="sheet flex min-h-[72px] items-center gap-4 px-4 py-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo/10 text-indigo">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{title}</span>
          <span className="block text-sm text-ink-soft">{hint}</span>
        </span>
        <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
      </Link>
    </li>
  );
}
