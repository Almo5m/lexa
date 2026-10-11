"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { INTERESTS, MAX_INTERESTS } from "@/features/profile/interests";

export function InterestsForm({ initial }: { initial: string[] }) {
  const { t } = useT();
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  function toggle(id: string) {
    setState("idle");
    setChosen((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length >= MAX_INTERESTS ? current : [...current, id],
    );
  }

  async function save() {
    setBusy(true);
    setState("idle");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: chosen }),
      });
      if (!response.ok) throw new Error("save_failed");
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-ink-soft">{t("me.hint", { n: MAX_INTERESTS })}</p>
      <div className="flex flex-wrap gap-3" role="group" aria-label={t("me.title")}>
        {INTERESTS.map((id) => {
          const on = chosen.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(id)}
              className={`min-h-12 rounded-full px-5 font-medium transition-colors ${
                on ? "bg-indigo text-white" : "bg-sheet text-ink shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep"
              }`}
            >
              {t(`interest.${id}` as DictKey)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <TagButton gradient loading={busy} onClick={save}>
          {t("me.save")}
        </TagButton>
        {state === "saved" && <p className="font-semibold text-leaf">{t("me.saved")}</p>}
        {state === "error" && <p className="pen-error text-pen-red">{t("common.error")}</p>}
      </div>
    </div>
  );
}
