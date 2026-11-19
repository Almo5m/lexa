import { z } from "zod";

/** What the AI returns after marking the skills part. */
export const levelAssessSchema = z.object({
  items: z.array(z.object({ id: z.string().max(80), score: z.number().int().min(0).max(3), noteAr: z.string().max(200).default("") })).max(10),
  overallBand: z.number().int().min(1).max(5),
  summaryAr: z.string().max(400),
});
export type LevelAssessment = z.infer<typeof levelAssessSchema>;

/**
 * Joins the two parts into one level. Writing and translating show more than recognising words, so the AI part weighs more,
 * but the result never moves more than one band away from the vocabulary level. A wrong move up would hand the student words he cannot read yet.
 */
export function combineLevels(vocab: number, ai: number): number {
  const mixed = Math.round(0.4 * vocab + 0.6 * ai);
  return Math.min(5, Math.max(1, Math.min(vocab + 1, Math.max(vocab - 1, mixed))));
}
