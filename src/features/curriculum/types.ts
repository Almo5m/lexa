export type Level = "A1" | "A2" | "B1";

/** One teaching entry: the word, what it means, and a short real phrase that shows how it is used. */
export interface PathWord {
  en: string;
  pos: string;
  ar: string;
  chunkEn: string;
  chunkAr: string;
}

export interface Unit {
  id: string;
  level: Level;
  titleAr: string;
  titleEn: string;
  words: PathWord[];
}

/** [word, part of speech, Arabic meaning, phrase, Arabic phrase] — a compact way to write the lists. */
export type WordTuple = [string, string, string, string, string];

export function toWords(tuples: WordTuple[]): PathWord[] {
  return tuples.map(([en, pos, ar, chunkEn, chunkAr]) => ({ en, pos, ar, chunkEn, chunkAr }));
}
