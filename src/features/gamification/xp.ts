export function xpForLevel(level: number): number {
  return Math.round(50 * (level - 1) * level);
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  currentXp: number;
  neededXp: number;
  ratio: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelFromXp(totalXp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const currentXp = totalXp - start;
  const neededXp = end - start;
  return { level, currentXp, neededXp, ratio: currentXp / neededXp };
}

export function comboBonus(streakOfCorrect: number): number {
  if (streakOfCorrect < 3) return 0;
  return Math.min(10, Math.floor(streakOfCorrect / 3) * 2);
}
