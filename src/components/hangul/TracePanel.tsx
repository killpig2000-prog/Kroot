"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { speakKorean } from "@/lib/tts";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import { scoreAttempt, TRACE_ANCHORS, type TraceScore } from "@/lib/hangul-trace";
import type { Jamo } from "@/lib/hangul";
import TraceCanvas, { type TraceCanvasHandle, type TraceMode } from "@/components/hangul/TraceCanvas";
import type { JamoProgress } from "@/components/hangul/useHangulProgress";

const HANGUL_ACCENT = "#C63958";
const STAR = "#E2A93B";

export type GradedInfo = { xp: ProgressResult | null; improved: boolean };

type Props = {
  jamo: Jamo;
  kind: "consonant" | "vowel";
  progress: JamoProgress;
  mode: TraceMode;
  onModeChange?: (m: TraceMode) => void;
  /** Challenge run hides the toggle — the run decides the mode. */
  hideModeToggle?: boolean;
  onPracticed: (char: string) => void;
  onGraded: (char: string, score: TraceScore) => Promise<GradedInfo>;
  onNext?: () => void;
  nextLabel?: string;
  signedIn: boolean;
  /** Example word + XP note — off inside the challenge run to keep it tight. */
  compact?: boolean;
  tourStrokeId?: string;
};

export function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <span aria-label={`${n}/3`} style={{ color: STAR, fontSize: size, letterSpacing: 2 }}>
      {"★".repeat(n)}
      <span className="opacity-40">{"☆".repeat(3 - n)}</span>
    </span>
  );
}

/**
 * The letter card + paper + controls — the thing that replaced the
 * stroke-animation detail box. Same panel on desktop (sticky beside the
 * grid) and mobile (in a bottom sheet).
 */
