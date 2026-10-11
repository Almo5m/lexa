import { createHash } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/settings";
import { DemoRefusedError, evaluateDemoHit, isSameOrigin } from "./limits";

/** The visitor is identified by a salted hash of the IP. The raw IP is never stored. */
function visitorHash(headers: Headers): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${serverEnv.supabaseServiceKey()}`).digest("hex").slice(0, 32);
}

/** Counts this request against the visitor and the daily total, and refuses when a limit is passed. */
export async function guardDemoRequest(request: Request, settings: AppSettings): Promise<void> {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    throw new DemoRefusedError("demo_closed");
  }
  if (!settings.demoEnabled) throw new DemoRefusedError("demo_closed");

  const { data, error } = await createSupabaseAdminClient().rpc("demo_hit", {
    p_day: new Date().toISOString().slice(0, 10),
    p_visitor: visitorHash(request.headers),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const refusal = evaluateDemoHit(
    { visitorHits: Number(row?.visitor_hits ?? 0), totalHits: Number(row?.total_hits ?? 0) },
    settings,
  );
  if (refusal) throw new DemoRefusedError(refusal);
}
