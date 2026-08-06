"use client";

import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { speakKorean } from "@/lib/tts";

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

  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label={`${label}: ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speakKorean(text, { rate: 0.92 });
      }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E3DDD0] bg-white text-[13px] transition-all hover:border-[#DB2777] hover:bg-[#FDF2F8] hover:scale-110 ${className}`}
    >
      🔊
    </button>
  );
}
