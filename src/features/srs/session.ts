import type { WordStatus } from "./types";

export type ReviewMode = "recall" | "write" | "listen";

export function pickMode(input: {
  status: WordStatus;
  repetitions: number;
  lapses: number;
}): ReviewMode {
  if (input.status === "new") return "recall";
  if (input.status === "weak") return input.lapses % 2 === 0 ? "write" : "listen";
  const rotation: ReviewMode[] = ["recall", "write", "listen"];
  return rotation[(input.repetitions + input.lapses) % rotation.length];
}
