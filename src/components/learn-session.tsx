"use client";

import { fetchAi } from "@/lib/fetch-ai";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoLoader } from "@/components/bo-loader";
import { BoMascot } from "@/components/bo-mascot";
import { ReviewSession, type SessionWord } from "@/components/review-session";
import { SpeakButton } from "@/components/speak-button";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import { TEACH_ROUND } from "@/features/curriculum/session-plan";
import type { WordCard } from "@/features/ai/schemas";
import type { LearnWord } from "@/app/api/path/learn/route";

type Phase = { name: "loading" } | { name: "error" } | { name: "empty" } | { name: "allknown" } | { name: "check"; list: LearnWord[]; index: number; known: string[] } | { name: "teach"; round: number; index: number } | { name: "test"; round: number } | { name: "done" };

const ENRICH_GROUP = 4;
const ENRICH_PARALLEL = 3;
/** Below this many words the check is not worth a step of its own. */
const CHECK_MIN = 4;
/** How many times we top the quota up with new words after the student already knew some. */
const CHECK_REFILLS = 4;
const DONT_KNOW = "__dont_know__";

/** Four choices for one word: its meaning, up to two wrong meanings taken from the other words, and "I don't know". */
function checkOptions(list: LearnWord[], word: LearnWord): string[] {
  const right = word.card.meaningsAr[0] ?? "";
  const wrong = list
    .filter((other) => other.id !== word.id)
    .map((other) => other.card.meaningsAr[0] ?? "")
    .filter((meaning) => meaning && meaning !== right);
  const hash = (text: string) => [...(word.id + text)].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 100_003, 7);
  const picked = [...new Set(wrong)].sort((a, b) => hash(a) - hash(b)).slice(0, 2);
  return [right, ...picked].sort((a, b) => hash(a) - hash(b));
}

