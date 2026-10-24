import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { REQUIRED_STEPS, stepNumber, type StepKey } from "@/features/curriculum/today-plan";

/**
 * The strip at the top of every exercise that belongs to today's session: which step this is, how many there are,
 * and one way back. It is the same on every page, so the student always knows where he is.
 */
export async function StepBanner({ step }: { step: StepKey }) {
  const { t } = await getT();
  const number = stepNumber(step);
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--r-md)] bg-sheet px-4 py-3 shadow-[var(--shadow-1)]">
      <div className="flex items-center gap-2.5">
        <ol className="flex gap-1" aria-hidden="true">
          {REQUIRED_STEPS.map((key) => (
            <li key={key} className={`h-2.5 w-5 rounded-full ${key === step ? "bg-indigo" : "bg-paper-deep"}`} />
          ))}
        </ol>
        <p className="whitespace-nowrap text-sm font-semibold">
          {number ? t("today.stepNumber", { a: number, b: REQUIRED_STEPS.length }) : t("today.extraTag")}
        </p>
      </div>
      <Link href="/" className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-medium text-indigo">
        {t("today.sessionShort")}
      </Link>
    </div>
  );
}
