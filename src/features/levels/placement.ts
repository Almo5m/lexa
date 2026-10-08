import { BAND_COUNT, PSEUDO_WORDS, WORD_BANK } from "./bank";

export const REAL_PER_BAND = 5;
export const PSEUDO_COUNT = 5;
const PASS_RATE = 0.6;
const MAX_FALSE_ALARM_RATE = 0.4;

export interface TestItem {
  word: string;
  band: number | null;
}

export type Random = () => number;

function shuffle<T>(items: T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildPlacementTest(random: Random = Math.random): TestItem[] {
  const items: TestItem[] = [];
  for (let band = 1; band <= BAND_COUNT; band++) {
    for (const word of shuffle(WORD_BANK[band], random).slice(0, REAL_PER_BAND)) {
      items.push({ word, band });
    }
  }
  for (const word of shuffle(PSEUDO_WORDS, random).slice(0, PSEUDO_COUNT)) {
    items.push({ word, band: null });
  }
  return shuffle(items, random);
}

export interface PlacementResult {
  level: number;
  reliable: boolean;
  falseAlarmRate: number;
  correctedByBand: number[];
}

/**
 * Yes/No vocabulary test with invented words. Each band's hit rate loses the share of
 * invented words the student claimed to know, and the level is the number of bands
 * passed in a row from the easiest. Two or more false claims out of five make the
 * result unreliable.
 */
export function scorePlacement(items: TestItem[], known: Set<string>): PlacementResult {
  const pseudo = items.filter((item) => item.band === null);
  const falseAlarms = pseudo.filter((item) => known.has(item.word)).length;
  const falseAlarmRate = pseudo.length === 0 ? 0 : falseAlarms / pseudo.length;

  const correctedByBand: number[] = [];
  for (let band = 1; band <= BAND_COUNT; band++) {
    const real = items.filter((item) => item.band === band);
    const hits = real.filter((item) => known.has(item.word)).length;
    const hitRate = real.length === 0 ? 0 : hits / real.length;
    correctedByBand.push(Math.max(0, hitRate - falseAlarmRate));
  }

  let level = 0;
  for (const rate of correctedByBand) {
    if (rate >= PASS_RATE) level += 1;
    else break;
  }

  return {
    level: Math.max(1, level),
    reliable: falseAlarmRate < MAX_FALSE_ALARM_RATE,
    falseAlarmRate,
    correctedByBand,
  };
}

export function suggestWords(
  level: number,
  existing: Iterable<string>,
  count: number,
  random: Random = Math.random,
): string[] {
  const owned = new Set(existing);
  const bands = [level, Math.min(BAND_COUNT, level + 1), Math.max(1, level - 1)];
  const picked: string[] = [];
  for (const band of [...new Set(bands)]) {
    const pool = shuffle(
      WORD_BANK[band].filter((word) => !owned.has(word) && !picked.includes(word)),
      random,
    );
    const share = band === level ? Math.ceil(count * 0.6) : Math.ceil(count * 0.2);
    picked.push(...pool.slice(0, share));
  }
  if (picked.length < count) {
    for (let band = 1; band <= BAND_COUNT && picked.length < count; band++) {
      for (const word of WORD_BANK[band]) {
        if (!owned.has(word) && !picked.includes(word)) picked.push(word);
        if (picked.length >= count) break;
      }
    }
  }
  return picked.slice(0, count);
}
