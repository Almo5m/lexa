import Link from "next/link";
import { ReviewIcon, ChatIcon, WordsIcon, XpIcon } from "@/components/icons";
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
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">{t("practice.title")}</h1>

      <Group title={t("practice.groupWords")}>
        <Row href="/review" icon={<ReviewIcon />} title={t("practice.review")} hint={t("practice.reviewHint")} />
        <Row href="/quiz" icon={<WordsIcon />} title={t("practice.quiz")} hint={t("practice.quizHint")} />
      </Group>

      <Group title={t("practice.groupUnderstand")}>
        <Row href="/read" icon={<WordsIcon />} title={t("practice.read")} hint={t("practice.readHint")} />
        <Row href="/translate" icon={<ChatIcon />} title={t("practice.translate")} hint={t("practice.translateHint")} />
      </Group>

      <Group title={t("practice.groupGrammar")}>
        <Row href="/grammar" icon={<WordsIcon />} title={t("practice.grammar")} hint={t("practice.grammarHint")} />
        <Row href="/writing" icon={<ChatIcon />} title={t("practice.writing")} hint={t("practice.writingHint")} />
        <Row href="/listening" icon={<ChatIcon />} title={t("practice.listening")} hint={t("practice.listeningHint")} />
      </Group>

      <Group title={t("practice.groupSpeak")}>
        <Row href="/talk" icon={<ChatIcon />} title={t("practice.talk")} hint={t("practice.talkHint")} />
      </Group>

      <Group title={t("practice.groupLevel")}>
        <Row
          href="/level"
          icon={<XpIcon />}
          title={t("practice.level")}
          hint={level ? t("practice.levelDone", { n: level }) : t("practice.levelHint")}
        />
        <Row href="/suggest" icon={<WordsIcon />} title={t("practice.suggest")} hint={t("suggest.intro")} />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-ink-faint">{title}</h2>
      <ul className="divide-y divide-line border-y border-line">{children}</ul>
    </section>
  );
}

function Row({ href, icon, title, hint }: { href: string; icon: ReactNode; title: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-4 px-1 py-2 hover:bg-paper-deep/60">
        <span className="text-ink-soft">{icon}</span>
        <span>
          <span className="block text-lg font-medium">{title}</span>
          <span className="block text-sm text-ink-soft">{hint}</span>
        </span>
      </Link>
    </li>
  );
}
