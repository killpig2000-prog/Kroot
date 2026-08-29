"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { buttonClassName } from "@/components/ui/Button";
import { speakKorean } from "@/lib/tts";
import { VOCAB_ROOTS, type VocabWordWithProgress } from "@/lib/vocabulary";
import { WORD_STATUSES, getWordNote, wordStatus, hanjaOf } from "@/lib/word-notes";

const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");

// Ruled notebook paper: a faint line every 32px, plus a red margin rule.
const RULED = "repeating-linear-gradient(180deg, transparent 0 31px, #EEF0F6 31px 32px)";

// Swipe gesture tuning (px unless noted).
const SWIPE_START = 8; // horizontal travel before we treat the pointer as a drag
const STAMP_FROM = 40; // stamp starts fading in here…
const STAMP_TO = 120; // …and is fully opaque here
const RELEASE_MAX = 100; // release threshold: min(100px, 25% of card width)
const MAX_TILT = 12; // degrees, ≈ dx / 20 clamped
const FLY_MS = 250;
const FADE_MS = 150; // reduced-motion replacement for the fly-off
const SPRING_MS = 320;

// The study card as a dictionary entry on a notebook page: headword, hanja
// set large in the margin, the word-parts memo written out as etymology,
// the example as a quoted line, and "seen elsewhere" sentences as margin
// notes. Flow (reveal → still learning / got it) is unchanged.
export default function FlipPhase({
  words,
  index,
  word,
  wordCounts,
  topicLabel,
  flipped,
  rootOpen,
  onFlip,
  onAnswer,
  onOpenRoot,
  onCloseRoot,
}: {
  words: VocabWordWithProgress[];
  index: number;
  word: VocabWordWithProgress;
  wordCounts: { correct: number; incorrect: number };
  topicLabel: string;
  flipped: boolean;
  rootOpen: boolean;
  onFlip: () => void;
  onAnswer: (gotIt: boolean) => void;
  onOpenRoot: () => void;
  onCloseRoot: () => void;
}) {
  const status = WORD_STATUSES[wordStatus(wordCounts.correct + wordCounts.incorrect)];
  const root = word.root ? VOCAB_ROOTS[word.root] : undefined;
  const note = getWordNote(word.korean);
  const hanja = hanjaOf(word.korean);
  const prev = words[index - 1];
  const next = words[index + 1];
  const more = word.moreExamples ?? [];

  return (
    <div className="max-w-[600px] relative">
      {/* progress dots + counter */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex gap-[6px] min-w-0 flex-wrap">
          {words.map((w, k) => (
            <span
              key={w.key}
              className={`w-[22px] h-[5px] rounded-full ${
                k < index ? "bg-[#6B33CC]" : k === index ? "bg-[#6B33CC] opacity-40" : "bg-line"
              }`}
            />
          ))}
        </div>
        <span className="text-[12.5px] text-muted min-w-0 truncate whitespace-nowrap">
          <span className="hidden sm:inline">
            {topicLabel} · {word.level} ·{" "}
          </span>
          <b className="text-[#6B33CC]">{index + 1}</b> / {words.length}
        </span>
      </div>

      {/* the notebook page — swipe right = Got it, left = Still learning */}
      <SwipeCard key={word.key} enabled={flipped} nextWord={next} onSwipe={onAnswer}>
        <span className="absolute top-4 right-5 text-[10.5px] font-black tracking-[.06em] uppercase text-amber border-2 border-amber rounded-[6px] px-2 py-[3px] rotate-[-6deg] opacity-80 select-none">
          {status.label}
        </span>

        <div className="relative pt-6 pb-5 pr-[clamp(18px,4vw,26px)] pl-[clamp(40px,8vw,70px)]">
          {/* headword + hanja */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start mb-1 pr-16">
            <div>
              <p className="kr font-black text-[clamp(34px,6vw,44px)] leading-[1.1] tracking-[-0.01em]">
                <button
                  type="button"
                  onClick={() => speakKorean(word.korean)}
                  title="Hear it"
                  className="inline-flex items-baseline gap-2 hover:text-[#6B33CC] transition-colors text-left"
                >
                  {word.korean}
                  <span aria-hidden="true" className="text-[16px] translate-y-[-6px] opacity-70">🔊</span>
                </button>
              </p>
              <p className="text-[13px] text-faint mt-0.5">{word.romanization}</p>
            </div>
            {hanja && (
              <span
                className="kr font-black text-[clamp(36px,6vw,52px)] leading-none text-[#A08F4E] opacity-55 tracking-[.04em] select-none"
                aria-label={`Hanja: ${hanja}`}
              >
                {hanja}
              </span>
            )}
          </div>

          {flipped ? (
            <div style={{ animation: "fadeUp .3s ease" }}>
              <p className="text-[20px] font-extrabold mt-2.5 mb-1.5 flex items-center gap-2">
                <span className="text-[11px] font-black text-[#6B33CC] border-[1.5px] border-[#DDD6FE] rounded-full w-[18px] h-[18px] inline-grid place-items-center">
                  1
                </span>
                {word.meaning_en}
              </p>
              {note?.parts && (
                <p className="text-[12.5px] text-muted leading-[1.65] mb-3">
                  {note.parts.map((p, i) => (
                    <span key={p.syllable + p.hanja}>
                      {i > 0 && <span className="mx-1.5 text-faint">+</span>}
                      <b className="kr text-charcoal">{p.syllable}</b>{" "}
                      <span className="kr text-[#A08F4E]">{p.hanja}</span> {p.gloss}
                    </span>
                  ))}
                </p>
              )}
              {note?.origin && (
                <p className="text-[12.5px] text-muted leading-[1.65] mb-3">from {note.origin}</p>
              )}

              <div className="border-l-[3px] border-[#DDD6FE] pl-3.5 py-1 my-2 mb-3.5">
                <p className="kr text-[16px] font-medium">
                  <button
                    type="button"
                    onClick={() => speakKorean(word.example_kr)}
                    title="Hear the sentence"
                    className="text-left hover:text-[#6B33CC] transition-colors"
                  >
                    {word.example_kr} <span aria-hidden="true" className="text-[11px] opacity-70">🔊</span>
                  </button>
                </p>
                <p className="text-[12.5px] text-muted">{word.example_en}</p>
              </div>

              {/* seen elsewhere — inline below xl, margin notes on xl */}
              {more.length > 0 && (
                <div className="xl:hidden grid gap-2 mb-2">
                  {more.map((ex, i) => (
                    <MarginNote key={i} ex={ex} />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap mt-4 pt-3.5 border-t border-dashed border-dash">
                <span className="kr text-[12px] text-faint font-semibold">
                  {prev ? `← ${prev.korean}` : ""}
                  {prev && " · "}
                  <b className="text-charcoal">{word.korean}</b>
                  {next && " · "}
                  {next ? `${next.korean} →` : ""}
                </span>
                <div className="flex gap-2">
                  <button className={BTN_LINE} onClick={() => onAnswer(false)}>
                    Still learning
                  </button>
                  <button className={BTN_INK} onClick={() => onAnswer(true)}>
                    Got it ✓
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 mb-1">
              <button
                className="border-[1.5px] border-dashed border-[#DDD6FE] rounded-[10px] bg-[#F5F3FF] px-[22px] py-3 text-[13.5px] font-semibold text-[#6B33CC] hover:bg-[#EDE9FE] transition-colors"
                onClick={onFlip}
              >
                👀 Reveal meaning
              </button>
              <p className="text-[12px] text-faint mt-3">
                {hanja ? "The hanja above is your hint." : "Say it out loud first — then flip."}
              </p>
            </div>
          )}
        </div>

        {/* margin notes: pinned to the page's right edge on wide screens */}
        {flipped && more.length > 0 && (
          <div className="hidden xl:flex flex-col gap-3 absolute left-full top-24 ml-5 w-[190px]">
            {more.map((ex, i) => (
              <MarginNote key={i} ex={ex} rotate={i % 2 === 0 ? 2 : -1.5} />
            ))}
          </div>
        )}
      </SwipeCard>

      {/* bonus root banner */}
      {root && !rootOpen && (
        <div className="mt-4 border border-dashed border-[#DDD6FE] rounded-[14px] bg-[#F5F3FF] px-5 py-4 flex items-center gap-3.5">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-[#6B33CC] text-white flex items-center justify-center font-bold text-[17px] flex-none kr">
            {root.syllable}
          </span>
          <div className="min-w-0">
            <b className="block text-[13.5px] font-semibold">Bonus root: {root.name}</b>
            <span className="text-[12.5px] text-[#713FC0]">A few more words that share this root</span>
          </div>
          <button
            className="ml-auto flex-none bg-[#6B33CC] hover:bg-[#713FC0] text-white rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors"
            onClick={onOpenRoot}
          >
            Explore →
          </button>
        </div>
      )}

      {/* root explore panel */}
      {root && rootOpen && (
        <div className="mt-2.5 border border-[#DDD6FE] rounded-[14px] bg-white px-[22px] py-5" style={{ animation: "fadeUp .3s ease" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#F5F3FF] text-[#6B33CC] flex items-center justify-center kr text-xl flex-none">
                {root.syllable}
              </span>
              <div>
                <b className="block text-[15px] font-bold">{root.name}</b>
                <span className="text-[12.5px] text-muted">{root.desc}</span>
              </div>
            </div>
            <button
              className="border-none bg-warm w-7 h-7 rounded-lg text-faint hover:text-charcoal text-[13px]"
              onClick={onCloseRoot}
              aria-label="Close root panel"
            >
              ✕
            </button>
          </div>
          <div className="grid gap-2.5">
            {root.words.map(([kr, meaning]) => (
              <div key={kr} className="flex items-center gap-3 border border-line rounded-[10px] px-3.5 py-[11px] bg-warm">
                <span className="kr text-lg flex-none min-w-[52px]">{kr}</span>
                <span className="text-[13px] text-muted">
                  <b className="text-charcoal font-semibold">{meaning}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type DragMode = "idle" | "drag" | "fly" | "back";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// The notebook page with a swipe gesture layered on top: pointer events + a
// CSS transform, no library. Keyed by word in the parent so every card mounts
// fresh at rest. The buttons inside keep working exactly as before; the
// gesture just calls the same handler.
function SwipeCard({
  enabled,
  nextWord,
  onSwipe,
  children,
}: {
  enabled: boolean;
  nextWord?: VocabWordWithProgress;
  onSwipe: (gotIt: boolean) => void;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  // limit = release threshold for this drag: min(100px, 25% of the card width).
  const [drag, setDrag] = useState<{ dx: number; mode: DragMode; limit: number }>({
    dx: 0,
    mode: "idle",
    limit: RELEASE_MAX,
  });
  // Pointer bookkeeping lives in refs so pointermove doesn't re-render until a drag begins.
  const gesture = useRef<{ id: number; x0: number; y0: number; width: number; dragging: boolean } | null>(null);
  const busy = useRef(false); // true from release-past-threshold until this card unmounts
  const suppressClick = useRef(false); // swallow the click that follows a drag
  const flyTimer = useRef<number | undefined>(undefined);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || busy.current || drag.mode === "fly") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      width: cardRef.current?.offsetWidth ?? 400,
      dragging: false,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.dragging) {
      // Only claim the pointer once it's clearly horizontal; vertical
      // movement stays with the browser (touch-action: pan-y) for scrolling.
      if (Math.abs(dx) <= SWIPE_START || Math.abs(dx) <= Math.abs(dy)) return;
      g.dragging = true;
      suppressClick.current = true;
      cardRef.current?.setPointerCapture(e.pointerId);
    }
    setDrag({ dx, mode: "drag", limit: Math.min(RELEASE_MAX, g.width * 0.25) });
  }

  function endGesture(e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.dragging) return;
    if (cardRef.current?.hasPointerCapture(e.pointerId)) cardRef.current.releasePointerCapture(e.pointerId);

    const dx = e.clientX - g.x0;
    const limit = Math.min(RELEASE_MAX, g.width * 0.25);
    if (cancelled || Math.abs(dx) < limit) {
      setDrag({ dx: 0, mode: "back", limit });
      return;
    }
    // Past the threshold: fly off (or fade, under reduced motion), then answer.
    busy.current = true;
    const dir = dx > 0 ? 1 : -1;
    setDrag({ dx: dir * (g.width * 1.1), mode: "fly", limit });
    flyTimer.current = window.setTimeout(() => onSwipe(dir > 0), reduced ? FADE_MS : FLY_MS);
  }

  function onClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  }

  const { dx, mode, limit } = drag;
  const abs = Math.abs(dx);
  const tilt = reduced ? 0 : Math.max(-MAX_TILT, Math.min(MAX_TILT, dx / 20));
  const stampOpacity = Math.max(0, Math.min(1, (abs - STAMP_FROM) / (STAMP_TO - STAMP_FROM)));
  const peekProgress = mode === "fly" ? 1 : Math.max(0, Math.min(1, abs / limit));

  const flying = mode === "fly";
  const cardStyle: CSSProperties = {
    touchAction: "pan-y",
    transform: flying && reduced ? "none" : `translateX(${dx}px) rotate(${tilt}deg)`,
    opacity: flying ? 0 : 1,
    transition:
      mode === "drag"
        ? "none"
        : flying
          ? reduced
            ? `opacity ${FADE_MS}ms ease-out`
            : `transform ${FLY_MS}ms ease-in, opacity ${FLY_MS}ms ease-in`
          : mode === "back"
            ? `transform ${SPRING_MS}ms cubic-bezier(.2,.9,.3,1.2)`
            : "none",
    userSelect: mode === "drag" ? "none" : undefined,
  };

  return (
    <>
      <div className="relative [overflow-x:clip]">
        {/* the next page, peeking out from underneath */}
        <div
          className="absolute inset-0 bg-white border border-line rounded-[6px] overflow-hidden"
          aria-hidden="true"
          style={{
            transform: `translateY(${12 - 12 * peekProgress}px) scale(${0.97 + 0.03 * peekProgress})`,
            opacity: 0.55 + 0.45 * peekProgress,
            transition: mode === "drag" ? "none" : "transform 200ms ease, opacity 200ms ease",
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: RULED }} />
          <span className="absolute top-0 bottom-0 left-[clamp(28px,6vw,52px)] w-px bg-[#F5C6C6] opacity-70" />
          {nextWord && (
            <p className="kr font-black text-[clamp(34px,6vw,44px)] leading-[1.1] tracking-[-0.01em] text-faint pt-6 pl-[clamp(40px,8vw,70px)]">
              {nextWord.korean}
            </p>
          )}
        </div>

        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endGesture(e, false)}
          onPointerCancel={(e) => endGesture(e, true)}
          onClickCapture={onClickCapture}
          className="relative bg-white border border-line rounded-[6px] shadow-[0_20px_40px_-28px_rgba(60,50,30,.6)] overflow-hidden"
          style={cardStyle}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: RULED }} aria-hidden="true" />
          <span
            className="absolute top-0 bottom-0 left-[clamp(28px,6vw,52px)] w-px bg-[#F5C6C6] opacity-70 pointer-events-none"
            aria-hidden="true"
          />
          {children}

          {/* swipe stamps */}
          <span
            aria-hidden="true"
            className="absolute top-[108px] left-1/2 z-10 pointer-events-none select-none text-[22px] font-black tracking-[.08em] uppercase text-[#3E7C59] border-[3px] border-[#3E7C59] rounded-[8px] px-2.5 py-1 -translate-x-1/2 rotate-[-12deg] whitespace-nowrap"
            style={{ opacity: dx > 0 ? stampOpacity : 0, transition: mode === "drag" ? "none" : "opacity 120ms ease" }}
          >
            Got it ✓
          </span>
          <span
            aria-hidden="true"
            className="absolute top-[108px] left-1/2 z-10 pointer-events-none select-none text-[18px] font-black tracking-[.08em] uppercase text-muted border-[3px] border-current rounded-[8px] px-2.5 py-1 -translate-x-1/2 rotate-[12deg] whitespace-nowrap"
            style={{ opacity: dx < 0 ? stampOpacity : 0, transition: mode === "drag" ? "none" : "opacity 120ms ease" }}
          >
            Still learning
          </span>
        </div>
      </div>

      {enabled && (
        <p className="hidden [@media(pointer:coarse)]:block text-[11.5px] text-faint text-center mt-2.5">
          Swipe right = Got it · left = Still learning
        </p>
      )}
    </>
  );
}

// A "seen in Reading / Listening" sentence, styled as a sticky margin note.
function MarginNote({
  ex,
  rotate = 0,
}: {
  ex: { kr: string; en: string; source: "reading" | "listening" };
  rotate?: number;
}) {
  return (
    <div
      className="bg-[#FFF9DB] border border-[#EDE3B4] rounded-[6px] px-3 py-2.5 shadow-[0_5px_12px_rgba(0,0,0,0.07)] text-left"
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <p className="text-[10px] font-bold tracking-[0.07em] uppercase text-[#A08F4E] mb-1">
        {ex.source === "reading" ? "📖 Seen in Reading" : "🎧 Seen in Listening"}
      </p>
      <p className="kr text-[13px] font-medium text-charcoal leading-[1.45]">
        <button
          type="button"
          onClick={() => speakKorean(ex.kr)}
          title="Hear the sentence"
          className="text-left hover:text-[#6B33CC] transition-colors"
        >
          {ex.kr}
        </button>
      </p>
      <p className="text-[11.5px] text-muted leading-[1.45]">{ex.en}</p>
    </div>
  );
}
