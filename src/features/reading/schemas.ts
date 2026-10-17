import { z } from "zod";

export const QUESTION_COUNT = 3;

export const passageSchema = z
  .object({
    title: z.string().trim().min(1).max(60),
    // Target words are wrapped in **double asterisks** so the student sees them.
    text: z.string().trim().min(100).max(800),
    textAr: z.string().trim().min(10).max(1000),
    questions: z
      .array(
        z.object({
          question: z.string().trim().min(3).max(160),
          options: z.array(z.string().trim().min(1).max(90)).min(2).max(3),
          answerIndex: z.number().int().min(0).max(2),
          explanationAr: z.string().trim().min(3).max(260),
        }),
      )
      .length(QUESTION_COUNT),
  })
  .refine((passage) => passage.questions.every((q) => q.answerIndex < q.options.length), {
    message: "answerIndex out of range",
  });

export type Passage = z.infer<typeof passageSchema>;

export interface StoredAnswer {
  choice: number;
  correct: boolean;
}
