"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LEVEL_ORDER } from "@/lib/tree";
import { speakKorean, prefetchKorean } from "@/lib/tts";
import { bandCode, currentQuestion, type Run } from "@/lib/level-test";
import { poolText } from "@/lib/level-test-i18n";
import { BTN_GHOST, BTN_OUTLINE, CARD, EYEBROW, FADE } from "./styles";

const OPT =
  "text-left px-[14px] py-[11px] rounded-[9px] text-[13.5px] font-medium border transition-colors disabled:cursor-default";

// Step 3 — the adaptive test. Shows right/wrong for a beat (same feedback as
// the promotion test's Mcq) before handing the choice up to the run.
export default function PlacementQuiz({
  run,
  onAnswer,
  onReplace,
  onSkipAll,
}: {
  run: Run;
  onAnswer: (choice: number) => void;
  /** Swap the current question (audio wouldn't play) — no penalty. */
  onReplace: () => void;
  onSkipAll: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations("onboarding.quiz");
  const tt = useTranslations("onboarding.types");
  const locale = useLocale();
  const q = currentQuestion(run);

  // Warm the audio cache as soon as the question is up, so "Play" doesn't
  // wait on a cold synthesis.
  useEffect(() => {
    if (q?.audio) prefetchKorean([q.audio]);
  }, [q?.audio]);

  // Pressing Back during the answer-feedback beat used to leave this timer
  // running: it fired onAnswer() against a run the learner had already
  // rewound, jumping the flow forward or recording an answer for a question
  // that was no longer on screen.
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  if (!q) return null;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const right = i === q!.ans;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setPicked(null);
      setShowText(false);
      setAudioFailed(false);
      onAnswer(i);
    }, right ? 500 : 1100);
  }

  function play() {
    const ok = speakKorean(q!.audio!, { rate: 0.9, onerror: () => setAudioFailed(true) });
    if (!ok) setAudioFailed(true);
  }

  return (
    <section className={FADE}>
      <div className={CARD}>
        <div className="flex justify-between items-baseline mb-2.5 text-[12.5px] text-muted">
          <span className="font-medium">
            <b className="text-charcoal">{bandCode(run.band)}</b> · {t("question", { n: run.answered + 1 })}
          </span>
          <span className="text-[11.5px] text-faint font-semibold">{t("stopsEarly")}</span>
        </div>
        <div className="flex gap-1.5 mb-4" aria-label="levels">
          {LEVEL_ORDER.map((code, i) => {
            const band = i + 1;
            const cls = run.passed.includes(band)
              ? "bg-success"
              : band === run.band
                ? "bg-[var(--sun)]"
                : "bg-line";
            return <span key={code} title={code} className={`flex-1 h-[5px] rounded-full ${cls}`} />;
          })}
        </div>

        <span className={`${EYEBROW} mb-2.5`}>{tt(q.type)}</span>
        {q.audio ? (
          <>
            <div>
              <button type="button" onClick={play} className={`${BTN_OUTLINE} mb-2`}>
                {t("play")}
              </button>
            </div>
            <p className="text-[12px] text-faint mb-3">
              {audioFailed ? t("audioFailed") : t("cantHear")}{" "}
              <button type="button" className="font-semibold text-success underline" onClick={() => setShowText(true)}>
                {t("showText")}
              </button>{" "}
              {t("or")}{" "}
              <button type="button" className="font-semibold text-success underline" onClick={onReplace}>
                {t("swap")}
              </button>{" "}
              {t("noPenalty")}
            </p>
            {showText && <p className="kr text-[22px] text-charcoal mb-1.5 leading-[1.3]">{q.audio}</p>}
            <p className="text-[13.5px] text-muted mb-4">{poolText(locale, q.ask)}</p>
          </>
        ) : (
          <>
            <p className="kr text-[clamp(24px,3.6vw,30px)] text-charcoal mb-1.5 leading-[1.3]">{q.word}</p>
            <p className="text-[13.5px] text-muted mb-4">{poolText(locale, q.ask)}</p>
          </>
        )}

        <div className="grid gap-2">
          {q.opts.map((opt, i) => {
            const state =
              picked === null
                ? "bg-cream border-line text-charcoal hover:border-success hover:bg-success-bg"
                : i === q.ans
                  ? "border-success bg-success-bg text-charcoal font-bold"
                  : i === picked
                    ? "border-danger bg-danger-bg text-charcoal"
                    : "bg-cream border-line text-charcoal opacity-55";
            return (
              <button key={opt} type="button" onClick={() => pick(i)} disabled={picked !== null} className={`${OPT} ${state}`}>
                {poolText(locale, opt)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => pick(-1)}
            disabled={picked !== null}
            className={`${OPT} bg-warm border-dashed border-dash text-muted hover:border-faint hover:text-charcoal ${
              picked === -1 ? "opacity-55" : ""
            }`}
          >
            {t("dontKnow")}
          </button>
        </div>

        <button type="button" onClick={onSkipAll} className={`${BTN_GHOST} block text-center mx-auto mt-5`}>
          {t("notNow")}
        </button>
      </div>
    </section>
  );
}
