"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TagButton, ScrambleText } from "@/components/tag-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();

    if (isSignup) {
      const displayName = String(form.get("name") ?? "").trim().slice(0, 40);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      setLoading(false);
      if (signUpError) return setError(t("auth.errorSignup"));
      if (!data.session) return setNotice(t("auth.checkEmail"));
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setLoading(false);
        return setError(t("auth.errorLogin"));
      }
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="sheet mx-auto mt-10 w-full max-w-sm space-y-6 p-6" noValidate>
      <h1 className="text-2xl font-semibold">
        {isSignup ? t("auth.signupTitle") : t("auth.loginTitle")}
      </h1>

      {isSignup && (
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            {t("auth.name")}
          </label>
          <input id="name" name="name" className="field" autoComplete="name" maxLength={40} required />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          {t("auth.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="field ltr-text"
          aria-invalid={error ? true : undefined}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          {t("auth.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={8}
          className="field ltr-text"
          aria-invalid={error ? true : undefined}
          aria-describedby={isSignup ? "password-hint" : undefined}
          required
        />
        {isSignup && (
          <p id="password-hint" className="mt-1 text-sm text-ink-faint">
            {t("auth.passwordHint")}
          </p>
        )}
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {error && <p className="pen-error text-pen-red">{error}</p>}
        {notice && <p className="text-leaf">{notice}</p>}
      </div>

      <TagButton type="submit" loading={loading} className="w-full">
        {loading ? (
          <ScrambleText text={t("common.loading")} />
        ) : isSignup ? (
          t("auth.signup")
        ) : (
          t("auth.login")
        )}
      </TagButton>

      <p className="text-center text-sm">
        <Link href={isSignup ? "/login" : "/signup"} className="text-ink-soft underline underline-offset-4">
          {isSignup ? t("auth.toLogin") : t("auth.toSignup")}
        </Link>
      </p>
    </form>
  );
}
