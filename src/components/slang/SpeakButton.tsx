"use client";

import { useEffect } from "react";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { speakKorean, prefetchKorean } from "@/lib/tts";

// Small 🔊 button that reads a Korean string aloud with the Web Speech API.
// Lives on both card faces, so it stops click-through to the flip handler.
export default function SpeakButton({
  text,
  label = "Listen",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const supported = useBrowserSupport(() => "speechSynthesis" in window);

  // Warm the audio cache as soon as this button appears, so the tap plays
  // instantly instead of waiting on a cold TTS synthesis.
  useEffect(() => {
    prefetchKorean([text]);
  }, [text]);

  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label={`${label}: ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speakKorean(text, { rate: 0.92 });
      }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-line bg-cream text-[13px] transition-all hover:border-[#C13E78] hover:bg-[var(--tint-pink)] hover:scale-110 ${className}`}
    >
      🔊
    </button>
  );
}
