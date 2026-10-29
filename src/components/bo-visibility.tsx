"use client";

import { useBoCompanion } from "@/components/bo-companion-context";
import { useT } from "@/lib/i18n/provider";

/** Lets the student show or hide Bo floating over every screen. The choice is kept on this device. */
export function BoVisibility() {
  const { t } = useT();
  const { hidden, setHidden } = useBoCompanion();

  return (
    <div className="space-y-3">
      <p className="text-ink-soft">{t("boPicker.hint")}</p>
      <label className="flex min-h-12 items-center gap-3 font-semibold">
        <input type="checkbox" checked={!hidden} onChange={(event) => setHidden(!event.target.checked)} className="size-5 accent-indigo" />
        {t("boPicker.visible")}
      </label>
    </div>
  );
}
