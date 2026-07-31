"use client";

import { useEffect, useState } from "react";

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
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label={`${label}: ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";
        utterance.rate = 0.92;
        window.speechSynthesis.speak(utterance);
      }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E7E5E4] bg-white text-[13px] transition-all hover:border-[#DB2777] hover:bg-[#FDF2F8] hover:scale-110 ${className}`}
    >
      🔊
    </button>
  );
}
