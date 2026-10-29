"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

export interface AdminBoMessage {
  id: string;
  textAr: string;
  textEn: string;
  active: boolean;
}

async function send(body: object): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/bo-messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return response.ok;
  } catch {
    return false;
  }
}

/** The messages Bo says to students: write, edit, switch off, delete. The timing is in the Settings tab. */
export function AdminBoMessages({ messages, everyMinutes, perDay }: { messages: AdminBoMessage[]; everyMinutes: number; perDay: number }) {
  const { t } = useT();
  const router = useRouter();
  const [textAr, setTextAr] = useState("");
  const [textEn, setTextEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function run(body: object, done?: () => void) {
    setBusy(true);
    setFailed(false);
    const ok = await send(body);
    setBusy(false);
    if (!ok) return setFailed(true);
    done?.();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("boMsg.intro")}</p>
      <p className="text-sm font-semibold text-indigo">
        {everyMinutes > 0 && perDay > 0 ? t("boMsg.timing", { a: everyMinutes, b: perDay }) : t("boMsg.off")}
      </p>

      <section className="sheet space-y-3 p-6" aria-labelledby="bo-msg-new">
        <h2 id="bo-msg-new" className="text-lg font-bold">{t("boMsg.new")}</h2>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!textAr.trim()) return;
            void run({ action: "add", textAr, textEn }, () => {
              setTextAr("");
              setTextEn("");
            });
          }}
        >
          <textarea className="field" rows={2} maxLength={200} required value={textAr} onChange={(e) => setTextAr(e.target.value)} placeholder={t("boMsg.placeholder")} aria-label={t("boMsg.ar")} />
          <textarea className="field ltr-text" rows={2} maxLength={200} value={textEn} onChange={(e) => setTextEn(e.target.value)} placeholder={t("boMsg.placeholderEn")} aria-label={t("boMsg.en")} />
          <p className="text-xs text-ink-faint">{t("boMsg.nameHint")}</p>
          <TagButton type="submit" gradient disabled={busy}>{t("boMsg.add")}</TagButton>
          {failed && <p role="alert" className="pen-error">{t("common.error")}</p>}
        </form>
      </section>

      {messages.length === 0 && <p className="text-ink-soft">{t("boMsg.empty")}</p>}
      <ul className="space-y-3">
        {messages.map((message) => (
          <Row key={message.id} message={message} busy={busy} run={run} />
        ))}
      </ul>
    </div>
  );
}

function Row({ message, busy, run }: { message: AdminBoMessage; busy: boolean; run: (body: object, done?: () => void) => Promise<void> }) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [ar, setAr] = useState(message.textAr);
  const [en, setEn] = useState(message.textEn);

  return (
    <li className={`sheet space-y-3 p-5 ${message.active ? "" : "opacity-60"}`}>
      {editing ? (
        <div className="space-y-2">
          <textarea className="field" rows={2} maxLength={200} value={ar} onChange={(e) => setAr(e.target.value)} aria-label={t("boMsg.ar")} />
          <textarea className="field ltr-text" rows={2} maxLength={200} value={en} onChange={(e) => setEn(e.target.value)} aria-label={t("boMsg.en")} />
          <div className="flex gap-2">
            <TagButton gradient disabled={busy || !ar.trim()} onClick={() => void run({ action: "update", id: message.id, textAr: ar, textEn: en }, () => setEditing(false))}>
              {t("boMsg.save")}
            </TagButton>
            <TagButton quiet onClick={() => setEditing(false)}>{t("common.cancel")}</TagButton>
          </div>
        </div>
      ) : (
        <div>
          <p className="leading-7">{message.textAr}</p>
          {message.textEn && <p className="ltr-text mt-1 text-sm text-ink-soft">{message.textEn}</p>}
        </div>
      )}
      {!editing && (
        <div className="flex flex-wrap items-center gap-1 border-t border-line pt-2 text-sm">
          <label className="flex min-h-11 items-center gap-2 pe-3 font-semibold">
            <input type="checkbox" className="size-5 accent-indigo" checked={message.active} disabled={busy} onChange={(e) => void run({ action: "toggle", id: message.id, active: e.target.checked })} />
            {t("boMsg.active")}
          </label>
          <button type="button" className="min-h-11 px-3 text-ink-soft hover:text-indigo" onClick={() => setEditing(true)}>{t("boMsg.edit")}</button>
          <button type="button" className="min-h-11 px-3 text-pen-red" disabled={busy} onClick={() => void run({ action: "delete", id: message.id })}>{t("school.admin.deleteWord")}</button>
        </div>
      )}
    </li>
  );
}
