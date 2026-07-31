"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity, verdictFor, type Verdict } from "@/lib/speech-match";
import { promptsFor, topicIcon, topicLabel } from "@/lib/speaking";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

const MINUTES_PER_SESSION = 5;

const BTN_ROSE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors";
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A1A1AA] mb-2";

const VERDICTS: Record<Verdict, { text: string; fg: string; bg: string; brd: string }> = {
  great: { text: "🌱 Sounds great!", fg: "#16A34A", bg: "#F0FDF4", brd: "#BBF7D0" },
  close: { text: "💧 So close — check the difference below.", fg: "#B45309", bg: "#FFFBEB", brd: "#FDE68A" },
  again: { text: "🌰 Not quite yet — give it another go.", fg: "#E11D48", bg: "#FFF1F2", brd: "#FECDD3" },
};

export default function SpeakingSession({
  level,
  userId,
}: {
  level: CefrLevel;
  // accepted for call-site symmetry with the other sessions; progress now goes
  // through the server-side RPCs, which resolve the user themselves.
  userId?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const prompts = useMemo(() => promptsFor(level), [level]);

  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState("");
  const [typedFallback, setTypedFallback] = useState(false);
  const [nailed, setNailed] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const logged = useRef(false);

  const { speak, isSpeaking, isSupported: ttsOk } = useKoreanSpeaker();
  const { isSupported: micOk, isListening, interim, error, listen, setError } = useSpeechRecognition("ko-KR");

  const prompt = prompts[index];

  const showFallback = typedFallback || !micOk;

  // reset the answer state whenever we move to a new prompt
  function resetAnswer() {
    setHeard(null);
    setTyped("");
    setError(null);
  }

  if (prompts.length === 0) {
    return (
      <div className="max-w-[680px] border border-[#E7E5E4] rounded-[14px] px-7 py-10 text-center">
        <p className="text-[15px] font-semibold mb-1.5">No prompts at {level} yet</p>
        <p className="text-sm text-[#71717A] mb-5">Try another level while we plant more here.</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {LEVEL_ORDER.filter((lv) => lv !== level).map((lv) => (
            <Link key={lv} href={`/speaking?level=${lv}`} className={BTN_LINE}>
              {lv}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  function grade(text: string) {
    const answers = [prompt.kr, ...(prompt.altAnswers ?? [])];
    const s = bestSimilarity(text, answers);
    setHeard(text);
    setScore(s);
    if (verdictFor(s) === "great") {
      setNailed((n) => (n.includes(prompt.id) ? n : [...n, prompt.id]));
      // Per-prompt record for My growth stats; harmless no-op until
      // migration 0017 creates speaking_progress.
      if (userId) {
        void supabase
          .from("speaking_progress")
          .upsert(
            { user_id: userId, prompt_key: prompt.id, best_score: Math.round(s) },
            { onConflict: "user_id,prompt_key" },
          );
      }
    }
  }

  async function logMinutesOnce() {
    if (logged.current) return;
    logged.current = true;
    const result = await recordCompletion(supabase, "speaking", MINUTES_PER_SESSION);
    if (result?.leveled_up) setLevelUp(result);
    router.refresh();
  }

  function next() {
    if (index + 1 < prompts.length) {
      setIndex(index + 1);
      resetAnswer();
    } else {
      setFinished(true);
      void logMinutesOnce();
    }
  }

  if (finished) {
    return (
      <div
        className="max-w-[680px] text-center border border-[#E7E5E4] rounded-[14px] px-7 py-10"
        style={{ animation: "fadeUp .4s ease" }}
      >
        <svg width="104" height="104" viewBox="0 0 150 160" aria-hidden="true" className="inline-block">
          <ellipse cx="75" cy="150" rx="46" ry="7" fill="#E7E5E4" />
          <path d="M75 146 C75 122 74 112 74 98" stroke="#8B7355" strokeWidth="8" strokeLinecap="round" />
          <g className="sway">
            <circle cx="75" cy="72" r="36" fill="#22C55E" />
            <circle cx="49" cy="88" r="18" fill="#4ADE80" />
            <circle cx="101" cy="88" r="18" fill="#4ADE80" />
            <circle className="blink" cx="64" cy="72" r="3.6" fill="#14532D" />
            <circle className="blink d2" cx="86" cy="72" r="3.6" fill="#14532D" />
            <path d="M66 82 Q75 90 84 82" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="58" r="5.5" fill="#FB7185" />
            <circle cx="102" cy="56" r="5.5" fill="#FACC15" />
          </g>
          <text x="114" y="54" fontSize="20">
            💬
          </text>
        </svg>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">You said it out loud!</h2>
        <p className="text-sm text-[#71717A] mb-[22px]">
          {prompts.length} prompt{prompts.length > 1 ? "s" : ""} spoken — your mouth is learning the shapes.
        </p>
        {levelUp && (
          <p className="text-sm font-semibold text-[#16A34A] mb-[22px] -mt-3">
            🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
          </p>
        )}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <div className="border border-[#E7E5E4] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-[#16A34A]">
              {nailed.length}/{prompts.length}
            </b>
            <small className="text-xs text-[#71717A]">Nailed</small>
          </div>
          <div className="border border-[#E7E5E4] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold">{level}</b>
            <small className="text-xs text-[#71717A]">Level</small>
          </div>
          <div className="border border-[#E7E5E4] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-[#16A34A]">+10 XP</b>
            <small className="text-xs text-[#71717A]">Earned</small>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 bg-[#FFF1F2] border border-[#FECDD3] rounded-full px-[18px] py-2 text-[13.5px] font-semibold text-[#E11D48] mb-6">
          💧 {MINUTES_PER_SESSION} minutes watered into your tree
        </span>
        <div className="flex justify-center gap-2.5 flex-wrap">
          <Link href="/dashboard" className={BTN_ROSE}>
            Back to garden
          </Link>
          <button
            className={BTN_LINE}
            onClick={() => {
              setIndex(0);
              setNailed([]);
              resetAnswer();
              setFinished(false);
            }}
          >
            Speak again
          </button>
        </div>
      </div>
    );
  }

  const verdict = heard !== null ? VERDICTS[verdictFor(score)] : null;

  return (
    <div>
      {/* progress dots */}
      <div className="flex gap-[7px] mb-5 flex-wrap">
        {prompts.map((p, i) => (
          <span
            key={p.id}
            className={`w-[26px] h-1.5 rounded-full transition-colors ${
              i < index ? "bg-[#E11D48]" : i === index ? "bg-[#E11D48] opacity-45" : "bg-[#E7E5E4]"
            }`}
          />
        ))}
      </div>

      <div
        key={prompt.id}
        className="max-w-[680px] border border-[#E7E5E4] rounded-[14px] p-[clamp(20px,3vw,28px)]"
        style={{ animation: "fadeUp .35s ease" }}
      >
        <div className="flex items-center justify-between mb-5 gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#E11D48] bg-[#FFF1F2] border border-[#FECDD3] rounded-full px-2.5 py-[3px]">
            {topicIcon(prompt.topic)} {topicLabel(prompt.topic)}
          </span>
          <span className="text-[12.5px] text-[#A1A1AA] font-medium">
            Prompt {index + 1} of {prompts.length}
          </span>
        </div>

        <p className={LABEL}>Say this in Korean</p>
        <p className="font-bold text-[19px] tracking-[-0.01em] leading-[1.45] mb-5">{prompt.en}</p>

        {/* model answer player */}
        <div className="flex items-center gap-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-[18px] py-3.5 mb-5">
          <button
            aria-label="Hear the model answer"
            className="w-11 h-11 rounded-full flex-none bg-[#E11D48] text-white text-[17px] flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
            onClick={() => speak(prompt.kr)}
            disabled={!ttsOk}
          >
            🔊
          </button>
          <div className="min-w-0">
            <b className="block text-[11px] font-bold tracking-[.06em] text-[#A1A1AA]">MODEL ANSWER</b>
            <p className="text-[13px] text-[#71717A]">
              {heard === null
                ? "Listen first if you'd like — then say it yourself."
                : "Compare it with what you said."}
            </p>
          </div>
          {isSpeaking && (
            <span className="ml-auto text-[12px] font-semibold text-[#E11D48] wave-on">speaking…</span>
          )}
        </div>

        {/* record */}
        {heard === null && (
          <div className="flex flex-col items-center gap-3 mb-2">
            {micOk && (
              <>
                <button
                  aria-label={isListening ? "Listening — tap to stop" : "Tap and speak"}
                  onClick={() => listen(grade)}
                  disabled={isListening}
                  className={`w-[92px] h-[92px] rounded-full text-[30px] flex items-center justify-center border-[3px] transition-all ${
                    isListening
                      ? "bg-[#E11D48] border-[#FECDD3] text-white scale-105 wave-on"
                      : "bg-[#FFF1F2] border-[#FECDD3] text-[#E11D48] hover:scale-105 hover:bg-[#FECDD3]"
                  }`}
                >
                  🎤
                </button>
                <p className="text-[13px] text-[#71717A] min-h-[20px] text-center">
                  {isListening ? (
                    <span className="kr text-[15px] text-[#18181B]">{interim || "Listening…"}</span>
                  ) : (
                    "Tap the mic and say it out loud"
                  )}
                </p>
              </>
            )}

            {error && (
              <p className="text-[12.5px] text-[#E11D48] text-center max-w-[420px]">{error}</p>
            )}

            {!showFallback ? (
              <button
                className="text-[12.5px] font-semibold text-[#71717A] hover:text-[#18181B] transition-colors"
                onClick={() => setTypedFallback(true)}
              >
                Type your answer instead
              </button>
            ) : (
              <div className="w-full max-w-[460px]">
                {!micOk && (
                  <p className="text-[12.5px] text-[#71717A] mb-2 text-center">
                    Your browser doesn&apos;t support speech recognition — type your answer instead.
                  </p>
                )}
                <textarea
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="한국어로 입력하세요…"
                  rows={2}
                  className="kr w-full resize-none rounded-[10px] border border-[#E7E5E4] bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-[#E11D48] transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <button
                    className={BTN_ROSE}
                    disabled={!typed.trim()}
                    onClick={() => grade(typed.trim())}
                  >
                    Check it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* verdict */}
        {heard !== null && verdict && (
          <div className="border-t border-[#E7E5E4] pt-[18px]" style={{ animation: "fadeUp .35s ease" }}>
            <span
              className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3 py-1.5 mb-3.5 border"
              style={{ color: verdict.fg, background: verdict.bg, borderColor: verdict.brd }}
            >
              {verdict.text}
            </span>

            <div className="grid gap-2.5 mb-4">
              <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-[10px] px-4 py-3">
                <b className="block text-[11px] font-bold tracking-[.06em] text-[#A1A1AA] mb-1">YOU SAID</b>
                <p className="kr text-[17px] font-medium">{heard}</p>
              </div>
              <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[10px] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block text-[11px] font-bold tracking-[.06em] text-[#E11D48] mb-1">
                      MODEL ANSWER
                    </b>
                    <p className="kr text-[17px] font-medium">{prompt.kr}</p>
                    {prompt.altAnswers && prompt.altAnswers.length > 0 && (
                      <p className="kr text-[13px] text-[#71717A] mt-1">
                        also fine: {prompt.altAnswers.join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    aria-label="Replay the model answer"
                    className="flex-none text-sm text-[#A1A1AA] hover:text-[#E11D48] transition-colors disabled:opacity-40"
                    onClick={() => speak(prompt.kr)}
                    disabled={!ttsOk}
                  >
                    🔁
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[12.5px] text-[#A1A1AA] font-medium">
                {Math.round(score * 100)}% match
              </span>
              <div className="flex gap-2.5">
                <button
                  className={BTN_LINE}
                  onClick={() => {
                    setHeard(null);
                    setTyped("");
                  }}
                >
                  Try again
                </button>
                <button className={BTN_ROSE} onClick={next}>
                  {index + 1 === prompts.length ? "Finish →" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
