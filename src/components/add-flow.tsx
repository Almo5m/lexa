"use client";

import Link from "next/link";
import { useState } from "react";
import { CameraIcon, CloseIcon } from "@/components/icons";
import { ScrambleText, TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { normalizeWord, splitManualInput } from "@/features/words/clean";

type Stage = "pick" | "review" | "saving" | "done";

interface Props {
  maxImages: number;
  maxImageMb: number;
}

export function AddFlow({ maxImages, maxImageMb }: Props) {
  const { t } = useT();
  const [stage, setStage] = useState<Stage>("pick");
  const [files, setFiles] = useState<File[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [notes, setNotes] = useState<{ known: string[]; duplicates: string[]; rejected: string[] }>({
    known: [],
    duplicates: [],
    rejected: [],
  });
  const [manual, setManual] = useState("");
  const [group, setGroup] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  function safeError(code: string | undefined) {
    const known = [
      "daily_ai_limit_reached",
      "ai_feature_disabled",
      "ai_busy",
      "unsupported_image_type",
      "image_too_large",
      "too_many_images",
      "no_images",
      "invalid_input",
    ];
    return known.includes(code ?? "") ? t(`error.${code}` as DictKey) : t("error.generic");
  }

  async function extract() {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      for (const file of files) body.append("images", file);
      const response = await fetch("/api/extract", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) return setError(safeError(data.error));
      if (data.words.length === 0 && data.alreadyKnown.length === 0) {
        setError(t("add.noWords"));
        return;
      }
      setWords(data.words);
      setNotes({ known: data.alreadyKnown, duplicates: data.duplicates, rejected: data.rejected });
      setStage("review");
    } catch {
      setError(t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  function addManual() {
    const incoming = splitManualInput(manual)
      .map(normalizeWord)
      .filter((word): word is string => word !== null);
    setWords((current) => [...new Set([...current, ...incoming])]);
    setManual("");
    if (stage === "pick") setStage("review");
  }

  function editWord(index: number, value: string) {
    setWords((current) => current.map((word, i) => (i === index ? value : word)));
  }

  async function save() {
    setError(null);
    setStage("saving");
    const valid = [...new Set(words.map(normalizeWord).filter((w): w is string => w !== null))];
    try {
      const saveResponse = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: valid, groupName: group.trim() || undefined }),
      });
      const saved = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saved.error);

      setProgress({ done: 0, total: saved.added });
      let done = 0;
      for (let guard = 0; guard < 80; guard++) {
        const response = await fetch("/api/words/generate", { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        done += data.generated;
        setProgress({ done: Math.min(done, saved.added), total: saved.added });
        if (data.remaining === 0 || data.generated === 0) break;
      }
      setStage("done");
    } catch (caught) {
      setError(safeError(caught instanceof Error ? caught.message : undefined));
      setStage("review");
    }
  }

  const validCount = new Set(words.map(normalizeWord).filter(Boolean)).size;

  if (stage === "saving") {
    return (
      <div className="sheet space-y-4 p-6" aria-live="polite">
        <p className="text-lg">
          {progress.total === 0 ? (
            <ScrambleText text={t("add.saving")} />
          ) : (
            <ScrambleText text={t("add.generating", { a: progress.done, b: progress.total })} />
          )}
        </p>
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="sheet space-y-5 p-6">
        <p className="marker inline px-1 text-xl">{t("add.done", { n: progress.done })}</p>
        <div>
          <Link href="/words" className="tag-btn">
            {t("add.openWords")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {stage === "pick" && (
        <section className="sheet space-y-4 p-6">
          <label htmlFor="photos" className="flex items-center gap-2 text-lg font-semibold">
            <CameraIcon />
            {t("add.photosLabel")}
          </label>
          <p className="text-sm text-ink-faint">{t("add.photosHint", { n: maxImages, mb: maxImageMb })}</p>
          <input
            id="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, maxImages))}
            className="block w-full min-h-12 text-sm file:me-4 file:min-h-11 file:cursor-pointer file:rounded-md file:border-0 file:bg-paper-deep file:px-4 file:font-medium file:text-ink"
          />
          {files.length > 0 && (
            <p className="text-sm text-ink-soft">{files.map((file) => file.name).join("، ")}</p>
          )}
          <TagButton onClick={extract} loading={busy} disabled={files.length === 0}>
            {busy ? <ScrambleText text={t("add.extracting")} /> : t("add.extract")}
          </TagButton>
        </section>
      )}

      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {error}
        </p>
      )}

      {stage === "review" && (
        <section aria-labelledby="review-title" className="space-y-5">
          <div>
            <h2 id="review-title" className="text-xl font-semibold">
              {t("add.reviewTitle")}
            </h2>
            <p className="text-sm text-ink-faint">{t("add.reviewHint")}</p>
          </div>

          {notes.known.length > 0 && (
            <p className="text-sm text-ink-soft">{t("add.alreadyKnown", { words: notes.known.join("، ") })}</p>
          )}
          {notes.duplicates.length > 0 && (
            <p className="text-sm text-ink-soft">{t("add.duplicates", { words: notes.duplicates.join("، ") })}</p>
          )}
          {notes.rejected.length > 0 && (
            <p className="text-sm text-ink-soft">{t("add.rejected", { words: notes.rejected.join("، ") })}</p>
          )}

          <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {words.map((word, index) => (
              <li key={index} className="flex items-center gap-2 border-b border-line">
                <input
                  value={word}
                  onChange={(event) => editWord(index, event.target.value)}
                  aria-label={t("add.edit", { word })}
                  className="field ltr-text flex-1 border-b-0"
                  spellCheck={false}
                  autoCapitalize="none"
                />
                <button
                  type="button"
                  onClick={() => setWords((current) => current.filter((_, i) => i !== index))}
                  aria-label={t("add.remove", { word })}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-ink-faint hover:text-pen-red"
                >
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <label htmlFor="manual" className="block text-lg font-semibold">
          {t("add.manualLabel")}
        </label>
        <p className="text-sm text-ink-faint">{t("add.manualHint")}</p>
        <textarea
          id="manual"
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          rows={2}
          className="field ltr-text"
          spellCheck={false}
          autoCapitalize="none"
        />
        <TagButton quiet onClick={addManual} disabled={manual.trim().length === 0}>
          {t("add.manualButton")}
        </TagButton>
      </section>

      {stage === "review" && (
        <section className="space-y-3">
          <label htmlFor="group" className="block text-lg font-semibold">
            {t("add.groupLabel")}
          </label>
          <input
            id="group"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            maxLength={60}
            placeholder={t("add.groupHint")}
            className="field"
          />
          <div className="pt-3">
            <TagButton onClick={save} disabled={validCount === 0}>
              {t("add.save", { n: validCount })}
            </TagButton>
          </div>
        </section>
      )}
    </div>
  );
}
