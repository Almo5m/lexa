export type Grade = "again" | "hard" | "good" | "easy";

export type WordStatus = "new" | "learning" | "weak" | "mastered";

export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  correctCount: number;
  wrongCount: number;
  dueAt: string;
  lastReviewedAt: string | null;
}
