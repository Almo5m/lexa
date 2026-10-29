"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { TagButton } from "@/components/tag-button";
import { shrinkImage } from "@/lib/shrink-image";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

export interface AdminGrammarUnit {
  id: string;
  number: number;
  topic: string;
  rule: string;
  images: { id: string; url: string }[];
}

/** One card per book unit: the explanation pictures in order, a button to add more, and move / delete on each. */
export function AdminGrammar({ units }: { units: AdminGrammarUnit[] }) {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("grammar.admin.intro")}</p>
      <ul className="space-y-4">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </ul>
    </div>
  );
}

function UnitCard({ unit }: { unit: AdminGrammarUnit }) {
  const { t } = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMessage(null);
    let done = 0;
    let failed: DictKey | null = null;
    try {
      for (const file of Array.from(files)) {
        const shrunk = await shrinkImage(file);
        if (!shrunk) {
          failed = "grammar.admin.unreadable";
          continue;
        }
        const form = new FormData();
        form.set("unitId", unit.id);
        form.set("file", new File([shrunk], "lesson.jpg", { type: "image/jpeg" }));
        const response = await fetch("/api/admin/grammar", { method: "PUT", body: form });
        if (response.ok) done++;
        else {
          const data = await response.json().catch(() => ({}));
          failed = data.error === "too_many" ? "grammar.admin.tooMany" : "common.error";
          if (data.error === "too_many") break;
        }
      }
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
    setMessage(failed ? t(failed) : t("grammar.admin.uploaded", { n: done }));
    router.refresh();
  }

  async function act(body: object) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/grammar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) setMessage(t("common.error"));
      router.refresh();
    } catch {
      setMessage(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="sheet space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">{t("grammar.unit", { n: unit.number })} · {unit.topic}</p>
          <h2 className="ltr-text text-lg font-bold">{unit.rule}</h2>
        </div>
        <span className="rounded-full bg-paper-deep px-3 py-1 text-sm font-semibold">
          {unit.images.length === 0 ? t("grammar.admin.builtIn") : t("grammar.admin.count", { n: unit.images.length })}
        </span>
      </div>

      {unit.images.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {unit.images.map((image, index) => (
            <li key={image.id} className="space-y-2 rounded-2xl border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={t("grammar.imageAlt", { n: index + 1 })} loading="lazy" className="aspect-[3/4] w-full rounded-xl bg-paper-deep object-contain" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{index + 1}</span>
                <span className="flex">
                  <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={busy || index === 0} onClick={() => void act({ action: "move", id: image.id, direction: "up" })} aria-label={t("school.admin.up")}>
                    ↑
                  </button>
                  <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={busy || index === unit.images.length - 1} onClick={() => void act({ action: "move", id: image.id, direction: "down" })} aria-label={t("school.admin.down")}>
                    ↓
                  </button>
                  <button type="button" className="min-h-11 px-2 text-pen-red disabled:opacity-40" disabled={busy} onClick={() => void act({ action: "delete", id: image.id })}>
                    {t("school.admin.deleteWord")}
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <input ref={input} id={`img-${unit.id}`} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => void upload(event.target.files)} />
        <TagButton gradient disabled={busy} onClick={() => input.current?.click()}>
          {busy ? t("grammar.admin.uploading") : t("grammar.admin.add")}
        </TagButton>
        <p className="text-xs text-ink-faint">{t("grammar.admin.hint")}</p>
        {message && <p role="status" className="text-sm font-semibold">{message}</p>}
      </div>
    </li>
  );
}
