"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TagButton } from "@/components/tag-button";
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
  const router = useRouter();
  const [saved, setSaved] = useState<AppSettings>(initial);
  const [values, setValues] = useState<AppSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

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
      setSaved(data.settings);
      setValues(data.settings);
      setMessage({ ok: true, text: t("admin.saved") });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: t("admin.saveError", { reason: "network" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28">
      {GROUPS.map((group) => (
        <fieldset key={group.title} className="sheet p-6">
          <legend className="float-start mb-4 w-full text-lg font-bold">{t(group.title)}</legend>
          <div className="clear-both grid gap-x-8 gap-y-6 md:grid-cols-2">
            {group.fields.map((field) => {
              const id = `setting-${field.key}`;
              const label = t(`admin.field.${field.key}` as DictKey);
              const help = t(`admin.help.${field.key}` as DictKey);
              const value = values[field.key];

              if (field.kind === "boolean") {
                return (
                  <div key={field.key} className="flex items-start justify-between gap-4 rounded-[var(--r-sm)] bg-paper-deep/60 p-4">
                    <div>
                      <label htmlFor={id} className="font-medium">
                        {label}
                      </label>
                      <p id={`${id}-help`} className="text-sm text-ink-soft">
                        {help}
                      </p>
                    </div>
                    <button
                      id={id}
                      type="button"
                      role="switch"
                      aria-checked={Boolean(value)}
                      aria-describedby={`${id}-help`}
                      onClick={() => update(field.key, !value as never)}
                      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                        value ? "bg-leaf" : "bg-line"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                          value ? "start-7" : "start-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <div key={field.key}>
                  <label htmlFor={id} className="mb-1 block font-medium">
                    {label}
                  </label>
                  <input
                    id={id}
                    type={field.kind === "number" ? "number" : "text"}
                    inputMode={field.kind === "number" ? "decimal" : undefined}
                    step={field.step ?? 1}
                    value={String(value)}
                    aria-describedby={`${id}-help`}
                    onChange={(event) => {
                      if (field.kind === "number") {
                        const next = event.target.valueAsNumber;
                        if (!Number.isNaN(next)) update(field.key, next as never);
                      } else {
                        update(field.key, event.target.value as never);
                      }
                    }}
                    className="field ltr-text"
                  />
                  <p id={`${id}-help`} className="mt-1 text-sm text-ink-soft">
                    {help}
                  </p>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-sheet/95 px-5 py-3 backdrop-blur transition-transform ${
          dirty || message ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className={message ? (message.ok ? "font-medium text-leaf" : "pen-error text-pen-red") : "text-ink-soft"}>
            {message ? message.text : t("admin.unsaved")}
          </p>
          <div className="flex gap-3">
            {dirty && (
              <TagButton quiet onClick={() => setValues(saved)}>
                {t("admin.discard")}
              </TagButton>
            )}
            <TagButton type="submit" loading={busy} disabled={!dirty} gradient>
              {t("admin.save")}
            </TagButton>
          </div>
        </div>
      </div>
    </form>
  );
}
