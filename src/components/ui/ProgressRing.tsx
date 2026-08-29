// Shared conic-gradient score ring, previously hand-rolled separately in
// PronunciationChallenge.tsx and PronunciationTrail.tsx.
interface ProgressRingProps {
  value: number;
  color: string;
  trackColor?: string;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
  className?: string;
}

export default function ProgressRing({
  value,
  color,
  trackColor = "#E3DDD0",
  size = 130,
  thickness = 25,
  children,
  className = "",
}: ProgressRingProps) {
  const innerSize = size - thickness * 2;
  return (
    <div
      className={`rounded-full flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${value * 3.6}deg, ${trackColor} 0)`,
      }}
    >
      <div
        className="rounded-full bg-cream flex flex-col items-center justify-center"
        style={{ width: innerSize, height: innerSize }}
      >
        {children}
      </div>
    </div>
  );
}
