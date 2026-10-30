/**
 * The weekly board shows made-up names only, never real ones. A name is an adjective, an animal and two digits,
 * built from fixed lists, so nobody can type anything unsuitable and the server can check a name by rebuilding it.
 */
export const ADJECTIVES = ["شجاع", "ذكي", "سريع", "هادي", "نشيط", "قوي", "مبتسم", "فضولي", "مرح", "صبور", "طموح", "ماهر", "لامع", "جريء", "رايق", "مجتهد"] as const;
export const ANIMALS = ["نمر", "صقر", "فهد", "أسد", "ذئب", "دلفين", "نسر", "حصان", "غزال", "باندا", "ثعلب", "فيل", "بومة", "سلحفاة", "نحلة", "قرش"] as const;

export function makeNickname(random: () => number = Math.random): string {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length) % list.length];
  const number = 10 + (Math.floor(random() * 90) % 90);
  return `${pick(ANIMALS)} ${pick(ADJECTIVES)} ${number}`;
}

export function isValidNickname(value: string): boolean {
  const parts = value.split(" ");
  if (parts.length !== 3) return false;
  const [animal, adjective, number] = parts;
  return (ANIMALS as readonly string[]).includes(animal) && (ADJECTIVES as readonly string[]).includes(adjective) && /^[1-9][0-9]$/.test(number);
}
