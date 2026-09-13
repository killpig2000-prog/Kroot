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
  variant = "default",
}: {
  phrases: string[];
  className?: string;
  large?: boolean;
  /** Keep the very first phrase up this long before cycling — for a greeting
      that should be read, not glimpsed. Later phrases use the normal timing. */
  firstHoldMs?: number;
  /** Let a long line (a greeting with a long name) wrap inside ~86vw instead
      of running off a 360px phone. Callers that centre the bubble with
      left-1/2 must also give the wrapper `w-max`, or it wraps at half width. */
  wrap?: boolean;
  /** "card": the Garden card's bubble, with the tail on the left edge
      pointing back at the tree.
      "default" is the garden scenes' one-line bubble with a bottom tail. */
  variant?: "default" | "card";
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
  // The lines are written as lower-case asides; alone in a bubble they read
  // as sentences. (A no-op for scripts without case.)
  const text = current.charAt(0).toUpperCase() + current.slice(1);

  const fade = `pointer-events-none transition-all duration-500 ease-out ${
    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
  } ${className}`;

  if (variant === "card") {
    return (
      <div className={fade}>
        <div className="relative rounded-[14px] border border-line bg-cream px-3 py-[7px] shadow-[0_6px_14px_-10px_rgba(60,50,30,.35)] whitespace-nowrap">
          <span className="block text-[13.5px] font-bold leading-tight text-success-deep">{text}</span>
          <span
            aria-hidden="true"
            className="absolute left-[-6px] bottom-3 w-[10px] h-[10px] rotate-45 border-b border-l border-line bg-cream"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={fade}>
      <div
        className={`relative bg-cream shadow-[0_3px_0_var(--card-shadow)] ${
          wrap ? "text-center leading-snug max-w-[min(86vw,420px)]" : "whitespace-nowrap"
        } ${large ? "rounded-3xl px-6 py-3.5" : "rounded-2xl px-3.5 py-2"}`}
      >
        <span className={`text-deep font-semibold ${large ? "text-[17px]" : "text-[12.5px]"}`}>{text}</span>
        <span
          className={`absolute left-1/2 -translate-x-1/2 bg-cream rotate-45 ${
            large ? "-bottom-2 w-4 h-4" : "-bottom-1.5 w-3 h-3"
          }`}
        />
      </div>
    </div>
  );
}
