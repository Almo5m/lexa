interface GoalRingProps {
  done: number;
  goal: number;
  label: string;
}

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GoalRing({ done, goal, label }: GoalRingProps) {
  const ratio = goal === 0 ? 0 : Math.min(1, done / goal);
  const complete = ratio >= 1;
  return (
    <div className="sheet px-2 py-4 text-center">
      <svg viewBox="0 0 60 60" className="mx-auto h-16 w-16" role="img" aria-label={`${label}: ${done} / ${goal}`}>
        <defs>
          <linearGradient id="goal-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8256fa" />
            <stop offset="0.55" stopColor="#3d90fb" />
            <stop offset="1" stopColor="#3ac1fc" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r={RADIUS} fill="none" stroke="var(--color-paper-deep)" strokeWidth="8" />
        <circle
          cx="30"
          cy="30"
          r={RADIUS}
          fill="none"
          stroke={complete ? "#0e8a5a" : "url(#goal-grad)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          transform="rotate(-90 30 30)"
        />
      </svg>
      <p className="mt-1 text-base font-semibold">
        {Math.min(done, goal)}/{goal}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
