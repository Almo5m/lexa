import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { GRAMMAR_UNITS } from "@/features/grammar";

export const metadata = { title: "Grammar" };

/** The grammar of the school book, unit by unit. */
export default async function GrammarPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("grammar.title")}</h1>
        <p className="text-ink-soft">{t("grammar.intro")}</p>
      </div>
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
      <Link href="/writing" className="sheet flex min-h-14 items-center justify-between gap-3 px-5 py-3 font-medium text-indigo">
        {t("practice.writing")}
        <span aria-hidden="true" className="ltr:rotate-180">‹</span>
      </Link>
    </div>
  );
}
