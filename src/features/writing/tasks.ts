/** The three writing tasks of Year 3 Term 1. The brief and the checklist are ours; only the task types follow the ministry book. */
export interface WritingTask {
  id: string;
  unit: number;
  titleEn: string;
  /** What the student must write, in English, as an exam question would say it. */
  brief: string;
  /** What a good answer contains, in Arabic, shown before writing. */
  planAr: string[];
  /** Sentence starters that help without writing the answer for the student. */
  starters: string[];
  minWords: number;
  maxWords: number;
}

export const WRITING_TASKS: WritingTask[] = [
  {
    id: "w-essay",
    unit: 3,
    titleEn: "Persuasive essay",
    brief: "Write an essay of about 120 words to convince your classmates that everyone should help protect nature. Give at least two reasons.",
    planAr: ["مقدمة: قول رأيك في جملة واضحة.", "فقرة فيها سببين على الأقل، كل سبب بمثال.", "خاتمة: كرر رأيك وادعي القارئ يعمل حاجة."],
    starters: ["In my opinion, ...", "First of all, ...", "Moreover, ...", "For example, ...", "In conclusion, ..."],
    minWords: 60,
    maxWords: 220,
  },
  {
    id: "w-paragraph",
    unit: 4,
    titleEn: "Descriptive paragraph",
    brief: "Write a paragraph of about 80 words describing a sea or a beach you have seen or imagined. Use at least three adjectives and one compound adjective.",
    planAr: ["جملة افتتاحية: المكان فين وعامل إزاي.", "وصف بالحواس: بتشوف إيه وبتسمع إيه.", "جملة ختام: إحساسك تجاه المكان.", "استخدم صفة مركبة زي a two-hour trip أو a well-known beach."],
    starters: ["The beach is ...", "The water looks ...", "I can see ...", "It is a ...-... place."],
    minWords: 40,
    maxWords: 150,
  },
  {
    id: "w-review",
    unit: 6,
    titleEn: "Online review",
    brief: "Write an online review of about 80 words about a place you visited with friends (a cafe, a park, a cinema). Say what you liked, what you did not like, and whether you recommend it.",
    planAr: ["اسم المكان وإيه اللي خلاك تروحه.", "حاجة عجبتك وحاجة ماعجبتكش.", "توصية في الآخر: هتنصح بيه ولا لأ ولمين."],
    starters: ["Last week I went to ...", "What I liked most was ...", "However, ...", "I would recommend it to ..."],
    minWords: 40,
    maxWords: 150,
  },
];

export function writingTask(id: string): WritingTask | undefined {
  return WRITING_TASKS.find((task) => task.id === id);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
