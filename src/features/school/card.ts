import type { WordCard } from "@/features/ai/schemas";
import type { SchoolWord } from "./types";

/**
 * The card a school word starts with, built from what the admin uploaded, so the student can learn it at once.
 * The AI fills in pronunciation, a memory hook and more examples afterwards.
 */
export function schoolCard(word: Pick<SchoolWord, "term" | "pos" | "meaningAr" | "exampleEn" | "exampleAr">): WordCard {
  return {
    term: word.term,
    ipa: "",
    partOfSpeech: word.pos,
    meaningsAr: word.meaningAr.split(/[،,]/).map((part) => part.trim()).filter(Boolean).slice(0, 4),
    situationAr: "",
    sentence: word.exampleEn,
    sentenceAr: word.exampleAr,
    usageNoteAr: "",
    memoryHookAr: "",
    extraExamples: [],
    related: [],
    confusableWith: null,
  };
}
