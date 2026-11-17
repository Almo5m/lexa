import type { DictKey } from "@/lib/i18n/dictionary";

interface AuthLike {
  code?: string;
  status?: number;
  message?: string;
}

/**
 * Turns what Supabase says into the one sentence the student should read.
 * Until now every failure said "wrong email or password", which hid the real cause
 * (a wrong key on the host, an unconfirmed email, a rate limit, a broken sign-up trigger).
 */
export function authErrorKey(error: AuthLike, mode: "login" | "signup"): DictKey {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  // An HTML page came back instead of JSON: the Supabase address is not the project address.
  if (message.includes("not valid json") || message.includes("<!doctype") || message.includes("unexpected token")) return "auth.errorUrl";
  if (message.includes("invalid api key") || message.includes("apikey") || error.status === 401 && !code) return "auth.errorKey";
  if (error.status === 0 || message.includes("failed to fetch") || message.includes("network")) return "auth.errorNetwork";
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "auth.errorUnconfirmed";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error.status === 429) return "auth.errorRate";
  if (code === "user_already_exists" || message.includes("already registered")) return "auth.errorExists";
  if (code === "weak_password") return "auth.errorWeak";
  if (code === "signup_disabled") return "auth.errorSignupOff";
  if (code === "unexpected_failure" || message.includes("database error") || (error.status ?? 0) >= 500) return "auth.errorServer";
  if (code === "email_address_invalid" || code === "validation_failed") return "auth.errorSignup";
  return mode === "login" ? "auth.errorLogin" : "auth.errorSignup";
}
