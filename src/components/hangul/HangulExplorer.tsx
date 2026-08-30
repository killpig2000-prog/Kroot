"use client";

import { useEffect, useState } from "react";
import { speakKorean, prefetchKorean } from "@/lib/tts";
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

const GREEN = "#3E7C59";
const SOFT = "#F0FDF4";
const BRD = "#BBF7D0";

function speak(text: string) {
  speakKorean(text);
}

const TABS = [
  { key: "consonants", label: "Consonants", kr: "자음" },
  { key: "vowels", label: "Vowels", kr: "모음" },
  { key: "syllables", label: "How syllables work", kr: "글자 만들기" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SECTION_LABEL =
  "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2.5";

function JamoTile({ jamo, selected, onSelect }: { jamo: Jamo; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={() => {
        onSelect();
        speak(jamo.char);
      }}
      aria-pressed={selected}
      aria-label={`${jamo.char} · ${jamo.rom}`}
      className={`group flex flex-col items-center rounded-[14px] border bg-cream px-1.5 pt-3 pb-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 ${
        selected ? "border-success bg-success-bg shadow-[0_0_0_3px_#DCFCE7]" : "border-line hover:border-success-line"
      }`}
    >
      <span
        className="kr flex items-center justify-center text-[34px] leading-none h-[44px] transition-transform duration-150 group-hover:scale-110"
        style={{ color: GREEN }}
      >
        {jamo.char}
      </span>
      <b className="block font-semibold text-[13px] mt-1.5 leading-tight">{jamo.rom}</b>
      <small className="kr block text-[11px] text-faint leading-tight mt-0.5">{jamo.name}</small>
    </button>
  );
}

/**
 * The letters as a tile grid — big glyphs, four across on a phone — with one
 * detail panel under the grid for whichever tile is selected, instead of a
 * full-width card per letter.
 */
function JamoGrid({ items }: { items: Jamo[] }) {
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const selected = items.find((j) => j.char === selectedChar) ?? null;
  return (
    <div className="max-w-[980px] mb-8">
      <div className="grid grid-cols-4 sm:grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2 sm:gap-2.5">
        {items.map((j) => (
          <JamoTile
            key={j.char}
            jamo={j}
            selected={j.char === selectedChar}
            onSelect={() => setSelectedChar((c) => (c === j.char ? null : j.char))}
          />
        ))}
      </div>
      {selected ? (
        <div
          key={selected.char}
          className="mt-3 border border-success-line bg-success-bg rounded-[14px] px-4 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animation: "fadeUp .3s ease" }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className="kr flex-none w-12 h-12 rounded-xl bg-cream border flex items-center justify-center text-[26px]"
              style={{ borderColor: BRD, color: GREEN }}
            >
              {selected.char}
            </span>
            <p className="text-[13px] text-muted leading-[1.55] min-w-0">
              <b className="text-charcoal">{selected.rom}</b>
              <span className="kr text-faint"> · {selected.name}</span> — {selected.hint}
            </p>
          </div>
          <button
            onClick={() => speak(selected.example.kr)}
            className="flex-none text-left bg-cream border border-line rounded-[10px] px-3.5 py-2.5 flex items-center gap-3 hover:border-success transition-colors sm:min-w-[200px]"
          >
            <span className="min-w-0">
              <b className="kr block text-[16px] font-medium">{selected.example.kr}</b>
              <small className="block text-[12px] text-faint">
                {selected.example.rom} · {selected.example.en}
              </small>
            </span>
            <span className="ml-auto flex-none text-sm text-faint">🔊</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SyllableBuilder() {
  const [cho, setCho] = useState(0);
  const [jung, setJung] = useState(0);
  const syllable = composeSyllable(cho, jung);
  const rom = `${ROM_BY_JAMO[CHO[cho]] ?? ""}${ROM_BY_JAMO[JUNG[jung]] ?? ""}`;

  return (
    <div className="max-w-[820px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)] mb-8">
      <p className={SECTION_LABEL}>Build a block</p>

      <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
        <span
          className="kr w-[72px] h-[72px] rounded-[14px] border flex items-center justify-center text-[34px]"
          style={{ background: "#FAF7EF", borderColor: "#E3DDD0" }}
        >
          {CHO[cho]}
        </span>
        <span className="text-[22px] text-faint font-light">+</span>
        <span
          className="kr w-[72px] h-[72px] rounded-[14px] border flex items-center justify-center text-[34px]"
          style={{ background: "#FAF7EF", borderColor: "#E3DDD0" }}
        >
          {JUNG[jung]}
        </span>
        <span className="text-[22px] text-faint font-light">=</span>
        <button
          onClick={() => speak(syllable)}
          className="kr w-[96px] h-[96px] rounded-[18px] border-[1.5px] flex flex-col items-center justify-center text-[42px] leading-none transition-transform duration-150 hover:scale-105"
          style={{ background: SOFT, borderColor: BRD, color: GREEN }}
          aria-label={`Hear ${syllable}`}
        >
          {syllable}
        </button>
      </div>
      <p className="text-center text-[13px] text-muted mb-6">
        <b className="text-success">{rom}</b>
      </p>

      <p className={SECTION_LABEL}>Consonant (초성)</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CHO.map((c, i) => (
          <button
            key={c}
            onClick={() => setCho(i)}
            className={`kr w-9 h-9 rounded-[9px] text-[17px] border transition-all ${
              i === cho
                ? "bg-success border-success text-white"
                : "bg-cream border-line text-muted hover:border-success hover:-translate-y-0.5"
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
                ? "bg-success border-success text-white"
                : "bg-cream border-line text-muted hover:border-success hover:-translate-y-0.5"
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
        shown ? "border-success-line bg-success-bg" : "border-line bg-cream hover:border-success"
      }`}
    >
      <b className="kr block text-[24px] font-medium mb-1.5">{kr}</b>
      {shown ? (
        <span className="block" style={{ animation: "fadeUp .3s ease" }}>
          <small className="block text-[12.5px] font-semibold text-success">{rom}</small>
          <small className="block text-[12px] text-muted">{en}</small>
        </span>
      ) : (
        <small className="block text-[12px] text-faint">tap to reveal · 🔊</small>
      )}
    </button>
  );
}

// Everything this page can speak, so the whole set can be warmed up front —
// the grid is small and every tile is a plausible first tap.
const ALL_SPOKEN = [
  ...BASIC_CONSONANTS.flatMap((j) => [j.char, j.example.kr]),
  ...DOUBLE_CONSONANTS.flatMap((j) => [j.char, j.example.kr]),
  ...BASIC_VOWELS.flatMap((j) => [j.char, j.example.kr]),
  ...COMPOUND_VOWELS.flatMap((j) => [j.char, j.example.kr]),
  ...PRACTICE_WORDS.map((w) => w.kr),
];

export default function HangulExplorer() {
  const [tab, setTab] = useState<TabKey>("consonants");

  useEffect(() => {
    prefetchKorean(ALL_SPOKEN);
  }, []);

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
                ? "bg-success border-success text-white"
                : "bg-cream border-line text-muted hover:border-faint"
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
          <JamoGrid items={DOUBLE_CONSONANTS} />
        </div>
      )}

      {tab === "vowels" && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <p className={SECTION_LABEL}>10 basic vowels · 기본 모음</p>
          <JamoGrid items={BASIC_VOWELS} />
          <p className={SECTION_LABEL}>Compound vowels · 복합 모음</p>
          <JamoGrid items={COMPOUND_VOWELS} />
        </div>
      )}

      {tab === "syllables" && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div className="max-w-[820px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)] mb-5">
            <p className={SECTION_LABEL}>The idea</p>
            <div className="flex gap-3 flex-wrap">
              {[
                { block: "가", parts: "ㄱ + ㅏ", note: "vowel on the right" },
                { block: "고", parts: "ㄱ + ㅗ", note: "vowel underneath" },
                { block: "강", parts: "ㄱ + ㅏ + ㅇ", note: "final consonant at the bottom" },
              ].map((b) => (
                <button
                  key={b.block}
                  onClick={() => speak(b.block)}
                  className="flex-1 min-w-[160px] border border-line rounded-xl px-4 py-3.5 bg-warm text-center transition-all hover:border-success hover:bg-success-bg hover:-translate-y-0.5"
                >
                  <b className="kr block text-[30px] font-medium mb-1">{b.block}</b>
                  <small className="kr block text-[13px] text-success font-semibold">{b.parts}</small>
                  <small className="block text-[11.5px] text-faint mt-0.5">{b.note}</small>
                </button>
              ))}
            </div>
          </div>

          <SyllableBuilder />

          <p className={SECTION_LABEL}>Reading practice · 읽기 연습</p>
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
