import type { WordStatus } from "./types";

/**
 * Every review exercise is typed, and the system decides if it is right:
 * - write: the student sees the Arabic meaning and types the English word
 * - listen: the student hears the word and types it
 * - sentence: the student writes a sentence using the word, and Lexa checks it
 */
export type ReviewMode = "write" | "listen" | "sentence";

export function pickMode(input: {
  status: WordStatus;
  repetitions: number;
  lapses: number;
}): ReviewMode {
  if (input.status === "new") return "write";
  if (input.status === "weak") return input.lapses % 2 === 0 ? "write" : "listen";
  // Sentences cost an AI call, so they come only after the word is known by heart.
  const rotation: ReviewMode[] = ["write", "listen", "sentence"];
  return rotation[(input.repetitions + input.lapses) % rotation.length];
}
