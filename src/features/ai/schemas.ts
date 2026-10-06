import { z } from "zod";

export const extractionSchema = z.object({
  words: z.array(z.string().max(60)).max(400),
});

export const cardSchema = z.object({
  term: z.string(),
  ipa: z.string(),
  partOfSpeech: z.string(),
  meaningsAr: z.array(z.string()).min(1).max(4),
  situationAr: z.string(),
  sentence: z.string(),
  sentenceAr: z.string(),
  usageNoteAr: z.string(),
  extraExamples: z.array(z.object({ en: z.string(), ar: z.string() })).max(3),
  related: z.array(z.object({ word: z.string(), noteAr: z.string() })).max(4),
  confusableWith: z
    .object({ word: z.string(), differenceAr: z.string() })
    .nullable(),
});

export const cardBatchSchema = z.object({ cards: z.array(cardSchema) });

export type WordCard = z.infer<typeof cardSchema>;

export const tutorReplySchema = z.object({
  reply: z.string(),
});
