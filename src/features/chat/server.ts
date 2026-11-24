/** Database side of the Bo chat. Service client only; every query is filtered by the student's id. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { callGemini } from "@/features/ai/gemini";
import { isPlus } from "@/features/plus/plan";
import { loadPlusUntil } from "@/features/plus/server";
import type { AppSettings } from "@/lib/settings";
import {
  SUMMARY_MAX_CHARS, SUMMARY_SYSTEM, carryOver, chatLimitFor, clampSummary, summarizableCount, summaryPrompt,
  type ChatLine, type StudentFacts,
} from "./memory";

export interface Conversation {
  id: string;
  title: string;
  summary: string;
  message_count: number;
  student_count: number;
  summarized_upto: number;
  created_at: string;
  updated_at: string;
}

export const CONVERSATION_COLUMNS = "id, title, summary, message_count, student_count, summarized_upto, created_at, updated_at";

export function isMissingChatTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || error?.code === "PGRST202" || /chat_|take_chat_message/.test(error?.message ?? ""));
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface Allowance {
  plan: "free" | "plus";
  plusUntil: string | null;
  limit: number;
  used: number;
}

export async function loadAllowance(db: SupabaseClient, userId: string, settings: AppSettings): Promise<Allowance> {
  const [plusUntil, usage] = await Promise.all([
    loadPlusUntil(db, userId),
    db.from("chat_usage").select("used").eq("user_id", userId).eq("day", todayUtc()).maybeSingle(),
  ]);
  const plus = isPlus(plusUntil);
  return { plan: plus ? "plus" : "free", plusUntil: plus ? plusUntil : null, limit: chatLimitFor(plus, settings), used: usage.data?.used ?? 0 };
}

export async function loadFacts(db: SupabaseClient, userId: string): Promise<StudentFacts> {
  const { data } = await db.from("profiles").select("display_name, stage, level_band, interests").eq("id", userId).maybeSingle();
  return {
    firstName: (data?.display_name ?? "").trim().split(/\s+/)[0] ?? "",
    stage: data?.stage && data.stage !== "secondary" ? data.stage : "",
    levelBand: data?.level_band ?? null,
    interests: Array.isArray(data?.interests) ? (data.interests as string[]) : [],
  };
}

export async function ownConversation(db: SupabaseClient, userId: string, id: string): Promise<Conversation | null> {
  const { data } = await db.from("chat_conversations").select(CONVERSATION_COLUMNS).eq("id", id).eq("user_id", userId).maybeSingle();
  return (data as Conversation | null) ?? null;
}

export async function recentLines(db: SupabaseClient, userId: string, conversationId: string, limit: number): Promise<ChatLine[]> {
  const { data } = await db
    .from("chat_messages")
    .select("role, text")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ChatLine[]).reverse();
}

/** Folds the oldest unsummarized messages into the capped summary. Returns the summary after the update. */
export async function refreshSummary(db: SupabaseClient, userId: string, conversation: Conversation, settings: AppSettings, force = false): Promise<string> {
  const count = summarizableCount(conversation.message_count, conversation.summarized_upto, force);
  if (count === 0) return conversation.summary;

  const { data } = await db
    .from("chat_messages")
    .select("role, text")
    .eq("conversation_id", conversation.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .range(conversation.summarized_upto, conversation.summarized_upto + count - 1);
  const lines = (data ?? []) as ChatLine[];
  if (lines.length === 0) return conversation.summary;

  const text = await callGemini({
    userId,
    feature: "chat",
    model: settings.aiModel,
    fallbackModel: settings.aiFallbackModel,
    system: SUMMARY_SYSTEM,
    prompt: summaryPrompt(conversation.summary, lines),
    temperature: 0.2,
    maxOutputTokens: 400,
  });
  const summary = clampSummary(text, SUMMARY_MAX_CHARS);
  if (!summary) return conversation.summary;
  await db
    .from("chat_conversations")
    .update({ summary, summarized_upto: conversation.summarized_upto + lines.length })
    .eq("id", conversation.id)
    .eq("user_id", userId);
  return summary;
}

/** A new conversation. When it continues a full one, it starts with that one's capped summary. */
export async function createConversation(db: SupabaseClient, userId: string, settings: AppSettings, from?: string): Promise<string | null> {
  let summary = "";
  let carriedFrom: string | null = null;
  if (from) {
    const old = await ownConversation(db, userId, from);
    if (old) {
      carriedFrom = old.id;
      try {
        summary = carryOver(await refreshSummary(db, userId, old, settings, true));
      } catch {
        // The AI may be busy right now; the old summary (even if a little behind) still carries over.
        summary = carryOver(old.summary);
      }
    }
  }
  const { data, error } = await db
    .from("chat_conversations")
    .insert({ user_id: userId, summary, carried_from: carriedFrom })
    .select("id")
    .single();
  if (error) return null;
  return data.id;
}
