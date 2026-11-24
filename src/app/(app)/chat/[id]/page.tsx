import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
import { requireUserPage } from "@/lib/auth";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { daysLeft } from "@/features/plus/plan";
import { loadAllowance, ownConversation } from "@/features/chat/server";

export const metadata = { title: "Chat with Bo" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { user } = await requireUserPage();
  const settings = await loadSettings();
  const db = createSupabaseAdminClient();

  const conversation = await ownConversation(db, user.id, id);
  if (!conversation) notFound();

  const [allowance, messages] = await Promise.all([
    loadAllowance(db, user.id, settings),
    db
      .from("chat_messages")
      .select("role, text")
      .eq("conversation_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(400),
  ]);

  return (
    <ChatRoom
      conversationId={id}
      initialMessages={(messages.data ?? []) as { role: "student" | "tutor"; text: string }[]}
      studentCount={conversation.student_count}
      maxPerConversation={settings.chatMessagesPerConversation}
      used={allowance.used}
      limit={allowance.limit}
      plan={allowance.plan}
      plusDays={daysLeft(allowance.plusUntil)}
      hasMemory={conversation.summary !== ""}
    />
  );
}
