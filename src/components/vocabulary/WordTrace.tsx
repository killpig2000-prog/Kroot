"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isSyllable, scoreAttempt } from "@/lib/hangul-trace";
import { speakKorean } from "@/lib/tts";
import TraceCanvas, { type TraceCanvasHandle, type TraceMode } from "@/components/hangul/TraceCanvas";
import { Stars } from "@/components/hangul/TracePanel";

const HANGUL_ACCENT = "#B04A5E";

/** Words the trace paper can take: pure Hangul syllables, no spaces or punctuation. */
export function canTraceWord(korean: string): boolean {
  const chars = Array.from(korean.trim());
  return chars.length > 0 && chars.length <= 6 && chars.every(isSyllable);
}

// "Write it" — the Hangul tab folded into the word card (2026-09-07
// restructure): the first time a learner meets a word they trace it, one
// syllable at a time, on the same paper /hangul uses. Guide mode drags
// along the grey strokes; "from memory" is free-hand and is what gets
// scored (shape + stroke order → stars), same rules as the letter page.
// Pure in-card practice: no XP, no coins, nothing saved (hangul never pays).
export default function WordTrace({
  korean,
  defaultOpen,
}: {
  korean: string;
  /** A1/A2 open straight away (first meeting = write it); B1+ start folded. */
  defaultOpen: boolean;
}) {
  const t = useTranslations("vocabulary.trace");
  const syllables = Array.from(korean.trim());
  const [open, setOpen] = useState(defaultOpen);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<TraceMode>("practice");
  const [drawnCount, setDrawnCount] = useState(0);
  const [locked, setLocked] = useState(false);
  // Stars per syllable, in order; null = not scored yet.
  const [stars, setStars] = useState<(number | null)[]>(() => syllables.map(() => null));
  const canvas = useRef<TraceCanvasHandle | null>(null);

  const char = syllables[idx];
  const last = idx === syllables.length - 1;

  const setStar = (i: number, n: number) =>
    setStars((prev) => prev.map((v, j) => (j === i ? Math.max(v ?? 0, n) : v)));

  const reset = () => {
    canvas.current?.reset();
    setDrawnCount(0);
    setLocked(false);
  };

  const go = (i: number) => {
    setIdx(i);
    setDrawnCount(0);
    setLocked(false);
  };

  const score = () => {
    const drawn = canvas.current?.drawn() ?? [];
    if (drawn.length === 0) return;
    const s = scoreAttempt(drawn, char);
    setStar(idx, s.stars);
    setLocked(true);
    speakKorean(char);
  };

  const switchMode = (m: TraceMode) => {
    if (m === mode) return;
    setMode(m);
    setDrawnCount(0);
    setLocked(false);
  };

  const hint = locked
    ? null
    : mode === "challenge"
      ? t("hintFree")
      : t("hintGuide");

  const scored = stars.filter((s): s is number => s !== null);
  const total = scored.length === syllables.length ? Math.round(scored.reduce((a, b) => a + b, 0) / syllables.length) : null;

  return (
    <section className="mt-3.5 rounded-[14px] border-[1.5px] border-dashed border-line bg-cream">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
      >
        <span aria-hidden="true" className="text-[17px]">✍️</span>
        <b className="flex-1 min-w-0 text-[14px] font-bold text-charcoal">{t("title")}</b>
        {total !== null && !open ? <Stars n={total} size={13} /> : null}
        <span className={`text-[11px] text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* syllable stepper — one tab per block, stars underneath once scored */}
          {syllables.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("title")}>
              {syllables.map((s, i) => (
                <button
                  key={`${s}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => go(i)}
                  className={`kr min-w-[44px] min-h-[44px] rounded-[10px] border px-2.5 text-[18px] font-black leading-none flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    i === idx ? "border-success bg-success-bg text-success-deep" : "border-line bg-warm text-charcoal hover:border-faint"
                  }`}
                >
                  {s}
                  {stars[i] !== null ? <Stars n={stars[i]!} size={9} /> : null}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-[3px] p-[3px] rounded-xl bg-warm-2" role="tablist">
            {(["practice", "challenge"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`py-2 rounded-[9px] text-[12.5px] font-bold transition-all ${
                  mode === m ? "bg-cream text-charcoal shadow-sm" : "text-muted hover:text-charcoal"
                }`}
              >
                {t(m === "practice" ? "modeGuide" : "modeMemory")}
              </button>
            ))}
          </div>

          <TraceCanvas
            key={`${char}-${idx}-${mode}`}
            ref={canvas}
            char={char}
            mode={mode}
            hint={hint}
            locked={locked}
            onDrawnCountChange={setDrawnCount}
            onPracticeDone={() => {
              // A guided trace all the way through counts as one star — the
              // real stars come from writing it from memory.
              setStar(idx, 1);
              speakKorean(char);
            }}
          />

          <p className="text-center text-[11.5px] text-muted -mt-1">{t("caption")}</p>

          <div className="flex items-center justify-center gap-2 min-h-[22px]" aria-live="polite">
            {stars[idx] !== null ? (
              <>
                <span className="kr text-[13px] font-bold text-charcoal">{char}</span>
                <Stars n={stars[idx]!} />
              </>
            ) : (
              <span className="text-[12px] text-faint">{t("notYet")}</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 min-h-[44px] rounded-[12px] border-[1.5px] border-line text-[13px] font-bold text-muted hover:border-faint"
            >
              {t("reset")}
            </button>
            {mode === "challenge" && !locked ? (
              <button
                type="button"
                onClick={score}
                disabled={drawnCount === 0}
                className="flex-1 min-h-[44px] rounded-[12px] text-white text-[13px] font-bold disabled:opacity-40"
                style={{ background: HANGUL_ACCENT }}
              >
                {t("check")}
              </button>
            ) : !last ? (
              <button
                type="button"
                onClick={() => go(idx + 1)}
                className="flex-1 min-h-[44px] rounded-[12px] bg-success text-white text-[13px] font-bold"
              >
                {t("nextSyllable")}
              </button>
            ) : total !== null ? (
              <span className="flex-1 min-h-[44px] rounded-[12px] bg-success-bg border border-success-line text-success-deep text-[13px] font-bold flex items-center justify-center gap-2">
                <span className="kr">{korean}</span> <Stars n={total} size={13} />
              </span>
            ) : null}
          </div>

          <Link href="/hangul" className="self-end text-[12px] font-semibold text-muted hover:text-charcoal transition-colors">
            {t("allLetters")} →
          </Link>
        </div>
      )}
    </section>
  );
}
