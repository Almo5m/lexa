export interface CleanedWords {
  words: string[];
  duplicates: string[];
  rejected: string[];
}

const MAX_WORD_LENGTH = 40;
const MAX_WORDS_PER_BATCH = 300;
const ENGLISH_WORD = /^[a-z]+(?:[-'][a-z]+)*$/;
const ARABIC_RANGE = /[\u0600-\u06FF]/;

export function normalizeWord(raw: string): string | null {
  const stripped = raw
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .trim()
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "")
    .toLowerCase();

  if (stripped.length < 2 || stripped.length > MAX_WORD_LENGTH) return null;
  return ENGLISH_WORD.test(stripped) ? stripped : null;
}

export function cleanExtractedWords(rawList: string[]): CleanedWords {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const rejected: string[] = [];
  const words: string[] = [];

  for (const raw of rawList) {
    if (ARABIC_RANGE.test(raw)) continue;
    const word = normalizeWord(raw);
    if (word === null) {
      if (raw.trim().length > 0) rejected.push(raw.trim());
      continue;
    }
    if (seen.has(word)) {
      duplicates.add(word);
      continue;
    }
    seen.add(word);
    words.push(word);
  }

  return {
    words: words.slice(0, MAX_WORDS_PER_BATCH),
    duplicates: [...duplicates],
    rejected,
  };
}

export function splitManualInput(text: string): string[] {
  return text.split(/[\n,;،\t]+/).map((part) => part.trim()).filter(Boolean);
}

export function splitAgainstLibrary(
  candidates: string[],
  existing: Iterable<string>,
): { fresh: string[]; alreadyKnown: string[] } {
  const known = new Set(existing);
  const fresh: string[] = [];
  const alreadyKnown: string[] = [];
  for (const word of candidates) (known.has(word) ? alreadyKnown : fresh).push(word);
  return { fresh, alreadyKnown };
}
