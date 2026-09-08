"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { anchorsFor, isSyllable, scoreAttempt } from "@/lib/hangul-trace";
import { speakKorean } from "@/lib/tts";
import { useBackToClose } from "@/hooks/useBackToClose";
import TraceCanvas, { type TraceCanvasHandle, type TraceMode } from "@/components/hangul/TraceCanvas";
import { Stars } from "@/components/hangul/TracePanel";

const HANGUL_ACCENT = "#B04A5E";

/** Words the trace paper can take: pure Hangul syllables, no spaces or punctuation. */
export function canTraceWord(korean: string): boolean {
  const chars = Array.from(korean.trim());
  return chars.length > 0 && chars.length <= 6 && chars.every(isSyllable);
}

/**
 * The finished word gathering itself out of the syllable strip.
 *
 * A plain FLIP: the word is laid out where it belongs, then each syllable is
 * thrown back to its block in the strip with no transition, and one frame
 * later it travels home. Nothing is measured off a hard-coded size, so it
 * survives any strip width and any clamp() the paper lands on.
 */
function Finale({
  korean,
  stars,
  rom,
  meaning,
  blocks,
}: {
  korean: string;
  stars: number;
  rom?: string;
  meaning?: string;
  blocks: React.RefObject<(HTMLElement | null)[]>;
}) {
  const chars = Array.from(korean);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const from = blocks.current ?? [];
    const flying = spans.current.filter((sp, i): sp is HTMLSpanElement => !!sp && !!from[i]);
    if (flying.length === 0) return;

    spans.current.forEach((sp, i) => {
      const src = from[i];
      if (!sp || !src) return;
      const a = src.getBoundingClientRect();
      const b = sp.getBoundingClientRect();
      const scale = parseFloat(getComputedStyle(src).fontSize) / parseFloat(getComputedStyle(sp).fontSize);
      sp.style.transition = "none";
      sp.style.opacity = "0";
      sp.style.transform = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${
        a.top + a.height / 2 - (b.top + b.height / 2)
      }px) scale(${scale.toFixed(3)})`;
    });

    const id = requestAnimationFrame(() => {
      spans.current.forEach((sp, i) => {
        if (!sp) return;
        sp.style.transition = `transform .5s cubic-bezier(.3,1.35,.5,1) ${i * 90}ms, opacity .18s linear ${i * 90}ms`;
        sp.style.opacity = "1";
        sp.style.transform = "";
      });
    });
    return () => cancelAnimationFrame(id);
  }, [blocks, korean]);

  // The word says itself once the last syllable has landed.
  useEffect(() => {
    const t = setTimeout(() => speakKorean(korean), 420);
    return () => clearTimeout(t);
  }, [korean]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-full mx-auto aspect-square rounded-[18px] bg-cream overflow-hidden shadow-[inset_0_0_0_1.5px_var(--c-line)] flex items-center justify-center"
        style={{ maxWidth: "clamp(240px, 80vw, 320px)" }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-[22%] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--c-success-bg), transparent 70%)",
            animation: "fadeUp .5s ease .42s both",
          }}
        />
        <span className="kr relative flex items-center justify-center gap-[2px] font-black leading-none text-charcoal">
          {chars.map((c, i) => (
            <span
              key={`${c}-${i}`}
              ref={(el) => {
                spans.current[i] = el;
              }}
              className="inline-block"
              style={{ fontSize: "clamp(38px, 12vw, 52px)" }}
            >
              {c}
            </span>
          ))}
        </span>
      </div>
      <div
        className="flex items-center justify-center gap-2.5 flex-wrap text-center"
        style={{ animation: "fadeUp .35s ease .58s both" }}
      >
        <Stars n={stars} />
        {rom ? <span className="text-[13px] font-bold text-muted">{rom}</span> : null}
        {meaning ? <span className="text-[15px] font-extrabold text-charcoal">{meaning}</span> : null}
      </div>
    </div>
  );
}

// "Write it" — the Hangul tab folded into the word card (2026-09-07
// restructure): the first time a learner meets a word they trace it, one
// syllable at a time, on the same paper /hangul uses. Guide mode drags
// along the grey strokes; "from memory" is free-hand and is what gets
// scored (shape + stroke order → stars), same rules as the letter page.
// Pure in-card practice: no XP, no coins, nothing saved (hangul never pays).
//
// The paper lives in a popup, not in the card (2026-09-09): in the card it
// was 505px of the 882px card and the single reason the word page scrolled
// past one screen. Phone gets the same bottom sheet /hangul uses, desktop a
// centred modal. The paper never changes size with the word's length —
// syllable count is carried by the strip above it, and the last syllable
// ends with the blocks gathering into the whole word.
export default function WordTrace({
  korean,
  rom,
  meaning,
}: {
  korean: string;
  /** Romanisation and meaning, shown once the whole word has been written. */
  rom?: string;
  meaning?: string;
}) {
  const t = useTranslations("vocabulary.trace");
  const syllables = Array.from(korean.trim());
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<TraceMode>("practice");
  const [drawnCount, setDrawnCount] = useState(0);
  const [locked, setLocked] = useState(false);
  // Stars per syllable, in order; null = not scored yet.
  const [stars, setStars] = useState<(number | null)[]>(() => syllables.map(() => null));
  const canvas = useRef<TraceCanvasHandle | null>(null);
  const blocks = useRef<(HTMLElement | null)[]>([]);

  const char = syllables[idx];
  const last = idx === syllables.length - 1;

  const close = useCallback(() => setOpen(false), []);
  const dismiss = useBackToClose(open, close);

  // The sheet covers the page; the page behind it must not scroll under it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

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

  const restart = () => {
    setStars(syllables.map(() => null));
    setMode("practice");
    go(0);
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

  const hint = locked ? null : mode === "challenge" ? t("hintFree") : t("hintGuide");

  const scored = stars.filter((s): s is number => s !== null);
  const allScored = scored.length === syllables.length;
  const total = allScored ? Math.round(scored.reduce((a, b) => a + b, 0) / syllables.length) : null;
  // One-syllable words have nothing to gather — they end on the stars alone.
  const finale = allScored && syllables.length > 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3.5 w-full flex items-center gap-2.5 rounded-[16px] border-[1.5px] border-dashed border-line bg-cream px-4 py-3 text-left hover:border-success transition-colors"
      >
        <span aria-hidden="true" className="text-[17px]">✍️</span>
        <b className="text-[16px] font-bold text-charcoal">{t("title")}</b>
        {total !== null ? (
          <Stars n={total} size={13} />
        ) : (
          <span className="text-[13px] font-semibold text-muted">{t("blocks", { count: syllables.length })}</span>
        )}
        <span className="ml-auto text-[13px] font-bold text-muted">{t("open")} ▸</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("close")}
            onClick={dismiss}
            className="fixed inset-0 z-[60] bg-[#282319]/35 cursor-default"
          />
          <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center pointer-events-none">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={korean}
              className="sheet-up pointer-events-auto w-full lg:w-[420px] bg-warm border-dashed border-dash border-t-[1.5px] lg:border-[1.5px] rounded-t-[22px] lg:rounded-[22px] px-4 pt-2.5 pb-[max(20px,env(safe-area-inset-bottom))] lg:pb-5 max-h-[92dvh] lg:max-h-[88dvh] overflow-y-auto"
            >
              <div className="w-10 h-1 rounded-full bg-dash mx-auto mb-3 lg:hidden" aria-hidden="true" />
              <div className="max-w-[560px] mx-auto flex flex-col gap-3">
                {/* word head — which block of which word, and the way out */}
                <div className="flex items-center gap-3">
                  <span
                    className="kr flex-none w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-[26px] font-black leading-none"
                    style={{ background: "#FBE9EE", color: HANGUL_ACCENT }}
                  >
                    {finale ? "✓" : char}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold leading-tight truncate">
                      <span className="kr">{korean}</span>
                      {syllables.length > 1 ? (
                        <span className="text-muted font-bold text-[13px] ml-2">
                          {idx + 1}/{syllables.length}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[12px] text-muted leading-snug truncate">
                      {finale ? t("doneSub") : t("strokes", { count: anchorsFor(char).length })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={dismiss}
                    aria-label={t("close")}
                    className="flex-none w-9 h-9 rounded-[10px] border border-line text-[14px] text-muted hover:border-success transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* syllable strip — one block per letter of the word, stars
                    once scored. It is also where the finale flies from, so it
                    stays on screen after the last block is done. */}
                {syllables.length > 1 && (
                  <div className="flex gap-1.5" role="tablist" aria-label={t("title")}>
                    {syllables.map((s, i) => (
                      <button
                        key={`${s}-${i}`}
                        type="button"
                        role="tab"
                        aria-selected={!finale && i === idx}
                        ref={(el) => {
                          blocks.current[i] = el;
                        }}
                        onClick={() => go(i)}
                        className={`kr flex-1 min-w-[44px] min-h-[46px] rounded-[11px] border px-1 text-[18px] font-black leading-none flex flex-col items-center justify-center gap-0.5 transition-opacity ${
                          !finale && i === idx
                            ? "border-success bg-success-bg text-success-deep"
                            : "border-line bg-cream text-charcoal hover:border-faint"
                        } ${finale ? "opacity-25" : ""}`}
                      >
                        {s}
                        {stars[i] !== null ? <Stars n={stars[i]!} size={9} /> : null}
                      </button>
                    ))}
                  </div>
                )}

                {finale ? (
                  <>
                    <Finale korean={korean} stars={total ?? 0} rom={rom} meaning={meaning} blocks={blocks} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={restart}
                        className="flex-1 min-h-[44px] rounded-[12px] border-[1.5px] border-line text-[15px] font-bold text-muted hover:border-faint"
                      >
                        {t("again")}
                      </button>
                      <button
                        type="button"
                        onClick={dismiss}
                        className="flex-1 min-h-[44px] rounded-[12px] bg-success text-white text-[15px] font-bold"
                      >
                        {t("close")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-[3px] p-[3px] rounded-xl bg-warm-2" role="tablist">
                      {(["practice", "challenge"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="tab"
                          aria-selected={mode === m}
                          onClick={() => switchMode(m)}
                          className={`py-2 rounded-[9px] text-[14px] font-bold transition-all ${
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

                    <p className="text-center text-[13.5px] text-muted -mt-1">{t("caption")}</p>

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
                        className="flex-1 min-h-[44px] rounded-[12px] border-[1.5px] border-line text-[15px] font-bold text-muted hover:border-faint"
                      >
                        {t("reset")}
                      </button>
                      {mode === "challenge" && !locked ? (
                        <button
                          type="button"
                          onClick={score}
                          disabled={drawnCount === 0}
                          className="flex-1 min-h-[44px] rounded-[12px] text-white text-[15px] font-bold disabled:opacity-40"
                          style={{ background: HANGUL_ACCENT }}
                        >
                          {t("check")}
                        </button>
                      ) : !last ? (
                        <button
                          type="button"
                          onClick={() => go(idx + 1)}
                          className="flex-1 min-h-[44px] rounded-[12px] bg-success text-white text-[15px] font-bold"
                        >
                          {t("nextSyllable")}
                        </button>
                      ) : total !== null ? (
                        <span className="flex-1 min-h-[44px] rounded-[12px] bg-success-bg border border-success-line text-success-deep text-[15px] font-bold flex items-center justify-center gap-2">
                          <span className="kr">{korean}</span> <Stars n={total} size={13} />
                        </span>
                      ) : null}
                    </div>
                  </>
                )}

                <Link
                  href="/hangul"
                  className="self-end text-[12px] font-semibold text-muted hover:text-charcoal transition-colors"
                >
                  {t("allLetters")} →
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
