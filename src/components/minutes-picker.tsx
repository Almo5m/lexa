"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { DAILY_MINUTES, type DailyMinutes } from "@/features/curriculum/session-plan";

/** The student chooses how long he studies each day; the number of new words and the review round follow it. */
export function MinutesPicker({ initial }: { initial: DailyMinutes }) {
  const { t } = useT();
  const router = useRouter();
  const [value, setValue] = useState<DailyMinutes>(initial);
  const [failed, setFailed] = useState(false);

  async function choose(minutes: DailyMinutes) {
    const before = value;
    setValue(minutes);
    setFailed(false);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyMinutes: minutes }),
      });
      if (!response.ok) throw new Error("minutes_failed");
      router.refresh();
    } catch {
      setValue(before);
      setFailed(true);
    }
  }

  return (
    <div>
      <p id="minutes-label" className="mb-2 text-sm opacity-85">
        {t("today.minutes")}
      </p>
      <div role="radiogroup" aria-labelledby="minutes-label" className="flex gap-2">
        {DAILY_MINUTES.map((minutes) => (
          <button
            key={minutes}
            type="button"
            role="radio"
            aria-checked={value === minutes}
            onClick={() => choose(minutes)}
            className={`min-h-11 flex-1 rounded-full px-3 text-sm font-semibold transition ${
              value === minutes ? "bg-white text-indigo" : "bg-white/15 text-white"
            }`}
          >
            {t("today.minutesValue", { n: minutes })}
          </button>
        ))}
      </div>
      {failed && <p role="alert" className="mt-2 text-sm">{t("common.error")}</p>}
    </div>
  );
}