export default function TracePanel({
  jamo, kind, progress, mode, onModeChange, hideModeToggle, onPracticed, onGraded, onNext, nextLabel, signedIn, compact, tourStrokeId,
}: Props) {
  const t = useTranslations("hangul");
  const canvas = useRef<TraceCanvasHandle | null>(null);
  const [drawnCount, setDrawnCount] = useState(0);
  const [result, setResult] = useState<TraceScore | null>(null);
  const [graded, setGraded] = useState<GradedInfo | null>(null);
  const [grading, setGrading] = useState(false);
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const strokeCount = TRACE_ANCHORS[jamo.char]?.length ?? 0;

  // A new letter or mode remounts this panel (the parent keys it on both), so
  // every piece of attempt state above starts fresh without an effect.
  const reset = () => {
    canvas.current?.reset();
    setResult(null); setGraded(null); setDrawnCount(0); setStrokeIdx(0); setCelebrate(false);
  };

  const grade = async () => {
    const drawn = canvas.current?.drawn() ?? [];
    if (drawn.length === 0 || grading) return;
    const s = scoreAttempt(drawn, jamo.char);
    setResult(s);
    setGrading(true);
    try {
      setGraded(await onGraded(jamo.char, s));
    } finally {
      setGrading(false);
    }
  };

  const hint =
    mode === "challenge"
      ? result ? null : t("trace.hintFree")
      : strokeIdx === 0 ? t("trace.hintStart") : t("trace.hintNext", { n: strokeIdx + 1 });

  const verdict = result
    ? result.score >= 85 ? t("trace.verdictGreat") : result.score >= 60 ? t("trace.verdictClose") : t("trace.verdictAgain")
    : "";

  return (
    <div className="flex flex-col gap-3">
      {/* letter card */}
      <div className="flex items-center gap-3">
        <span
          className="kr flex-none w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-[30px] font-black leading-none"
          style={{ background: "#FBE9EE", color: HANGUL_ACCENT }}
        >
          {jamo.char}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold leading-tight truncate">
            {jamo.rom}
            <span className="text-faint font-semibold text-[12px] ml-2">{t(`trace.${kind}`)} · {t("trace.strokes", { count: strokeCount })}</span>
          </p>
          <p className="text-[12px] text-muted leading-snug truncate">{jamo.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => speakKorean(jamo.char)}
          aria-label={t("hear", { text: jamo.char })}
          className="flex-none w-9 h-9 rounded-[10px] border border-line text-[15px] text-muted hover:border-success transition-colors"
        >
          🔊
        </button>
      </div>

      {!hideModeToggle ? (
        <div className="grid grid-cols-2 gap-[3px] p-[3px] rounded-xl bg-warm-2" role="tablist">
          {(["practice", "challenge"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => onModeChange?.(m)}
              className={`py-2 rounded-[9px] text-[12.5px] font-bold transition-all ${
                mode === m ? "bg-cream text-charcoal shadow-sm" : "text-muted hover:text-charcoal"
              }`}
            >
              {t(`trace.${m}`)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <TraceCanvas
          ref={canvas}
          char={jamo.char}
          mode={mode}
          hint={hint}
          locked={!!result}
          tourId={tourStrokeId}
          onDrawnCountChange={setDrawnCount}
          onActiveStrokeChange={setStrokeIdx}
          onPracticeDone={() => {
            setCelebrate(true);
            onPracticed(jamo.char);
            speakKorean(jamo.char);
            setTimeout(() => setCelebrate(false), 1400);
          }}
        />
        {celebrate ? (
          <div
            className="absolute inset-x-0 top-0 mx-auto aspect-square rounded-[18px] flex flex-col items-center justify-center gap-1 pointer-events-none"
            style={{ maxWidth: "clamp(240px, 80vw, 320px)", background: "color-mix(in srgb, var(--c-warm) 86%, transparent)", animation: "fadeUp .25s ease" }}
          >
            <span className="text-[44px] font-black leading-none text-success-deep">✓</span>
            <span className="text-[13px] font-bold">{t("trace.doneToast", { name: jamo.rom })}</span>
          </div>
        ) : null}
      </div>

      {/* controls */}
      {mode === "practice" ? (
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="flex-1 rounded-[12px] border-[1.5px] border-line py-2.5 text-[13px] font-bold text-muted hover:border-faint">
            {t("trace.reset")}
          </button>
          {onNext ? (
            <button type="button" onClick={onNext} className="flex-1 rounded-[12px] bg-success text-white py-2.5 text-[13px] font-bold">
              {nextLabel ?? t("trace.next")}
            </button>
          ) : null}
        </div>
      ) : !result ? (
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="flex-1 rounded-[12px] border-[1.5px] border-line py-2.5 text-[13px] font-bold text-muted hover:border-faint">
            {t("trace.reset")}
          </button>
          <button
            type="button"
            onClick={grade}
            disabled={drawnCount === 0}
            className="flex-1 rounded-[12px] text-white py-2.5 text-[13px] font-bold disabled:opacity-40"
            style={{ background: HANGUL_ACCENT }}
          >
            {t("trace.grade")}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-[14px] bg-warm-2 p-3.5 flex flex-col gap-2.5" style={{ animation: "fadeUp .3s ease" }}>
            <div className="flex items-center gap-3">
              <div className="relative flex-none w-14 h-14">
                <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--c-line)" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="16" fill="none" stroke="var(--c-success)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray="100.5" strokeDashoffset={(100.5 - (100.5 * result.score) / 100).toFixed(1)}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-black tabular-nums">{result.score}</span>
              </div>
              <div className="min-w-0 flex-1">
                <Stars n={result.stars} />
                <p className="text-[13px] font-extrabold leading-tight">{verdict}</p>
                <p className="text-[11px] text-muted">
                  {graded?.improved ? `${t("trace.newBest")} · ` : ""}
                  {graded?.xp ? (
                    <b className="text-success-deep">{t("trace.xpEarned", { xp: graded.xp.points_awarded ?? XP_POINTS.hangul })}</b>
                  ) : grading ? "…" : null}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {result.strokes.map((s) => (
                <div key={s.index} className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 text-[11.5px] rounded-lg bg-cream px-2.5 py-1.5">
                  <span className="font-extrabold text-muted whitespace-nowrap">{t("trace.strokeN", { n: s.index + 1 })}</span>
                  <span className="h-1.5 rounded-full bg-line overflow-hidden">
                    <i className="block h-full rounded-full bg-success" style={{ width: `${s.missing ? 0 : s.shapePct}%` }} />
                  </span>
                  {s.missing ? (
                    <span className="font-bold whitespace-nowrap" style={{ color: HANGUL_ACCENT }}>{t("trace.strokeMissing")}</span>
                  ) : (
                    <span className="font-bold whitespace-nowrap" style={{ color: s.orderOk ? "var(--c-success-deep)" : HANGUL_ACCENT }}>
                      {s.orderOk ? t("trace.orderOk") : t("trace.orderBad")} · {s.shapePct}%
                    </span>
                  )}
                </div>
              ))}
              {result.drawnCount !== result.targetCount ? (
                <p className="text-[11.5px] font-bold px-1" style={{ color: HANGUL_ACCENT }}>
                  {t("trace.countMismatch", { drawn: result.drawnCount, target: result.targetCount })}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="flex-1 rounded-[12px] border-[1.5px] border-line py-2.5 text-[13px] font-bold text-muted hover:border-faint">
              {t("trace.retry")}
            </button>
            {onNext ? (
              <button type="button" onClick={onNext} className="flex-1 rounded-[12px] bg-success text-white py-2.5 text-[13px] font-bold">
                {nextLabel ?? t("trace.next")}
              </button>
            ) : null}
          </div>
        </>
      )}

      {!compact ? (
        <>
          <button
            type="button"
            onClick={() => speakKorean(jamo.example.kr)}
            className="flex items-center justify-between gap-3 rounded-[12px] bg-warm-2 px-3.5 py-2.5 text-left hover:bg-warm-3 transition-colors"
          >
            <span className="min-w-0">
              <b className="kr block text-[15px] font-bold">
                {jamo.example.kr} <span className="text-muted font-medium text-[12px]">{jamo.example.rom}</span>
              </b>
              <small className="block text-[11px] text-muted">{jamo.example.en}</small>
            </span>
            <span className="flex-none text-[14px] text-faint">🔊</span>
          </button>
          {signedIn ? (
            <p className="text-[11px] text-muted px-1">
              🎯 {t("trace.xpNote", { xp: XP_POINTS.hangul })}
              {progress.bestStars > 0 ? <> · <Stars n={progress.bestStars} size={11} /></> : null}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
