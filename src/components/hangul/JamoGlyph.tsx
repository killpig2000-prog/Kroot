import { anchorsFor, chaikin, strokeWidthFor, TRACE_BOX } from "@/lib/hangul-trace";

/**
 * A jamo (or composed syllable block) drawn from its trace anchors as plain
 * SVG — the same shape the learner will trace, so tiles and the letter card
 * show exactly what the paper expects. Inherits `currentColor`.
 */
export default function JamoGlyph({ char, className, width }: { char: string; className?: string; width?: number }) {
  const strokes = anchorsFor(char);
  if (strokes.length === 0) return <span className={className}>{char}</span>;
  const w = width ?? strokeWidthFor(char) + 4;
  return (
    <svg viewBox={`0 0 ${TRACE_BOX} ${TRACE_BOX}`} className={className} aria-hidden="true">
      {strokes.map((s, i) => (
        <polyline
          key={i}
          points={chaikin(s, s.circle ? 1 : 5).map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={w}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
