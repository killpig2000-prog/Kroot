import { chaikin, STROKE_WIDTH, TRACE_ANCHORS, TRACE_BOX } from "@/lib/hangul-trace";

/**
 * A jamo drawn from its trace anchors as plain SVG — the same shape the
 * learner will trace, so tiles and the letter card show exactly what the
 * canvas expects. Inherits `currentColor`.
 */
export default function JamoGlyph({ char, className, width = STROKE_WIDTH + 4 }: { char: string; className?: string; width?: number }) {
  const strokes = TRACE_ANCHORS[char];
  if (!strokes) return <span className={className}>{char}</span>;
  return (
    <svg viewBox={`0 0 ${TRACE_BOX} ${TRACE_BOX}`} className={className} aria-hidden="true">
      {strokes.map((s, i) => (
        <polyline
          key={i}
          points={chaikin(s, s.circle ? 1 : 5).map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
