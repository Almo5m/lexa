export type GenerateResult = { ok: true; generated: number } | { ok: false; error: string };

/** Asks the server to prepare pending cards, a few at a time, until none are left. */
export async function generatePendingCards(
  total: number,
  onProgress: (done: number, total: number) => void,
): Promise<GenerateResult> {
  let done = 0;
  onProgress(0, total);
  for (let guard = 0; guard < 80; guard++) {
    const response = await fetch("/api/words/generate", { method: "POST" });
    const data = await response.json();
    if (!response.ok) return { ok: false, error: data.error ?? "server_error" };
    done += data.generated;
    onProgress(Math.min(done, total), total);
    if (data.remaining === 0 || data.generated === 0) break;
  }
  return { ok: true, generated: Math.min(done, total) };
}
