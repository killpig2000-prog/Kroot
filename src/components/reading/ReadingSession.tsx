"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { MINUTES_PER_PASSAGE, type Passage } from "@/lib/reading";

type Phase = "read" | "quiz" | "summary";

const ABC = ["A", "B", "C", "D"];

const BTN_BLUE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors disabled:opacity-60";
const BTN_INK =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#18181B] hover:bg-[#3F3F46] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E3DDD0] hover:bg-[#FAF7EF] transition-colors disabled:opacity-60";
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C] mb-2";

// Shared translation reveal used by every genre-specific reading layout below —
// blurred placeholder until the reader taps "Show translation".
function TranslatableText({
  en,
  showTranslation,
  className = "",
}: {
  en: string;
  showTranslation: boolean;
  className?: string;
}) {
  return (
    <p
      className={`transition-all rounded ${
        showTranslation ? "text-[#6B6560]" : "text-transparent bg-[#F4F4F5] select-none"
      } ${className}`}
    >
      {en || " "}
    </p>
  );
}

export default function ReadingSession({
  passage,
  userId,
  chapterIndex,
  hasNextChapter,
  level,
}: {
  passage: Passage;
  userId: string;
  chapterIndex: number;
  hasNextChapter: boolean;
  level: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("read");
  const [showTranslation, setShowTranslation] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const loggedMinutes = useRef(false);
  // Mirrors of correct/incorrect that are safe to read inside timeouts.
  const counts = useRef({ correct: 0, incorrect: 0 });

  const question = passage.questions[qIndex];

  async function answer(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    const gotIt = optionIndex === question.answerIndex;
    if (gotIt) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    if (gotIt) counts.current.correct += 1;
    else counts.current.incorrect += 1;

    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 < passage.questions.length) {
        setQIndex((i) => i + 1);
      } else {
        setPhase("summary");
        // Save right away so the level-up line can show on the summary screen.
        void logProgressOnce();
      }
    }, 700);
  }

  async function logProgressOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;

    await supabase.from("reading_progress").upsert(
      {
        user_id: userId,
        passage_key: passage.key,
        correct_count: counts.current.correct,
        incorrect_count: counts.current.incorrect,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,passage_key" }
    );

    const result = await recordCompletion(supabase, "reading", MINUTES_PER_PASSAGE);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logProgressOnce();
    router.push(href);
    router.refresh();
  }

  if (phase === "read") {
    const genre = passage.genre;
    // Structured genres author real \n line breaks (speaker turns, sign lines,
    // steps, paragraphs) — split ONLY on those so a multi-sentence turn/step
    // doesn't get chopped mid-line. Flowing prose (diary/story/explainer/none)
    // still splits sentence-by-sentence for the book-spread layout.
    const structured = genre === "dialogue" || genre === "message" || genre === "notice" || genre === "email" || genre === "instruction" || genre === "interview";
    const krLines = (structured ? passage.body_kr.split("\n") : passage.body_kr.split(/(?<=[.!?])\s+/)).filter(Boolean);
    const enLines = (structured ? passage.body_en.split("\n") : passage.body_en.split(/(?<=[.!?])\s+/)).filter(Boolean);
    const lines = krLines.map((kr, i) => ({ kr, en: enLines[i] ?? "" }));

    const header = (
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="text-[11.5px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md px-2 py-0.5">
          Chapter {chapterIndex + 1}
        </span>
        <button
          onClick={() => setShowTranslation((s) => !s)}
          className="text-[12.5px] font-semibold text-[#6B6560] hover:text-[#18181B] transition-colors"
        >
          {showTranslation ? "Hide translation" : "Show translation"}
        </button>
      </div>
    );
    const continueButton = (
      <div className="flex justify-end mt-5">
        <button className={BTN_BLUE} onClick={() => setPhase("quiz")}>
          Answer the questions →
        </button>
      </div>
    );

    // ---------- Dialogue / Message: chat bubbles (translation beside, not below) ----------
    if (genre === "dialogue" || genre === "message") {
      const speakers: string[] = [];
      const turns = lines.map(({ kr, en }) => {
        const krIdx = kr.indexOf(":");
        const speaker = krIdx === -1 ? "" : kr.slice(0, krIdx).trim();
        const text = krIdx === -1 ? kr : kr.slice(krIdx + 1).trim();
        const enIdx = en.indexOf(":");
        const enText = enIdx === -1 ? en : en.slice(enIdx + 1).trim();
        if (speaker && !speakers.includes(speaker)) speakers.push(speaker);
        const side = speakers.indexOf(speaker) % 2 === 1 ? "right" : "left";
        return { speaker, text, enText, side };
      });

      return (
        <div className="max-w-[780px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
          {header}
          <div className="rounded-[10px] border border-[#E3DDD0] bg-[#F5F4F0] p-[clamp(16px,3vw,24px)] grid gap-4">
            {turns.map((t, i) => {
              const bubble = (
                <div className="flex flex-col flex-none max-w-[380px]" key="bubble">
                  {t.speaker && (
                    <span className={`text-[11px] font-semibold text-[#A19A8C] mb-1 px-1 ${t.side === "right" ? "text-right" : ""}`}>
                      {t.speaker}
                    </span>
                  )}
                  <div
                    className={`rounded-[14px] px-4 py-2.5 ${
                      t.side === "right"
                        ? "bg-[#2563EB] text-white rounded-tr-[4px]"
                        : "bg-white border border-[#E3DDD0] rounded-tl-[4px]"
                    }`}
                  >
                    <p className="kr text-[15px] leading-[1.6]">{t.text}</p>
                  </div>
                </div>
              );
              const translation = (
                <TranslatableText
                  key="translation"
                  en={t.enText}
                  showTranslation={showTranslation}
                  className={`text-[12.5px] flex-1 min-w-[120px] self-center ${t.side === "right" ? "text-right" : ""}`}
                />
              );
              return (
                <div key={i} className={`flex items-center gap-3 ${t.side === "right" ? "justify-end" : "justify-start"}`}>
                  {t.side === "right" ? [translation, bubble] : [bubble, translation]}
                </div>
              );
            })}
          </div>
          {continueButton}
        </div>
      );
    }

    // ---------- Notice: posted sign, bilingual side by side (common on real Korean signs) ----------
    if (genre === "notice") {
      return (
        <div className="max-w-[780px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
          {header}
          <div className="relative mx-auto max-w-[620px] -rotate-1 bg-[#FFFDF7] border-2 border-dashed border-[#E3DDD0] rounded-[8px] p-[clamp(22px,4vw,30px)] shadow-[0_2px_10px_rgba(24,20,10,.06)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xl drop-shadow-sm">📌</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <div className="grid gap-2.5 sm:text-right">
                {lines.map((line, i) => (
                  <p key={i} className={`kr leading-[1.7] ${i === 0 ? "font-bold text-[17px]" : "text-[15px]"}`}>
                    {line.kr}
                  </p>
                ))}
              </div>
              <div className="grid gap-2.5">
                {lines.map((line, i) => (
                  <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-[13px]" />
                ))}
              </div>
            </div>
          </div>
          {continueButton}
        </div>
      );
    }

    // ---------- Email: envelope card, Korean | English columns ----------
    if (genre === "email") {
      return (
        <div className="max-w-[860px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
          {header}
          <div className="rounded-[10px] border border-[#E3DDD0] overflow-hidden bg-white">
            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#EFF6FF] border-b border-[#BFDBFE]">
              <span className="text-lg flex-none">✉️</span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold text-[#6B6560] uppercase tracking-[.05em]">Subject</p>
                <p className="kr font-semibold text-[15px] truncate">{passage.title_kr}</p>
                <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[12px] truncate" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-[clamp(16px,3vw,24px)] sm:border-r border-b sm:border-b-0 border-[#E3DDD0] grid gap-3 content-start">
                {lines.map((line, i) => (
                  <p key={i} className="kr text-[15px] leading-[1.8]">
                    {line.kr}
                  </p>
                ))}
              </div>
              <div className="p-[clamp(16px,3vw,24px)] grid gap-3 content-start">
                {lines.map((line, i) => (
                  <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-[13.5px] leading-[1.9]" />
                ))}
              </div>
            </div>
          </div>
          {continueButton}
        </div>
      );
    }

    // ---------- Interview: Q&A transcript, speaker name bolded, Korean | English columns ----------
    if (genre === "interview") {
      const turns = lines.map(({ kr, en }) => {
        const krIdx = kr.indexOf(":");
        const speaker = krIdx === -1 ? "" : kr.slice(0, krIdx).trim();
        const text = krIdx === -1 ? kr : kr.slice(krIdx + 1).trim();
        const enIdx = en.indexOf(":");
        const enSpeaker = enIdx === -1 ? "" : en.slice(0, enIdx).trim();
        const enText = enIdx === -1 ? en : en.slice(enIdx + 1).trim();
        const isHost = speaker.includes("진행자") || speaker.includes("기자");
        return { speaker, text, enSpeaker, enText, isHost };
      });
      return (
        <div className="max-w-[860px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
          {header}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎙️</span>
            <h2 className="kr text-[16px] font-semibold">{passage.title_kr}</h2>
          </div>
          <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[13px] mb-4" />
          <div className="rounded-[10px] border border-[#E3DDD0] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-[clamp(14px,2.5vw,20px)] bg-white sm:border-r border-b sm:border-b-0 border-[#E3DDD0] grid gap-3">
                {turns.map((t, i) => (
                  <p key={i} className={`kr text-[15px] leading-[1.7] ${t.isHost ? "text-[#6B6560] italic" : ""}`}>
                    <b className={`not-italic font-semibold ${t.isHost ? "text-[#A19A8C]" : "text-[#2563EB]"}`}>{t.speaker}: </b>
                    {t.text}
                  </p>
                ))}
              </div>
              <div className="p-[clamp(14px,2.5vw,20px)] grid gap-3">
                {turns.map((t, i) => (
                  <p key={i} className={`text-[13.5px] leading-[1.8] transition-all ${
                    showTranslation ? (t.isHost ? "text-[#A19A8C] italic" : "text-[#6B6560]") : "text-transparent bg-[#F4F4F5] select-none rounded"
                  }`}>
                    <b className={`not-italic font-semibold ${showTranslation ? (t.isHost ? "text-[#A19A8C]" : "text-[#1D4ED8]") : ""}`}>{t.enSpeaker}: </b>
                    {t.enText}
                  </p>
                ))}
              </div>
            </div>
          </div>
          {continueButton}
        </div>
      );
    }

    // ---------- Instruction: numbered steps, Korean | English columns ----------
    if (genre === "instruction") {
      const stepLines = lines.filter((l) => /^\d+\./.test(l.kr.trim()));
      const displayLines = stepLines.length > 0 ? stepLines : lines;
      return (
        <div className="max-w-[860px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
          {header}
          <h2 className="kr text-[17px] font-semibold mb-1">{passage.title_kr}</h2>
          <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[13px] mb-4" />
          <div className="rounded-[10px] border border-[#E3DDD0] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-[clamp(14px,2.5vw,20px)] bg-white sm:border-r border-b sm:border-b-0 border-[#E3DDD0] grid gap-3">
                {displayLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-none w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[13px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="kr text-[15px] leading-[1.6] pt-0.5">{line.kr.replace(/^\d+\.\s*/, "")}</p>
                  </div>
                ))}
              </div>
              <div className="p-[clamp(14px,2.5vw,20px)] grid gap-3">
                {displayLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-none w-7 h-7 rounded-full opacity-0">{i + 1}</span>
                    <TranslatableText
                      en={line.en.replace(/^\d+\.\s*/, "")}
                      showTranslation={showTranslation}
                      className="text-[13.5px] leading-[1.7] pt-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {continueButton}
        </div>
      );
    }

    // ---------- Review: verdict card, Korean | English columns ----------
    if (genre === "review") {
      return (
        <div className="max-w-[860px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
          {header}
          <div className="relative rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] p-[clamp(18px,3.2vw,26px)]">
            <span className="absolute -top-3 left-5 bg-white border border-[#FDE68A] rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-[#92702B]">
              ⭐ Review
            </span>
            <h2 className="kr text-[16px] font-semibold mt-2.5 mb-1">{passage.title_kr}</h2>
            <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[12.5px] mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div className="grid gap-2">
                {lines.map((line, i) => (
                  <p key={i} className="kr text-[15px] leading-[1.75]">
                    {line.kr}
                  </p>
                ))}
              </div>
              <div className="grid gap-2">
                {lines.map((line, i) => (
                  <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-[13px] leading-[1.8]" />
                ))}
              </div>
            </div>
          </div>
          {continueButton}
        </div>
      );
    }

    // ---------- Default: book spread (diary / story / explainer / untagged) ----------
    return (
      <div className="max-w-[880px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <div className="rounded-[10px] border border-[#E3DDD0] overflow-hidden bg-[#FAF7EF]">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-[clamp(14px,2.5vw,22px)] bg-white sm:border-r border-b sm:border-b-0 border-[#E3DDD0]">
              <p className={LABEL}>Korean</p>
              <h2 className="kr text-[17px] font-medium mb-3">{passage.title_kr}</h2>
              {lines.map((line, i) => (
                <p key={i} className="kr text-base font-medium leading-[2] mb-1.5">
                  {line.kr}
                </p>
              ))}
            </div>
            <div className="p-[clamp(14px,2.5vw,22px)]">
              <p className={LABEL}>English</p>
              <h2 className="text-[15px] font-semibold text-[#6B6560] mb-3">{passage.title_en}</h2>
              {lines.map((line, i) => (
                <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-sm leading-[2.15] mb-1.5" />
              ))}
            </div>
          </div>
        </div>
        {continueButton}
      </div>
    );
  }

  if (phase === "quiz") {
    const pct = (qIndex / passage.questions.length) * 100;
    return (
      <div className="max-w-[680px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]">
        <div className="flex justify-between items-center mb-2.5 text-[12.5px] font-medium text-[#A19A8C]">
          <span>
            Question {qIndex + 1} of {passage.questions.length}
          </span>
          <span>{correct} correct</span>
        </div>
        <div className="h-1.5 bg-[#E3DDD0] rounded-full overflow-hidden mb-6">
          <i
            className="not-italic block h-full bg-[#2563EB] rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className={LABEL}>Question</p>
        <p className="font-bold text-[17px] tracking-[-0.01em] mb-3.5">{question.question_en}</p>

        <div className="grid gap-2.5">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.answerIndex;
            const show = selected !== null;
            const state = !show ? "idle" : isCorrect ? "correct" : i === selected ? "wrong" : "idle";
            return (
              <button
                key={opt}
                onClick={() => answer(i)}
                disabled={show}
                className={`text-left px-4 py-[13px] rounded-[10px] text-[14.5px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                  state === "correct"
                    ? "border-[#16A34A] bg-[#F0FDF4]"
                    : state === "wrong"
                    ? "border-[#DC2626] bg-[#FEF2F2]"
                    : show
                    ? "border-[#E3DDD0] bg-white opacity-90"
                    : "border-[#E3DDD0] bg-white hover:border-[#2563EB] hover:bg-[#EFF6FF]"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-[7px] flex-none flex items-center justify-center text-[11.5px] font-bold border ${
                    state === "correct"
                      ? "bg-[#16A34A] border-[#16A34A] text-white"
                      : state === "wrong"
                      ? "bg-[#DC2626] border-[#DC2626] text-white"
                      : "bg-[#FAF7EF] border-[#E3DDD0] text-[#6B6560]"
                  }`}
                >
                  {ABC[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-[680px] text-center border border-[#E3DDD0] rounded-[14px] px-7 py-10"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <svg width="104" height="104" viewBox="0 0 150 160" aria-hidden="true" className="inline-block">
        <ellipse cx="75" cy="150" rx="46" ry="7" fill="#E3DDD0" />
        <path d="M75 146 C75 122 74 112 74 98" stroke="#8B7355" strokeWidth="8" strokeLinecap="round" />
        <g className="sway">
          <circle cx="75" cy="72" r="36" fill="#22C55E" />
          <circle cx="49" cy="88" r="18" fill="#4ADE80" />
          <circle cx="101" cy="88" r="18" fill="#4ADE80" />
          <circle className="blink" cx="64" cy="72" r="3.6" fill="#14532D" />
          <circle className="blink d2" cx="86" cy="72" r="3.6" fill="#14532D" />
          <path d="M66 82 Q75 90 84 82" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="58" r="5.5" fill="#FACC15" />
          <circle cx="102" cy="56" r="5.5" fill="#FB7185" />
        </g>
        <text x="116" y="54" fontSize="20">
          📖
        </text>
      </svg>
      <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">Chapter {chapterIndex + 1} complete!</h2>
      <p className="text-sm text-[#6B6560] mb-[22px]">
        You read the whole story — your tree grew a little today.
      </p>
      {levelUp && (
        <p className="text-sm font-semibold text-[#16A34A] mb-[22px] -mt-3">
          🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
        </p>
      )}

      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <div className="border border-[#E3DDD0] rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-[#2563EB]">
            {correct}/{passage.questions.length}
          </b>
          <small className="text-xs text-[#6B6560]">Correct</small>
        </div>
        <div className="border border-[#E3DDD0] rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold">{incorrect}</b>
          <small className="text-xs text-[#6B6560]">To review</small>
        </div>
        <div className="border border-[#E3DDD0] rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-[#16A34A]">+10 XP</b>
          <small className="text-xs text-[#6B6560]">Earned</small>
        </div>
      </div>

      <div className="flex justify-center gap-2.5 flex-wrap">
        {hasNextChapter && (
          <button
            className={BTN_BLUE}
            onClick={() => goTo(`/reading/session?chapter=${chapterIndex + 1}&level=${level}`)}
            disabled={navigating}
          >
            {navigating ? "Saving…" : `Chapter ${chapterIndex + 2} →`}
          </button>
        )}
        <button
          className={hasNextChapter ? BTN_LINE : BTN_INK}
          onClick={() => goTo(`/reading?level=${level}`)}
          disabled={navigating}
        >
          {navigating ? "Saving…" : "Story map"}
        </button>
        <button className={BTN_LINE} onClick={() => goTo("/dashboard")} disabled={navigating}>
          Back to my garden
        </button>
      </div>
    </div>
  );
}

export function ReadingEmpty() {
  return (
    <div className="max-w-[680px] border border-[#E3DDD0] rounded-[14px] px-7 py-10 text-center">
      <p className="font-bold text-[17px] tracking-[-0.01em] mb-1.5">No story here yet</p>
      <p className="text-sm text-[#6B6560] mb-5">This chapter isn&apos;t written yet.</p>
      <Link href="/reading" className={BTN_INK}>
        Back to the map
      </Link>
    </div>
  );
}
