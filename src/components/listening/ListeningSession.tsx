"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { QUIZZES, type Dialogue } from "@/lib/listening-dialogues";
import type { CefrLevel } from "@/lib/tree";

const ABC = ["A", "B", "C", "D"];

const BTN_TEAL =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors";
const Q_LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A1A1AA] mb-2";

// deterministic bar heights so SSR and client render match
const WAVE_BARS = Array.from({ length: 26 }, (_, i) => 20 + ((i * 37) % 68));

function ClipPlayer({
  dialogue,
  clipNo,
  clipCount,
  onFinished,
}: {
  dialogue: Dialogue;
  clipNo: number;
  clipCount: number;
  onFinished: (correct: boolean) => void;
}) {
  const [rate, setRate] = useState(1.0);
  const [subOn, setSubOn] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [showEn, setShowEn] = useState(false);
  const { currentIndex, isPlaying, isSupported, play, replayLine, stop } =
    useSpeechSynthesis(dialogue.lines, 0.9 * rate);

  const quiz = QUIZZES[dialogue.id];
  const answered = picked !== null;
  const correct = quiz ? picked === quiz.ans : true;
  const currentLine = currentIndex >= 0 ? dialogue.lines[currentIndex] : null;

  return (
    <div className="max-w-[680px] border border-[#E7E5E4] rounded-[14px] p-[clamp(20px,3vw,28px)] mb-3.5">
      {/* clip head */}
      <div className="flex items-center justify-between mb-4 gap-2.5 flex-wrap">
        <div className="font-semibold text-[15.5px]">
          {dialogue.title}
          <small className="block text-[12.5px] text-[#71717A] font-normal">
            {dialogue.level} · {dialogue.lines.length} lines
          </small>
        </div>
        <span className="text-[12.5px] text-[#A1A1AA] font-medium">
          Clip {clipNo} of {clipCount}
        </span>
      </div>

      {/* player row */}
      <div className="flex items-center gap-3.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-[18px] py-4 mb-2.5">
        <button
          aria-label={isPlaying ? "Stop" : "Play"}
          className="w-[52px] h-[52px] rounded-full flex-none bg-[#0D9488] text-white text-[19px] flex items-center justify-center transition-all hover:scale-105 hover:bg-[#0F766E] disabled:opacity-50"
          onClick={isPlaying ? stop : play}
          disabled={!isSupported}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className={`flex-1 flex items-center gap-[3px] h-9 min-w-[80px] ${isPlaying ? "wave-on" : ""}`}>
          {WAVE_BARS.map((h, i) => (
            <i
              key={i}
              className={`flex-1 rounded-full transition-colors duration-200 ${
                isPlaying ? "bg-[#0D9488]" : "bg-[#D6D3CC]"
              }`}
              style={{ height: `${h}%`, animationDelay: `${(i % 7) * 0.09}s` }}
            />
          ))}
        </div>
        <button
          className="flex-none border border-[#E7E5E4] bg-white rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-[#71717A] hover:border-[#A1A1AA] transition-colors"
          onClick={() => setRate((r) => (r === 1.0 ? 0.7 : 1.0))}
        >
          {rate.toFixed(1)}×
        </button>
      </div>

      {/* subtitle row */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="text-xs text-[#A1A1AA]">🎧 Listen as many times as you need.</span>
        <button
          className={`flex items-center gap-[9px] text-[13px] font-semibold transition-colors ${
            subOn ? "text-[#0D9488]" : "text-[#71717A]"
          }`}
          onClick={() => setSubOn((v) => !v)}
        >
          <span
            className={`relative w-[38px] h-[22px] rounded-full flex-none transition-colors ${
              subOn ? "bg-[#0D9488]" : "bg-[#E7E5E4]"
            }`}
          >
            <span
              className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                subOn ? "left-[19px]" : "left-[3px]"
              }`}
            />
          </span>
          Subtitles
        </button>
      </div>

      {/* live subtitle */}
      {subOn && (
        <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-[10px] px-4 py-[13px] mb-4">
          <span className="block text-[11px] font-bold tracking-[.06em] text-[#0D9488] mb-[3px]">
            CC · Korean
          </span>
          <p className="kr text-[16.5px] font-medium min-h-[26px]">
            {currentLine ? currentLine.kr : "Press play to see live subtitles."}
          </p>
        </div>
      )}

      {/* question */}
      {quiz && (
        <>
          <p className={Q_LABEL}>Question</p>
          <p className="font-bold text-[17px] tracking-[-0.01em] mb-3.5">{quiz.q}</p>
          <div className="grid gap-2.5 mb-1">
            {quiz.opts.map((opt, i) => {
              const isAns = i === quiz.ans;
              const isPicked = i === picked;
              const state = !answered ? "idle" : isAns ? "correct" : isPicked ? "wrong" : "idle";
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => setPicked(i)}
                  className={`text-left px-4 py-[13px] rounded-[10px] text-[14.5px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                    state === "correct"
                      ? "border-[#16A34A] bg-[#F0FDF4]"
                      : state === "wrong"
                      ? "border-[#DC2626] bg-[#FEF2F2]"
                      : answered
                      ? "border-[#E7E5E4] bg-white opacity-90"
                      : "border-[#E7E5E4] bg-white hover:border-[#0D9488] hover:bg-[#F0FDFA]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-[7px] flex-none flex items-center justify-center text-[11.5px] font-bold border ${
                      state === "correct"
                        ? "bg-[#16A34A] border-[#16A34A] text-white"
                        : state === "wrong"
                        ? "bg-[#DC2626] border-[#DC2626] text-white"
                        : "bg-[#FAFAF9] border-[#E7E5E4] text-[#71717A]"
                    }`}
                  >
                    {ABC[i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}

      {(answered || !quiz) && (
        <div className="border-t border-[#E7E5E4] pt-[18px] mt-[18px]" style={{ animation: "fadeUp .35s ease" }}>
          {quiz && (
            <span
              className={`inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3 py-1.5 mb-3.5 border ${
                correct
                  ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                  : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
              }`}
            >
              {correct ? "🌱 Correct! Sharp ears." : "💧 Not quite — read what you heard below."}
            </span>
          )}
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <p className={Q_LABEL} style={{ marginBottom: 0 }}>
              What you heard
            </p>
            <button
              className="text-[12.5px] font-semibold text-[#71717A] hover:text-[#18181B] transition-colors"
              onClick={() => setShowEn((v) => !v)}
            >
              {showEn ? "Hide English" : "Show English"}
            </button>
          </div>
          <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-[10px] px-4 py-3.5 mb-3 grid gap-2.5">
            {dialogue.lines.map((line, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div>
                  <b
                    className={`block text-[11px] font-bold mb-px ${
                      i === currentIndex ? "text-[#0D9488]" : "text-[#A1A1AA]"
                    }`}
                  >
                    {line.speaker}
                  </b>
                  <p
                    className={`kr text-base font-medium rounded px-1 -mx-1 transition-colors ${
                      i === currentIndex ? "bg-[#F0FDFA] text-[#0D9488]" : ""
                    }`}
                  >
                    {line.kr}
                  </p>
                  {showEn && <p className="text-[13px] text-[#71717A]">{line.en}</p>}
                </div>
                <button
                  aria-label="Replay this line"
                  className="flex-none text-sm text-[#A1A1AA] hover:text-[#0D9488] transition-colors disabled:opacity-40 mt-1"
                  onClick={() => replayLine(i)}
                  disabled={!isSupported}
                >
                  🔁
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3.5">
            <button className={BTN_TEAL} onClick={() => onFinished(correct)}>
              {clipNo === clipCount ? "Finish →" : "Next clip →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListeningSession({
  dialogues,
  level,
  situationLabel,
}: {
  dialogues: Dialogue[];
  level: CefrLevel;
  situationLabel: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [clipIndex, setClipIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [good, setGood] = useState(0);
  const [newLevel, setNewLevel] = useState<number | null>(null);

  async function completeClip(correct: boolean) {
    if (correct) setGood((g) => g + 1);
    const d = dialogues[clipIndex];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("listening_progress").upsert(
        { user_id: user.id, dialogue_id: d.id, completed_at: new Date().toISOString() },
        { onConflict: "user_id,dialogue_id" }
      );
      const res = await recordCompletion(supabase, "listening", 3);
      if (res?.leveled_up) setNewLevel(res.new_level);
    }
    if (clipIndex + 1 < dialogues.length) setClipIndex(clipIndex + 1);
    else setFinished(true);
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
            <circle cx="50" cy="58" r="5.5" fill="#FACC15" />
            <circle cx="102" cy="56" r="5.5" fill="#FB7185" />
          </g>
          <text x="116" y="54" fontSize="20">
            💧
          </text>
        </svg>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">Great listening!</h2>
        <p className="text-sm text-[#71717A] mb-[22px]">
          {dialogues.length} clip{dialogues.length > 1 ? "s" : ""} done — your ears (and your tree) grew today.
        </p>
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <div className="border border-[#E7E5E4] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-[#16A34A]">
              {good}/{dialogues.length}
            </b>
            <small className="text-xs text-[#71717A]">Correct</small>
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
        <span className="inline-flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-[18px] py-2 text-[13.5px] font-semibold text-[#16A34A] mb-6">
          💧 {situationLabel} · all clips done
        </span>
        {newLevel && (
          <p className="text-[13.5px] font-semibold text-[#16A34A] mb-6 -mt-3">
            🎉 Level up! Now Lv. {newLevel}
          </p>
        )}
        <div className="flex justify-center gap-2.5 flex-wrap">
          <Link href={`/listening?level=${level}`} className={BTN_TEAL}>
            Choose another topic
          </Link>
          <button
            className={BTN_LINE}
            onClick={() => {
              setClipIndex(0);
              setGood(0);
              setFinished(false);
            }}
          >
            Listen again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* progress dots */}
      <div className="flex gap-[7px] mb-5">
        {dialogues.map((d, i) => (
          <span
            key={d.id}
            className={`w-[26px] h-1.5 rounded-full ${
              i < clipIndex ? "bg-[#0D9488]" : i === clipIndex ? "bg-[#0D9488] opacity-45" : "bg-[#E7E5E4]"
            }`}
          />
        ))}
      </div>

      <ClipPlayer
        key={dialogues[clipIndex].id}
        dialogue={dialogues[clipIndex]}
        clipNo={clipIndex + 1}
        clipCount={dialogues.length}
        onFinished={completeClip}
      />
    </div>
  );
}
