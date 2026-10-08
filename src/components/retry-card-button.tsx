"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";

export function RetryCardButton({ wordId }: { wordId: string }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function retry() {
    setBusy(true);
    setError(false);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("words").update({ card_status: "pending" }).eq("id", wordId);
      const response = await fetch("/api/words/generate", { method: "POST" });
      if (!response.ok) throw new Error("generate_failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <TagButton onClick={retry} loading={busy}>
        {t("card.retry")}
      </TagButton>
      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {t("common.error")}
        </p>
      )}
    </div>
  );
}
