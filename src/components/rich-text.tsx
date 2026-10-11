import { parseRichText, splitLatinRuns, type Inline } from "@/features/text/rich";

function Runs({ text }: { text: string }) {
  return (
    <>
      {splitLatinRuns(text).map((run, index) =>
        run.latin ? (
          <bdi key={index} dir="ltr">
            {run.text}
          </bdi>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </>
  );
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((part, index) =>
        part.kind === "bold" ? (
          <strong key={index} className="font-bold text-indigo">
            <Runs text={part.text} />
          </strong>
        ) : part.kind === "italic" ? (
          <em key={index}>
            <Runs text={part.text} />
          </em>
        ) : (
          <Runs key={index} text={part.text} />
        ),
      )}
    </>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {parseRichText(text).map((block, index) =>
        block.kind === "paragraph" ? (
          <p key={index} dir="auto">
            <Inlines inlines={block.inlines} />
          </p>
        ) : block.kind === "bullets" ? (
          <ul key={index} dir="auto" className="list-disc space-y-1 ps-5">
            {block.items.map((item, i) => (
              <li key={i}>
                <Inlines inlines={item} />
              </li>
            ))}
          </ul>
        ) : (
          <ol key={index} dir="auto" className="list-decimal space-y-1 ps-5">
            {block.items.map((item, i) => (
              <li key={i}>
                <Inlines inlines={item} />
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
