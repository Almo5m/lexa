"use client";

import { BoRobot } from "@/components/bo-robot";
import { useBoVariant } from "@/components/use-bo-variant";
import { BO_VARIANTS, saveBoVariant, type BoVariant } from "@/features/bo/variant";
import { useT } from "@/lib/i18n/provider";

/** Lets the student pick which Bo he studies with. The choice is kept on this device. */
export function BoPicker() {
  const { t } = useT();
  const chosen = useBoVariant();

  return (
    <div className="space-y-3">
      <p className="text-ink-soft">{t("boPicker.hint")}</p>
      <div role="radiogroup" aria-label={t("boPicker.title")} className="grid grid-cols-2 gap-3">
        {BO_VARIANTS.map((variant: BoVariant) => {
          const selected = chosen === variant;
          return (
            <button
              key={variant}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => saveBoVariant(variant)}
              className={`choice flex-col gap-2 py-4 text-center ${selected ? "choice-picked" : ""}`}
            >
              <BoRobot variant={variant} mood="happy" size={112} />
              <span className="font-bold">{t(`boPicker.${variant}` as const)}</span>
              <span className="text-sm font-normal text-ink-soft">{t(`boPicker.${variant}Hint` as const)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
