export type LexaMood = "happy" | "neutral" | "sad";

const SOURCES: Record<LexaMood, { src: string; width: number; height: number }> = {
  happy: { src: "/lexa/lexa-happy.webp", width: 560, height: 502 },
  neutral: { src: "/lexa/lexa-neutral.webp", width: 524, height: 560 },
  sad: { src: "/lexa/lexa-sad.webp", width: 514, height: 560 },
};

interface LexaMascotProps {
  mood: LexaMood;
  size?: number;
  className?: string;
}

/** Lexa the owl. Decorative: the text next to it always says what happened. */
export function LexaMascot({ mood, size = 120, className = "" }: LexaMascotProps) {
  const image = SOURCES[mood];
  return (
    <span className={`mascot ${className}`} data-mood={mood} style={{ width: size }}>
      <img src={image.src} width={image.width} height={image.height} alt="" draggable={false} />
    </span>
  );
}
