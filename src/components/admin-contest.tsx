"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

export interface AdminContest {
  id: string;
  title: string;
  prize: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  count: number;
  questions: number;
  winners: { name: string; score: number }[];
}

/** Contests: write the questions, pick the dates, see who won. Real names show here only, never to students. */
export function AdminContestPanel({ contests }: { contests: AdminContest[] }) {
  const { t } = useT();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prize, setPrize] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(body: object, done?: () => void) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/contest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error === "bad_lines" ? t("contest.admin.badLines", { n: (data.lines as number[]).join(", ") }) : t("common.error"));
        return;
      }
      done?.();
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("contest.admin.intro")}</p>
      <section className="sheet space-y-3 p-6" aria-labelledby="contest-new">
        <h2 id="contest-new" className="text-lg font-bold">{t("contest.admin.new")}</h2>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run({ action: "add", title, prize, questionsText: text, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() }, () => { setTitle(""); setPrize(""); setText(""); setStartsAt(""); setEndsAt(""); });
          }}
        >
          <input className="field" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("contest.admin.titleField")} aria-label={t("contest.admin.titleField")} />
          <input className="field" maxLength={200} value={prize} onChange={(e) => setPrize(e.target.value)} placeholder={t("contest.admin.prize")} aria-label={t("contest.admin.prize")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">{t("contest.admin.start")}<input type="datetime-local" required className="field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
            <label className="space-y-1 text-sm font-semibold">{t("contest.admin.end")}<input type="datetime-local" required className="field" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></label>
          </div>
          <p className="text-sm text-ink-soft">{t("contest.admin.format")}</p>
          <textarea className="field ltr-text" rows={8} required value={text} onChange={(e) => setText(e.target.value)} placeholder={"Capital of Egypt? | Cairo | Giza | Aswan | Luxor | a"} aria-label={t("contest.admin.questions")} />
          <TagButton type="submit" gradient disabled={busy}>{t("contest.admin.add")}</TagButton>
          {error && <p role="alert" className="pen-error">{error}</p>}
        </form>
      </section>

      {contests.length === 0 && <p className="text-ink-soft">{t("contest.admin.empty")}</p>}
      <ul className="space-y-3">
        {contests.map((c) => (
          <li key={c.id} className={`sheet space-y-2 p-5 ${c.active ? "" : "opacity-60"}`}>
            <p className="font-bold">{c.title}</p>
            <p className="text-sm text-ink-soft">{when(c.startsAt)} → {when(c.endsAt)} · {t("contest.admin.counts", { a: c.questions, b: c.count })}</p>
            {c.prize && <p className="text-sm">{t("contest.prize")}: {c.prize}</p>}
            {c.winners.length > 0 && (
              <ol className="text-sm">
                {c.winners.map((w, i) => <li key={i}>{["🥇", "🥈", "🥉"][i]} {w.name} · <span className="ltr-text">{w.score}/{c.questions}</span></li>)}
              </ol>
            )}
            <div className="flex flex-wrap items-center gap-1 border-t border-line pt-2 text-sm">
              <label className="flex min-h-11 items-center gap-2 pe-3 font-semibold">
                <input type="checkbox" className="size-5 accent-indigo" checked={c.active} disabled={busy} onChange={(e) => void run({ action: "toggle", id: c.id, active: e.target.checked })} />
                {t("boMsg.active")}
              </label>
              <button type="button" className="min-h-11 px-3 text-pen-red" disabled={busy} onClick={() => void run({ action: "delete", id: c.id })}>{t("school.admin.deleteWord")}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
