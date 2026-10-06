import { z } from "zod";

export const settingsSchema = z.object({
  aiModel: z.string().min(1).max(80),
  aiFallbackModel: z.string().max(80),
  aiDailyLimitPerStudent: z.number().int().min(0).max(500),
  tutorEnabled: z.boolean(),
  imageExtractionEnabled: z.boolean(),
  maxImagesPerUpload: z.number().int().min(1).max(10),
  maxImageSizeMb: z.number().min(0.5).max(10),
  dailyGoalNewWords: z.number().int().min(1).max(100),
  dailyGoalReviews: z.number().int().min(1).max(200),
  xpNewWord: z.number().int().min(0).max(100),
  xpCorrectAnswer: z.number().int().min(0).max(100),
  xpDailyGoal: z.number().int().min(0).max(500),
  srsStartingEase: z.number().min(1.3).max(3.5),
  srsFirstIntervalDays: z.number().min(0.1).max(10),
  srsMasteredIntervalDays: z.number().int().min(7).max(365),
  srsWeakLapses: z.number().int().min(1).max(10),
  streakFreezesPerWeek: z.number().int().min(0).max(7),
});

export type AppSettings = z.infer<typeof settingsSchema>;

export const defaultSettings: AppSettings = {
  aiModel: "gemini-2.5-flash",
  aiFallbackModel: "gemini-2.5-flash-lite",
  aiDailyLimitPerStudent: 40,
  tutorEnabled: true,
  imageExtractionEnabled: true,
  maxImagesPerUpload: 5,
  maxImageSizeMb: 4,
  dailyGoalNewWords: 10,
  dailyGoalReviews: 15,
  xpNewWord: 10,
  xpCorrectAnswer: 5,
  xpDailyGoal: 50,
  srsStartingEase: 2.5,
  srsFirstIntervalDays: 1,
  srsMasteredIntervalDays: 21,
  srsWeakLapses: 3,
  streakFreezesPerWeek: 1,
};

export function mergeSettings(stored: unknown): AppSettings {
  const parsed = settingsSchema.partial().safeParse(stored ?? {});
  return { ...defaultSettings, ...(parsed.success ? parsed.data : {}) };
}
