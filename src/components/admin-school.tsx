"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import { UNIT_STAGES, isUnitStage, type UnitStage } from "@/features/stage/stage";
import { AdminStageTabs } from "@/components/admin-stage-tabs";
import type { DictKey } from "@/lib/i18n/dictionary";

export interface AdminWord {
  id: string;
  term: string;
  meaningAr: string;
  pos: string;
  exampleEn: string;
  exampleAr: string;
}

export interface AdminUnit {
  id: string;
  titleAr: string;
  titleEn: string;
  stage: string;
  words: AdminWord[];
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

/**
 * The admin's school curriculum, organised by stage. A stage tab shows the units that stage studies (its own and the shared ones),
 * every unit is a closed row that opens to three clear parts: its words, adding words, and the unit's settings.
 */
export function AdminSchool({ units, stage }: { units: AdminUnit[]; stage: string }) {
  const { t } = useT();
  const router = useRouter();
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [newStage, setNewStage] = useState<UnitStage>(isUnitStage(stage) ? stage : "all");
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

  const shown = units.filter((unit) => stage === "all" || unit.stage === "all" || unit.stage === stage);
  const wordsIn = (list: AdminUnit[]) => list.reduce((sum, unit) => sum + unit.words.length, 0);
  const tabs = [
    { value: "all", label: t("school.admin.stage.every"), count: units.length },
    ...(["sec1", "sec2", "sec3", "general"] as const).map((item) => ({ value: item, label: t(`school.admin.stage.${item}` as DictKey), count: units.filter((unit) => unit.stage === item).length })),
  ];

  return (
    <div className="space-y-6">
      <AdminStageTabs tab="school" current={stage} items={tabs} label={t("school.admin.stage")} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-ink-soft">{stage === "all" ? t("school.admin.introAll") : t("school.admin.introStage")}</p>
        <p className="text-sm text-ink-soft">
          <span className="text-2xl font-bold text-ink">{wordsIn(shown)}</span> {t("school.admin.totalWords", { n: shown.length })}
        </p>
      </div>

      <details className="sheet" open={units.length === 0}>
        <summary className="flex min-h-14 cursor-pointer list-none items-center px-5 font-semibold text-indigo">{t("school.admin.addUnit")}</summary>
        <form
          className="grid gap-3 border-t border-line p-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!titleAr.trim()) return;
            void run({ action: "addUnit", titleAr, titleEn, stage: newStage }, () => {
              setTitleAr("");
              setTitleEn("");
            });
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium">{t("school.admin.titleAr")}</span>
            <input className="field" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} maxLength={80} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">{t("school.admin.titleEn")}</span>
            <input className="field ltr-text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={80} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">{t("school.admin.stage")}</span>
            <select className="field" value={newStage} onChange={(e) => setNewStage(e.target.value as UnitStage)}>
              {UNIT_STAGES.map((item) => (
                <option key={item} value={item}>{t(`school.admin.stage.${item}` as DictKey)}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <TagButton type="submit" disabled={busy}>{t("school.admin.add")}</TagButton>
          </div>
        </form>
      </details>
      {message && <p role="alert" className="pen-error">{message}</p>}

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-ink-soft">{t("school.admin.empty")}</p>
      ) : (
        <ol className="space-y-2">
          {shown.map((unit, index) => (
            <UnitRow key={unit.id} unit={unit} number={index + 1} stage={stage} first={index === 0} last={index === shown.length - 1} busy={busy} run={run} />
          ))}
        </ol>
      )}
    </div>
  );
}

function UnitRow({
  unit,
  number,
  stage,
  first,
  last,
  busy,
  run,
}: {
  unit: AdminUnit;
  number: number;
  stage: string;
  first: boolean;
  last: boolean;
  busy: boolean;
  run: (body: object, done?: (data: Record<string, unknown>) => void) => Promise<void>;
}) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [result, setResult] = useState<{ saved: number; problems: Problem[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleAr, setTitleAr] = useState(unit.titleAr);
  const [titleEn, setTitleEn] = useState(unit.titleEn);

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 200_000) return;
    setText(await file.text());
  }

  return (
    <li>
      <details className="sheet">
        <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-deep text-sm font-semibold text-ink-soft">{number}</span>
            <span className="min-w-0">
              <span className="block font-semibold">{unit.titleAr}</span>
              {unit.titleEn && <span className="ltr-text block text-sm text-ink-soft">{unit.titleEn}</span>}
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm">
            {stage === "all" || unit.stage === "all" ? (
              <span className="rounded-full border border-line px-3 py-0.5 text-ink-soft">{t(`school.admin.stage.${unit.stage}` as DictKey)}</span>
            ) : null}
            <span className="rounded-full bg-paper-deep px-3 py-0.5 font-medium">{t("school.admin.wordsCount", { n: unit.words.length })}</span>
          </span>
        </summary>

        <div className="space-y-6 border-t border-line p-5">
          <section className="space-y-2" aria-label={t("school.admin.sectionWords")}>
            <h3 className="font-bold">{t("school.admin.sectionWords")} ({unit.words.length})</h3>
            {unit.words.length === 0 ? (
              <p className="text-sm text-ink-soft">{t("school.admin.noWords")}</p>
            ) : (
              <ul className="max-h-96 divide-y divide-line overflow-y-auto rounded-lg border border-line px-3">
                {unit.words.map((word) => (
                  <WordRow key={word.id} word={word} busy={busy} run={run} />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2" aria-label={t("school.admin.sectionAdd")}>
            <h3 className="font-bold">{t("school.admin.sectionAdd")}</h3>
            <p className="text-xs text-ink-faint">{t("school.admin.format")}</p>
            <textarea
              id={`words-${unit.id}`}
              dir="ltr"
              rows={5}
              className="field ltr-text font-mono text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label={t("school.admin.paste")}
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
          </section>

          <section className="space-y-3 border-t border-line pt-4" aria-label={t("school.admin.sectionSettings")}>
            <h3 className="font-bold">{t("school.admin.sectionSettings")}</h3>
            {renaming ? (
              <form
                className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (titleAr.trim()) void run({ action: "renameUnit", id: unit.id, titleAr, titleEn }, () => setRenaming(false));
                }}
              >
                <input className="field" value={titleAr} maxLength={80} required onChange={(e) => setTitleAr(e.target.value)} aria-label={t("school.admin.titleAr")} />
                <input className="field ltr-text" value={titleEn} maxLength={80} onChange={(e) => setTitleEn(e.target.value)} aria-label={t("school.admin.titleEn")} />
                <TagButton type="submit" disabled={busy}>{t("school.admin.saveWord")}</TagButton>
                <TagButton quiet onClick={() => setRenaming(false)}>{t("common.cancel")}</TagButton>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button type="button" className="min-h-11 px-2 font-semibold text-indigo" onClick={() => setRenaming(true)}>{t("grammar.admin.rename")}</button>
                <label className="flex items-center gap-2">
                  <span className="text-ink-soft">{t("school.admin.stage")}</span>
                  <select className="field min-h-11 w-auto py-1 text-sm" value={unit.stage} disabled={busy} onChange={(e) => void run({ action: "setUnitStage", id: unit.id, stage: e.target.value })}>
                    {UNIT_STAGES.map((item) => (
                      <option key={item} value={item}>{t(`school.admin.stage.${item}` as DictKey)}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={busy || first} onClick={() => void run({ action: "moveUnit", id: unit.id, direction: "up", stage })}>{t("school.admin.up")}</button>
                <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={busy || last} onClick={() => void run({ action: "moveUnit", id: unit.id, direction: "down", stage })}>{t("school.admin.down")}</button>
              </div>
            )}
            <div className="flex items-center gap-3">
              {confirmDelete ? (
                <>
                  <span className="text-sm text-pen-red">{t("school.admin.deleteAsk")}</span>
                  <TagButton disabled={busy} onClick={() => void run({ action: "deleteUnit", id: unit.id })}>{t("school.admin.deleteYes")}</TagButton>
                  <TagButton quiet onClick={() => setConfirmDelete(false)}>{t("common.cancel")}</TagButton>
                </>
              ) : (
                <button type="button" className="min-h-11 text-sm text-pen-red" onClick={() => setConfirmDelete(true)}>{t("school.admin.deleteUnit")}</button>
              )}
            </div>
          </section>
        </div>
      </details>
    </li>
  );
}

/** One school word: shows the meaning, and opens a small form to fix the meaning, type and examples without re-uploading the unit. */
function WordRow({ word, busy, run }: { word: AdminWord; busy: boolean; run: (body: object, done?: (data: Record<string, unknown>) => void) => Promise<void> }) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [meaningAr, setMeaningAr] = useState(word.meaningAr);
  const [pos, setPos] = useState(word.pos);
  const [exampleEn, setExampleEn] = useState(word.exampleEn);
  const [exampleAr, setExampleAr] = useState(word.exampleAr);

  if (editing) {
    return (
      <li className="py-3">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run({ action: "editWord", id: word.id, meaningAr, pos, exampleEn, exampleAr }, () => setEditing(false));
          }}
        >
          <p className="ltr-text font-medium">{word.term}</p>
          <input className="field" required maxLength={200} value={meaningAr} onChange={(e) => setMeaningAr(e.target.value)} aria-label={t("wod.meaning")} />
          <input className="field ltr-text" maxLength={20} value={pos} onChange={(e) => setPos(e.target.value)} placeholder="noun / verb / adj" aria-label="pos" />
          <input className="field ltr-text" maxLength={300} value={exampleEn} onChange={(e) => setExampleEn(e.target.value)} aria-label="Example" />
          <input className="field" maxLength={300} value={exampleAr} onChange={(e) => setExampleAr(e.target.value)} aria-label={t("school.admin.exampleAr")} />
          <div className="flex gap-2">
            <TagButton type="submit" disabled={busy}>{t("school.admin.saveWord")}</TagButton>
            <TagButton quiet onClick={() => setEditing(false)}>{t("common.cancel")}</TagButton>
          </div>
        </form>
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="ltr-text font-medium">{word.term}</span>
        <span className="ms-3 text-sm text-ink-soft">{word.meaningAr}</span>
      </span>
      <span className="flex shrink-0">
        <button type="button" className="min-h-11 px-2 text-sm font-semibold text-indigo" disabled={busy} onClick={() => setEditing(true)}>{t("school.admin.editWord")}</button>
        <button type="button" className="min-h-11 px-2 text-sm text-pen-red" disabled={busy} onClick={() => void run({ action: "deleteWord", id: word.id })}>{t("school.admin.deleteWord")}</button>
      </span>
    </li>
  );
}
