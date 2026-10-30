"use client";

import { useEffect, useState } from "react";
import { BoLoader } from "@/components/bo-loader";
import { BoMascot } from "@/components/bo-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

interface ContestData {
  state: "running" | "ended" | "none" | "missing";
  id?: string;
  title?: string;
  prize?: string;
  endsAt?: string;
  max?: number;
  mine?: number | null;
  questions?: { question: string; options: string[] }[];
  winners?: { nickname: string | null; score: number; me: boolean }[];
}

/** The weekly contest: one attempt, scored on the server. After it ends, the top three show by their made-up names. */
export function ContestSession() {
  const { t } = useT();
  const [data, setData] = useState<ContestData | null>(null);
  const [failed, setFailed] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/contest");
        if (!response.ok) throw new Error("load");
        const next: ContestData = await response.json();
        setData(next);
        setAnswers((next.questions ?? []).map(() => null));
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  async function submit() {
    if (!data?.id) return;
    setBusy(true);
    try {
      const response = await fetch("/api/contest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: data.id, answers }) });
      if (!response.ok) throw new Error("save");
      setSent(await response.json());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (failed) return <p role="alert" className="pen-error">{t("common.error")}</p>;
  if (!data) return <BoLoader label={t("common.loading")} />;
  if (data.state === "none" || data.state === "missing") {
    return (
      <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
        <BoMascot mood="neutral" size={110} />
        <p className="text-ink-soft">{t("contest.none")}</p>
      </div>
    );
  }

  const score = sent?.score ?? data.mine ?? null;
  const ends = data.endsAt ? new Date(data.endsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
  return (
    <div className="space-y-5">
      <div className="hero-card space-y-1 p-5">
        <h2 className="text-lg font-bold">{data.title}</h2>
        {data.prize && <p className="text-sm">{t("contest.prize")}: {data.prize}</p>}
        <p className="text-sm opacity-90">{data.state === "running" ? t("contest.endsAt", { d: ends }) : t("contest.ended")}</p>
      </div>

      {score !== null && (
        <div className="sheet flex flex-col items-center gap-2 p-6 text-center">
          <BoMascot mood="happy" size={100} />
          <p className="text-lg font-bold">{t("contest.yourScore")} <span className="ltr-text">{score} / {sent?.max ?? data.max}</span></p>
          {data.state === "running" && <p className="text-sm text-ink-soft">{t("contest.wait")}</p>}
        </div>
      )}

      {data.state === "running" && score === null && (
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4">
          {(data.questions ?? []).map((q, i) => (
            <fieldset key={i} className="sheet space-y-2 p-5">
              <legend className="ltr-text px-1 font-semibold">{i + 1}. {q.question}</legend>
              {q.options.map((option, o) => (
                <label key={o} className="ltr-text flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-paper-deep">
                  <input type="radio" name={`q${i}`} className="size-5 accent-indigo" checked={answers[i] === o} onChange={() => setAnswers((cur) => cur.map((v, k) => (k === i ? o : v)))} />
                  {option}
                </label>
              ))}
            </fieldset>
          ))}
          <TagButton type="submit" gradient disabled={busy}>{t("contest.submit")}</TagButton>
        </form>
      )}

      {data.state === "ended" && (
        <section className="sheet space-y-2 p-5">
          <h3 className="font-bold">{t("contest.winners")}</h3>
          {(data.winners ?? []).length === 0 && <p className="text-ink-soft">{t("contest.noWinners")}</p>}
          <ol className="space-y-1">
            {(data.winners ?? []).map((w, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{["🥇", "🥈", "🥉"][i]} {w.nickname ?? t("contest.anon")}{w.me ? ` · ${t("board.you")}` : ""}</span>
                <span className="ltr-text font-bold">{w.score} / {data.max}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
