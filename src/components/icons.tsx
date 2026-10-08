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

/* Signature icons: rounded, with a soft violet tint inside the lines. */

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

/* XP uses the X from the Lexa logo. */
export function XpIcon(props: IconProps) {
  return (
    <Base className="icon-x" {...props} strokeWidth={4.2}>
      <g className="x-body">
        <path d="M6.5 6.5l11 11" stroke="#3d90fb" />
        <path d="M17.5 6.5l-11 11" stroke="#785bfa" strokeOpacity={0.85} />
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

export function LexaIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16v11H11l-4.5 3.5V17H4z" fill="currentColor" fillOpacity={0.14} />
      <circle cx="9.5" cy="11.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11.2" r="1.1" fill="currentColor" stroke="none" />
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
