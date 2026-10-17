import type { Passage, StoredAnswer } from "./schemas";

export interface AnsweredView {
  choice: number;
  correct: boolean;
  correctIndex: number;
  explanationAr: string;
}

/** What the browser may see. The right answers are sent only for questions the student has already answered. */
export interface ReadingView {
  title: string;
  text: string;
  words: string[];
  questions: { question: string; options: string[] }[];
  answered: AnsweredView[];
  completed: boolean;
  score: number;
  /** The Arabic translation opens only after the questions, so it cannot replace reading. */
  textAr: string | null;
}

export function toView(passage: Passage, words: string[], answers: StoredAnswer[]): ReadingView {
  const completed = answers.length >= passage.questions.length;
  return {
    title: passage.title,
    text: passage.text,
    words,
    questions: passage.questions.map((q) => ({ question: q.question, options: q.options })),
    answered: answers.map((answer, index) => ({
      choice: answer.choice,
      correct: answer.correct,
      correctIndex: passage.questions[index].answerIndex,
      explanationAr: passage.questions[index].explanationAr,
    })),
    completed,
    score: answers.filter((answer) => answer.correct).length,
    textAr: completed ? passage.textAr : null,
  };
}

/** Grades one choice on the server. */
export function gradeChoice(passage: Passage, index: number, choice: number): StoredAnswer {
  const question = passage.questions[index];
  if (!question || choice < 0 || choice >= question.options.length) throw new Error("invalid_choice");
  return { choice, correct: choice === question.answerIndex };
}
