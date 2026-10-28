/** The school curriculum: units of words the admin uploads, the same for every student. */
export interface SchoolWord {
  id: string;
  unitId: string;
  term: string;
  pos: string;
  meaningAr: string;
  exampleEn: string;
  exampleAr: string;
}

export interface SchoolUnit {
  id: string;
  titleAr: string;
  titleEn: string;
  words: SchoolWord[];
}

/** A word line the admin typed or uploaded, checked and ready to save. */
export interface ParsedWord {
  term: string;
  pos: string;
  meaningAr: string;
  exampleEn: string;
  exampleAr: string;
}

export interface ParseProblem {
  line: number;
  reason: "format" | "term" | "meaning" | "long" | "duplicate";
}
