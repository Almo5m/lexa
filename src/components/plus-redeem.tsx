"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

/** The student types or pastes his activation code. */
export function PlusRedeem() {
  const { t } = useT();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "wrong" | "many" | "failed">("idle");

  async function redeem() {
    setState("busy");
    try {
      const response = await fetch("/api/plus/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (response.status === 400) return setState("wrong");
      if (response.status === 429) return setState("many");
      if (!response.ok) throw new Error("redeem");
      setCode("");
      setState("idle");
      router.refresh();
    } catch {
      setState("failed");
    }
  }

  return (
    <form className="sheet space-y-3 p-5" onSubmit={(event) => { event.preventDefault(); void redeem(); }}>
      <label className="block space-y-1 font-semibold">
        {t("plus.codeLabel")}
        <input className="field ltr-text uppercase tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PLUS-XXXX-XXXX-XXXX" maxLength={30} autoComplete="off" spellCheck={false} />
      </label>
      <TagButton type="submit" gradient disabled={state === "busy" || code.trim().length < 8}>{t("plus.redeem")}</TagButton>
      {state === "wrong" && <p role="alert" className="pen-error">{t("plus.wrong")}</p>}
      {state === "many" && <p role="alert" className="pen-error">{t("plus.many")}</p>}
      {state === "failed" && <p role="alert" className="pen-error">{t("common.error")}</p>}
    </form>
  );
}
