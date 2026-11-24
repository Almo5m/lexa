/**
 * The ministry books by stage (Term 1): the units, their topic and grammar focus, from each book's "Scope and Sequence".
 * Only titles and what the book teaches; the exercises, scripts and explanations are ours or uploaded by the admin.
 */
export type BookStage = "sec1" | "sec2" | "sec3";

export interface BookUnit {
  number: number;
  titleEn: string;
  grammarEn: string;
}

export const BOOKS: Record<BookStage, BookUnit[]> = {
  sec1: [
    { number: 1, titleEn: "Egypt's Heritage", grammarEn: "Past Simple and Past Continuous" },
    { number: 2, titleEn: "Hands Help, Hearts Care", grammarEn: "Modal Verbs (must, have to)" },
    { number: 3, titleEn: "Truth Vs. Lies", grammarEn: "Conditional sentences" },
    { number: 4, titleEn: "Save and Shine", grammarEn: "Verbs + infinitive or -ing forms" },
    { number: 5, titleEn: "Using Technology at Schools", grammarEn: "Countable and Uncountable Nouns" },
    { number: 6, titleEn: "Job Hunting", grammarEn: "Definite and Indefinite Articles" },
  ],
  sec2: [
    { number: 1, titleEn: "Egypt-Africa Cooperation", grammarEn: "Present Continuous in Active and Passive" },
    { number: 2, titleEn: "Startups & Young Entrepreneurs", grammarEn: "Past Perfect Active and Passive" },
    { number: 3, titleEn: "Sustainable Development Goals (SDG)", grammarEn: "Adjectives and Adverbs" },
    { number: 4, titleEn: "Natural Disasters", grammarEn: "Comparative and Superlative adjectives" },
    { number: 5, titleEn: "Media Manipulation", grammarEn: "Tag questions" },
    { number: 6, titleEn: "Soft Skills Vs. Hard Skills", grammarEn: "Defining and Non-defining Relative Clauses" },
  ],
  sec3: [
    { number: 1, titleEn: "Inside the World of Care", grammarEn: "Present Perfect and Present Perfect Continuous" },
    { number: 2, titleEn: "The Power of Machines", grammarEn: "Reported statements and commands" },
    { number: 3, titleEn: "Protect Nature, Protect Future", grammarEn: "Modals of deduction, regret and blame" },
    { number: 4, titleEn: "Marine Life", grammarEn: "Adjectives and compound adjectives" },
    { number: 5, titleEn: "From Muscles to Mindset", grammarEn: "Causative have / get" },
    { number: 6, titleEn: "Let's Hang Out!", grammarEn: "Reported questions" },
  ],
};

/** The book of a stage. An account that never chose a stage keeps the third-secondary book. */
export function bookFor(stage: string | null): BookUnit[] {
  if (stage === "sec1" || stage === "sec2" || stage === "sec3") return BOOKS[stage];
  return stage === null ? BOOKS.sec3 : [];
}
