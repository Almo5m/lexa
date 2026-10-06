import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { classifyWord, isDue, scheduleReview } from "@/features/srs/scheduler";
import type { Grade, SrsState } from "@/features/srs/types";
import { comboBonus, levelFromXp } from "@/features/gamification/xp";
import { applyProgress } from "@/features/gamification/award";
import { normalizeWord } from "@/features/words/clean";

const bodySchema = z.object({
  wordId: z.string().uuid(),
  mode: z.enum(["recall", "write", "listen"]),
  grade: z.enum(["again", "hard", "good", "easy"]).optional(),
  answer: z.string().max(60).optional(),
  hintUsed: z.boolean().optional(),
  combo: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    const body = bodySchema.parse(await request.json());

    const { data: word } = await supabase
      .from("words")
      .select("*")
      .eq("id", body.wordId)
      .single();
    if (!word) throw new HttpError(404, "word_not_found");

    const typedMode = body.mode === "write" || body.mode === "listen";
    let grade: Grade;
    let correct: boolean;
    if (typedMode) {
      if (body.answer === undefined) throw new HttpError(400, "answer_required");
      correct = normalizeWord(body.answer) === word.term;
      grade = correct ? (body.hintUsed ? "hard" : "good") : "again";
    } else {
      if (!body.grade) throw new HttpError(400, "grade_required");
      grade = body.grade;
      correct = grade !== "again";
    }

    const now = new Date();
    const before: SrsState = {
      ease: word.ease,
      intervalDays: word.interval_days,
      repetitions: word.repetitions,
      lapses: word.lapses,
      correctCount: word.correct_count,
      wrongCount: word.wrong_count,
      dueAt: word.due_at,
      lastReviewedAt: word.last_reviewed_at,
    };

    const firstTime = before.lastReviewedAt === null;
    const countsForProgress = firstTime || isDue(before, now);
    const after = countsForProgress ? scheduleReview(before, grade, settings, now) : before;

    if (countsForProgress) {
      await supabase
        .from("words")
        .update({
          ease: after.ease,
          interval_days: after.intervalDays,
          repetitions: after.repetitions,
          lapses: after.lapses,
          correct_count: after.correctCount,
          wrong_count: after.wrongCount,
          due_at: after.dueAt,
          last_reviewed_at: after.lastReviewedAt,
        })
        .eq("id", word.id);
      await supabase.from("review_logs").insert({
        user_id: user.id,
        word_id: word.id,
        mode: body.mode,
        grade,
      });
    }

    let xpGained = 0;
    let levelUp = false;
    let goalReachedNow = false;
    let totalXp: number | null = null;

    if (countsForProgress) {
      if (firstTime) xpGained += settings.xpNewWord;
      if (correct) xpGained += settings.xpCorrectAnswer + comboBonus(body.combo ?? 0);

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", user.id)
        .single();
      const result = await applyProgress(
        user.id,
        { newWords: firstTime ? 1 : 0, reviews: firstTime ? 0 : 1, xp: xpGained },
        settings,
        now,
      );
      totalXp = result.totalXp;
      goalReachedNow = result.goalReachedNow;
      xpGained += result.bonusXp;
      levelUp = levelFromXp(result.totalXp) > levelFromXp(profile?.total_xp ?? 0);
    }

    return NextResponse.json({
      correct,
      grade,
      answer: word.term,
      status: classifyWord(after, settings),
      nextDueAt: after.dueAt,
      countedForProgress: countsForProgress,
      xpGained,
      totalXp,
      levelUp,
      goalReachedNow,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
