import type { ReactNode } from "react";
import { parseBlocks, type Block, type CalloutKind, type Inline, type LessonColor, type ListNode } from "@/features/grammar/markup";
import type { LessonBlock } from "@/features/grammar/lesson-images";

const COLOR_CLASS: Record<LessonColor, string> = {
  red: "text-pen-red",
  green: "text-leaf",
  blue: "text-indigo",
  orange: "text-amber",
  purple: "text-[#7c3aed]",
  gray: "text-ink-faint",
};

const CALLOUT_STYLE: Record<CalloutKind, { box: string; icon: string }> = {
  rule: { box: "border-indigo/40 bg-indigo/8", icon: "📘" },
  tip: { box: "border-leaf/40 bg-leaf/10", icon: "💡" },
  warn: { box: "border-amber/50 bg-amber/12", icon: "⚠️" },
  example: { box: "border-cyan/40 bg-cyan/10", icon: "✏️" },
  note: { box: "border-line bg-paper-deep", icon: "📌" },
};

function inline(nodes: Inline[]): ReactNode {
  return nodes.map((node, index) => {
    switch (node.k) {
      case "text":
        return node.v;
      case "b":
        return <strong key={index}>{inline(node.c)}</strong>;
      case "i":
        return <em key={index}>{inline(node.c)}</em>;
      case "s":
        return <s key={index}>{inline(node.c)}</s>;
      case "hl":
        return <mark key={index} className="rounded bg-xp/45 px-1 text-inherit">{inline(node.c)}</mark>;
      case "code":
        return <code key={index} dir="ltr" className="rounded bg-paper-deep px-1.5 py-0.5 text-[0.95em]">{inline(node.c)}</code>;
      case "color":
        return <span key={index} className={`font-semibold ${COLOR_CLASS[node.color]}`}>{inline(node.c)}</span>;
    }
  });
}

function lines(rows: Inline[][]): ReactNode {
  return rows.map((row, index) => (
    <span key={index} className="block">
      {inline(row)}
    </span>
  ));
}

function list(node: ListNode, key?: number): ReactNode {
  const Tag = node.ordered ? "ol" : "ul";
  return (
    <Tag key={key} className={`space-y-1.5 ps-6 ${node.ordered ? "list-decimal" : "list-disc"} marker:text-indigo`}>
      {node.items.map((item, index) => (
        <li key={index} dir="auto" className="leading-8">
          {inline(item.c)}
          {item.children && <div className="mt-1.5">{list(item.children)}</div>}
        </li>
      ))}
    </Tag>
  );
}

function block(item: Block, key: number): ReactNode {
  switch (item.t) {
    case "h": {
      const style = item.level === 1 ? "text-2xl font-bold" : item.level === 2 ? "text-xl font-bold text-indigo" : "text-lg font-semibold";
      const Tag = item.level === 1 ? "h2" : item.level === 2 ? "h3" : "h4";
      return <Tag key={key} dir="auto" className={`${style} pt-2`}>{inline(item.c)}</Tag>;
    }
    case "p":
      return <p key={key} dir="auto" className="leading-8">{lines(item.lines)}</p>;
    case "list":
      return list(item, key);
    case "quote":
      return <blockquote key={key} dir="auto" className="border-s-4 border-indigo/50 bg-paper-deep/70 px-4 py-2 leading-8">{lines(item.lines)}</blockquote>;
    case "hr":
      return <hr key={key} className="border-line" />;
    case "code":
      return <pre key={key} dir="ltr" className="overflow-x-auto rounded-2xl bg-paper-deep p-4 text-sm leading-7">{item.text}</pre>;
    case "table":
      return (
        <div key={key} className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-max border-collapse text-start">
            <thead className="bg-indigo/10">
              <tr>
                {item.head.map((cell, index) => (
                  <th key={index} dir="auto" className="border-b border-line px-4 py-2.5 text-start font-bold">{inline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.rows.map((row, r) => (
                <tr key={r} className={r % 2 ? "bg-paper-deep/50" : ""}>
                  {row.map((cell, index) => (
                    <td key={index} dir="auto" className="border-t border-line px-4 py-2.5 align-top">{inline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout": {
      const style = CALLOUT_STYLE[item.kind];
      return (
        <aside key={key} className={`space-y-2 rounded-3xl border-2 p-4 ${style.box}`}>
          <p className="flex items-center gap-2 font-bold" dir="auto">
            <span aria-hidden="true">{style.icon}</span>
            {inline(item.title)}
          </p>
          <div className="space-y-3">{item.blocks.map(block)}</div>
        </aside>
      );
    }
  }
}

/** A lesson text written in the lesson format (see features/grammar/markup.ts), drawn as styled, safe elements. */
export function LessonText({ body }: { body: string }) {
  return <div className="space-y-4">{parseBlocks(body).map(block)}</div>;
}

/** The pieces of one lesson in order: pictures (tap to open full size) and formatted texts. */
export function LessonBlocks({ blocks, imageAlt, tapHint }: { blocks: LessonBlock[]; imageAlt: (n: number) => string; tapHint: string }) {
  let imageNumber = 0;
  const hasImages = blocks.some((item) => item.kind === "image");
  return (
    <section className="space-y-4">
      {blocks.map((item) => {
        if (item.kind === "text") {
          return (
            <article key={item.id} className="sheet p-5">
              <LessonText body={item.body} />
            </article>
          );
        }
        imageNumber += 1;
        return (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="sheet block overflow-hidden p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={imageAlt(imageNumber)} loading={imageNumber === 1 ? "eager" : "lazy"} className="h-auto w-full rounded-xl" />
          </a>
        );
      })}
      {hasImages && <p className="text-center text-xs text-ink-faint">{tapHint}</p>}
    </section>
  );
}
