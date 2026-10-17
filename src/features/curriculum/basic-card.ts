import type { WordCard } from "@/features/ai/schemas";
import type { PathWord } from "./types";

/**
 * The card a path word starts with. It comes from the hand-written list, so the student can learn the
 * word at once. The AI fills in pronunciation, examples and a memory hook afterwards.
 */
export function basicCard(entry: PathWord): WordCard {
  return {
    term: entry.en,
    ipa: "",
    partOfSpeech: entry.pos,
    meaningsAr: entry.ar.split(/[،,]/).map((part) => part.trim()).filter(Boolean).slice(0, 4),
    situationAr: "",
    sentence: capitalize(entry.chunkEn) + ".",
    sentenceAr: entry.chunkAr,
    usageNoteAr: "",
    memoryHookAr: "",
    extraExamples: [],
    related: [],
    confusableWith: null,
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
