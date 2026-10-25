/** The strip at the top of every exercise: the words "3 of 10" and a chunky bar that fills as the student goes on. */
export function SessionProgress({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = max <= 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="space-y-2" aria-live="polite">
      <p className="text-sm font-semibold text-ink-faint">{label}</p>
      <div className="h-3.5 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className="grad-fill h-3.5 rounded-full transition-[width] duration-300" style={{ width: `${value === 0 ? 0 : Math.max(5, percent)}%` }} />
      </div>
    </div>
  );
}
