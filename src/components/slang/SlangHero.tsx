"use client";

import SpeakButton from "./SpeakButton";
import { VibeChip } from "./SlangCard";
import type { SlangEntry } from "@/lib/slang";

// The "slang of the day" banner. The entry is chosen on the server so the
// server and client agree on which word it is.
export default function SlangHero({ entry }: { entry: SlangEntry }) {
  return (
    <div className="border border-[#FBCFE8] rounded-[14px] bg-[#FDF2F8] p-[18px] md:p-6 mb-6 max-w-[980px] flex flex-col md:flex-row gap-5 md:items-center">
      <div className="md:w-[220px] shrink-0">
        <span className="inline-block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#DB2777] mb-2">
          Slang of the day
        </span>
        <div className="flex items-center gap-2.5">
          <span className="kr text-[clamp(30px,5vw,42px)] leading-none text-[#18181B]">{entry.kr}</span>
          <SpeakButton text={entry.kr} />
        </div>
        <span className="block text-[13px] text-[#6B6560] mt-1.5">{entry.romanization}</span>
      </div>

      <div className="min-w-0 flex-1">
        <b className="block font-bold text-[17px] tracking-[-0.01em] text-[#18181B]">{entry.meaning}</b>
        <span className="block text-[12.5px] text-[#A19A8C] italic mt-0.5">
          literally &ldquo;{entry.literal}&rdquo;
        </span>
        {entry.origin && (
          <p className="text-[13px] text-[#6B6560] mt-2 leading-[1.55]">{entry.origin}</p>
        )}
        <div className="mt-3 rounded-[10px] bg-white border border-[#FBCFE8] px-3.5 py-2.5">
          <div className="flex items-start gap-2">
            <span className="kr text-[14px] flex-1">{entry.example.kr}</span>
            <SpeakButton text={entry.example.kr} className="shrink-0 w-7 h-7 text-[12px]" />
          </div>
          <span className="block text-[12.5px] text-[#6B6560] mt-0.5">{entry.example.en}</span>
        </div>
        <div className="mt-3">
          <VibeChip vibe={entry.vibe} />
        </div>
      </div>
    </div>
  );
}
