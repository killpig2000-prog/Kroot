"use client";

import type { Example } from "@/lib/course";
import { speakKorean } from "@/lib/tts";

function speak(text: string) {
  speakKorean(text);
}

// Example sentences in the same reading style as the grammar lesson pages.
export default function ExampleList({ items }: { items: Example[] }) {
  return (
    <div className="bg-[#FAF7EF] border border-[#E3DDD0] rounded-[10px] px-4 py-3.5 grid gap-3.5">
      {items.map((ex) => (
        <div key={ex.kr} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kr text-[16.5px] font-medium leading-[1.5]">{ex.kr}</p>
            <p className="text-[13px] text-[#6B6560] mt-0.5">{ex.en}</p>
          </div>
          <button
            aria-label={`Hear ${ex.kr}`}
            onClick={() => speak(ex.kr)}
            className="flex-none text-sm text-[#A19A8C] hover:text-[#16A34A] hover:scale-110 transition-all mt-1"
          >
            🔊
          </button>
        </div>
      ))}
    </div>
  );
}
