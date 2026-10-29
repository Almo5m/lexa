/** Messages Bo says on his own. The rules for when and which one are plain functions, so they are easy to test. */
export interface BoMessage {
  id: string;
  text: string;
}

export interface MessageState {
  /** The day (YYYY-MM-DD) the counter belongs to. */
  day: string;
  /** How many messages were shown that day. */
  count: number;
  /** When the last one was shown (ms), 0 for never. */
  lastAt: number;
  /** Ids already shown in this round, so the same message does not come twice in a row. */
  seen: string[];
}

export const EMPTY_STATE: MessageState = { day: "", count: 0, lastAt: 0, seen: [] };

/** A new session waits this long before the first message, so Bo never greets the student with a pop-up. */
export const FIRST_MESSAGE_DELAY_MS = 90_000;

export function dayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** The counter of today: a new day starts from zero. */
export function stateForDay(state: MessageState, today: string): MessageState {
  return state.day === today ? state : { ...state, day: today, count: 0 };
}

export function canShowNow(state: MessageState, now: number, today: string, everyMinutes: number, perDay: number): boolean {
  if (everyMinutes <= 0 || perDay <= 0) return false;
  const current = stateForDay(state, today);
  if (current.count >= perDay) return false;
  return current.lastAt === 0 || now - current.lastAt >= everyMinutes * 60_000;
}

/** A message not shown in this round yet. When all were shown, a new round starts (never the one just shown). */
export function pickMessage(messages: readonly BoMessage[], seen: readonly string[], random: () => number = Math.random): BoMessage | null {
  if (messages.length === 0) return null;
  const fresh = messages.filter((message) => !seen.includes(message.id));
  const last = seen[seen.length - 1];
  const pool = fresh.length > 0 ? fresh : messages.length > 1 ? messages.filter((message) => message.id !== last) : messages;
  return pool[Math.floor(random() * pool.length) % pool.length];
}

/** Records that a message was shown. */
export function afterShown(state: MessageState, message: BoMessage, now: number, today: string, total: number): MessageState {
  const current = stateForDay(state, today);
  const seen = current.seen.includes(message.id) ? current.seen : [...current.seen, message.id];
  return { day: today, count: current.count + 1, lastAt: now, seen: seen.length >= total ? [message.id] : seen };
}

/** Puts the student's first name where the admin wrote {name}; without a name the placeholder disappears cleanly. */
export function fillName(text: string, fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  return text
    .replace(/\s*\{name\}/g, first ? ` ${first}` : "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([،,.!؟?])/g, "$1")
    .trim();
}

/** One message for the whole day, the same on every visit, different between students and days. */
export function dailyMessage(messages: readonly BoMessage[], day: string, userId: string): BoMessage | null {
  if (messages.length === 0) return null;
  let hash = 0;
  for (const char of `${day}:${userId}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return messages[hash % messages.length];
}

export function parseState(raw: string | null): MessageState {
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object") return EMPTY_STATE;
    return {
      day: typeof data.day === "string" ? data.day : "",
      count: Number.isFinite(data.count) ? Math.max(0, Math.floor(data.count)) : 0,
      lastAt: Number.isFinite(data.lastAt) ? data.lastAt : 0,
      seen: Array.isArray(data.seen) ? data.seen.filter((id: unknown): id is string => typeof id === "string").slice(-200) : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}
