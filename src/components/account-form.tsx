"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

export function AccountForm({ initialName }: { initialName: string }) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const word = t("account.deleteWord");

  async function saveName(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setState("idle");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("name_failed");
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteFailed(false);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) throw new Error("delete_failed");
      window.location.assign("/welcome");
    } catch {
      setDeleteFailed(true);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveName} className="space-y-3">
        <label htmlFor="account-name" className="block text-sm font-medium">
          {t("account.name")}
        </label>
        <input id="account-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" required />
        <div aria-live="polite" className="min-h-5 text-sm">
          {state === "saved" && <p className="text-leaf">{t("account.saved")}</p>}
          {state === "error" && <p className="text-pen-red">{t("account.error")}</p>}
        </div>
        <TagButton type="submit" loading={busy} className="w-full sm:w-auto">
          {t("account.save")}
        </TagButton>
      </form>

      <div className="space-y-3 border-t border-line pt-6">
        <h3 className="text-lg font-bold text-pen-red">{t("account.deleteTitle")}</h3>
        <p className="text-ink-soft">{t("account.deleteWhat")}</p>
        <label htmlFor="delete-confirm" className="block text-sm font-medium">
          {t("account.deleteConfirm", { word })}
        </label>
        <input id="delete-confirm" className="field" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        {deleteFailed && <p className="text-pen-red">{t("account.deleteError")}</p>}
        <TagButton
          type="button"
          onClick={deleteAccount}
          loading={deleting}
          disabled={confirmText.trim() !== word}
          className="w-full sm:w-auto"
        >
          {t("account.deleteButton")}
        </TagButton>
      </div>
    </div>
  );
}
