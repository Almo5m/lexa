import { BoMascot } from "@/components/bo-mascot";
import { ChatHistory, NewChatButton, type HistoryItem } from "@/components/chat-history";
import { PlanBadge, UsageMeter } from "@/components/chat-usage";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { daysLeft } from "@/features/plus/plan";
import { conversationFull } from "@/features/chat/memory";
import { isMissingChatTable, loadAllowance } from "@/features/chat/server";

export const metadata = { title: "Chat with Bo" };

export default async function ChatPage() {
  const { user } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();
  const db = createSupabaseAdminClient();

  const [allowance, listed] = await Promise.all([
    loadAllowance(db, user.id, settings),
    db
      .from("chat_conversations")
      .select("id, title, message_count, student_count, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  if (listed.error && isMissingChatTable(listed.error)) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">{t("bochat.title")}</h1>
        <p className="sheet rounded-3xl p-5 text-ink-soft">{t("bochat.setup")}</p>
      </div>
    );
  }

  const items: HistoryItem[] = (listed.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    messages: row.message_count,
    full: conversationFull(row.student_count, settings),
    updatedAt: row.updated_at,
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <section className="sheet flex items-center gap-4 rounded-[28px] p-4" aria-label={t("bochat.title")}>
        <BoMascot mood="happy" size={110} className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-2xl font-semibold">{t("bochat.title")}</h1>
          <PlanBadge plan={allowance.plan} days={daysLeft(allowance.plusUntil)} />
          <UsageMeter used={allowance.used} limit={allowance.limit} />
        </div>
      </section>

      <NewChatButton />

      <section className="space-y-3" aria-labelledby="history-title">
        <h2 id="history-title" className="text-lg font-bold">{t("bochat.history")}</h2>
        <ChatHistory items={items} />
      </section>
    </div>
  );
}
