"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

export interface AdminWordOfDay {
  id: string;
  term: string;
  meaningAr: string;
  storyAr: string;
  active: boolean;
}

async function send(body: object): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/word-of-day", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return response.ok;
  } catch {
    return false;
  }
}

/** Words of the day: one shows each day, in turn. Add the word, its meaning and a short story that makes it stick. */
export function AdminWordOfDayPanel({ words }: { words: AdminWordOfDay[] }) {
  const { t } = useT();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [meaningAr, setMeaningAr] = useState("");
  const [storyAr, setStoryAr] = useState("");
  const [storyEn, setStoryEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function run(body: object, done?: () => void) {
    setBusy(true);
    setFailed(false);
    const ok = await send(body);
    setBusy(false);
    if (!ok) return setFailed(true);
    done?.();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("wod.intro", { n: words.filter((word) => word.active).length })}</p>

      <section className="sheet space-y-3 p-6" aria-labelledby="wod-new">
        <h2 id="wod-new" className="text-lg font-bold">{t("wod.new")}</h2>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run({ action: "add", term, meaningAr, storyAr, storyEn }, () => {
              setTerm("");
              setMeaningAr("");
              setStoryAr("");
              setStoryEn("");
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field ltr-text" required maxLength={40} value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t("wod.term")} aria-label={t("wod.term")} />
            <input className="field" required maxLength={120} value={meaningAr} onChange={(e) => setMeaningAr(e.target.value)} placeholder={t("wod.meaning")} aria-label={t("wod.meaning")} />
          </div>
          <textarea className="field" rows={3} maxLength={400} value={storyAr} onChange={(e) => setStoryAr(e.target.value)} placeholder={t("wod.storyAr")} aria-label={t("wod.storyAr")} />
          <textarea className="field ltr-text" rows={3} maxLength={400} value={storyEn} onChange={(e) => setStoryEn(e.target.value)} placeholder={t("wod.storyEn")} aria-label={t("wod.storyEn")} />
          <TagButton type="submit" gradient disabled={busy}>{t("wod.add")}</TagButton>
          {failed && <p role="alert" className="pen-error">{t("common.error")}</p>}
        </form>
      </section>

      {words.length === 0 && <p className="text-ink-soft">{t("wod.empty")}</p>}
      <ul className="space-y-3">
        {words.map((word) => (
          <li key={word.id} className={`sheet space-y-2 p-5 ${word.active ? "" : "opacity-60"}`}>
            <p>
              <span className="ltr-text text-lg font-bold">{word.term}</span>
              <span className="ms-3 text-ink-soft">{word.meaningAr}</span>
            </p>
            {word.storyAr && <p className="text-sm leading-7 text-ink-soft">{word.storyAr}</p>}
            <div className="flex flex-wrap items-center gap-1 border-t border-line pt-2 text-sm">
              <label className="flex min-h-11 items-center gap-2 pe-3 font-semibold">
                <input type="checkbox" className="size-5 accent-indigo" checked={word.active} disabled={busy} onChange={(e) => void run({ action: "toggle", id: word.id, active: e.target.checked })} />
                {t("boMsg.active")}
              </label>
              <button type="button" className="min-h-11 px-3 text-pen-red" disabled={busy} onClick={() => void run({ action: "delete", id: word.id })}>
                {t("school.admin.deleteWord")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
