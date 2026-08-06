"use client";

import { useState } from "react";
import SpeakButton from "./SpeakButton";
import { VIBES, type SlangEntry } from "@/lib/slang";

const FACE =
  "absolute inset-0 flex flex-col items-center justify-center px-5 text-center [backface-visibility:hidden] rounded-[14px]";

export function VibeChip({ vibe }: { vibe: SlangEntry["vibe"] }) {
  const meta = VIBES.find((v) => v.key === vibe);
  return (
    <span className="inline-block text-[11.5px] font-semibold text-[#DB2777] bg-[#FDF2F8] border border-[#FBCFE8] rounded-full px-2.5 py-[3px]">
      {meta?.emoji} {meta?.label}
    </span>
  );
}

export default function SlangCard({ entry }: { entry: SlangEntry }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={flipped ? `Flip ${entry.kr} back` : `Reveal the meaning of ${entry.kr}`}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      className="w-full h-[210px] [perspective:1200px] block cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div
        className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* front */}
        <div className={`${FACE} border border-[#E3DDD0] bg-[#FAF7EF] transition-colors hover:bg-[#FDF2F8]`}>
          <span className="kr text-[clamp(28px,5vw,38px)] leading-tight">{entry.kr}</span>
          <span className="mt-2 text-[13px] text-[#6B6560]">{entry.romanization}</span>
          <div className="mt-4 flex items-center gap-2">
            <SpeakButton text={entry.kr} />
            <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C]">
              Tap to flip
            </span>
          </div>
        </div>

        {/* back */}
        <div
          className={`${FACE} border border-[#FBCFE8] bg-[#FDF2F8] [transform:rotateY(180deg)] justify-start pt-4 pb-4 overflow-hidden`}
        >
          <div className="flex items-center gap-2 w-full justify-center">
            <b className="kr text-[19px] text-[#DB2777]">{entry.kr}</b>
            <SpeakButton text={entry.kr} />
          </div>
          <span className="mt-1 text-[11.5px] text-[#A19A8C] italic">
            literally &ldquo;{entry.literal}&rdquo;
          </span>
          <b className="mt-1.5 font-bold text-[15px] tracking-[-0.01em] text-[#18181B] leading-snug">
            {entry.meaning}
          </b>
          <div className="mt-2.5 w-full rounded-[10px] bg-white border border-[#FBCFE8] px-3 py-2 text-left">
            <div className="flex items-start gap-1.5">
              <span className="kr text-[13px] text-[#18181B] leading-snug flex-1">{entry.example.kr}</span>
              <SpeakButton text={entry.example.kr} className="shrink-0 w-6 h-6 text-[11px]" />
            </div>
            <span className="block text-[11.5px] text-[#6B6560] mt-0.5 leading-snug">
              {entry.example.en}
            </span>
          </div>
          <div className="mt-2.5">
            <VibeChip vibe={entry.vibe} />
          </div>
        </div>
      </div>
    </div>
  );
}
