"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { TagButton } from "@/components/tag-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";

export function ResetForm() {
  const { t } = useT();
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "yes" | "no">("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  // The email link signs the student in for this one step; without a session there is nothing to change.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setReady(data.session ? "yes" : "no");
    }, 600);
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) setReady("yes");
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setLoading(true);
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(true);
    setDone(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1200);
  }

  return (
    <form onSubmit={onSubmit} className="sheet-raised mx-auto mt-6 w-full max-w-sm space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{t("auth.resetTitle")}</h1>
      {ready === "no" ? (
        <>
          <p className="text-pen-red">{t("auth.resetNoSession")}</p>
          <Link href="/forgot" className="inline-flex min-h-11 items-center transition-colors hover:text-indigo">
            {t("auth.forgotTitle")}
          </Link>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              {t("auth.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="field ltr-text"
              disabled={ready !== "yes"}
              required
            />
            <p className="mt-1 text-sm text-ink-faint">{t("auth.passwordHint")}</p>
          </div>
          <div aria-live="polite" className="min-h-6 text-sm">
            {error && <p className="pen-error text-pen-red">{t("auth.resetError")}</p>}
            {done && <p className="text-leaf">{t("auth.resetDone")}</p>}
          </div>
          <TagButton type="submit" loading={loading} disabled={ready !== "yes" || done} className="w-full">
            {t("auth.resetSave")}
          </TagButton>
        </>
      )}
    </form>
  );
}
