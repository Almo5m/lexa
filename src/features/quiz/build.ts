export type QuizType = "meaning" | "word" | "gap" | "situation" | "listen";

export interface QuizWord {
  id: string;
  term: string;
  meaningAr: string;
  situationAr: string;
  sentence: string;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  wordId: string;
  type: QuizType;
  prompt: string;
  audio?: string;
  options: QuizOption[];
}

export const MIN_WORDS_FOR_QUIZ = 4;
const OPTION_COUNT = 4;
const TYPES: QuizType[] = ["meaning", "word", "gap", "situation", "listen"];

type Random = () => number;

function shuffle<T>(items: T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function blankSentence(sentence: string, term: string): string | null {
  const stems = [term];
  if (/[ey]$/.test(term) && term.length > 3) stems.push(term.slice(0, -1));
  for (const stem of stems) {
    const pattern = new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]*`, "i");
    if (pattern.test(sentence)) return sentence.replace(pattern, "_____");
  }
  return null;
}

function answersWithMeaning(type: QuizType): boolean {
  return type === "meaning" || type === "listen";
}

function labelFor(word: QuizWord, type: QuizType): string {
  return answersWithMeaning(type) ? word.meaningAr : word.term;
}

function makeQuestion(
  target: QuizWord,
  type: QuizType,
  pool: QuizWord[],
  index: number,
  random: Random,
): QuizQuestion | null {
  let prompt: string;
  let audio: string | undefined;
  switch (type) {
    case "meaning":
      prompt = target.term;
      audio = target.term;
      break;
    case "word":
      prompt = target.meaningAr;
      break;
    case "gap": {
      const blanked = blankSentence(target.sentence, target.term);
      if (!blanked) return null;
      prompt = blanked;
      break;
    }
    case "situation":
      prompt = target.situationAr;
      break;
    case "listen":
      prompt = "";
      audio = target.term;
      break;
  }

  const correctLabel = labelFor(target, type);
  const seen = new Set([correctLabel]);
  const distractors: QuizOption[] = [];
  for (const other of shuffle(pool, random)) {
    if (other.id === target.id) continue;
    const label = labelFor(other, type);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    distractors.push({ id: other.id, label });
    if (distractors.length === OPTION_COUNT - 1) break;
  }
  if (distractors.length < OPTION_COUNT - 1) return null;

  return {
    id: `q${index}`,
    wordId: target.id,
    type,
    prompt,
    audio,
    options: shuffle([{ id: target.id, label: correctLabel }, ...distractors], random),
  };
}

/**
 * Builds a mixed quiz from the student's own cards. The words are taken in the order
 * given (the caller puts weak and due words first); the other words supply wrong answers.
 */
export function buildQuiz(words: QuizWord[], count: number, random: Random = Math.random): QuizQuestion[] {
  if (words.length < MIN_WORDS_FOR_QUIZ) return [];
  const targets = words.slice(0, count);
  const typeOrder = shuffle(TYPES, random);
  const questions: QuizQuestion[] = [];

  targets.forEach((target, index) => {
    const start = index % typeOrder.length;
    for (let step = 0; step < typeOrder.length; step++) {
      const type = typeOrder[(start + step) % typeOrder.length];
      const question = makeQuestion(target, type, words, questions.length, random);
      if (question) {
        questions.push(question);
        return;
      }
    }
  });
  return questions;
}
