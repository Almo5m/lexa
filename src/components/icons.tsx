import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Base({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      {children}
    </svg>
  );
}

/* Signature icons: rounded, with a soft blue tint inside the lines. */

export function SpeakerIcon({ playing = false, ...props }: IconProps & { playing?: boolean }) {
  return (
    <Base className="icon-speaker" data-playing={playing} {...props}>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="#785bfa" fillOpacity={0.18} />
      <path className="wave-1" d="M15.2 9.2a4 4 0 0 1 0 5.6" stroke="#785bfa" />
      <path className="wave-2" d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" stroke="#3ac1fc" />
    </Base>
  );
}

export function RevealIcon({ open = false, ...props }: IconProps & { open?: boolean }) {
  return (
    <Base {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="4" fill="#785bfa" fillOpacity={0.14} />
      {open ? (
        <path d="M8 12h8" />
      ) : (
        <>
          <path d="M8.5 12h7" strokeDasharray="0.5 3.2" stroke="#785bfa" />
          <rect x="3.5" y="6.5" width="7" height="11" rx="4" fill="#785bfa" fillOpacity={0.4} stroke="none" />
        </>
      )}
    </Base>
  );
}

export function FlameIcon({ active = false, ...props }: IconProps & { active?: boolean }) {
  return (
    <Base className="icon-flame" data-active={active} {...props}>
      <g className="flame-body">
        <path
          d="M12 3c.5 3-3.5 4.6-3.5 9a3.5 3.5 0 0 0 7 0c0-1.2-.5-2-1-2.8 2.4 1 4 3.2 4 5.8a6.5 6.5 0 0 1-13 0C5.5 8.5 10.5 7 12 3z"
          fill="#fcb945"
          fillOpacity={active ? 1 : 0.35}
          stroke="#e8870a"
        />
        <path d="M12 13c1.4 1.4 2 2.2 2 3.2a2 2 0 0 1-4 0c0-1 .6-1.8 2-3.2z" fill="#fff2cf" stroke="none" />
      </g>
    </Base>
  );
}

/* XP is a lightning bolt: energy earned from studying. */
export function XpIcon(props: IconProps) {
  return (
    <Base className="icon-x" {...props} strokeWidth={2}>
      <g className="x-body">
        <path d="M13.5 2.5L5 13.2h6l-1 8.3 8.5-10.7h-6z" fill="#ffc94a" stroke="#c98a00" />
      </g>
    </Base>
  );
}

export function WeakWordIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h12l4 4v8H4z" fill="#d63a40" fillOpacity={0.12} stroke="#d63a40" />
      <path d="M12 6l-2 4 3 2-2 4" stroke="#d63a40" />
    </Base>
  );
}

/* Supporting icons: same 2px stroke and rounded joins so they read as one family. */

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 11l8-6.5 8 6.5v8.5H4z" />
      <path d="M10 19.5v-5h4v5" />
    </Base>
  );
}

export function AddIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </Base>
  );
}

export function WordsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" />
      <path d="M9 9h6M9 13h4" />
    </Base>
  );
}

export function ReviewIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12a7 7 0 0 1 12-4.9L19 9" />
      <path d="M19 4.5V9h-4.5" />
      <path d="M19 12a7 7 0 0 1-12 4.9L5 15" />
      <path d="M5 19.5V15h4.5" />
    </Base>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5h16v11H11l-4.5 3.5V16H4z" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </Base>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </Base>
  );
}

export function BoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.2v2.4" />
      <circle cx="12" cy="2.9" r="1" fill="currentColor" stroke="none" />
      <rect x="4.5" y="6.5" width="15" height="12" rx="4.5" fill="currentColor" fillOpacity={0.14} />
      <path d="M2.8 11v3M21.2 11v3" />
      <circle cx="9.2" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M10 15.4c1.2.9 2.8.9 4 0" strokeWidth={1.8} />
    </Base>
  );
}

export function PracticeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity={0.14} />
      <path d="M10.2 8.6l5.2 3.4-5.2 3.4z" fill="currentColor" />
    </Base>
  );
}

export function PathIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 20V4" />
      <path d="M6 5h11l-2.5 3.5L17 12H6" fill="currentColor" fillOpacity={0.14} />
    </Base>
  );
}

/* Practice tiles: one icon per exercise, same line style as the rest. */

export function QuizIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.6" />
      <path d="M12 16.6h.01" />
    </Base>
  );
}

export function ReadIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" />
      <path d="M12 6.5v13" />
    </Base>
  );
}

export function TranslateIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h9M8.5 4v2M6 6c.5 3 2.5 5.5 5 6.5M11 6c-.5 3-2.5 5.5-5.5 7" />
      <path d="M12.5 20l4-9 4 9M13.9 17h5.2" />
    </Base>
  );
}

export function GrammarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 18l4.5-12L13 18M5.8 14h5.4" />
      <path d="M15 12.5l2.2 2.2L21 10" />
    </Base>
  );
}

export function WritingIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15.5 5.5l3 3L9 18l-4 1 1-4z" />
      <path d="M13.5 7.5l3 3" />
    </Base>
  );
}

export function ListenIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3.5" y="13.5" width="4" height="6" rx="1.6" />
      <rect x="16.5" y="13.5" width="4" height="6" rx="1.6" />
    </Base>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </Base>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z" />
    </Base>
  );
}
