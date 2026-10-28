"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { TagButton } from "@/components/tag-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";

export function ForgotForm() {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    try {
      await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      });
    } catch {
      // The answer is the same either way, so nobody can use this form to find out who is registered.
    }
    setLoading(false);
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="sheet-raised mx-auto mt-6 w-full max-w-sm space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{t("auth.forgotTitle")}</h1>
      <p className="text-ink-soft">{t("auth.forgotWhy")}</p>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          {t("auth.email")}
        </label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="field ltr-text" required />
      </div>
      <div aria-live="polite" className="min-h-6 text-sm">
        {sent && <p className="text-leaf">{t("auth.forgotSent")}</p>}
      </div>
      <TagButton type="submit" loading={loading} className="w-full">
        {t("auth.forgotSend")}
      </TagButton>
      <p className="text-center text-sm">
        <Link href="/login" className="inline-flex min-h-11 items-center text-ink-soft transition-colors hover:text-indigo">
          {t("auth.toLogin")}
        </Link>
      </p>
    </form>
  );
}
