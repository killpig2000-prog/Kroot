// Circular progress: a track ring with a teal (or green when complete) arc,
// content centred inside. Used on situation cards and the situation hero.
export default function ProgressRing({
  value,
  max,
  size = 40,
  stroke = 4,
  trackClassName = "stroke-line",
  children,
  className = "",
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  /** Tailwind stroke class for the background ring. */
  trackClassName?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const done = max > 0 && value >= max;
  return (
    <span
      className={`relative inline-block flex-none ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClassName} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className={`transition-[stroke-dashoffset] duration-500 ${done ? "stroke-success" : "stroke-teal"}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  );
}
