"use client";

import { BoMascot } from "@/components/bo-mascot";
import { COLORS, HATS, clampLook, type BoLook } from "@/features/bo/look";
import { saveLook, useBoLook } from "@/features/bo/look-store";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useT } from "@/lib/i18n/provider";

/** Hats and colors for Bo. Each one opens at a level; the choice stays on this device. */
export function BoLookPicker({ level }: { level: number }) {
  const { t } = useT();
  const look = clampLook(useBoLook(), level);
  const choose = (next: Partial<BoLook>) => saveLook({ ...look, ...next });

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">{t("look.hint", { n: level })}</p>
      <BoMascot mood="happy" size={120} />
      <fieldset className="space-y-2">
        <legend className="font-semibold">{t("look.hat")}</legend>
        <div className="flex flex-wrap gap-2">
          {HATS.map((hat) => {
            const locked = hat.minLevel > level;
            return (
              <button key={hat.id} type="button" disabled={locked} aria-pressed={look.hat === hat.id} onClick={() => choose({ hat: hat.id })} className={`choice !w-auto min-h-11 px-4 ${look.hat === hat.id ? "choice-picked" : ""} ${locked ? "opacity-50" : ""}`}>
                {t(`look.hat.${hat.id}` as DictKey)}{locked ? ` · ${t("look.level", { n: hat.minLevel })}` : ""}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="font-semibold">{t("look.color")}</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => {
            const locked = color.minLevel > level;
            return (
              <button key={color.id} type="button" disabled={locked} aria-pressed={look.color === color.id} onClick={() => choose({ color: color.id })} className={`choice !w-auto min-h-11 gap-2 px-4 ${look.color === color.id ? "choice-picked" : ""} ${locked ? "opacity-50" : ""}`}>
                <span aria-hidden="true" className="inline-block size-4 rounded-full" style={{ background: color.hex }} />
                {t(`look.color.${color.id}` as DictKey)}{locked ? ` · ${t("look.level", { n: color.minLevel })}` : ""}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
