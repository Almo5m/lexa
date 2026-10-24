import { z } from "zod";

const mark = z.number().int().min(0).max(5);

export const writingGradeSchema = z.object({
  content: mark,
  organization: mark,
  grammar: mark,
  vocabulary: mark,
  mistakes: z
    .array(
      z.object({
        original: z.string().max(200),
        fixed: z.string().max(200),
        explanationAr: z.string().max(300),
      }),
    )
    .max(6),
  improvedVersion: z.string().max(2000),
  feedbackAr: z.string().max(700),
});

export type WritingGrade = z.infer<typeof writingGradeSchema>;

export function totalMarks(grade: Pick<WritingGrade, "content" | "organization" | "grammar" | "vocabulary">): number {
  return grade.content + grade.organization + grade.grammar + grade.vocabulary;
}
