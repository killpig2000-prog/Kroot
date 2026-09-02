"use client";

import { useEffect, useRef, useState } from "react";
import { HANGUL_STROKES } from "@/lib/hangul-strokes";

const GREEN = "#3E7C59";
const DOT = "#E2A600";

function StrokeSvg({ strokes }: { strokes: (typeof HANGUL_STROKES)[string] }) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const paths = pathRefs.current.filter((p): p is SVGPathElement => p !== null);
    const dot = dotRef.current;

    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.transition = "none";
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      // force reflow so the transition below actually restarts each replay
      void p.getBoundingClientRect();
      const start = p.getPointAtLength(0);
      timers.push(
        setTimeout(() => {
          if (dot) {
            dot.setAttribute("cx", String(start.x));
            dot.setAttribute("cy", String(start.y));
            dot.style.opacity = "1";
          }
          p.style.transition = "stroke-dashoffset .55s cubic-bezier(.3,.6,.3,1)";
          p.style.strokeDashoffset = "0";
        }, i * 600)
      );
    });

    if (dot) {
      timers.push(setTimeout(() => { dot.style.opacity = "0"; }, (paths.length - 1) * 600 + 650));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {strokes.map((s, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d={s.d}
          transform={s.mirror ? "translate(100 0) scale(-1 1)" : undefined}
          fill="none"
          stroke={GREEN}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <circle ref={dotRef} r={3.2} fill={DOT} opacity={0} />
    </svg>
  );
}

/**
 * Animated stroke-order drawing for the character shown in the Hangul
 * detail panel — tap to replay. Only the 14 basic consonants and 10 basic
 * vowels have stroke data (see hangul-strokes.ts); anything else returns
 * null so the caller falls back to a plain glyph.
 */
export default function StrokeOrderGlyph({ char }: { char: string }) {
  const strokes = HANGUL_STROKES[char];
  const [replayKey, setReplayKey] = useState(0);

  if (!strokes) return null;

  return (
    <button
      type="button"
      onClick={() => setReplayKey((k) => k + 1)}
      aria-label="Replay stroke order"
      className="block w-full h-full"
    >
      <StrokeSvg key={replayKey} strokes={strokes} />
    </button>
  );
}
