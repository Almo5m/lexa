/** Bo's face as a small flat mark, for headers and anywhere a full 3D robot would be too heavy. */
export function BoMark({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bo-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9e6fb" />
        </linearGradient>
        <linearGradient id="bo-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a68ff" />
          <stop offset="1" stopColor="#2438c4" />
        </linearGradient>
      </defs>
      <rect x="29.4" y="5" width="5.2" height="9" rx="2.6" fill="#3250f0" />
      <circle cx="32" cy="6" r="4.6" fill="#ffc94a" />
      <rect x="2.5" y="26" width="8" height="16" rx="4" fill="url(#bo-ear)" />
      <rect x="53.5" y="26" width="8" height="16" rx="4" fill="url(#bo-ear)" />
      <rect x="8" y="13" width="48" height="43" rx="16" fill="url(#bo-shell)" stroke="#bcd3f2" strokeWidth="1.5" />
      <rect x="13" y="19" width="38" height="31" rx="11" fill="#10224f" />
      <rect x="20.5" y="26" width="6.2" height="11" rx="3.1" fill="#2fc4ff" />
      <rect x="37.3" y="26" width="6.2" height="11" rx="3.1" fill="#2fc4ff" />
      <path d="M26 43.5c1.8 2.4 10.2 2.4 12 0" fill="none" stroke="#2fc4ff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
