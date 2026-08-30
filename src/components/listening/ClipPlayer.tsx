import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSaveResume } from "@/hooks/useSaveResume";
import Character, { characterColor, characterVariant } from "@/components/listening/Character";
import Waveform from "@/components/listening/Waveform";
import TapText from "@/components/words/TapText";
import { QUIZZES, type Dialogue } from "@/lib/listening-dialogues";
import { estMinutes } from "@/lib/listening-resume";
import { getLocalizedDialogueLine } from "@/lib/listening-i18n";
import type { CefrLevel } from "@/lib/tree";

const ABC = ["A", "B", "C", "D"];
const BTN_TEAL = buttonClassName("teal");
const CTL =
  "w-10 h-10 rounded-full border border-line bg-cream text-[13px] text-muted grid place-items-center hover:border-teal hover:text-teal transition-colors disabled:opacity-40";
// Tappable words get the dotted underline from the mockup.
const TAP = "[&_[role=button]]:underline [&_[role=button]]:decoration-dotted [&_[role=button]]:underline-offset-4";
const MAIN =
  "rounded-full bg-teal text-white grid place-items-center pl-[3px] transition-all hover:scale-105 hover:bg-[#0F766E] disabled:opacity-50";

// Player: one clip at a time. Two characters on a stage (the speaking one
// lights up with a bubble), a waveform, and the script as messenger bubbles
// that fill in as lines are heard. The quiz appears once every line played.
export default function ClipPlayer({
  dialogue,
  clipNo,
  clipCount,
  situationKey,
  situationLabel,
  situationIcon,
  level,
  userId,
  onExit,
  onFinished,
}: {
  dialogue: Dialogue;
  clipNo: number;
  clipCount: number;
  situationKey: string;
  situationLabel: string;
  situationIcon: string;
  level: CefrLevel;
  userId: string | null;
  /** Called with how many lines were heard before leaving, for partial XP. */
  onExit: (heard: number) => void;
  onFinished: (correct: boolean | null) => void;
}) {
  const t = useTranslations("listening.player");
  const th = useTranslations("listening.home");
  const locale = useLocale();
  const lines = dialogue.lines;
  const [rate, setRate] = useState(1.0);
  const [showEn, setShowEn] = useState(false);
  // Clips always start at line 1 — no cross-visit resume.
  const [heard, setHeard] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { currentIndex, isPlaying, isSupported, playFrom, speakOne, stop } =
    useSpeechSynthesis(lines, 0.9 * rate);

  const speakers = useMemo(() => Array.from(new Set(lines.map((l) => l.speaker))), [lines]);
  const quiz = QUIZZES[dialogue.id];
  const answered = picked !== null;
  const correct = quiz ? picked === quiz.ans : true;
  const allHeard = heard >= lines.length;

  // A line counts as heard the moment it starts playing (adjusted during
  // render, per the React "derive state from changing values" pattern).
  if (currentIndex + 1 > heard) setHeard(currentIndex + 1);

  // Dashboard "Continue" card.
  useSaveResume(userId, {
    skill: "listening",
    href: `/listening/${situationKey}?level=${level}&clip=${dialogue.id}`,
    label: dialogue.title as string,
    detail: `${situationIcon} ${situationLabel} · ${level}`,
    progress: Math.round((Math.min(heard, lines.length) / lines.length) * 100),
  });

  // The line on the stage: the one playing, else the last heard one.
  const stageIndex = currentIndex >= 0 ? currentIndex : Math.min(heard, lines.length) - 1;
  const stageLine = stageIndex >= 0 ? lines[stageIndex] : null;
  const speakingIdx = isPlaying && stageLine ? speakers.indexOf(stageLine.speaker) : -1;

  function handleMainButton() {
    if (isPlaying) {
      stop();
      return;
    }
    // Resume at the first unheard line; replay from the top once done.
    playFrom(allHeard ? 0 : heard);
  }

  const mainLabel = isPlaying ? t("pause") : allHeard ? t("playAgain") : heard > 0 ? t("resume") : t("play");
  const hint = isPlaying
    ? t("hintPlaying", { n: stageIndex + 1, total: lines.length })
    : allHeard
      ? t("hintAll", { total: lines.length })
      : heard > 0
        ? t("hintResume", { n: heard + 1, total: lines.length })
        : t("hintStart", { n: lines.length });

  const controls = (
    <>
      <button
        aria-label={t("prevLine")}
        className={CTL}
        onClick={() => stageIndex > 0 && speakOne(stageIndex - 1)}
        disabled={!isSupported || stageIndex <= 0}
      >
        ⏮
      </button>
      <button
        aria-label={mainLabel}
        className={`${MAIN} w-[60px] h-[60px] text-[22px] shadow-[0_6px_18px_rgba(34,137,128,.35)]`}
        onClick={handleMainButton}
        disabled={!isSupported}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button
        aria-label={t("replayLine")}
        className={CTL}
        onClick={() => stageIndex >= 0 && speakOne(stageIndex)}
        disabled={!isSupported || stageIndex < 0}
      >
        🔁
      </button>
    </>
  );

  return (
    <div className="max-w-[720px] pb-[76px] md:pb-0">
      {/* top bar: back · where · rate */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          className="text-[13px] font-bold text-muted hover:text-charcoal transition-colors flex-none"
          onClick={() => {
            const finalHeard = heard;
            stop();
            onExit(finalHeard);
          }}
        >
          {t("allClips")}
        </button>
        <span className="min-w-0 truncate text-[12.5px] text-muted tabular-nums">
          {th.rich("clipOf", {
            icon: situationIcon,
            situation: situationLabel,
            n: clipNo,
            total: clipCount,
            level,
          })}
        </span>
        <button
          className="flex-none border border-line bg-cream rounded-lg px-2.5 py-[5px] text-[12px] font-bold text-muted hover:border-faint transition-colors tabular-nums"
          onClick={() => setRate((r) => (r === 1.0 ? 0.7 : 1.0))}
          aria-label={t("speed", { rate: rate.toFixed(1) })}
        >
          {rate.toFixed(1)}×
        </button>
      </div>

      {!isSupported && (
        <p className="border border-line bg-warm rounded-[10px] px-4 py-3 text-[13px] text-muted mb-3">
          {t("noTts")}
        </p>
      )}

      <div className="border border-line rounded-[16px] bg-cream overflow-hidden">
        {/* stage */}
        <div
          className="px-[clamp(14px,3vw,24px)] pt-5 pb-4 text-center border-b border-dashed border-dash"
          style={{ background: "radial-gradient(ellipse at 50% 0%, var(--tint-teal) 0%, var(--c-warm) 70%)" }}
        >
          <h2 className="font-extrabold text-[clamp(17px,2.2vw,20px)] tracking-[-0.02em]">{dialogue.title as string}</h2>
          <p className="text-[12.5px] text-muted mt-0.5">
            {t("meta", { n: lines.length, min: estMinutes(lines.length) })} ·{" "}
            {allHeard ? t("allHeard") : t("listenFirst")}
          </p>

          {/* cast */}
          <div className="flex justify-center items-end gap-[clamp(40px,10vw,72px)] mt-12 mb-1">
            {speakers.slice(0, 2).map((sp, i) => {
              const on = speakingIdx === i;
              const idleBubble =
                !isPlaying &&
                ((allHeard && i === 1) || (heard === 0 && i === 0))
                  ? allHeard
                    ? t("idleAll")
                    : t("idleStart")
                  : null;
              return (
                <div key={sp} className="relative flex flex-col items-center gap-1.5">
                  {(on && stageLine) || idleBubble ? (
                    <div
                      className={`absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-10 max-w-[min(300px,80vw)] w-max rounded-[12px] px-3.5 py-2 bg-cream border shadow-sm ${
                        on ? "border-[var(--tint-teal-line)]" : "border-line"
                      }`}
                      style={{ animation: "fadeUp .25s ease" }}
                    >
                      {on && stageLine ? (
                        <p className="kr text-[16px] font-semibold leading-snug">
                          <TapText text={stageLine.kr} userId={userId} source="listening" className={`${TAP} [&_[role=button]]:decoration-teal`} />
                        </p>
                      ) : (
                        <p className="text-[12.5px] text-muted font-medium whitespace-nowrap">{idleBubble}</p>
                      )}
                      <span
                        aria-hidden="true"
                        className={`absolute top-full left-1/2 -ml-1.5 border-[6px] border-transparent ${
                          on ? "border-t-[var(--tint-teal-line)]" : "border-t-line"
                        }`}
                      />
                    </div>
                  ) : null}
                  <span className={`rounded-full ${on ? "avatar-on" : ""}`}>
                    <Character color={characterColor(i)} variant={characterVariant(i)} talking={on} size={72} />
                  </span>
                  <span
                    className={`text-[11.5px] font-bold px-2 py-[3px] rounded-md border transition-colors ${
                      on ? "bg-[var(--tint-teal)] text-teal border-[var(--tint-teal-line)]" : "bg-cream text-muted border-line"
                    }`}
                  >
                    {sp}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="max-w-[520px] mx-auto mt-4">
            <Waveform seed={dialogue.id} lineCount={lines.length} heard={heard} current={currentIndex} playing={isPlaying} />
            <div className="flex gap-1.5 mb-3" aria-hidden="true">
              {lines.map((_, i) => (
                <span
                  key={i}
                  className={`flex-1 text-center text-[10px] font-bold tracking-[.06em] ${
                    i < heard || i === currentIndex ? "text-teal" : "text-faint"
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* desktop controls; phones get the sticky bar below */}
          <div className="hidden md:flex items-center justify-center gap-4">{controls}</div>
          <div className="flex items-center justify-center gap-3 mt-3 text-[12px]">
            <span className="font-bold text-teal tabular-nums">{hint}</span>
            <span className="text-faint">·</span>
            <button
              className={`font-semibold transition-colors ${showEn ? "text-teal" : "text-faint hover:text-muted"}`}
              onClick={() => setShowEn((v) => !v)}
            >
              {t("translation")} {showEn ? t("on") : t("off")}
            </button>
          </div>
        </div>

        {/* script as messenger bubbles */}
        <div className="px-[clamp(12px,3vw,20px)] pt-[18px] pb-1.5 flex flex-col gap-2.5">
          {lines.map((line, i) => {
            const revealed = i < heard;
            const playing = i === currentIndex;
            const side = speakers.indexOf(line.speaker) % 2; // 0 left, 1 right
            const who = speakers.indexOf(line.speaker);
            return (
              <div
                key={i}
                className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[78%] ${side === 1 ? "self-end flex-row-reverse" : ""}`}
              >
                <span className="flex-none -mb-1">
                  <Character color={characterColor(who)} variant={characterVariant(who)} talking={playing} size={30} />
                </span>
                <div className="min-w-0">
                  <b
                    className={`block text-[10.5px] font-bold mx-1 mb-[3px] ${playing ? "text-teal" : "text-faint"} ${
                      side === 1 ? "text-right" : ""
                    }`}
                  >
                    {line.speaker}
                    {playing && ` · ${t("playing")}`}
                  </b>
                  {revealed ? (
                    <div
                      className={`px-3.5 py-2.5 rounded-[16px] text-[15px] leading-[1.55] border ${
                        side === 1 ? "rounded-br-[6px]" : "rounded-bl-[6px]"
                      } ${
                        playing
                          ? "bg-teal text-white border-teal shadow-[0_4px_14px_rgba(34,137,128,.3)]"
                          : side === 1
                            ? "bg-[var(--tint-teal)] border-[var(--tint-teal-line)]"
                            : "bg-warm-2 border-transparent"
                      }`}
                    >
                      <span className="kr font-medium">
                        <TapText
                          text={line.kr}
                          userId={userId}
                          source="listening"
                          className={`${TAP} ${playing ? "[&_[role=button]]:decoration-white/60" : "[&_[role=button]]:decoration-teal"}`}
                        />
                      </span>
                      {showEn && (
                        <span className={`block text-[12px] mt-[3px] font-normal ${playing ? "text-white/80" : "text-muted"}`}>
                          {getLocalizedDialogueLine(line, locale)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-3.5 py-2.5 rounded-[16px] bg-cream border border-dashed border-dash text-faint text-[11px] tracking-[.25em] select-none ${
                        side === 1 ? "rounded-br-[6px]" : "rounded-bl-[6px]"
                      }`}
                    >
                      {"●".repeat(Math.min(8, Math.max(3, Math.round(line.kr.length / 4))))}
                    </div>
                  )}
                </div>
                {revealed && (
                  <button
                    aria-label={t("replayLine")}
                    className="flex-none self-center text-[12px] text-faint hover:text-teal transition-colors disabled:opacity-40"
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
        <p className="text-center text-[11.5px] text-faint px-5 pt-2 pb-4">
          {allHeard ? t("noteAll") : t("note")}
        </p>

        {/* quiz, once everything has played */}
        {allHeard && (
          <div className="mx-[clamp(12px,3vw,20px)] mb-5 border border-line rounded-[14px] overflow-hidden" style={{ animation: "fadeUp .35s ease" }}>
            {quiz ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 bg-warm border-b border-line">
                  <span className="text-[11px] font-extrabold tracking-[.1em] uppercase text-teal">{t("checkEars")}</span>
                  <span className="text-[11.5px] text-faint">{t("oneQuestion")}</span>
                </div>
                <p className="px-4 pt-4 pb-1.5 font-extrabold text-[16.5px] tracking-[-0.01em]">{quiz.q}</p>
                <div className="grid gap-2 px-4 pt-2 pb-4">
                  {quiz.opts.map((opt, i) => {
                    const isAns = i === quiz.ans;
                    const isPicked = i === picked;
                    const state = !answered ? "idle" : isAns ? "correct" : isPicked ? "wrong" : "idle";
                    return (
                      <button
                        key={i}
                        disabled={answered}
                        onClick={() => setPicked(i)}
                        className={`text-left px-3.5 py-[11px] rounded-[10px] text-[14px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                          state === "correct"
                            ? "border-success bg-success-bg"
                            : state === "wrong"
                              ? "border-danger bg-danger-bg"
                              : answered
                                ? "border-line bg-cream opacity-90"
                                : "border-line bg-cream hover:border-teal hover:bg-[var(--tint-teal)]"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-[7px] flex-none grid place-items-center text-[11.5px] font-extrabold border ${
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
              </>
            ) : null}
            {(answered || !quiz) && (
              <div
                className="flex items-center justify-between gap-2.5 px-4 py-3 border-t border-line bg-warm flex-wrap"
                style={{ animation: "fadeUp .35s ease" }}
              >
                {quiz ? (
                  <span className={`text-[13px] font-bold ${correct ? "text-success" : "text-danger"}`}>
                    {correct ? t("correct") : t("wrong")}
                  </span>
                ) : (
                  <span className="text-[13px] font-bold text-success">{t("allHeardMsg")}</span>
                )}
                <button
                  className={BTN_TEAL}
                  disabled={saving}
                  onClick={() => {
                    setSaving(true);
                    stop();
                    onFinished(quiz ? correct : null);
                  }}
                >
                  {saving ? t("saving") : clipNo === clipCount ? t("finish") : t("doneNext")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* phones: playback controls stay reachable while the script scrolls */}
      <div className="md:hidden fixed left-0 right-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex items-center gap-2.5 px-3 py-2 bg-cream/95 backdrop-blur-[10px] border-t border-line">
        <button
          aria-label={t("prevLine")}
          className={CTL}
          onClick={() => stageIndex > 0 && speakOne(stageIndex - 1)}
          disabled={!isSupported || stageIndex <= 0}
        >
          ⏮
        </button>
        <button
          aria-label={mainLabel}
          className={`${MAIN} w-11 h-11 text-[17px]`}
          onClick={handleMainButton}
          disabled={!isSupported}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="flex-1 min-w-0 text-left" onClick={() => setShowEn((v) => !v)}>
          <b className="block text-[13px] truncate tabular-nums">
            {stageLine ? `${stageLine.speaker} · ` : ""}
            {hint}
          </b>
          <span className="block text-[11px] text-muted truncate">
            {t("translation")} {showEn ? t("on") : t("off")} · {t("tapToggle")}
          </span>
        </button>
        <button
          aria-label={t("replayLine")}
          className={CTL}
          onClick={() => stageIndex >= 0 && speakOne(stageIndex)}
          disabled={!isSupported || stageIndex < 0}
        >
          🔁
        </button>
      </div>
    </div>
  );
}
