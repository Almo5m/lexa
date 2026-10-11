import { z } from "zod";

export const MISTAKE_TYPES = [
  "missing_be",
  "agreement",
  "article",
  "preposition",
  "plural",
  "tense",
  "word_order",
  "spelling",
  "word_choice",
  "other",
] as const;

export type MistakeType = (typeof MISTAKE_TYPES)[number];

const level = z.number().int().min(1).max(5);

export const talkAnalysisSchema = z.object({
  vocabularyLevel: level,
  grammarLevel: level,
  clarityLevel: level,
  mistakes: z
    .array(
      z.object({
        original: z.string().max(200),
        fixed: z.string().max(200),
        // A model may invent a label; anything unknown becomes "other" instead of failing the whole answer.
        type: z.string().transform((value): MistakeType => (MISTAKE_TYPES as readonly string[]).includes(value) ? (value as MistakeType) : "other"),
        explanationAr: z.string().max(300),
      }),
    )
    .max(6),
  naturalVersion: z.string().max(900),
  feedbackAr: z.string().max(500),
});

export type TalkAnalysis = z.infer<typeof talkAnalysisSchema>;
export type TalkMistake = TalkAnalysis["mistakes"][number];
