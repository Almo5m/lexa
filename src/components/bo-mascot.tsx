import { BoRobot } from "@/components/bo-robot";
import type { BoMood } from "@/features/bo/scene";

interface BoMascotProps {
  mood: BoMood;
  size?: number;
  className?: string;
}

/** Bo the 3D robot, decorative: the text next to him always says what happened. */
export function BoMascot({ mood, size = 120, className = "" }: BoMascotProps) {
  return <BoRobot mood={mood} size={size} className={className} />;
}