export function LearnSession({ more, unit, track }: { more: boolean; unit?: string; track?: "path" }) {
  const { t } = useT();
  const [words, setWords] = useState<LearnWord[]>([]);
  const [cards, setCards] = useState<Record<string, WordCard>>({});
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const started = useRef(false);
  const seen = useRef(new Set<string>());
  const kept = useRef<LearnWord[]>([]);
  const refills = useRef(0);

  /** The hand-written card is enough to start. The AI examples arrive while the student is already learning. */
  const enrich = useCallback(async (list: LearnWord[]) => {
    const todo = list.filter((word) => !word.enriched);
    const groups: LearnWord[][] = [];
    for (let i = 0; i < todo.length; i += ENRICH_GROUP) groups.push(todo.slice(i, i + ENRICH_GROUP));
    let next = 0;
    async function worker() {
      while (next < groups.length) {
        const group = groups[next++];
        try {
          const response = await fetchAi("/api/words/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: group.map((word) => word.id) }),
          });
          if (!response.ok) continue;
          const data: { cards?: Record<string, WordCard> } = await response.json();
          setCards((current) => ({ ...current, ...(data.cards ?? {}) }));
        } catch {
          // The basic card stays, nothing is lost.
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(ENRICH_PARALLEL, groups.length) }, worker));
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const response = await fetch("/api/path/learn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ more, unit, track }),
        });
        if (!response.ok) throw new Error("learn_failed");
        const data: { words: LearnWord[] } = await response.json();
        if (data.words.length === 0) return setPhase({ name: "empty" });
        if (data.words.length < CHECK_MIN) {
          setWords(data.words);
          setPhase({ name: "teach", round: 0, index: 0 });
          return void enrich(data.words);
        }
        data.words.forEach((word) => seen.current.add(word.id));
        setPhase({ name: "check", list: data.words, index: 0, known: [] });
      } catch {
        setPhase({ name: "error" });
      }
    })();
  }, [more, unit, track, enrich]);

  /** Ends one pass of the check: known words are saved as learned, the rest go to teaching, and the quota is topped up. */
  async function finishCheck(list: LearnWord[], known: string[]) {
    kept.current = [...kept.current, ...list.filter((word) => !known.includes(word.id))];
    if (known.length > 0) {
      setPhase({ name: "loading" });
      await fetch("/api/words/known", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: known }) }).catch(() => undefined);
      if (refills.current < CHECK_REFILLS) {
        refills.current += 1;
        try {
          const response = await fetch("/api/path/learn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ more, unit, track }) });
          if (response.ok) {
            const data: { words: LearnWord[] } = await response.json();
            const fresh = data.words.filter((word) => !seen.current.has(word.id));
            if (fresh.length > 0) {
              fresh.forEach((word) => seen.current.add(word.id));
              return setPhase({ name: "check", list: fresh, index: 0, known: [] });
            }
          }
        } catch {
          // The words we have are enough.
        }
      }
    }
    if (kept.current.length === 0) return setPhase({ name: "allknown" });
    setWords(kept.current);
    setPhase({ name: "teach", round: 0, index: 0 });
    void enrich(kept.current);
  }

  const rounds = Math.ceil(words.length / TEACH_ROUND);
  const roundWords = (round: number) => words.slice(round * TEACH_ROUND, (round + 1) * TEACH_ROUND);
  const cardOf = (word: LearnWord) => cards[word.id] ?? word.card;

  if (phase.name === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <BoLoader size={140} label={t("learn.loading")} />
        <p className="text-ink-soft">{t("learn.loading")}</p>
      </div>
    );
  }

  if (phase.name === "error") {
    return (
      <section className="sheet space-y-4 p-6 text-center">
        <p role="alert" className="text-pen-red">{t("common.error")}</p>
        <Link href="/" className="tag-btn">{t("review.back")}</Link>
      </section>
    );
  }

  if (phase.name === "check") {
    const word = phase.list[phase.index];
    const options = checkOptions(phase.list, word);
    const answer = (choice: string) => {
      const known = choice === (word.card.meaningsAr[0] ?? "") ? [...phase.known, word.id] : phase.known;
      if (phase.index === phase.list.length - 1) void finishCheck(phase.list, known);
      else setPhase({ ...phase, index: phase.index + 1, known });
    };
    return (
      <section className="sheet space-y-5 p-6" aria-live="polite">
        <p className="text-sm text-ink-faint">{t("learn.check.progress", { a: phase.index + 1, b: phase.list.length })}</p>
        <p className="text-ink-soft">{t("learn.check.title")}</p>
        <div className="ltr-text flex items-center gap-3">
          <h2 className="text-4xl font-semibold tracking-tight">{word.term}</h2>
          <SpeakButton text={word.term} label={t("card.listen")} />
        </div>
        <div className="grid gap-3">
          {options.map((option) => (
            <TagButton key={option} quiet className="justify-center" onClick={() => answer(option)}>{option}</TagButton>
          ))}
          <TagButton quiet className="justify-center" onClick={() => answer(DONT_KNOW)}>{t("learn.check.dontKnow")}</TagButton>
        </div>
        <p className="text-sm text-ink-soft">{t("learn.check.hint")}</p>
      </section>
    );
  }

  if (phase.name === "allknown") {
    return (
      <section className="sheet flex flex-col items-center gap-4 p-8 text-center" aria-live="polite">
        <BoMascot mood="happy" size={130} />
        <h2 className="text-2xl font-semibold">{t("learn.check.allTitle")}</h2>
        <p className="text-ink-soft">{t("learn.check.allHint")}</p>
        <Link href="/" className="tag-btn justify-center">{t("learn.backToday")}</Link>
      </section>
    );
  }

  if (phase.name === "empty" || phase.name === "done") {
    return (
      <section className="sheet flex flex-col items-center gap-4 p-8 text-center" aria-live="polite">
        <BoMascot mood="happy" size={130} />
        <h2 className="text-2xl font-semibold">{phase.name === "done" ? t("learn.doneTitle", { n: words.length }) : t("learn.noneTitle")}</h2>
        <p className="text-ink-soft">{phase.name === "done" ? t("learn.doneHint") : t("learn.noneHint")}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/" className="tag-btn justify-center">{t("learn.backToday")}</Link>
          <Link href={`/learn?more=1${track === "path" ? "&track=path" : ""}${unit ? `&unit=${unit}` : ""}`} className="tag-btn tag-btn-quiet justify-center">
            {t("learn.more")}
          </Link>
        </div>
      </section>
    );
  }

  if (phase.name === "teach") {
    const list = roundWords(phase.round);
    const word = list[phase.index];
    const last = phase.index === list.length - 1;
    return (
      <section className="space-y-4">
        <p className="text-sm text-ink-faint" aria-live="polite">
          {t("learn.round", { r: phase.round + 1, n: rounds })} · {t("learn.word", { a: phase.index + 1, b: list.length })}
        </p>
        <TeachCard key={word.id} card={cardOf(word)} unitTitle={word.unitTitleAr} />
        <TagButton
          autoFocus
          className="w-full sm:w-auto"
          onClick={() => setPhase(last ? { name: "test", round: phase.round } : { name: "teach", round: phase.round, index: phase.index + 1 })}
        >
          {last ? t("learn.testMe") : t("learn.nextWord")}
        </TagButton>
      </section>
    );
  }

  const testWords: SessionWord[] = roundWords(phase.round).map((word) => ({ id: word.id, term: word.term, card: cardOf(word), mode: "write" }));
  return (
    <section className="space-y-4">
      <p className="text-sm text-ink-faint">{t("learn.testTitle", { r: phase.round + 1, n: rounds })}</p>
      <ReviewSession
        key={`test-${phase.round}`}
        words={testWords}
        onDone={() => setPhase(phase.round + 1 < rounds ? { name: "teach", round: phase.round + 1, index: 0 } : { name: "done" })}
      />
    </section>
  );
}

function TeachCard({ card, unitTitle }: { card: WordCard; unitTitle: string }) {
  const { t } = useT();
  return (
    <article className="sheet space-y-5 p-6">
      {unitTitle && <p className="text-sm text-ink-faint">{t("learn.unit", { name: unitTitle })}</p>}
      <header className="flex items-start justify-between gap-4">
        <div className="ltr-text">
          <h2 className="text-4xl font-semibold tracking-tight">{card.term}</h2>
          <p className="mt-1 text-ink-soft">
            {card.ipa && <span className="font-[family-name:var(--font-ipa)]">{card.ipa} · </span>}
            {card.partOfSpeech}
          </p>
        </div>
        <SpeakButton text={card.term} label={t("card.listen")} />
      </header>
      <p className="marker inline px-1 text-2xl">{card.meaningsAr.join("، ")}</p>
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <p className="ltr-text flex-1 text-xl leading-9">{card.sentence}</p>
          <SpeakButton text={card.sentence} label={t("card.listenSentence")} size="small" />
        </div>
        <p className="text-ink-soft">{card.sentenceAr}</p>
      </div>
      {card.memoryHookAr && (
        <div>
          <h3 className="font-semibold">{t("card.hook")}</h3>
          <p className="text-ink-soft">{card.memoryHookAr}</p>
        </div>
      )}
      {card.usageNoteAr && <p className="text-sm text-ink-soft">{card.usageNoteAr}</p>}
      {card.extraExamples.slice(0, 1).map((example) => (
        <div key={example.en}>
          <p className="ltr-text">{example.en}</p>
          <p className="text-sm text-ink-soft">{example.ar}</p>
        </div>
      ))}
    </article>
  );
}
