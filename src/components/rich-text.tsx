import { parseRichText, splitLatinRuns, type Inline } from "@/features/text/rich";

interface Token {
  style: Inline["kind"];
  latin: boolean;
  text: string;
}

type Group = { latin: boolean; tokens: Token[] };

/**
 * An English sentence must read left to right as one piece, even when a word inside it is bold.
 * So English runs that touch each other (or are only separated by spaces) share one isolate.
 */
function groupTokens(inlines: Inline[]): Group[] {
  const tokens: Token[] = inlines.flatMap((part) =>
    splitLatinRuns(part.text).map((run) => ({ style: part.kind, latin: run.latin, text: run.text })),
  );
  const groups: Group[] = [];
  let pending: Token[] = [];

  const flushPending = () => {
    if (pending.length === 0) return;
    groups.push({ latin: false, tokens: pending });
    pending = [];
  };

  for (const token of tokens) {
    const last = groups[groups.length - 1];
    if (token.latin) {
      if (last?.latin) {
        last.tokens.push(...pending, token);
        pending = [];
      } else {
        flushPending();
        groups.push({ latin: true, tokens: [token] });
      }
    } else if (last?.latin && token.text.trim() === "") {
      pending.push(token);
    } else {
      flushPending();
      groups.push({ latin: false, tokens: [token] });
    }
  }
  flushPending();
  return groups;
}

function Piece({ token }: { token: Token }) {
  if (token.style === "bold") return <strong className="font-bold text-indigo">{token.text}</strong>;
  if (token.style === "italic") return <em>{token.text}</em>;
  return <>{token.text}</>;
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {groupTokens(inlines).map((group, index) =>
        group.latin ? (
          <bdi key={index} dir="ltr">
            {group.tokens.map((token, i) => (
              <Piece key={i} token={token} />
            ))}
          </bdi>
        ) : (
          <span key={index}>
            {group.tokens.map((token, i) => (
              <Piece key={i} token={token} />
            ))}
          </span>
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
