import { z } from "zod";

export const exerciseSchema = z.object({
  term: z.string(),
  direction: z.enum(["ar2en", "en2ar"]),
  source: z.string().min(1).max(300),
  reference: z.string().min(1).max(300),
  hintAr: z.string().max(200),
});

export const exerciseBatchSchema = z.object({ exercises: z.array(exerciseSchema).min(1).max(8) });

export const gradeSchema = z.object({
  score: z.number().min(0).max(1),
  targetWordCorrect: z.boolean(),
  correctedVersion: z.string().max(400),
  naturalVersion: z.string().max(400),
  explanationAr: z.string().max(500),
});

export type TranslationExercise = z.infer<typeof exerciseSchema>;
export type TranslationGrade = z.infer<typeof gradeSchema>;
