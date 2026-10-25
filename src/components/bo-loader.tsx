import { BoMark } from "@/components/bo-mark";

interface BoLoaderProps {
  size?: number;
  label: string;
  className?: string;
}

/** Waiting screen: Bo bobs while three dots light up one after the other. */
export function BoLoader({ size = 160, label, className = "" }: BoLoaderProps) {
  return (
    <span role="status" aria-live="polite" className={`bo-loader ${className}`}>
      <BoMark size={Math.round(size * 0.62)} className="bo-loader-mark" />
      <span className="dots text-indigo" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
