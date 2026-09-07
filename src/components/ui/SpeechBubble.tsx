"use client";

import { useEffect, useState } from "react";

const VISIBLE_MS = 3200;
const GAP_MS = 500;

export default function SpeechBubble({
  phrases,
  className = "",
  large = false,
  firstHoldMs,
  wrap = false,
}: {
  phrases: { kr: string; en: string }[];
  className?: string;
  large?: boolean;
  /** Keep the very first phrase up this long before cycling — for a greeting
      that should be read, not glimpsed. Later phrases use the normal timing. */
  firstHoldMs?: number;
  /** Let a long line (a greeting with a long name) wrap inside ~86vw instead
      of running off a 360px phone. Callers that centre the bubble with
      left-1/2 must also give the wrapper `w-max`, or it wraps at half width. */
  wrap?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [looped, setLooped] = useState(false);

  useEffect(() => {
    if (phrases.length < 2) return;
    const hold = index === 0 && !looped && firstHoldMs ? firstHoldMs : VISIBLE_MS;
    const hide = setTimeout(() => setVisible(false), hold);
    const advance = setTimeout(() => {
      setIndex((i) => (i + 1) % phrases.length);
      setLooped(true);
      setVisible(true);
    }, hold + GAP_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(advance);
    };
  }, [index, looped, firstHoldMs, phrases.length]);

  const current = phrases[index];
  if (!current) return null;

  return (
    <div
      className={`pointer-events-none transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
      } ${className}`}
    >
      <div
        className={`relative bg-cream shadow-[0_3px_0_var(--card-shadow)] ${
          wrap ? "text-center leading-snug max-w-[min(86vw,420px)]" : "whitespace-nowrap"
        } ${large ? "rounded-3xl px-6 py-3.5" : "rounded-2xl px-3.5 py-2"}`}
      >
        <span className={`kr text-deep ${large ? "text-[20px] mr-3" : "text-[13px] mr-2"}`}>
          {current.kr}
        </span>
        <span className={`text-soft font-semibold opacity-80 ${large ? "text-[14px]" : "text-[11px]"}`}>
          {current.en}
        </span>
        <span
          className={`absolute left-1/2 -translate-x-1/2 bg-cream rotate-45 ${
            large ? "-bottom-2 w-4 h-4" : "-bottom-1.5 w-3 h-3"
          }`}
        />
      </div>
    </div>
  );
}
