import { bandLabel, recentAverage, type StoredSession } from "@/features/talk/analyze";

/** Each meter is a percentage from 0 to 100, or null when there is not enough data to say anything honest. */
export interface Meter {
  percent: number | null;
  /** A short value shown next to the bar, for example "A2" or "12 / 300". */
  value: string;
}

export function wordsMeter(learned: number, pathSize: number): Meter {
  if (learned === 0) return { percent: null, value: "0" };
  return { percent: Math.min(100, Math.round((learned / pathSize) * 100)), value: `${learned} / ${pathSize}` };
}

const TRANSLATE_WINDOW = 20;
const TRANSLATE_MIN = 3;

/** Share of the latest translations that were right (good or easy). */
export function translateMeter(grades: readonly string[]): Meter {
  const recent = grades.slice(0, TRANSLATE_WINDOW);
  if (recent.length < TRANSLATE_MIN) return { percent: null, value: "—" };
  const right = recent.filter((grade) => grade === "good" || grade === "easy").length;
  const percent = Math.round((right / recent.length) * 100);
  return { percent, value: `${percent}%` };
}

const READING_WINDOW = 10;

export interface ReadingRow {
  answers: { correct: boolean }[] | null;
  questions: number;
}

/** Average score over the latest finished reading texts. */
export function readingMeter(rows: readonly ReadingRow[]): Meter {
  const finished = rows.filter((row) => row.questions > 0 && (row.answers?.length ?? 0) >= row.questions).slice(0, READING_WINDOW);
  if (finished.length === 0) return { percent: null, value: "—" };
  const score = finished.reduce((sum, row) => sum + (row.answers ?? []).filter((a) => a.correct).length / row.questions, 0) / finished.length;
  const percent = Math.round(score * 100);
  return { percent, value: `${percent}%` };
}

/** The speaking meter follows the language profile: the average of the latest texts, shown as a band. */
export function speakMeter(sessions: StoredSession[]): Meter {
  const average = recentAverage(sessions);
  if (!average) return { percent: null, value: "—" };
  const level = (average.vocabulary + average.grammar + average.clarity) / 3;
  return { percent: Math.round((level / 5) * 100), value: bandLabel(level) };
}
