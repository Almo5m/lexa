import type { Metadata } from "next";
import { AlmoSignature } from "@/components/almo-signature";
import { LexaMascot } from "@/components/lexa-mascot";
import { LevelBar } from "@/components/talk-session";
import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildProgressReport } from "@/features/share/report";
import { hashShareToken, isActive, isPlausibleToken } from "@/features/share/token";
import type { DictKey } from "@/lib/i18n/dictionary";

// A private page: never indexed, never cached.
export const metadata: Metadata = { title: "Progress", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function loadReport(token: string) {
  if (!isPlausibleToken(token)) return null;
  const { data: link } = await createSupabaseAdminClient()
    .from("share_links")
    .select("user_id, expires_at")
    .eq("token_hash", hashShareToken(token))
    .maybeSingle();
  if (!link || !isActive(link.expires_at)) return null;
  return buildProgressReport(link.user_id);
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getT();
  const report = await loadReport(token);

  if (!report) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <LexaMascot mood="neutral" size={120} />
        <p className="text-lg">{t("share.invalid")}</p>
      </div>
    );
  }

  const maxAnswers = Math.max(1, ...report.week.map((day) => day.answers));

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-4">
        <LexaMascot mood="happy" size={80} />
        <h1 className="text-2xl font-bold">
          {report.firstName ? t("share.reportTitle", { name: report.firstName }) : t("share.reportTitleAnon")}
        </h1>
      </header>

      <section className="grid grid-cols-3 gap-3" aria-label="Summary">
        <Stat label={t("share.level")} value={report.level} />
        <Stat label={t("share.xp")} value={report.totalXp} />
        <Stat label={t("share.streak")} value={report.streak} note={t("share.longest", { n: report.longestStreak })} />
      </section>

      <section className="sheet space-y-3 p-5" aria-labelledby="words-title">
        <h2 id="words-title" className="font-bold">
          {t("share.words")}
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label={t("share.wordsTotal")} value={report.words.total} flat />
          <Stat label={t("share.mastered")} value={report.words.mastered} flat />
          <Stat label={t("share.weak")} value={report.words.weak} flat />
        </div>
      </section>

      <section className="sheet space-y-3 p-5" aria-labelledby="week-title">
        <h2 id="week-title" className="font-bold">
          {t("share.week")}
        </h2>
        <ul className="flex h-28 items-end gap-2">
          {report.week.map((day) => (
            <li key={day.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={t("share.answers", { n: day.answers })}>
              <span
                className="w-full rounded-t-md bg-[image:var(--grad)]"
                style={{ height: `${day.answers === 0 ? 4 : Math.max(8, (day.answers / maxAnswers) * 80)}px`, opacity: day.answers === 0 ? 0.25 : 1 }}
              />
              <span className="text-xs text-ink-faint">{day.day.slice(8)}</span>
              <span className="sr-only">{t("share.answers", { n: day.answers })}</span>
            </li>
          ))}
        </ul>
      </section>

      {report.language && (
        <section className="sheet space-y-4 p-5" aria-labelledby="lang-title">
          <h2 id="lang-title" className="font-bold">
            {t("share.language")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <LevelBar label={t("talk.vocabulary")} level={report.language.average.vocabulary} />
            <LevelBar label={t("talk.grammar")} level={report.language.average.grammar} />
            <LevelBar label={t("talk.clarity")} level={report.language.average.clarity} />
          </div>
          {report.language.patterns.length > 0 && (
            <div>
              <h3 className="mb-1 font-semibold">{t("share.patterns")}</h3>
              <ul className="list-disc space-y-1 ps-5 text-ink-soft">
                {report.language.patterns.map((pattern) => (
                  <li key={pattern.type}>{t(`talk.type.${pattern.type}` as DictKey)}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-ink-faint">{t("share.languageNote", { n: report.language.texts })}</p>
        </section>
      )}

      <p className="text-sm text-ink-faint">{t("share.footer")}</p>
      <AlmoSignature />
    </div>
  );
}

function Stat({ label, value, note, flat = false }: { label: string; value: number; note?: string; flat?: boolean }) {
  return (
    <div className={flat ? "rounded-lg bg-paper-deep p-3" : "sheet p-4 text-center"}>
      <p className="text-3xl font-bold text-indigo">{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
      {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
    </div>
  );
}
