"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";

/** The student's plan, always visible next to the chat. */
export function PlanBadge({ plan, days }: { plan: "free" | "plus"; days: number }) {
  const { t } = useT();
  return (
    <Link
      href="/plus"
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ${plan === "plus" ? "bg-xp text-ink" : "bg-paper-deep text-ink-soft"}`}
    >
      {plan === "plus" ? t("bochat.plan.plus", { n: days }) : t("bochat.plan.free")}
    </Link>
  );
}

/** Messages used today out of the plan's allowance. */
export function UsageMeter({ used, limit }: { used: number; limit: number }) {
  const { t } = useT();
  const ratio = limit <= 0 ? 1 : Math.min(used / limit, 1);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>{t("bochat.today")}</span>
        <span className="font-semibold">{t("bochat.counter", { a: Math.min(used, limit), b: limit })}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)} aria-label={t("bochat.today")}>
        <div className={`h-full rounded-full ${ratio >= 1 ? "bg-pen-red" : "bg-[image:var(--grad)]"}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}
