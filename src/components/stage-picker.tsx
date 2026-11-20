"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { STAGES, type Stage } from "@/features/stage/stage";

/** Radio chips for the four stages. Inside a form it posts as the field `stage`; with `onPick` it reports the choice. */
export function StagePicker({ initial, onPick, disabled }: { initial?: Stage | null; onPick?: (stage: Stage) => void; disabled?: boolean }) {
  const { t } = useT();
  const [value, setValue] = useState<Stage | null>(initial ?? null);
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1 block text-sm font-medium">{t("stage.label")}</legend>
      <div className="grid grid-cols-2 gap-2">
        {STAGES.map((stage) => (
          <label
            key={stage}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-3 text-center text-sm font-semibold ${value === stage ? "border-indigo bg-paper-deep text-indigo" : "border-line text-ink-soft"}`}
          >
            <input
              type="radio"
              name="stage"
              value={stage}
              className="sr-only"
              checked={value === stage}
              onChange={() => {
                setValue(stage);
                onPick?.(stage);
              }}
              required
            />
            {t(`stage.${stage}` as "stage.sec1")}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
