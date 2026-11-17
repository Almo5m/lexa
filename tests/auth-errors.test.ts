import { describe, expect, it } from "vitest";
import { cleanSupabaseUrl } from "@/lib/env";
import { authErrorKey } from "@/features/auth/errors";

describe("auth error messages", () => {
  it("tells a wrong key from a wrong password", () => {
    expect(authErrorKey({ message: "Invalid API key", status: 401 }, "login")).toBe("auth.errorKey");
    expect(authErrorKey({ code: "invalid_credentials", status: 400 }, "login")).toBe("auth.errorLogin");
  });
  it("spots a wrong Supabase address", () => {
    expect(authErrorKey({ status: 0, message: 'Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON' }, "signup")).toBe("auth.errorUrl");
  });
  it("names the real cause", () => {
    expect(authErrorKey({ code: "email_not_confirmed" }, "login")).toBe("auth.errorUnconfirmed");
    expect(authErrorKey({ code: "over_email_send_rate_limit", status: 429 }, "signup")).toBe("auth.errorRate");
    expect(authErrorKey({ code: "user_already_exists" }, "signup")).toBe("auth.errorExists");
    expect(authErrorKey({ code: "unexpected_failure", message: "Database error saving new user", status: 500 }, "signup")).toBe("auth.errorServer");
    expect(authErrorKey({ status: 0, message: "Failed to fetch" }, "login")).toBe("auth.errorNetwork");
  });
  it("falls back by mode", () => {
    expect(authErrorKey({}, "login")).toBe("auth.errorLogin");
    expect(authErrorKey({}, "signup")).toBe("auth.errorSignup");
  });

  it("cleans the Supabase address", () => {
    expect(cleanSupabaseUrl(" https://abc.supabase.co/rest/v1/ ")).toBe("https://abc.supabase.co");
    expect(cleanSupabaseUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co");
  });
});
