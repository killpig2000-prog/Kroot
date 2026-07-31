"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { MINUTES_PER_PROMPT, MIN_RESPONSE_LENGTH, type Prompt } from "@/lib/writing";
import LevelCreature from "@/components/dashboard/LevelCreature";
import SpeechBubble from "@/components/ui/SpeechBubble";
import type { CefrLevel } from "@/lib/tree";

type Phase = "write" | "grading" | "compare";

type GradeResult = {
  score: number;
  feedback_en: string;
  corrected_kr: string;
};

const CARD = "border border-[#E7E5E4] rounded-[14px] bg-white max-w-[900px]";
const LABEL = "text-[11.5px] font-semibold tracking-[.1em] uppercase text-[#A1A1AA]";
const BTN_INK =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-[#18181B] hover:bg-[#3F3F46] transition-colors disabled:bg-[#E7E5E4] disabled:text-[#A1A1AA]";
const BTN_AMBER =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-[#18181B] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors disabled:opacity-60";

function reactionFor(score: number) {
  if (score >= 90)
    return {
      anim: "cheer-wild",
      confetti: true,
      title: "Perfect!",
      verdict: "🌱 Natural! Beautifully written.",
      good: true,
      phrases: [
        { kr: "대박!! 천재예요!!", en: "you're a genius!!" },
        { kr: "완벽해요!!", en: "perfect!!" },
        { kr: "우와아아!!", en: "wooow!!" },
      ],
    };
  if (score >= 80)
    return {
      anim: "cheer-wild",
      confetti: true,
      title: "Amazing!",
      verdict: "🌱 Natural! Just about perfect.",
      good: true,
      phrases: [
        { kr: "정말 잘했어요!", en: "so well done!" },
        { kr: "최고예요!", en: "you're the best!" },
        { kr: "춤이 절로 나와요~", en: "I can't stop dancing~" },
      ],
    };
  if (score >= 50)
    return {
      anim: "cheer-big",
      confetti: false,
      title: "Nice work!",
      verdict: "💧 Almost — one small fix.",
      good: false,
      phrases: [
        { kr: "잘하고 있어요!", en: "you're doing great!" },
        { kr: "조금만 더!", en: "almost there!" },
        { kr: "쑥쑥 크고 있어요", en: "you're growing fast" },
      ],
    };
  return {
    anim: "cheer-sad",
    confetti: false,
    title: "Good try!",
    verdict: "💧 Let's fix this one together.",
    good: false,
    phrases: [
      { kr: "괜찮아요!", en: "it's okay!" },
      { kr: "같이 연습해요", en: "let's practice together" },
      { kr: "다음엔 할 수 있어요!", en: "you'll get it next time!" },
    ],
  };
}

export default function WritingSession({
  prompt,
  userId,
  level,
  chapterIndex,
  hasNextChapter,
}: {
  prompt: Prompt;
  userId: string;
  level: CefrLevel;
  chapterIndex: number;
  hasNextChapter: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("write");
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const loggedMinutes = useRef(false);

  async function submit() {
    if (response.trim().length < MIN_RESPONSE_LENGTH) return;
    setSubmitting(true);

    await supabase.from("writing_progress").upsert(
      {
        user_id: userId,
        prompt_key: prompt.key,
        response_text: response.trim(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,prompt_key" }
    );

    setSubmitting(false);
    setPhase("grading");

    try {
      const res = await fetch("/api/writing/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_kr: prompt.prompt_kr,
          prompt_en: prompt.prompt_en,
          response_text: response.trim(),
          level,
        }),
      });
      if (res.ok) setGrade(await res.json());
    } catch {
      // grading is best-effort — fall through to the compare screen without it
    }
    setPhase("compare");
    await logMinutesOnce();
  }

  async function logMinutesOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;

    const result = await recordCompletion(supabase, "writing", MINUTES_PER_PROMPT);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logMinutesOnce();
    router.push(href);
    router.refresh();
  }

  if (phase === "write") {
    const ready = response.trim().length >= MIN_RESPONSE_LENGTH;

    return (
      <div className={`${CARD} overflow-hidden`}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* left page — the prompt */}
          <div className="p-[clamp(20px,3vw,32px)] flex flex-col border-b md:border-b-0 md:border-r border-dashed border-[#E7E5E4]">
            <p className={`${LABEL} mb-5`}>
              Page {chapterIndex + 1} · <b className="text-[#D97706] font-semibold">Daily life</b>
            </p>
            <p className="font-bold text-[clamp(19px,2.2vw,24px)] leading-[1.45] tracking-[-0.02em] mb-3">
              <span className="text-[#D97706]">“</span>
              {prompt.prompt_en}
              <span className="text-[#D97706]">”</span>
            </p>
            <p className="kr text-[15px] text-[#71717A] leading-[1.8] mb-auto">{prompt.prompt_kr}</p>

            <div className="border border-dashed border-[#E7E5E4] rounded-[10px] bg-[#FAFAF9] px-4 py-3.5 mt-6">
              <div className="flex items-center justify-between gap-3 text-[12.5px] font-semibold text-[#71717A]">
                <span>Stuck on a word?</span>
                <button
                  className="text-[12.5px] font-semibold text-[#D97706] hover:underline"
                  onClick={() => setShowHint((v) => !v)}
                >
                  {showHint ? "Hide hint" : "💡 Peek at a hint"}
                </button>
              </div>
              {showHint && (
                <p
                  className="kr text-[15px] text-[#D97706] mt-2 leading-[1.7]"
                  style={{ animation: "fadeUp .3s ease" }}
                >
                  {prompt.example_kr}
                </p>
              )}
            </div>
          </div>

          {/* right page — your answer */}
          <div className="p-[clamp(20px,3vw,32px)] flex flex-col">
            <p className={`${LABEL} mb-3.5`}>Your answer</p>
            <div
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent 0 31px, #F0EEEA 31px 32px)",
              }}
            >
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="한국어로 써보세요..."
                rows={5}
                spellCheck={false}
                className="kr w-full min-h-[160px] resize-none bg-transparent border-none px-0.5 text-[17px] leading-[32px] text-[#18181B] placeholder:text-[#C9C2B2] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto flex-wrap">
              <span className="text-xs text-[#A1A1AA]">
                {ready ? "Ready when you are ✍️" : "Write a little more…"}
              </span>
              <button className={BTN_INK} onClick={submit} disabled={submitting || !ready}>
                {submitting ? "Saving…" : "Check my sentence"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "grading") {
    return (
      <div className={`${CARD} px-7 py-10 text-center`} style={{ animation: "fadeUp .35s ease" }}>
        <svg viewBox="0 0 220 230" className="w-[180px] h-auto mx-auto" aria-hidden="true">
          <g className="sway">
            <LevelCreature level={level} />
          </g>
        </svg>
        <h2 className="font-bold text-[19px] tracking-[-0.02em] mt-3 mb-1.5">Reading your writing…</h2>
        <p className="text-sm text-[#71717A]">Your tree teacher is checking the grammar 🧐</p>
      </div>
    );
  }

  const reaction = grade ? reactionFor(grade.score) : null;

  return (
    <div className={`${CARD} p-[clamp(20px,3vw,32px)]`} style={{ animation: "fadeUp .4s ease" }}>
      {grade && reaction ? (
        <div className="text-center mb-6">
          <div className="relative w-[min(300px,80vw)] mx-auto pt-16">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
              <SpeechBubble phrases={reaction.phrases} large />
            </div>
            <svg viewBox="0 0 220 230" className="w-full h-auto overflow-visible" aria-hidden="true">
              {reaction.confetti && (
                <g fontSize="20">
                  <text className="confetti-pop" x="20" y="180">🎊</text>
                  <text className="confetti-pop d2" x="100" y="200">✨</text>
                  <text className="confetti-pop d3" x="180" y="180">🎉</text>
                </g>
              )}
              <g className={reaction.anim}>
                <LevelCreature level={level} />
              </g>
            </svg>
          </div>

          <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-2 mb-3">{reaction.title}</h2>

          <div className="flex justify-center gap-3 flex-wrap mb-3.5">
            <span
              className={`inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg border px-3 py-1.5 ${
                reaction.good
                  ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                  : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
              }`}
            >
              {reaction.verdict}
            </span>
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-1.5 text-[#71717A]">
              Grammar <b className="text-[#18181B] text-[15px]">{grade.score}</b> / 100
            </span>
          </div>

          <p className="text-sm text-[#71717A] max-w-[460px] mx-auto leading-[1.7]">
            {grade.feedback_en}
          </p>
        </div>
      ) : (
        <div className="text-center mb-6">
          <h2 className="font-bold text-[21px] tracking-[-0.02em] mb-1.5">Nice writing!</h2>
          <p className="text-sm text-[#71717A]">Here&apos;s one natural way to say it.</p>
        </div>
      )}

      {levelUp && (
        <p className="text-center text-sm font-semibold text-[#16A34A] mb-6 -mt-3">
          🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
        </p>
      )}

      <div className="grid gap-4 mb-6">
        <div>
          <p className={`${LABEL} mb-1.5`}>Your sentence</p>
          <p className="kr text-base leading-[1.7]">{response}</p>
        </div>
        <div>
          <p className={`${LABEL} mb-1.5`}>
            {grade ? "Natural way to say it" : "One way to say it"}
          </p>
          <p className="kr text-[17px] font-medium leading-[1.6] text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] px-4 py-3">
            {grade ? grade.corrected_kr : prompt.example_kr}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 flex-wrap border-t border-[#E7E5E4] pt-5">
        <button className={BTN_LINE} onClick={() => goTo("/dashboard")} disabled={navigating}>
          Back to Garden
        </button>
        <button className={BTN_LINE} onClick={() => goTo(`/writing?level=${level}`)} disabled={navigating}>
          {navigating ? "Saving…" : "All pages"}
        </button>
        {hasNextChapter && (
          <button
            className={BTN_AMBER}
            onClick={() => goTo(`/writing/session?chapter=${chapterIndex + 1}&level=${level}`)}
            disabled={navigating}
          >
            {navigating ? "Saving…" : "Turn the page →"}
          </button>
        )}
      </div>
    </div>
  );
}

export function WritingEmpty() {
  return (
    <div className={`${CARD} px-7 py-10 text-center`}>
      <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">No prompt here yet</h2>
      <p className="text-sm text-[#71717A] mb-6">This page hasn&apos;t been written yet.</p>
      <Link href="/writing" className={BTN_INK}>
        Back to all pages
      </Link>
    </div>
  );
}
