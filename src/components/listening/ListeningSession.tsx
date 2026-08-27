"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, awardPartialCredit } from "@/lib/activity";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { QUIZZES, type Dialogue } from "@/lib/listening-dialogues";
import type { CefrLevel } from "@/lib/tree";

const ABC = ["A", "B", "C", "D"];

const BTN_TEAL = buttonClassName("teal");
const BTN_LINE = buttonClassName("line");
const Q_LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";

// ---------------------------------------------------------------------------
// Mid-clip resume: how many lines of a dialogue have been heard, kept in
// localStorage so a refresh or detour resumes at the same line. Clip-level
// completion stays in the DB (listening_progress) as before.
// ---------------------------------------------------------------------------
function heardKey(dialogueId: string) {
  return `kroot-listen-heard:${dialogueId}`;
}

function loadHeard(dialogueId: string, lineCount: number): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(heardKey(dialogueId)) ?? 0);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), lineCount) : 0;
}

function saveHeard(dialogueId: string, heard: number) {
  try {
    window.localStorage.setItem(heardKey(dialogueId), String(heard));
  } catch {
    // storage full/blocked — resume just won't survive a reload
  }
}

function clearHeard(dialogueId: string) {
  try {
    window.localStorage.removeItem(heardKey(dialogueId));
  } catch {
    // ignore
  }
}

// How much of this dialogue's XP has already been paid out as partial
// credit for leaving mid-clip, so resuming (or finishing later) doesn't
// double-pay the same progress.
function awardedKey(dialogueId: string) {
  return `kroot-listen-xp-awarded:${dialogueId}`;
}

function loadAwardedRatio(dialogueId: string): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(awardedKey(dialogueId)) ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function saveAwardedRatio(dialogueId: string, ratio: number) {
  try {
    window.localStorage.setItem(awardedKey(dialogueId), String(ratio));
  } catch {
    // ignore
  }
}

function clearAwardedRatio(dialogueId: string) {
  try {
    window.localStorage.removeItem(awardedKey(dialogueId));
  } catch {
    // ignore
  }
}

function estMinutes(d: Dialogue) {
  return Math.max(1, Math.round(d.lines.length / 4));
}

