"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

/** Deletes a student and all his data, after one confirmation. For a student who asks to remove his data. */
export function DeleteStudent({ id }: { id: string }) {
  const { t } = useT();
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id, confirm: true }) });
      if (!response.ok) throw new Error("delete");
      router.push("/admin?tab=students");
      router.refresh();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <section className="sheet space-y-3 p-6" aria-labelledby="del-student">
      <h2 id="del-student" className="font-bold text-pen-red">{t("students.deleteTitle")}</h2>
      <p className="text-sm text-ink-soft">{t("students.deleteText")}</p>
      {ask ? (
        <div className="flex flex-wrap items-center gap-2">
          <TagButton disabled={busy} onClick={() => void remove()}>{t("students.deleteYes")}</TagButton>
          <TagButton quiet onClick={() => setAsk(false)}>{t("common.cancel")}</TagButton>
        </div>
      ) : (
        <TagButton quiet onClick={() => setAsk(true)}>{t("students.delete")}</TagButton>
      )}
      {failed && <p role="alert" className="pen-error">{t("common.error")}</p>}
    </section>
  );
}
