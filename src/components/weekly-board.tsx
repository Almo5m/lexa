"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BoLoader } from "@/components/bo-loader";
import { BoMascot } from "@/components/bo-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

interface BoardData {
  available: boolean;
  joined?: boolean;
  nickname?: string | null;
  preview?: string | null;
  rows?: { rank: number; nickname: string; xp: number; me: boolean }[];
  me?: { rank: number; xp: number } | null;
  daysLeft?: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** The weekly board: top 20 by XP with made-up names. A student appears only after he joins, and can leave any time. */
export function WeeklyBoard() {
  const { t } = useT();
  const [data, setData] = useState<BoardData | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/board");
      if (!response.ok) throw new Error("board");
      const next: BoardData = await response.json();
      setData(next);
      setNickname((current) => current ?? next.preview ?? null);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: object) {
    setBusy(true);
    try {
      const response = await fetch("/api/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("post");
      setNickname(null);
      await load();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function another() {
    const response = await fetch("/api/board");
    if (response.ok) setNickname(((await response.json()) as BoardData).preview ?? nickname);
  }

  if (failed) return <p role="alert" className="pen-error">{t("common.error")}</p>;
  if (!data) return <BoLoader label={t("common.loading")} />;
  if (!data.available) {
    return (
      <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
        <BoMascot mood="neutral" size={110} />
        <p className="text-ink-soft">{t("board.unavailable")}</p>
      </div>
    );
  }

  const rows = data.rows ?? [];
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">{t("board.intro", { n: data.daysLeft ?? 7 })}</p>

      {data.joined ? (
        <div className="sheet flex flex-wrap items-center justify-between gap-3 p-4">
          <p>
            {t("board.youAre")} <span className="font-bold">{data.nickname}</span>
            {data.me ? <span className="ms-2 text-sm text-ink-soft">{t("board.yourPlace", { a: data.me.rank, b: data.me.xp })}</span> : <span className="ms-2 text-sm text-ink-soft">{t("board.notYet")}</span>}
          </p>
          <button type="button" disabled={busy} onClick={() => void post({ action: "leave" })} className="min-h-11 text-sm text-ink-soft transition-colors hover:text-pen-red">
            {t("board.leave")}
          </button>
        </div>
      ) : (
        <div className="hero-card space-y-3 p-5">
          <h2 className="text-lg font-bold">{t("board.joinTitle")}</h2>
          <p className="text-sm opacity-90">{t("board.joinText")}</p>
          <p className="text-2xl font-bold">{nickname}</p>
          <div className="flex flex-wrap gap-2">
            <TagButton disabled={busy || !nickname} onClick={() => nickname && void post({ action: "join", nickname })}>{t("board.join")}</TagButton>
            <TagButton quiet disabled={busy} onClick={() => void another()}>{t("board.another")}</TagButton>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
          <BoMascot mood="happy" size={110} />
          <p className="text-ink-soft">{t("board.empty")}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => (
            <li key={`${row.rank}-${row.nickname}`} className={`sheet flex items-center gap-3 px-4 py-3 ${row.me ? "ring-2 ring-indigo" : ""}`}>
              <span className="w-9 text-center text-lg font-bold" aria-label={t("board.rank", { n: row.rank })}>{MEDALS[row.rank - 1] ?? row.rank}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{row.nickname}{row.me ? ` · ${t("board.you")}` : ""}</span>
              <span className="ltr-text font-bold text-indigo">{row.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
      {data.joined && data.me && data.me.rank > 20 && (
        <p className="sheet px-4 py-3 text-center text-sm font-semibold">{t("board.yourPlace", { a: data.me.rank, b: data.me.xp })}</p>
      )}
      <Link href="/challenge" className="tag-btn tag-btn-quiet w-full justify-center">{t("board.toChallenge")}</Link>
    </div>
  );
}
