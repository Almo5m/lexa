"use client";

import { useState, type FormEvent } from "react";
import { ScrambleText, TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { AppSettings } from "@/lib/settings";

type FieldKind = "text" | "number" | "boolean";

interface FieldSpec {
  key: keyof AppSettings;
  kind: FieldKind;
  step?: number;
}

const GROUPS: { title: DictKey; fields: FieldSpec[] }[] = [
  {
    title: "admin.group.ai",
    fields: [
      { key: "aiModel", kind: "text" },
      { key: "aiFallbackModel", kind: "text" },
      { key: "aiDailyLimitPerStudent", kind: "number" },
      { key: "tutorEnabled", kind: "boolean" },
      { key: "imageExtractionEnabled", kind: "boolean" },
    ],
  },
  {
    title: "admin.group.upload",
    fields: [
      { key: "maxImagesPerUpload", kind: "number" },
      { key: "maxImageSizeMb", kind: "number", step: 0.5 },
    ],
  },
  {
    title: "admin.group.goals",
    fields: [
      { key: "dailyGoalNewWords", kind: "number" },
      { key: "dailyGoalReviews", kind: "number" },
      { key: "xpNewWord", kind: "number" },
      { key: "xpCorrectAnswer", kind: "number" },
      { key: "xpDailyGoal", kind: "number" },
      { key: "streakFreezesPerWeek", kind: "number" },
    ],
  },
  {
    title: "admin.group.srs",
    fields: [
      { key: "srsStartingEase", kind: "number", step: 0.1 },
      { key: "srsFirstIntervalDays", kind: "number", step: 0.1 },
      { key: "srsMasteredIntervalDays", kind: "number" },
      { key: "srsWeakLapses", kind: "number" },
    ],
  },
];

export function AdminSettingsForm({ initial }: { initial: AppSettings }) {
  const { t } = useT();
  const [values, setValues] = useState<AppSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ ok: false, text: t("admin.saveError", { reason: data.error ?? "unknown" }) });
        return;
      }
      setValues(data.settings);
      setMessage({ ok: true, text: t("admin.saved") });
    } catch {
      setMessage({ ok: false, text: t("admin.saveError", { reason: "network" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">{t(group.title)}</legend>
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {group.fields.map((field) => {
              const id = `setting-${field.key}`;
              const label = t(`admin.field.${field.key}` as DictKey);
              const value = values[field.key];
              if (field.kind === "boolean") {
                return (
                  <label key={field.key} htmlFor={id} className="flex min-h-12 items-center gap-3">
                    <input
                      id={id}
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => update(field.key, event.target.checked as never)}
                      className="h-6 w-6 accent-[var(--color-marker-deep)]"
                    />
                    {label}
                  </label>
                );
              }
              return (
                <div key={field.key}>
                  <label htmlFor={id} className="mb-1 block text-sm">
                    {label}
                  </label>
                  <input
                    id={id}
                    type={field.kind === "number" ? "number" : "text"}
                    inputMode={field.kind === "number" ? "decimal" : undefined}
                    step={field.step ?? 1}
                    value={String(value)}
                    onChange={(event) =>
                      update(
                        field.key,
                        (field.kind === "number" ? Number(event.target.value) : event.target.value) as never,
                      )
                    }
                    className="field ltr-text"
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-4">
        <TagButton type="submit" loading={busy}>
          {busy ? <ScrambleText text={t("common.loading")} /> : t("admin.save")}
        </TagButton>
        <p aria-live="polite" className={message?.ok ? "marker px-1 text-leaf" : "pen-error text-pen-red"}>
          {message?.text}
        </p>
      </div>
    </form>
  );
}
