"use client";

import type { GrammarExample } from "@/lib/grammar";
import { speakKorean } from "@/lib/tts";
import TapText from "@/components/words/TapText";

function speak(text: string) {
  speakKorean(text);
}

export default function ExampleBox({
  examples,
  userId = null,
}: {
  examples: GrammarExample[];
  /** Enables tap-to-save on every Korean word (null = signed out). */
  userId?: string | null;
}) {
  return (
    <div className="bg-warm border border-line rounded-[10px] px-4 py-3.5 grid gap-3.5">
      {examples.map((ex, i) => (
        <div key={i} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kr text-[16.5px] font-medium leading-[1.5]">
              <TapText text={ex.kr} userId={userId} source="grammar" />
            </p>
            <p className="text-[12.5px] text-faint italic">{ex.romanization}</p>
            <p className="text-[13px] text-muted mt-0.5">{ex.en}</p>
          </div>
          <button
            aria-label={`Hear ${ex.kr}`}
            onClick={() => speak(ex.kr)}
            className="flex-none text-sm text-faint hover:text-[#423AC5] hover:scale-110 transition-all mt-1"
          >
            🔊
          </button>
        </div>
      ))}
    </div>
  );
}
