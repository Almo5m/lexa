import type { Grade } from "@/features/srs/types";

export function scoreToGrade(score: number, targetWordCorrect: boolean): Grade {
  if (score >= 0.85 && targetWordCorrect) return "good";
  if (score >= 0.6 && targetWordCorrect) return "hard";
  return "again";
}

export function verdictOf(score: number): "correct" | "almost" | "wrong" {
  if (score >= 0.85) return "correct";
  if (score >= 0.6) return "almost";
  return "wrong";
}
