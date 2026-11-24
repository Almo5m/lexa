"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { TagButton } from "@/components/tag-button";
import { shrinkImage } from "@/lib/shrink-image";
import { useT } from "@/lib/i18n/provider";
import { LessonText } from "@/components/lesson-text";
import { LessonEditor } from "@/components/lesson-editor";
import type { LessonBlock } from "@/features/grammar/lesson-images";
import { STAGES, type Stage } from "@/features/stage/stage";
import type { DictKey } from "@/lib/i18n/dictionary";

export interface AdminLesson {
  id: string;
  /** Small line above the title, like "Unit 1 · Present perfect". */
  kicker?: string;
  title: string;
  /** English rule names read left to right. */
  ltr?: boolean;
  blocks: LessonBlock[];
}

/**
 * Grammar explanations for one stage. The third-secondary book units come first (they have drills), then any extra lessons
 * the admin adds for the stage. Every lesson is a closed row that opens to its pictures.
 */
export function AdminGrammar({ stage, book, topics }: { stage: Stage; book: AdminLesson[]; topics: AdminLesson[] }) {
  const { t } = useT();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function topicAction(body: object, done?: () => void) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/grammar-topics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        setMessage(t("common.error"));
        return;
      }
      done?.();
      router.refresh();
    } catch {
      setMessage(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-ink-soft">{t("grammar.admin.intro")}</p>

      {book.length > 0 && (
        <section className="space-y-3" aria-labelledby="book-title">
          <h2 id="book-title" className="text-lg font-bold">{t("grammar.admin.bookUnits")}</h2>
          <ul className="space-y-2">
            {book.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3" aria-labelledby="topics-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="topics-title" className="text-lg font-bold">{t("grammar.admin.extra")}</h2>
          <span className="text-sm text-ink-faint">{t("grammar.admin.extraCount", { n: topics.length })}</span>
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) void topicAction({ action: "add", stage, title }, () => setTitle(""));
          }}
        >
          <input className="field min-w-0 flex-1 sm:max-w-md" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder={t("grammar.admin.titlePlaceholder")} aria-label={t("grammar.admin.titlePlaceholder")} />
          <TagButton type="submit" disabled={busy || !title.trim()}>{t("grammar.admin.addLesson")}</TagButton>
        </form>
        {message && <p role="alert" className="pen-error">{message}</p>}
        {topics.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-ink-soft">{t("grammar.admin.noLessons")}</p>
        ) : (
          <ul className="space-y-2">
            {topics.map((lesson, index) => (
              <LessonRow key={lesson.id} lesson={lesson} topic={{ first: index === 0, last: index === topics.length - 1, stage, busy, act: topicAction }} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface TopicControls {
  first: boolean;
  last: boolean;
  stage: Stage;
  busy: boolean;
  act: (body: object, done?: () => void) => Promise<void>;
}

function LessonRow({ lesson, topic }: { lesson: AdminLesson; topic?: TopicControls }) {
  const { t } = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(lesson.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const locked = busy || Boolean(topic?.busy);

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
        form.set("unitId", lesson.id);
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
    <li>
      <details className="sheet group">
        <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="min-w-0">
            {lesson.kicker && <span className="block text-sm text-ink-soft">{lesson.kicker}</span>}
            <span className={`block font-semibold ${lesson.ltr ? "ltr-text" : ""}`}>{lesson.title}</span>
          </span>
          <span className="rounded-full bg-paper-deep px-3 py-1 text-sm font-medium text-ink-soft">
            {lesson.blocks.length === 0 ? (topic ? t("grammar.admin.noPictures") : t("grammar.admin.builtIn")) : t("grammar.admin.count", { n: lesson.blocks.length })}
          </span>
        </summary>

        <div className="space-y-4 border-t border-line p-5">
          {topic && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {renaming ? (
                <form
                  className="flex flex-1 flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (name.trim()) void topic.act({ action: "rename", id: lesson.id, title: name }, () => setRenaming(false));
                  }}
                >
                  <input className="field min-w-0 flex-1" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} aria-label={t("grammar.admin.titlePlaceholder")} />
                  <TagButton type="submit" disabled={locked}>{t("school.admin.saveWord")}</TagButton>
                  <TagButton quiet onClick={() => setRenaming(false)}>{t("common.cancel")}</TagButton>
                </form>
              ) : (
                <>
                  <button type="button" className="min-h-11 px-2 font-semibold text-indigo" onClick={() => setRenaming(true)}>{t("grammar.admin.rename")}</button>
                  <select className="field min-h-11 w-auto py-1 text-sm" value={topic.stage} disabled={locked} aria-label={t("school.admin.stage")} onChange={(e) => void topic.act({ action: "setStage", id: lesson.id, stage: e.target.value })}>
                    {STAGES.map((item) => (
                      <option key={item} value={item}>{t(`school.admin.stage.${item}` as DictKey)}</option>
                    ))}
                  </select>
                  <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={locked || topic.first} onClick={() => void topic.act({ action: "move", id: lesson.id, direction: "up" })}>{t("school.admin.up")}</button>
                  <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={locked || topic.last} onClick={() => void topic.act({ action: "move", id: lesson.id, direction: "down" })}>{t("school.admin.down")}</button>
                  <span className="flex-1" />
                  {confirmDelete ? (
                    <>
                      <span className="text-pen-red">{t("grammar.admin.deleteAsk")}</span>
                      <TagButton disabled={locked} onClick={() => void topic.act({ action: "delete", id: lesson.id })}>{t("school.admin.deleteYes")}</TagButton>
                      <TagButton quiet onClick={() => setConfirmDelete(false)}>{t("common.cancel")}</TagButton>
                    </>
                  ) : (
                    <button type="button" className="min-h-11 px-2 text-pen-red" onClick={() => setConfirmDelete(true)}>{t("grammar.admin.deleteLesson")}</button>
                  )}
                </>
              )}
            </div>
          )}

          {lesson.blocks.length > 0 && (
            <ol className="space-y-3">
              {lesson.blocks.map((block, index) => (
                <li key={block.id} className="space-y-2 rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{index + 1} · {block.kind === "image" ? t("lessonEditor.kindImage") : t("lessonEditor.kindText")}</span>
                    <span className="flex flex-wrap">
                      {block.kind === "text" && (
                        <button type="button" className="min-h-11 px-2 font-semibold text-indigo disabled:opacity-40" disabled={locked} onClick={() => setEditing(editing === block.id ? null : block.id)}>{t("grammar.admin.rename")}</button>
                      )}
                      <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={locked || index === 0} onClick={() => void act({ action: "move", id: block.id, direction: "up" })} aria-label={t("school.admin.up")}>↑</button>
                      <button type="button" className="min-h-11 px-2 text-ink-soft hover:text-indigo disabled:opacity-40" disabled={locked || index === lesson.blocks.length - 1} onClick={() => void act({ action: "move", id: block.id, direction: "down" })} aria-label={t("school.admin.down")}>↓</button>
                      <button type="button" className="min-h-11 px-2 text-pen-red disabled:opacity-40" disabled={locked} onClick={() => window.confirm(t("lessonEditor.deleteBlock")) && void act({ action: "delete", id: block.id })}>{t("school.admin.deleteWord")}</button>
                    </span>
                  </div>
                  {block.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={block.url} alt={t("grammar.imageAlt", { n: index + 1 })} loading="lazy" className="max-h-72 w-auto rounded-md bg-paper-deep object-contain" />
                  ) : editing === block.id ? (
                    <LessonEditor
                      initial={block.body}
                      busy={locked}
                      onCancel={() => setEditing(null)}
                      onSave={(body) => {
                        void act({ action: "editText", id: block.id, body }).then(() => setEditing(null));
                      }}
                    />
                  ) : (
                    <div className="max-h-56 overflow-hidden rounded-xl bg-paper p-3 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
                      <LessonText body={block.body} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}

          {editing === "new" && (
            <LessonEditor
              initial=""
              busy={locked}
              onCancel={() => setEditing(null)}
              onSave={(body) => {
                void act({ action: "addText", unitId: lesson.id, body }).then(() => setEditing(null));
              }}
            />
          )}

          <div className="space-y-2">
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => void upload(event.target.files)} aria-label={t("grammar.admin.add")} />
            <div className="flex flex-wrap gap-2">
              <TagButton disabled={locked} onClick={() => input.current?.click()}>{busy ? t("grammar.admin.uploading") : t("grammar.admin.add")}</TagButton>
              <TagButton disabled={locked || editing === "new"} onClick={() => setEditing("new")}>{t("lessonEditor.addText")}</TagButton>
            </div>
            <p className="text-xs text-ink-faint">{t("grammar.admin.hint")}</p>
            {message && <p role="status" className="text-sm font-semibold">{message}</p>}
          </div>
        </div>
      </details>
    </li>
  );
}
