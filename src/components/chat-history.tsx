"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

export interface HistoryItem {
  id: string;
  title: string;
  messages: number;
  full: boolean;
  updatedAt: string;
}

export function NewChatButton() {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    try {
      const response = await fetch("/api/chat/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await response.json();
      if (!response.ok) throw new Error();
      router.push(`/chat/${data.id}`);
    } catch {
      setBusy(false);
    }
  }
  return (
    <button type="button" onClick={start} disabled={busy} className="tag-btn min-h-11 text-sm disabled:opacity-50">
      {t("bochat.new")}
    </button>
  );
}

export function ChatHistory({ items }: { items: HistoryItem[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  async function remove(id: string) {
    if (!window.confirm(t("bochat.deleteConfirm"))) return;
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" }).catch(() => undefined);
    router.refresh();
  }
  if (items.length === 0) return <p className="sheet rounded-3xl p-5 text-ink-soft">{t("bochat.empty")}</p>;
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" });
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="sheet flex items-center gap-2 rounded-3xl p-2 ps-4">
          <Link href={`/chat/${item.id}`} className="min-w-0 flex-1 py-2">
            <span className="block truncate font-semibold" dir="auto">{item.title || t("bochat.untitled")}</span>
            <span className="block text-xs text-ink-faint">
              {date(item.updatedAt)} · {t("bochat.msgs", { n: item.messages })}
              {item.full ? ` · ${t("bochat.closed")}` : ""}
            </span>
          </Link>
          <button type="button" onClick={() => remove(item.id)} className="min-h-11 rounded-full px-3 text-sm text-pen-red hover:bg-pen-red/10">
            {t("bochat.delete")}
          </button>
        </li>
      ))}
    </ul>
  );
}
