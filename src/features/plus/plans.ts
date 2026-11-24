/** What each plan gives, built from the settings so the admin sees (and edits) one source of truth. Pure functions. */
import { dailyLimitFor } from "./plan";
import type { AppSettings } from "@/lib/settings";
import { chatLimitFor } from "@/features/chat/memory";

export interface PlanRow {
  id: "free" | "plus";
  aiPerDay: number;
  chatPerDay: number;
  chatPerConversation: number;
}

export function planTable(settings: AppSettings): PlanRow[] {
  return (["free", "plus"] as const).map((id) => ({
    id,
    aiPerDay: dailyLimitFor(settings.aiDailyLimitPerStudent, id === "plus", settings.plusAiMultiplier),
    chatPerDay: chatLimitFor(id === "plus", settings),
    chatPerConversation: settings.chatMessagesPerConversation,
  }));
}

export type MemberState = "active" | "expiring" | "expired";
export const EXPIRING_DAYS = 7;

export function memberState(plusUntil: string, now = new Date()): MemberState {
  const end = new Date(plusUntil).getTime();
  if (end <= now.getTime()) return "expired";
  return end - now.getTime() <= EXPIRING_DAYS * 86_400_000 ? "expiring" : "active";
}

export function countMembers(rows: { plus_until: string }[], now = new Date()): Record<MemberState, number> {
  const counts: Record<MemberState, number> = { active: 0, expiring: 0, expired: 0 };
  for (const row of rows) counts[memberState(row.plus_until, now)] += 1;
  return counts;
}