// ---------------------------------------------------------------------------
// Player: one clip at a time. The current line sits on a "stage"; the script
// below reveals karaoke-style as lines are heard, and unheard lines stay
// masked. The quiz appears once every line has played.
// ---------------------------------------------------------------------------
function ClipPlayer({
  dialogue,
  clipNo,
  clipCount,
  initialHeard,
  onExit,
  onFinished,
}: {
  dialogue: Dialogue;
  clipNo: number;
  clipCount: number;
  initialHeard: number;
  onExit: () => void;
  onFinished: (correct: boolean) => void;
}) {
  const lines = dialogue.lines;
  const [rate, setRate] = useState(1.0);
  const [showEn, setShowEn] = useState(false);
  const [heard, setHeard] = useState(() => Math.min(initialHeard, lines.length));
  const [picked, setPicked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { currentIndex, isPlaying, isSupported, playFrom, speakOne, stop } =
    useSpeechSynthesis(lines, 0.9 * rate);

  const quiz = QUIZZES[dialogue.id];
  const answered = picked !== null;
  const correct = quiz ? picked === quiz.ans : true;
  const allHeard = heard >= lines.length;

  // A line counts as heard the moment it starts playing (adjusted during
  // render, per the React "derive state from changing values" pattern)…
  if (currentIndex + 1 > heard) setHeard(currentIndex + 1);
  // …and persisted so leaving mid-clip resumes at the right line.
  useEffect(() => {
    if (heard > 0 && heard < lines.length) saveHeard(dialogue.id, heard);
  }, [heard, lines.length, dialogue.id]);

  // The line shown on the stage: the one playing, else the last heard one.
  const stageIndex = currentIndex >= 0 ? currentIndex : Math.min(heard, lines.length) - 1;
  const stageLine = stageIndex >= 0 ? lines[stageIndex] : null;

  function handleMainButton() {
    if (isPlaying) {
      stop();
      return;
    }
    // Resume at the first unheard line; replay from the top once done.
    playFrom(allHeard ? 0 : heard);
  }

  return (
    <div className="max-w-[680px]">
      {/* header: back + title + rate */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <button
          className="text-[13px] font-semibold text-muted hover:text-charcoal transition-colors"
          onClick={() => {
            stop();
            onExit();
          }}
        >
          ← All clips
        </button>
        <button
          className="flex-none border border-line bg-white rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:border-faint transition-colors"
          onClick={() => setRate((r) => (r === 1.0 ? 0.7 : 1.0))}
        >
          {rate.toFixed(1)}×
        </button>
      </div>

      <div className="border border-line rounded-[14px] p-[clamp(20px,3vw,28px)] mb-3.5 bg-white">
        <div className="flex items-center justify-between mb-3 gap-2.5 flex-wrap">
          <div className="font-semibold text-[15.5px]">
            {dialogue.title}
            <small className="block text-[12.5px] text-muted font-normal">
              Clip {clipNo} of {clipCount} · {lines.length} lines
            </small>
          </div>
          <span className="text-[12.5px] text-faint font-medium tabular-nums">
            line {Math.min(heard, lines.length)}/{lines.length}
          </span>
        </div>

        {/* per-line progress bar */}
        <div className="flex gap-1 mb-4">
          {lines.map((_, i) => (
            <span
              key={i}
              className={`flex-1 h-[5px] rounded-full ${
                i === currentIndex
                  ? "bg-teal opacity-45"
                  : i < heard
                    ? "bg-teal"
                    : "bg-line"
              }`}
            />
          ))}
        </div>

        {/* stage */}
        <div className="border-[1.5px] border-[#99F6E4] bg-[#F0FDFA] rounded-[14px] px-5 py-5 text-center mb-4">
          <span className="block text-[11px] font-bold tracking-[.07em] uppercase text-teal">
            {stageLine ? stageLine.speaker : "Ready?"}
            {isPlaying && " · playing"}
          </span>
          <p className="kr text-[19px] font-medium min-h-[29px] mt-1.5 mb-0.5">
            {stageLine ? stageLine.kr : "Press play — lines appear as you hear them."}
          </p>
          <p className="text-[12.5px] text-muted min-h-[19px]">
            {stageLine && showEn ? stageLine.en : " "}
          </p>
          <div className="flex items-center justify-center gap-3.5 mt-3 mb-1">
            <button
              aria-label="Replay previous line"
              className="w-10 h-10 rounded-full border border-line bg-white text-[13px] text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
              onClick={() => stageIndex > 0 && speakOne(stageIndex - 1)}
              disabled={!isSupported || stageIndex <= 0}
            >
              ⏮
            </button>
            <button
              aria-label={isPlaying ? "Pause" : allHeard ? "Play again" : heard > 0 ? "Resume" : "Play"}
              className="w-[58px] h-[58px] rounded-full bg-teal text-white text-[21px] flex items-center justify-center transition-all hover:scale-105 hover:bg-[#0F766E] disabled:opacity-50"
              onClick={handleMainButton}
              disabled={!isSupported}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              aria-label="Replay this line"
              className="w-10 h-10 rounded-full border border-line bg-white text-[13px] text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
              onClick={() => stageIndex >= 0 && speakOne(stageIndex)}
              disabled={!isSupported || stageIndex < 0}
            >
              🔁
            </button>
          </div>
          {!isPlaying && heard > 0 && !allHeard && (
            <span className="text-[11.5px] font-semibold text-teal">
              ▶ resumes at line {heard + 1}
            </span>
          )}
          <div className="flex justify-center mt-1.5">
            <button
              className={`text-[12px] font-semibold transition-colors ${
                showEn ? "text-teal" : "text-faint hover:text-muted"
              }`}
              onClick={() => setShowEn((v) => !v)}
            >
              English {showEn ? "on" : "off"}
            </button>
          </div>
        </div>

        {/* karaoke script: heard lines revealed, unheard masked */}
        <div className="grid gap-1.5">
          {lines.map((line, i) => {
            const revealed = i < heard;
            const playing = i === currentIndex;
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 px-3 py-2 rounded-[10px] border transition-colors ${
                  playing
                    ? "bg-[#F0FDFA] border-[#99F6E4]"
                    : revealed
                      ? "bg-warm border-transparent"
                      : "border-transparent"
                }`}
              >
                <span
                  className={`flex-none w-5 h-5 rounded-full text-[10.5px] font-bold flex items-center justify-center mt-0.5 ${
                    playing ? "bg-teal text-white" : "bg-line text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <b
                    className={`block text-[10.5px] font-bold ${
                      playing ? "text-teal" : "text-faint"
                    }`}
                  >
                    {line.speaker}
                  </b>
                  {revealed ? (
                    <>
                      <p className="kr text-[14.5px] font-medium">{line.kr}</p>
                      {showEn && <p className="text-[12px] text-muted">{line.en}</p>}
                    </>
                  ) : (
                    <p className="text-[12px] tracking-[.2em] text-[#D6D3CC] select-none">
                      {"●".repeat(Math.min(8, Math.max(3, Math.round(line.kr.length / 4))))}
                    </p>
                  )}
                </div>
                {revealed && (
                  <button
                    aria-label="Replay this line"
                    className="flex-none text-[13px] text-faint hover:text-teal transition-colors disabled:opacity-40 mt-0.5"
                    onClick={() => speakOne(i)}
                    disabled={!isSupported}
                  >
                    🔁
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!allHeard && (
          <p className="text-[11.5px] text-faint text-center mt-3">
            Unheard lines unlock as they play — leave anytime, you&apos;ll resume right here.
          </p>
        )}

        {/* quiz, once everything has played */}
        {allHeard && quiz && (
          <div className="border-t border-line pt-[18px] mt-[18px]" style={{ animation: "fadeUp .35s ease" }}>
            <p className={Q_LABEL}>Check your ears</p>
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
                        ? "border-success bg-success-bg"
                        : state === "wrong"
                          ? "border-danger bg-danger-bg"
                          : answered
                            ? "border-line bg-white opacity-90"
                            : "border-line bg-white hover:border-teal hover:bg-[#F0FDFA]"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-[7px] flex-none flex items-center justify-center text-[11.5px] font-bold border ${
                        state === "correct"
                          ? "bg-success border-success text-white"
                          : state === "wrong"
                            ? "bg-danger border-danger text-white"
                            : "bg-warm border-line text-muted"
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
        )}

        {allHeard && (answered || !quiz) && (
          <div className="pt-4" style={{ animation: "fadeUp .35s ease" }}>
            {quiz && (
              <span
                className={`inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3 py-1.5 mb-3 border ${
                  correct
                    ? "bg-success-bg text-success border-success-line"
                    : "bg-danger-bg text-danger border-[#FECACA]"
                }`}
              >
                {correct ? "🌱 Correct! Sharp ears." : "💧 Not quite — replay the lines above."}
              </span>
            )}
            <div className="flex justify-end">
              <button
                className={BTN_TEAL}
                disabled={saving}
                onClick={() => {
                  setSaving(true);
                  onFinished(correct);
                }}
              >
                {saving ? "Saving…" : clipNo === clipCount ? "Finish →" : "Done — next clip →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session: a clip list with per-clip status (done / in progress / not started)
// and a resume banner; picking a clip opens the player above.
// ---------------------------------------------------------------------------
export default function ListeningSession({
  dialogues,
  level,
  situationLabel,
  completedIds,
}: {
  dialogues: Dialogue[];
  level: CefrLevel;
  situationLabel: string;
  completedIds: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedIds));
  const [openId, setOpenId] = useState<string | null>(null);
  const [heardMap, setHeardMap] = useState<Record<string, number>>({});
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [justFinishedAll, setJustFinishedAll] = useState(false);

  // localStorage is client-only — read the resume positions after mount
  // (async, so hydration matches the server-rendered "no resume" state).
  useEffect(() => {
    const t = setTimeout(() => {
      const map: Record<string, number> = {};
      for (const d of dialogues) {
        const h = loadHeard(d.id, d.lines.length);
        if (h > 0) map[d.id] = h;
      }
      setHeardMap(map);
    }, 0);
    return () => clearTimeout(t);
  }, [dialogues]);

  const doneCount = dialogues.filter((d) => completed.has(d.id)).length;
  const resumeTarget = dialogues.find((d) => !completed.has(d.id) && (heardMap[d.id] ?? 0) > 0);

  async function completeClip(dialogue: Dialogue) {
    const awardedRatio = loadAwardedRatio(dialogue.id);
    clearHeard(dialogue.id);
    clearAwardedRatio(dialogue.id);
    setHeardMap((m) => {
      const next = { ...m };
      delete next[dialogue.id];
      return next;
    });
    const nowDone = new Set(completed);
    nowDone.add(dialogue.id);
    setCompleted(nowDone);
    setOpenId(null);
    if (dialogues.every((d) => nowDone.has(d.id))) setJustFinishedAll(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("listening_progress").upsert(
        { user_id: user.id, dialogue_id: dialogue.id, completed_at: new Date().toISOString() },
        { onConflict: "user_id,dialogue_id" }
      );
      const res = await recordCompletion(supabase, "listening", 3, awardedRatio);
      if (res?.leveled_up) setNewLevel(res.new_level);
    }
  }

  // Left a clip before finishing it: pay out XP for the lines actually
  // heard so far, proportional to the dialogue's full reward.
  async function awardListeningPartial(dialogue: Dialogue, heard: number) {
    if (completed.has(dialogue.id) || heard <= 0) return;
    const ratio = heard / dialogue.lines.length;
    const awardedRatio = loadAwardedRatio(dialogue.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { newAwardedRatio, result } = await awardPartialCredit(
      supabase,
      "listening",
      ratio,
      awardedRatio
    );
    saveAwardedRatio(dialogue.id, newAwardedRatio);
    if (result?.leveled_up) setNewLevel(result.new_level);
  }

  const open = openId ? dialogues.find((d) => d.id === openId) : null;
  if (open) {
    return (
      <ClipPlayer
        key={open.id}
        dialogue={open}
        clipNo={dialogues.indexOf(open) + 1}
        clipCount={dialogues.length}
        initialHeard={heardMap[open.id] ?? 0}
        onExit={() => {
          const finalHeard = loadHeard(open.id, open.lines.length);
          setHeardMap((m) => ({ ...m, [open.id]: finalHeard }));
          setOpenId(null);
          void awardListeningPartial(open, finalHeard);
        }}
        onFinished={() => void completeClip(open)}
      />
    );
  }

  // all-done celebration (shown right after the last clip completes)
  if (justFinishedAll) {
    return (
      <div
        className="max-w-[680px] text-center border border-line rounded-[14px] px-7 py-10 bg-white"
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
            💧
          </text>
        </svg>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">Great listening!</h2>
        <p className="text-sm text-muted mb-5">
          {situationLabel} · all {dialogues.length} clips done at {level}. Your ears (and your tree)
          grew today.
        </p>
        {newLevel && (
          <p className="text-[13.5px] font-semibold text-success mb-5">
            🎉 Level up! Now Lv. {newLevel}
          </p>
        )}
        <div className="flex justify-center gap-2.5 flex-wrap">
          <Link href={`/listening?level=${level}`} className={BTN_TEAL}>
            Choose another topic
          </Link>
          <button className={BTN_LINE} onClick={() => setJustFinishedAll(false)}>
            Back to the clips
          </button>
        </div>
      </div>
    );
  }

  // clip list
  return (
    <div className="max-w-[680px]">
      {/* situation progress */}
      <div className="h-[7px] rounded-full bg-warm border border-line overflow-hidden mb-4">
        <div
          className="h-full bg-teal rounded-full transition-all"
          style={{ width: `${dialogues.length ? (doneCount / dialogues.length) * 100 : 0}%` }}
        />
      </div>

      {/* resume banner */}
      {resumeTarget && (
        <button
          className="w-full flex items-center gap-3 border-[1.5px] border-[#99F6E4] bg-[#F0FDFA] rounded-[13px] px-4 py-3 mb-3.5 text-left transition-all hover:-translate-y-0.5"
          onClick={() => setOpenId(resumeTarget.id)}
        >
          <span className="text-[20px] flex-none">🎧</span>
          <span className="flex-1 min-w-0">
            <b className="block text-[13.5px] font-bold text-teal">
              Continue where you left off
            </b>
            <span className="text-[12.5px] text-muted">
              {resumeTarget.title} · line {(heardMap[resumeTarget.id] ?? 0) + 1} of{" "}
              {resumeTarget.lines.length}
            </span>
          </span>
          <span className="flex-none text-[13px] font-bold text-teal">Resume ▶</span>
        </button>
      )}

      {newLevel && (
        <p className="text-[13px] font-semibold text-success mb-3">🎉 Level up! Now Lv. {newLevel}</p>
      )}

      {/* clip cards */}
      <div className="grid gap-2.5">
        {dialogues.map((d, i) => {
          const done = completed.has(d.id);
          const heard = heardMap[d.id] ?? 0;
          const inProgress = !done && heard > 0;
          return (
            <button
              key={d.id}
              onClick={() => setOpenId(d.id)}
              className={`w-full flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-left border-[1.5px] transition-all hover:border-teal hover:-translate-y-0.5 ${
                inProgress ? "border-[#99F6E4] bg-[#F0FDFA]" : "border-line bg-white"
              }`}
            >
              <span
                className={`flex-none w-[34px] h-[34px] rounded-full flex items-center justify-center text-[14px] font-extrabold ${
                  done
                    ? "bg-success-bg border-[1.5px] border-success-line text-success"
                    : inProgress
                      ? "bg-teal text-white"
                      : "bg-warm border-[1.5px] border-line text-faint"
                }`}
              >
                {done ? "✓" : inProgress ? "▶" : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <b className="block text-[14px] font-bold truncate">{d.title}</b>
                <small className="text-[11.5px] text-faint">
                  {d.lines.length} lines · ~{estMinutes(d)} min
                </small>
              </span>
              <span className="flex-none text-right text-[11.5px] text-faint">
                {done ? (
                  <span className="inline-block rounded-full border border-success-line bg-success-bg text-success font-bold px-2.5 py-0.5 text-[10.5px]">
                    Done
                  </span>
                ) : inProgress ? (
                  <>
                    <b className="block text-teal font-bold">line {heard}/{d.lines.length}</b>
                    <span className="inline-block w-[74px] h-1 rounded-full bg-line overflow-hidden mt-1">
                      <span
                        className="block h-full bg-teal"
                        style={{ width: `${(heard / d.lines.length) * 100}%` }}
                      />
                    </span>
                  </>
                ) : (
                  "Not started"
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
