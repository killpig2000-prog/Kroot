"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity, verdictFor } from "@/lib/speech-match";
import { wordsForChapter } from "@/lib/pronunciation";
import { checkTiles, type Board } from "@/lib/writing-builder";
import { TileBoard } from "@/components/writing/WritingBoards";
import AnswerCapture from "@/components/pronunciation/AnswerCapture";
import ScoreResult, { VERDICTS } from "@/components/pronunciation/ScoreResult";
import { speakKorean } from "@/lib/tts";

// The hero's "try it right now" pair — one pronunciation word and one easy
// tile sentence, both graded entirely in the browser. No account, no API
// call. The pronunciation card is the real practice card, piece for piece:
// the same AnswerCapture mic + countdown ring and the same ScoreResult
// gauge the Pronunciation Trail uses, fed by the same hooks — not a
// look-alike. The word and the board are fixed constants so the server
// render and the first client render agree.

// The very first word of the real trail (chapter 1, ㄹ) — what you try here
// is literally what lesson one asks.
const WORD = wordsForChapter("rieul")[0];
// Must match AnswerCapture's own MAX_LISTEN_MS so the ring runs out exactly
// when the mic stops.
const MAX_LISTEN_MS = 6000;

// 나는 한국을 사랑해요 (I love Korea). No distractor on purpose — the user
// wanted the landing sample to be only the words that belong.
const BOARD: Board = {
  answer: ["나는", "한국을", "사랑해요"],
  tiles: [
    { id: "t1", text: "한국을" },
    { id: "t2", text: "사랑해요" },
    { id: "t0", text: "나는" },
  ],
};

// Both cards share one skeleton (header row → label → content → flex spacer
// → the interactive bit) so they come out the same height with the mic and
// the tile buttons sitting on the same baseline.
const CARD =
  "relative h-full text-left bg-cream border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] flex flex-col";
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";
const LIVE =
  "tryit-live inline-flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[.08em] uppercase rounded-full px-2.5 py-[3px]";

