"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

export interface AdminUnit {
  id: string;
  titleAr: string;
  titleEn: string;
  words: { id: string; term: string; meaningAr: string }[];
}

interface Problem {
  line: number;
  reason: string;
}

async function send(body: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const response = await fetch("/api/admin/school", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

/** The admin's school curriculum: units in order, and a box to paste or upload each unit's words. */
export function AdminSchool({ units }: { units: AdminUnit[] }) {
  const { t } = useT();
  const router = useRouter();
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(body: object, done?: (data: Record<string, unknown>) => void) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await send(body);
      if (!result.ok) {
        setMessage(t("common.error"));
        return;
      }
      done?.(result.data);
      router.refresh();
    } catch {
      setMessage(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const total = units.reduce((sum, unit) => sum + unit.words.length, 0);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("school.admin.intro")}</p>
      <p className="text-2xl font-bold">
        {total}
        <span className="ms-2 text-base font-normal text-ink-soft">{t("school.admin.totalWords", { n: units.length })}</span>
      </p>

      <section className="sheet space-y-3 p-6" aria-labelledby="add-unit-title">
        <h2 id="add-unit-title" className="text-lg font-bold">
          {t("school.admin.addUnit")}
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!titleAr.trim()) return;
            void run({ action: "addUnit", titleAr, titleEn }, () => {
              setTitleAr("");
              setTitleEn("");
            });
          }}
        >
          <input className="field" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder={t("school.admin.titleAr")} maxLength={80} required aria-label={t("school.admin.titleAr")} />
          <input className="field ltr-text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder={t("school.admin.titleEn")} maxLength={80} aria-label={t("school.admin.titleEn")} />
          <TagButton type="submit" disabled={busy} gradient>
            {t("school.admin.add")}
          </TagButton>
        </form>
        {message && <p role="alert" className="pen-error">{message}</p>}
      </section>

      {units.length === 0 && <p className="text-ink-soft">{t("school.admin.empty")}</p>}

      <ul className="space-y-4">
        {units.map((unit, index) => (
          <UnitCard key={unit.id} unit={unit} first={index === 0} last={index === units.length - 1} busy={busy} run={run} />
        ))}
      </ul>
    </div>
  );
}

function UnitCard({
  unit,
  first,
  last,
  busy,
  run,
}: {
  unit: AdminUnit;
  first: boolean;
  last: boolean;
  busy: boolean;
  run: (body: object, done?: (data: Record<string, unknown>) => void) => Promise<void>;
}) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [result, setResult] = useState<{ saved: number; problems: Problem[] } | null>(null);
  const [showWords, setShowWords] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 200_000) return;
    setText(await file.text());
  }

  return (
    <li className="sheet space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{unit.titleAr}</h3>
          {unit.titleEn && <p className="ltr-text text-sm text-ink-soft">{unit.titleEn}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-paper-deep px-3 py-1 font-semibold">{t("school.admin.wordsCount", { n: unit.words.length })}</span>
          <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={busy || first} onClick={() => void run({ action: "moveUnit", id: unit.id, direction: "up" })}>
            {t("school.admin.up")}
          </button>
          <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={busy || last} onClick={() => void run({ action: "moveUnit", id: unit.id, direction: "down" })}>
            {t("school.admin.down")}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={`words-${unit.id}`} className="block text-sm font-semibold">
          {t("school.admin.paste")}
        </label>
        <p className="text-xs text-ink-faint">{t("school.admin.format")}</p>
        <textarea
          id={`words-${unit.id}`}
          dir="ltr"
          rows={5}
          className="field ltr-text font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"care | noun | رعاية | Take care of yourself. | اهتم بنفسك."}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,.txt,text/csv,text/plain" aria-label={t("school.admin.file")} onChange={(e) => void readFile(e.target.files?.[0])} className="text-sm" />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            {t("school.admin.replace")}
          </label>
        </div>
        <TagButton
          disabled={busy || text.trim() === ""}
          gradient
          onClick={() =>
            void run({ action: "importWords", unitId: unit.id, text, replace }, (data) => {
              setResult({ saved: Number(data.saved ?? 0), problems: (data.problems as Problem[]) ?? [] });
              if (Number(data.saved ?? 0) > 0) setText("");
            })
          }
        >
          {t("school.admin.import")}
        </TagButton>
        {result && (
          <div role="status" className="space-y-1 text-sm">
            <p className="font-semibold text-leaf">{t("school.admin.saved", { n: result.saved })}</p>
            {result.problems.length > 0 && (
              <ul className="space-y-0.5 text-pen-red">
                {result.problems.slice(0, 12).map((problem) => (
                  <li key={problem.line}>{t("school.admin.problem", { line: problem.line, reason: t(`school.admin.reason.${problem.reason}` as DictKey) })}</li>
                ))}
                {result.problems.length > 12 && <li>{t("school.admin.moreProblems", { n: result.problems.length - 12 })}</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      {unit.words.length > 0 && (
        <div>
          <button type="button" className="min-h-11 text-sm font-semibold text-indigo" onClick={() => setShowWords((value) => !value)} aria-expanded={showWords}>
            {showWords ? t("school.admin.hideWords") : t("school.admin.showWords")}
          </button>
          {showWords && (
            <ul className="mt-2 divide-y divide-line">
              {unit.words.map((word) => (
                <li key={word.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="ltr-text font-medium">{word.term}</span>
                    <span className="ms-3 text-sm text-ink-soft">{word.meaningAr}</span>
                  </span>
                  <button type="button" className="min-h-11 px-2 text-sm text-pen-red" disabled={busy} onClick={() => void run({ action: "deleteWord", id: word.id })}>
                    {t("school.admin.deleteWord")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-line pt-3">
        {confirmDelete ? (
          <>
            <span className="text-sm text-pen-red">{t("school.admin.deleteAsk")}</span>
            <TagButton disabled={busy} onClick={() => void run({ action: "deleteUnit", id: unit.id })}>
              {t("school.admin.deleteYes")}
            </TagButton>
            <TagButton quiet onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </TagButton>
          </>
        ) : (
          <button type="button" className="min-h-11 text-sm text-pen-red" onClick={() => setConfirmDelete(true)}>
            {t("school.admin.deleteUnit")}
          </button>
        )}
      </div>
    </li>
  );
}
