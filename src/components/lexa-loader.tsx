import type { CSSProperties } from "react";

const IMAGE = { width: 640, height: 788 };
const DISC = { cx: 312.6, cy: 567.1, radius: 156 };
const BAR_COUNT = 9;
const BAR = {
  centerRadius: DISC.radius * 0.545,
  length: DISC.radius * 0.39,
  thickness: DISC.radius * 0.21,
};
const CYCLE_SECONDS = 1.08;

// Colors read from the artwork, going clockwise from the top bar.
const BAR_COLORS = [
  "#4d75fb",
  "#2188f3",
  "#4f68fb",
  "#6975fb",
  "#6b6cfa",
  "#7f65f8",
  "#9165f9",
  "#9466f9",
  "#9d7dfa",
];

interface LexaLoaderProps {
  size?: number;
  label: string;
  className?: string;
}

export function LexaLoader({ size = 160, label, className = "" }: LexaLoaderProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`lexa-loader ${className}`}
      style={{ width: size }}
    >
      <img
        src="/lexa/loader-owl.webp"
        width={IMAGE.width}
        height={IMAGE.height}
        alt=""
        draggable={false}
      />
      <svg viewBox={`0 0 ${IMAGE.width} ${IMAGE.height}`} aria-hidden="true">
        {BAR_COLORS.map((color, index) => (
          <g
            key={color}
            transform={`translate(${DISC.cx} ${DISC.cy}) rotate(${(360 / BAR_COUNT) * index})`}
          >
            <rect
              className="lexa-bar"
              x={-BAR.thickness / 2}
              y={-(BAR.centerRadius + BAR.length / 2)}
              width={BAR.thickness}
              height={BAR.length}
              rx={BAR.thickness / 2}
              fill={color}
              style={
                {
                  "--i": index,
                  animationDelay: `${-(CYCLE_SECONDS / BAR_COUNT) * (BAR_COUNT - index)}s`,
                } as CSSProperties
              }
            />
          </g>
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
