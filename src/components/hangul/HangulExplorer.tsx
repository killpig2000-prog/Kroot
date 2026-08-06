"use client";

import { useState } from "react";
import {
  BASIC_CONSONANTS,
  BASIC_VOWELS,
  CHO,
  COMPOUND_VOWELS,
  DOUBLE_CONSONANTS,
  JUNG,
  PRACTICE_WORDS,
  ROM_BY_JAMO,
  composeSyllable,
  type Jamo,
} from "@/lib/hangul";

const GREEN = "#16A34A";
const SOFT = "#F0FDF4";
const BRD = "#BBF7D0";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

const TABS = [
  { key: "consonants", label: "Consonants", kr: "자음" },
  { key: "vowels", label: "Vowels", kr: "모음" },
  { key: "syllables", label: "How syllables work", kr: "글자 만들기" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SECTION_LABEL =
  "text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C] mb-2.5";

function JamoCard({ jamo }: { jamo: Jamo }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-[14px] bg-white overflow-hidden transition-all duration-150 ${
        open ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E3DDD0] hover:border-[#BBF7D0]"
      }`}
    >
      <button
        onClick={() => {
          setOpen((v) => !v);
          speak(jamo.char);
        }}
        className="w-full text-left px-4 py-[15px] flex items-center gap-3.5 group"
      >
        <span
          className="kr flex-none w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[27px] border transition-transform duration-150 group-hover:scale-110"
          style={{ background: SOFT, borderColor: BRD, color: GREEN }}
        >
          {jamo.char}
        </span>
        <span className="min-w-0">
          <b className="block font-semibold text-[15px]">{jamo.rom}</b>
          <small className="block text-[12.5px] text-[#6B6560] kr">{jamo.name}</small>
        </span>
        <span className="ml-auto flex-none text-[15px] text-[#A19A8C] group-hover:text-[#16A34A] transition-colors">
          🔊
        </span>
      </button>

      {open && (
        <div
          className="px-4 pb-4 border-t border-[#BBF7D0] pt-3"
          style={{ animation: "fadeUp .3s ease" }}
        >
          <p className="text-[13px] text-[#6B6560] leading-[1.55] mb-3">{jamo.hint}</p>
          <button
            onClick={() => speak(jamo.example.kr)}
            className="w-full text-left bg-white border border-[#E3DDD0] rounded-[10px] px-3.5 py-2.5 flex items-center gap-3 hover:border-[#16A34A] transition-colors"
          >
            <span className="min-w-0">
              <b className="kr block text-[16px] font-medium">{jamo.example.kr}</b>
              <small className="block text-[12px] text-[#A19A8C]">
                {jamo.example.rom} · {jamo.example.en}
              </small>
            </span>
            <span className="ml-auto flex-none text-sm text-[#A19A8C]">🔊</span>
          </button>
        </div>
      )}
    </div>
  );
}

function JamoGrid({ items }: { items: Jamo[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3 max-w-[980px] mb-8">
      {items.map((j) => (
        <JamoCard key={j.char} jamo={j} />
      ))}
    </div>
  );
}

function SyllableBuilder() {
  const [cho, setCho] = useState(0);
  const [jung, setJung] = useState(0);
  const syllable = composeSyllable(cho, jung);
  const rom = `${ROM_BY_JAMO[CHO[cho]] ?? ""}${ROM_BY_JAMO[JUNG[jung]] ?? ""}`;

  return (
    <div className="max-w-[820px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)] mb-8">
      <p className={SECTION_LABEL}>Build a block</p>
      <p className="text-[13.5px] text-[#6B6560] leading-[1.6] mb-5">
        Every Korean syllable is a little block: a consonant plus a vowel, packed into one square.
        Pick one of each and hear what you made.
      </p>

      <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
        <span
          className="kr w-[72px] h-[72px] rounded-[14px] border flex items-center justify-center text-[34px]"
          style={{ background: "#FAF7EF", borderColor: "#E3DDD0" }}
        >
          {CHO[cho]}
        </span>
        <span className="text-[22px] text-[#A19A8C] font-light">+</span>
        <span
          className="kr w-[72px] h-[72px] rounded-[14px] border flex items-center justify-center text-[34px]"
          style={{ background: "#FAF7EF", borderColor: "#E3DDD0" }}
        >
          {JUNG[jung]}
        </span>
        <span className="text-[22px] text-[#A19A8C] font-light">=</span>
        <button
          onClick={() => speak(syllable)}
          className="kr w-[96px] h-[96px] rounded-[18px] border-[1.5px] flex flex-col items-center justify-center text-[42px] leading-none transition-transform duration-150 hover:scale-105"
          style={{ background: SOFT, borderColor: BRD, color: GREEN }}
          aria-label={`Hear ${syllable}`}
        >
          {syllable}
        </button>
      </div>
      <p className="text-center text-[13px] text-[#6B6560] mb-6">
        <b className="text-[#16A34A]">{rom}</b> · tap the green block to hear it
      </p>

      <p className={SECTION_LABEL}>Consonant (초성)</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CHO.map((c, i) => (
          <button
            key={c}
            onClick={() => setCho(i)}
            className={`kr w-9 h-9 rounded-[9px] text-[17px] border transition-all ${
              i === cho
                ? "bg-[#16A34A] border-[#16A34A] text-white"
                : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#16A34A] hover:-translate-y-0.5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className={SECTION_LABEL}>Vowel (중성)</p>
      <div className="flex flex-wrap gap-1.5">
        {JUNG.map((v, i) => (
          <button
            key={v}
            onClick={() => setJung(i)}
            className={`kr w-9 h-9 rounded-[9px] text-[17px] border transition-all ${
              i === jung
                ? "bg-[#16A34A] border-[#16A34A] text-white"
                : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#16A34A] hover:-translate-y-0.5"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function PracticeWordCard({ kr, rom, en }: { kr: string; rom: string; en: string }) {
  const [shown, setShown] = useState(false);
  return (
    <button
      onClick={() => {
        setShown(true);
        speak(kr);
      }}
      className={`border rounded-[14px] px-4 py-4 text-center transition-all duration-150 hover:-translate-y-0.5 ${
        shown ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E3DDD0] bg-white hover:border-[#16A34A]"
      }`}
    >
      <b className="kr block text-[24px] font-medium mb-1.5">{kr}</b>
      {shown ? (
        <span className="block" style={{ animation: "fadeUp .3s ease" }}>
          <small className="block text-[12.5px] font-semibold text-[#16A34A]">{rom}</small>
          <small className="block text-[12px] text-[#6B6560]">{en}</small>
        </span>
      ) : (
        <small className="block text-[12px] text-[#A19A8C]">tap to reveal · 🔊</small>
      )}
    </button>
  );
}

export default function HangulExplorer() {
  const [tab, setTab] = useState<TabKey>("consonants");

  return (
    <div>
      {/* tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
              t.key === tab
                ? "bg-[#16A34A] border-[#16A34A] text-white"
                : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
            }`}
          >
            {t.label}
            <span className="kr text-[10.5px] font-bold ml-1.5 opacity-85">{t.kr}</span>
          </button>
        ))}
      </div>

      {tab === "consonants" && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <p className={SECTION_LABEL}>14 basic consonants · 기본 자음</p>
          <JamoGrid items={BASIC_CONSONANTS} />
          <p className={SECTION_LABEL}>5 double consonants · 쌍자음</p>
          <p className="text-[13px] text-[#6B6560] max-w-[680px] leading-[1.6] mb-3.5 -mt-1">
            These are the same shapes doubled up. Say them tense and tight, with no puff of air —
            the difference is real, and Korean ears hear it immediately.
          </p>
          <JamoGrid items={DOUBLE_CONSONANTS} />
        </div>
      )}

      {tab === "vowels" && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <p className={SECTION_LABEL}>10 basic vowels · 기본 모음</p>
          <JamoGrid items={BASIC_VOWELS} />
          <p className={SECTION_LABEL}>Compound vowels · 복합 모음</p>
          <p className="text-[13px] text-[#6B6560] max-w-[680px] leading-[1.6] mb-3.5 -mt-1">
            Each of these is two basic vowels squashed together. Once you spot the parts, you can
            read them without memorising anything new.
          </p>
          <JamoGrid items={COMPOUND_VOWELS} />
        </div>
      )}

      {tab === "syllables" && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div className="max-w-[820px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)] mb-5">
            <p className={SECTION_LABEL}>The idea</p>
            <p className="text-[14px] text-[#6B6560] leading-[1.7] mb-4">
              Korean doesn&apos;t write letters in a straight line like English. It stacks them into
              square syllable blocks. A tall vowel like ㅏ sits to the{" "}
              <b className="text-[#18181B]">right</b> of the consonant; a flat vowel like ㅗ sits{" "}
              <b className="text-[#18181B]">underneath</b> it.
            </p>
            <div className="flex gap-3 flex-wrap">
              {[
                { block: "가", parts: "ㄱ + ㅏ", note: "vowel on the right" },
                { block: "고", parts: "ㄱ + ㅗ", note: "vowel underneath" },
                { block: "강", parts: "ㄱ + ㅏ + ㅇ", note: "final consonant at the bottom" },
              ].map((b) => (
                <button
                  key={b.block}
                  onClick={() => speak(b.block)}
                  className="flex-1 min-w-[160px] border border-[#E3DDD0] rounded-xl px-4 py-3.5 bg-[#FAF7EF] text-center transition-all hover:border-[#16A34A] hover:bg-[#F0FDF4] hover:-translate-y-0.5"
                >
                  <b className="kr block text-[30px] font-medium mb-1">{b.block}</b>
                  <small className="kr block text-[13px] text-[#16A34A] font-semibold">{b.parts}</small>
                  <small className="block text-[11.5px] text-[#A19A8C] mt-0.5">{b.note}</small>
                </button>
              ))}
            </div>
          </div>

          <SyllableBuilder />

          <p className={SECTION_LABEL}>Reading practice · 읽기 연습</p>
          <p className="text-[13px] text-[#6B6560] max-w-[680px] leading-[1.6] mb-3.5 -mt-1">
            Try sounding each one out before you tap. If you can read these, you can read Korean —
            the rest is vocabulary.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 max-w-[820px]">
            {PRACTICE_WORDS.map((w) => (
              <PracticeWordCard key={w.kr} {...w} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