function PronunciationCard({ onDone }: { onDone: () => void }) {
  const t = useTranslations("pronunciation.practice");
  const tl = useTranslations("landing.tryIt");
  const router = useRouter();
  const { speak, isSpeaking, isSupported: ttsOk } = useKoreanSpeaker();
  const { isSupported: micOk, isListening, listenStartedAt, interim, error, listen } = useSpeechRecognition(
    "ko-KR",
    MAX_LISTEN_MS
  );
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Ticks the mic countdown ring while listening — same as the real card.
  const [micElapsedMs, setMicElapsedMs] = useState(0);
  useEffect(() => {
    if (!isListening || listenStartedAt === null) return;
    let raf: number;
    const tick = () => {
      setMicElapsedMs(performance.now() - listenStartedAt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isListening, listenStartedAt]);

  // Animates the score gauge counting up whenever a fresh grade comes in.
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    if (heard === null) return;
    const target = Math.round(score * 100);
    const start = performance.now();
    const DURATION = 550;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setAnimScore(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heard, score]);

  function grade(text: string) {
    // Same grading as PronunciationChallenge: the chapter word, nothing looser.
    const s = bestSimilarity(text, [WORD.kr]);
    setHeard(text);
    setScore(s);
    onDone();
  }

  const verdict = heard !== null ? VERDICTS[verdictFor(score)] : null;

  return (
    <div className={`${CARD} border-teal/40`}>
      <div className="flex items-center justify-between mb-4 gap-2.5 flex-wrap">
        <span className={`${LIVE} text-teal bg-[var(--tint-teal)]`}>{tl("livePron")}</span>
        <span className="text-[12px] text-faint font-medium">{tl("lessonWord")}</span>
      </div>

      <p className={LABEL}>{t("sayThis")}</p>
      <p className="flex items-center gap-3 flex-wrap mb-1">
        <span className="kr font-bold text-[34px] tracking-[-0.01em] leading-[1.2]">{WORD.kr}</span>
        <button
          type="button"
          onClick={() => speak(WORD.kr)}
          disabled={!ttsOk}
          className={`inline-flex items-center gap-1.5 text-[12px] font-bold text-teal bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-full px-2.5 py-[3px] transition-transform hover:scale-105 disabled:opacity-50 ${
            isSpeaking ? "wave-on" : ""
          }`}
        >
          🔊 {t("hearIt")}
        </button>
      </p>
      <p className="text-[13.5px] text-muted mb-4">
        <span className="italic">{WORD.romanization}</span> · {WORD.en}
      </p>

      <div className="flex-1" />

      {heard === null && (
        <div className="tryit-mic">
          <AnswerCapture
            bestScore={0}
            micOk={micOk}
            isListening={isListening}
            micElapsedMs={micElapsedMs}
            interim={interim}
            error={error}
            onListen={() => listen(grade)}
            onSkip={() => {}}
          />
        </div>
      )}

      {heard !== null && verdict && (
        <ScoreResult
          heard={heard}
          targetKr={WORD.kr}
          verdict={verdict}
          animScore={animScore}
          saveError={null}
          ttsOk={ttsOk}
          onReplay={() => speak(WORD.kr)}
          onTryAgain={() => setHeard(null)}
          // "Finish →" on the landing sample hands over to the real thing.
          onNext={() => router.push("/onboarding")}
          isLastWord
        />
      )}
    </div>
  );
}

function WritingCard({ onDone }: { onDone: () => void }) {
  const t = useTranslations("landing.tryIt");
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);

  function check() {
    const ok = checkTiles(BOARD, picked);
    setChecked(ok);
    if (ok) {
      speakKorean(BOARD.answer.join(" "), { rate: 0.9 });
      onDone();
    }
  }

  return (
    <div className={`${CARD} border-amber-line`}>
      <div className="flex items-center justify-between mb-4 gap-2.5 flex-wrap">
        <span className={`${LIVE} text-amber bg-[var(--tint-amber)]`}>{t("liveWrite")}</span>
        <span className="text-[12px] text-faint font-medium">{t("lessonSentence")}</span>
      </div>

      <p className={LABEL}>{t("writeTitle")}</p>
      <p className="text-[15px] font-bold text-charcoal leading-snug mb-0.5">{t("writePrompt")}</p>
      <p className="text-[12.5px] text-muted mb-4">{t("writeHint")}</p>

      <div className="flex-1" />

      {/* the 👆 sits on the first tile only until the learner touches one */}
      <div className={picked.length === 0 && checked === null ? "tryit-hint" : undefined}>
        <TileBoard
          board={BOARD}
          picked={picked}
          checked={checked}
          onChange={(next) => {
            setPicked(next);
            if (checked === false) setChecked(null);
          }}
          onCheck={check}
          onReset={() => {
            setPicked([]);
            setChecked(null);
          }}
        />
      </div>
    </div>
  );
}

export default function TryIt() {
  const t = useTranslations("landing.tryIt");
  const [done, setDone] = useState({ pron: false, write: false });
  const finished = done.pron || done.write;

  return (
    <div className="mb-8 text-left">
      {/* says out loud that the two cards below are live, not screenshots */}
      <div className="flex items-center justify-center gap-x-3 gap-y-1.5 flex-wrap mb-5 md:mb-10">
        <span className="inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-4 py-[7px] text-[14px] font-extrabold">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#F4C94F] tryit-live" />
          {t("banner")}
        </span>
        <span className="text-[13px] text-muted">{t("bannerSub")}</span>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px] mx-auto items-stretch">
        <span
          aria-hidden="true"
          className="hand hidden md:block absolute z-10 left-1/2 -top-[30px] -translate-x-1/2 -rotate-[3deg] text-[20px] font-semibold text-success whitespace-nowrap select-none"
        >
          {t("tryMe")}
        </span>
        <PronunciationCard onDone={() => setDone((d) => ({ ...d, pron: true }))} />
        <WritingCard onDone={() => setDone((d) => ({ ...d, write: true }))} />
      </div>
      {/* the real CTA button sits under the headline below, so this is just
          the bridge line — no second link competing with it */}
      {finished && (
        <p className="text-center mt-4 text-[13.5px] font-semibold text-success-deep" aria-live="polite">
          {t("afterTry")} ↓
        </p>
      )}
    </div>
  );
}
