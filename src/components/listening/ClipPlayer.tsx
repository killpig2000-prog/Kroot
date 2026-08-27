import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { QUIZZES, type Dialogue } from "@/lib/listening-dialogues";
import { saveHeard } from "@/lib/listening-resume";

const ABC = ["A", "B", "C", "D"];
const BTN_TEAL = buttonClassName("teal");
const Q_LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";

// Player: one clip at a time. The current line sits on a "stage"; the script
// below reveals karaoke-style as lines are heard, and unheard lines stay
// masked. The quiz appears once every line has played.
export default function ClipPlayer({
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
            {stageLine && showEn ? stageLine.en : " "}
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
