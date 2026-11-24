/** Pure text helpers for voice: no browser calls here, so everything is testable. */

export type SpeechLang = "en" | "ar";
export interface Segment {
  lang: SpeechLang;
  text: string;
}

const ARABIC = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;

/** Remove markdown and symbols that a voice would read out loud ("star star", "hash"). */
export function cleanForSpeech(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/(\*\*|__|~~|==)/g, "")
    .replace(/[*_#|]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split into pieces a browser voice can read without cutting off (long utterances stop after ~15 s in Chrome). */
export function splitSentences(text: string, maxLength = 180): string[] {
  const parts = text.match(/[^.!?؟۔\n]+[.!?؟۔]*/g) ?? [];
  const out: string[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    if (part.length <= maxLength) {
      out.push(part);
      continue;
    }
    let line = "";
    for (const word of part.split(/\s+/)) {
      if (line && line.length + word.length + 1 > maxLength) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function langOf(sentence: string): SpeechLang {
  const arabic = (sentence.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (sentence.match(/[A-Za-z]/g) ?? []).length;
  return arabic > latin ? "ar" : "en";
}

/** Sentences grouped by language, so a mixed Arabic/English reply is read with the right voice for each part. */
export function segmentByScript(text: string): Segment[] {
  const segments: Segment[] = [];
  for (const sentence of splitSentences(cleanForSpeech(text))) {
    if (!ARABIC.test(sentence) && !LATIN.test(sentence)) continue;
    segments.push({ lang: langOf(sentence), text: sentence });
  }
  return segments;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

/** 0..1: how close what the student said is to the target (word overlap in order), used for pronunciation practice. */
export function speechMatch(target: string, heard: string): number {
  const a = normalize(target).split(" ").filter(Boolean);
  const b = normalize(heard).split(" ").filter(Boolean);
  if (a.length === 0) return 0;
  const grid: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      grid[i][j] = a[i - 1] === b[j - 1] ? grid[i - 1][j - 1] + 1 : Math.max(grid[i - 1][j], grid[i][j - 1]);
    }
  }
  return grid[a.length][b.length] / a.length;
}
