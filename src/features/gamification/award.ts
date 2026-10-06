import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/settings";
import { recordActivity, refillFreezes, toDateKey, type StreakState } from "./streak";

export type ProgressEvent = { newWords?: number; reviews?: number; xp: number };

export interface AwardResult {
  totalXp: number;
  streak: StreakState;
  goalReachedNow: boolean;
  bonusXp: number;
}

export async function applyProgress(
  userId: string,
  event: ProgressEvent,
  settings: AppSettings,
  now = new Date(),
): Promise<AwardResult> {
  const db = createSupabaseAdminClient();
  const today = toDateKey(now);

  const [{ data: profile }, { data: day }] = await Promise.all([
    db.from("profiles").select("total_xp, streak_current, streak_longest, streak_last_date, streak_freezes").eq("id", userId).single(),
    db.from("daily_progress").select("*").eq("user_id", userId).eq("day", today).maybeSingle(),
  ]);
  if (!profile) throw new Error("profile_not_found");

  const progress = {
    new_words: (day?.new_words ?? 0) + (event.newWords ?? 0),
    reviews: (day?.reviews ?? 0) + (event.reviews ?? 0),
    xp: (day?.xp ?? 0) + event.xp,
    goal_reached: day?.goal_reached ?? false,
  };

  let bonusXp = 0;
  let goalReachedNow = false;
  const goalMet =
    progress.new_words >= settings.dailyGoalNewWords || progress.reviews >= settings.dailyGoalReviews;
  if (goalMet && !progress.goal_reached) {
    progress.goal_reached = true;
    goalReachedNow = true;
    bonusXp = settings.xpDailyGoal;
    progress.xp += bonusXp;
  }

  const wasFirstActivityThisWeek = new Date(`${today}T00:00:00Z`).getUTCDay() === 6 && !day;
  const streak = recordActivity(
    {
      current: profile.streak_current,
      longest: profile.streak_longest,
      lastActiveDate: profile.streak_last_date,
      freezes: wasFirstActivityThisWeek
        ? refillFreezes(profile.streak_freezes, settings.streakFreezesPerWeek)
        : profile.streak_freezes,
    },
    today,
  );

  const totalXp = profile.total_xp + event.xp + bonusXp;

  await Promise.all([
    db.from("daily_progress").upsert({ user_id: userId, day: today, ...progress }),
    db
      .from("profiles")
      .update({
        total_xp: totalXp,
        streak_current: streak.current,
        streak_longest: streak.longest,
        streak_last_date: streak.lastActiveDate,
        streak_freezes: streak.freezes,
      })
      .eq("id", userId),
  ]);

  return { totalXp, streak, goalReachedNow, bonusXp };
}
