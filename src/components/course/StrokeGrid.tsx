"use client";

import { useEffect, useState } from "react";
import { STROKE_SECONDS, getGlyphStrokes } from "@/lib/hangul-strokes";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

// Grid of glyph cards. Each card loops its stroke-order animation; tapping a
// card replays it and plays the sound.
export default function StrokeGrid({ chars }: { chars: string[] }) {
  // Bump to restart every card's CSS animation (keyed remount).
  const [cycle, setCycle] = useState(0);
  const longest = Math.max(
    ...chars.map((c) => getGlyphStrokes(c)?.strokes.length ?? 1),
  );

  useEffect(() => {
    const ms = (longest * STROKE_SECONDS + 1.6) * 1000;
    const t = setInterval(() => setCycle((c) => c + 1), ms);
    return () => clearInterval(t);
  }, [longest]);

  return (
    <div className="flex gap-3 flex-wrap">
      {chars.map((char) => {
        const glyph = getGlyphStrokes(char);
        return (
          <button
            key={char}
            onClick={() => {
              speak(char === "ㅇ" ? "이응" : char);
              setCycle((c) => c + 1);
            }}
            className="w-[104px] bg-white border-[1.5px] border-[#E7E5E4] rounded-[16px] pt-2 pb-2.5 flex flex-col items-center hover:border-[#16A34A] transition-colors"
            aria-label={`${char} stroke order`}
          >
            {glyph ? (
              <svg key={cycle} viewBox="0 0 100 100" className="w-[76px] h-[76px]">
                {glyph.strokes.map((d, i) => (
                  <path key={`g${i}`} d={d} stroke="#EDEBE8" strokeWidth={11} fill="none" strokeLinecap="round" />
                ))}
                {glyph.strokes.map((d, i) => (
                  <path
                    key={`s${i}`}
                    d={d}
                    pathLength={100}
                    className="course-stroke"
                    stroke="#16A34A"
                    strokeWidth={11}
                    fill="none"
                    strokeLinecap="round"
                    style={{ animation: `courseDraw ${STROKE_SECONDS}s ease-in-out ${i * STROKE_SECONDS}s forwards` }}
                  />
                ))}
              </svg>
            ) : (
              <span className="kr text-[52px] font-extrabold leading-[76px]">{char}</span>
            )}
            <span className="text-[12px] font-bold text-[#71717A]">
              {char}
              {glyph && <span className="text-[#A1A1AA] font-semibold"> · {glyph.sound}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
