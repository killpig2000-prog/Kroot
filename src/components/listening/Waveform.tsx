import { waveHeights } from "@/lib/listening";

// Decorative per-line "waveform": each line owns a run of bars. Heard lines
// are solid teal, the line playing right now is half-strength teal, unheard
// lines stay grey. Bars pulse while audio is speaking.
export default function Waveform({
  seed,
  lineCount,
  heard,
  current = -1,
  playing = false,
  barsPerLine,
  height = 44,
  className = "",
}: {
  seed: string;
  lineCount: number;
  /** Lines heard so far (0..lineCount). */
  heard: number;
  /** Index of the line playing now, -1 when idle. */
  current?: number;
  playing?: boolean;
  barsPerLine?: number;
  height?: number;
  className?: string;
}) {
  const per = barsPerLine ?? Math.max(3, Math.min(10, Math.floor(48 / Math.max(1, lineCount))));
  const heights = waveHeights(seed, lineCount * per);
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-[2.5px] w-full ${playing ? "wave-on" : ""} ${className}`}
      style={{ height }}
    >
      {heights.map((h, i) => {
        const line = Math.floor(i / per);
        const isCur = line === current;
        const on = line < heard && !isCur;
        return (
          <i
            key={i}
            className={`flex-1 rounded-[2px] origin-center ${on ? "bg-teal" : isCur ? "bg-teal opacity-50" : "bg-line"}`}
            style={{ height: `${Math.round(h * 100)}%`, animationDelay: isCur ? `${(i % per) * 0.08}s` : undefined }}
          />
        );
      })}
    </div>
  );
}
