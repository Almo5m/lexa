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
      strokeWidth={2}
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

/* Signature icons: drawn from the notebook / word-tag world. */

export function SpeakerIcon({ playing = false, ...props }: IconProps & { playing?: boolean }) {
  return (
    <Base className="icon-speaker" data-playing={playing} {...props}>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" fillOpacity={0.15} />
      <path className="wave-1" d="M15.2 9.2a4 4 0 0 1 0 5.6" />
      <path className="wave-2" d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" />
    </Base>
  );
}

export function RevealIcon({ open = false, ...props }: IconProps & { open?: boolean }) {
  return (
    <Base {...props}>
      <path d="M4 7h16v10H4z" fill="currentColor" fillOpacity={0.12} />
      {open ? (
        <>
          <path d="M4 7l4 5-4 5" />
          <path d="M10 12h6" />
        </>
      ) : (
        <>
          <path d="M8 12h8" strokeDasharray="1 3" />
          <path d="M4 7h4v10H4" fill="currentColor" fillOpacity={0.3} />
        </>
      )}
    </Base>
  );
}

export function FlameIcon({ active = false, ...props }: IconProps & { active?: boolean }) {
  return (
    <Base className="icon-flame" data-active={active} {...props}>
      <path
        d="M12 3c.5 3-3.5 4.6-3.5 9a3.5 3.5 0 0 0 7 0c0-1.2-.5-2-1-2.8 2.4 1 4 3.2 4 5.8a6.5 6.5 0 0 1-13 0C5.5 8.5 10.5 7 12 3z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={0.25}
      />
    </Base>
  );
}

export function XpIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.6l1.1-6L3.4 9.4l6-.8z" fill="currentColor" fillOpacity={0.18} />
    </Base>
  );
}

export function WeakWordIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h12l4 4v8H4z" fill="currentColor" fillOpacity={0.12} />
      <path d="M12 6l-2 4 3 2-2 4" />
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
