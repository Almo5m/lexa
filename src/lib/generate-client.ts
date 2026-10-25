import { fetchAi } from "@/lib/fetch-ai";
export type GenerateResult = { ok: true; generated: number } | { ok: false; error: string };

const GROUP_SIZE = 4;
const PARALLEL = 3;

/**
 * Prepares the pending cards in small groups, several groups at the same time.
 * Twelve words used to wait for three calls one after another; now they wait for about one.
 */
export async function generatePendingCards(
  total: number,
  onProgress: (done: number, total: number) => void,
): Promise<GenerateResult> {
  onProgress(0, total);
  const listing = await fetch("/api/words/generate");
  const listed = await listing.json().catch(() => ({}));
  if (!listing.ok) return { ok: false, error: listed.error ?? "server_error" };

  const ids: string[] = listed.ids ?? [];
  const groups: string[][] = [];
  for (let i = 0; i < ids.length; i += GROUP_SIZE) groups.push(ids.slice(i, i + GROUP_SIZE));

  let done = 0;
  let failure: string | null = null;
  let next = 0;

  async function worker() {
    while (failure === null && next < groups.length) {
      const group = groups[next++];
      try {
        const response = await fetchAi("/api/words/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: group }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          failure ??= data.error ?? "server_error";
          return;
        }
        done += data.generated ?? 0;
        onProgress(Math.min(done, total), total);
      } catch {
        failure ??= "server_error";
        return;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(PARALLEL, groups.length) }, worker));
  if (failure) return { ok: false, error: failure };
  return { ok: true, generated: Math.min(done, total) };
}
